import { readFile } from 'node:fs/promises';

const LOG_DIR = new URL('../logs/', import.meta.url);
const SESSION_ID =
  process.argv[2] ??
  process.env.JEV_SESSION_ID ??
  process.env.CLAUDE_CODE_SESSION_ID ??
  process.env.CODEX_THREAD_ID ??
  process.env.OPENCODE_RUN_ID ??
  `no-session-${new Date().toISOString().slice(0, 10)}`;
const LOG_FILE = new URL(`${SESSION_ID}.jsonl`, LOG_DIR);
const SECURITY_REASON_PREFIX = 'Security risk:';

interface LogEntry {
  request?: { question: string } | null;
  verdict?: { decision: 'auto' | 'ask'; pick: string | null; reason: string };
  userPick?: string;
}

function answer(run: LogEntry, userPick: string | undefined): string {
  const { verdict } = run;
  if (userPick !== undefined) return `${userPick} — by user`;
  if (verdict === undefined) return 'Jev failed — answer not logged';
  const warning = verdict.reason.startsWith(SECURITY_REASON_PREFIX) ? '⚠️ ' : '';
  if (verdict.decision === 'auto') return `${warning}${verdict.pick} — by Jev`;
  return `${warning}${verdict.pick ?? 'none fit'} — Jev suggested, answer not logged`;
}

let raw: string;
try {
  raw = await readFile(LOG_FILE, 'utf8');
} catch {
  console.log(`No Jev runs logged for session ${SESSION_ID}.`);
  process.exit(0);
}

const entries = raw.split('\n').filter(Boolean).map((line) => JSON.parse(line) as LogEntry);

const runs = entries.filter((entry) => entry.userPick === undefined);
runs.forEach((run, index) => {
  const next = entries[entries.indexOf(run) + 1];
  if (index > 0) console.log('');
  console.log(`${index % 2 === 0 ? '-' : '*'} **Q:** ${run.request?.question ?? '—'}`);
  console.log(`  - *A: ${answer(run, next?.userPick)}*`);
});
