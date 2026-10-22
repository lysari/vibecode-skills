import { appendFile, mkdir } from 'node:fs/promises';

const TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';
const LOG_DIR = new URL('../logs/', import.meta.url);
const SESSION_ID =
  process.env.JEV_SESSION_ID ??
  process.env.CLAUDE_CODE_SESSION_ID ??
  process.env.CODEX_THREAD_ID ??
  process.env.OPENCODE_RUN_ID ??
  `no-session-${new Date().toISOString().slice(0, 10)}`;
const LOG_FILE = new URL(`${SESSION_ID}.jsonl`, LOG_DIR);
const MODEL = 'jev-latest';
const NONE_FIT = 'none_fit';
const MAX_ATTEMPTS = 3;
const RETRY_STATUSES = [429, 529];

const AUTO_PICK_CONFIDENCE = 0.6;
const IRREVERSIBLE_LIMIT = 0.3;
const SECURITY_RISK_LIMIT = 0.2;

const WEIGHTS = { fit: 0.3, usability: 0.18, modern: 0.15, safety: 0.13, reliability: 0.12, simplicity: 0.12 };

const RECOMMENDED_MARKER = /\s*\((?:recommended|suggested|preferred|best)[^)]*\)|^\s*(?:recommended|suggested|preferred)\s*[:\-–—]\s*|[⭐★]/giu;

interface ChoiceOption {
  label: string;
  description: string;
}

interface ChoiceRequest {
  goal: string;
  context: string;
  question: string;
  options: ChoiceOption[];
  agentPick: string | null;
}

interface RankedOption {
  label: string;
  composite: number;
  choiceProbability: number;
  fit: number;
  usability: number;
  modern: number;
  safety: number;
  reliability: number;
  simplicity: number;
  irreversible: number;
  securityRisk: number;
}

interface ChoiceVerdict {
  decision: 'auto' | 'ask';
  pick: string | null;
  agentPick: string | null;
  agreesWithAgent: boolean | null;
  confidence: number;
  reason: string;
  ranking: RankedOption[];
}

interface JevResult {
  model: string;
  usage: unknown;
  answers: Record<string, unknown>;
}

interface ChoiceAnswer {
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

interface ScoreAnswer {
  score: number;
  legend: Record<string, unknown>;
}

interface NoulAnswer {
  noul: number;
}

function parseRequest(raw: string): ChoiceRequest {
  const input: unknown = JSON.parse(raw);
  if (typeof input !== 'object' || input === null) throw new Error('Input must be a JSON object.');
  const { goal, context, question, options, agentPick } = input as Record<string, unknown>;
  if (typeof goal !== 'string' || typeof question !== 'string') {
    throw new Error('Input needs string fields "goal" and "question".');
  }
  if (!Array.isArray(options) || options.length < 2) {
    throw new Error('Input needs an "options" array with at least 2 entries.');
  }
  const markedLabels: string[] = [];
  const parsedOptions = options.map((option: unknown, index): ChoiceOption => {
    const { label, description } = (option ?? {}) as Record<string, unknown>;
    if (typeof label !== 'string' || label.trim() === '') {
      throw new Error(`options[${index}] needs a non-empty string "label".`);
    }
    const rawDescription = typeof description === 'string' ? description : '';
    const cleanLabel = withoutMarker(label);
    const cleanDescription = withoutMarker(rawDescription);
    if (cleanLabel !== label.trim() || cleanDescription !== rawDescription.trim()) markedLabels.push(cleanLabel);
    return { label: cleanLabel, description: cleanDescription };
  });
  return {
    goal,
    context: typeof context === 'string' ? context : '',
    question,
    options: parsedOptions,
    agentPick: typeof agentPick === 'string' ? withoutMarker(agentPick) : (markedLabels[0] ?? null),
  };
}

function withoutMarker(text: string): string {
  return text.replace(RECOMMENDED_MARKER, '').trim();
}

function optionKey(index: number): string {
  return `option_${index}`;
}

function buildQuestions(request: ChoiceRequest): Record<string, unknown> {
  const questions: Record<string, unknown> = {};
  const choiceCriteria: Record<string, string> = {};
  request.options.forEach((option, index) => {
    choiceCriteria[optionKey(index)] = `${option.label}: ${option.description}`;
  });
  choiceCriteria[NONE_FIT] = 'None of the options serves `goal` within `context`; the user should be asked for another direction.';
  questions.best = {
    type: 'choice',
    instructions: 'Which option should be chosen to answer `question` so the user reaches `goal`, respecting every constraint and preference in `context`? When several options reach the goal, prefer the one built on the current, idiomatic approach of the stack in `context` over a legacy or deprecated one.',
    criteria: choiceCriteria,
  };

  request.options.forEach((_, index) => {
    const path = `\`options[${index}]\``;
    questions[`fit_${index}`] = {
      type: 'score',
      instructions: `How well does ${path} achieve \`goal\` while respecting \`context\`?`,
      criteria: [
        'Works against the goal or breaks a stated constraint',
        'Only partly reaches the goal or needs follow-up work',
        'Reaches the goal and respects every constraint',
      ],
    };
    questions[`usability_${index}`] = {
      type: 'score',
      instructions: `How good does the result of ${path} feel to use for the people who use it — end users of the UI, or developers calling the API — as described in \`context\`?`,
      criteria: [
        'Awkward, confusing, or inaccessible to use',
        'Usable, but with friction or rough edges',
        'Clear, accessible, and pleasant to use',
      ],
    };
    questions[`modern_${index}`] = {
      type: 'score',
      instructions: `How current is the approach in ${path} for the stack and version described in \`context\`?`,
      criteria: [
        'Uses deprecated or legacy APIs and patterns the stack has moved away from',
        'Still supported, but the stack now offers a newer recommended way',
        'Uses the current, idiomatic APIs and patterns of the stack',
      ],
    };
    questions[`reliability_${index}`] = {
      type: 'score',
      instructions: `How dependably does ${path} work across the inputs, states, and environments described in \`context\`?`,
      criteria: [
        'Likely to fail, break under edge cases, or behave inconsistently',
        'Works in common cases but has gaps at the edges',
        'Handles edge cases and fails gracefully',
      ],
    };
    questions[`safety_${index}`] = {
      type: 'score',
      instructions: `How safe is it to carry out ${path} in the project described by \`context\`?`,
      criteria: [
        'Can lose data, break the project, or affect people outside it',
        'Has side effects that take real work to undo',
        'Local and easy to undo',
      ],
    };
    questions[`simplicity_${index}`] = {
      type: 'score',
      instructions: `How much ongoing complexity does ${path} add to the project described by \`context\`?`,
      criteria: [
        'Adds new layers, dependencies, or concepts to maintain',
        'Adds a little to maintain',
        'Adds nothing beyond the change itself',
      ],
    };
    questions[`irreversible_${index}`] = {
      type: 'noul',
      instructions: `Does carrying out ${path} delete, overwrite, publish, push, send, spend money, or reach outside the current project?`,
      criteria: {
        true: 'It takes an action that cannot be cleanly undone or that other people or systems will see',
        false: 'Its effects stay inside the local project and can be undone',
      },
    };
    questions[`security_${index}`] = {
      type: 'noul',
      instructions: `Does carrying out ${path} weaken security — expose or hard-code secrets, disable or bypass authentication, authorization, validation, sanitization or other security checks, run untrusted input as code or HTML, grant broad permissions, or add an untrusted dependency?`,
      criteria: {
        true: 'It opens or widens a way for data to leak or for an attacker to act',
        false: 'It keeps every existing security check and exposes nothing new',
      },
    };
  });
  return questions;
}

async function askJev(request: ChoiceRequest, apiKey: string): Promise<JevResult> {
  const body = JSON.stringify({
    model: MODEL,
    state: {
      goal: request.goal,
      context: request.context,
      question: request.question,
      options: request.options,
    },
    questions: buildQuestions(request),
  });
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(TYPESAFE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body,
    });
    if (response.ok) {
      const result = (await response.json()) as { model?: unknown; usage?: unknown; answers?: unknown } | null;
      const answers = result?.answers;
      if (typeof answers !== 'object' || answers === null) throw new Error('TypeSafe response has no "answers".');
      return { model: String(result?.model), usage: result?.usage, answers: answers as Record<string, unknown> };
    }
    if (!RETRY_STATUSES.includes(response.status) || attempt === MAX_ATTEMPTS) {
      throw new Error(`TypeSafe request failed with ${response.status}: ${await response.text()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
  }
}

function normalizedScore(answer: ScoreAnswer): number {
  return answer.score / (Object.keys(answer.legend).length - 1);
}

function decide(request: ChoiceRequest, answers: Record<string, unknown>): ChoiceVerdict {
  const best = answers.best as ChoiceAnswer;
  const ranking = request.options
    .map((option, index): RankedOption => {
      const fit = normalizedScore(answers[`fit_${index}`] as ScoreAnswer);
      const usability = normalizedScore(answers[`usability_${index}`] as ScoreAnswer);
      const modern = normalizedScore(answers[`modern_${index}`] as ScoreAnswer);
      const safety = normalizedScore(answers[`safety_${index}`] as ScoreAnswer);
      const reliability = normalizedScore(answers[`reliability_${index}`] as ScoreAnswer);
      const simplicity = normalizedScore(answers[`simplicity_${index}`] as ScoreAnswer);
      return {
        label: option.label,
        composite:
          WEIGHTS.fit * fit +
          WEIGHTS.usability * usability +
          WEIGHTS.modern * modern +
          WEIGHTS.safety * safety +
          WEIGHTS.reliability * reliability +
          WEIGHTS.simplicity * simplicity,
        choiceProbability: best.probabilities[optionKey(index)] ?? 0,
        fit,
        usability,
        modern,
        safety,
        reliability,
        simplicity,
        irreversible: (answers[`irreversible_${index}`] as NoulAnswer).noul,
        securityRisk: (answers[`security_${index}`] as NoulAnswer).noul,
      };
    })
    .sort((a, b) => b.composite - a.composite);

  const pick = best.choice === NONE_FIT ? null : request.options[request.options.findIndex((_, index) => optionKey(index) === best.choice)].label;
  const { agentPick } = request;
  const agreesWithAgent = agentPick === null ? null : agentPick === pick;
  const verdict = { pick, agentPick, agreesWithAgent, confidence: best.confidence, ranking };
  const overruled = agreesWithAgent === false ? ` Jev disagrees with the agent's recommended "${agentPick}".` : '';
  const picked = ranking.find((option) => option.label === pick);

  if (picked === undefined) {
    return { ...verdict, decision: 'ask', reason: `Jev judged that no option serves the goal.${overruled}` };
  }
  if (picked.securityRisk > SECURITY_RISK_LIMIT) {
    return { ...verdict, decision: 'ask', reason: `Security risk: the pick may weaken security, so a human must decide.${overruled}` };
  }
  if (picked.irreversible > IRREVERSIBLE_LIMIT) {
    return { ...verdict, decision: 'ask', reason: `The pick may be irreversible or outward-facing.${overruled}` };
  }
  if (best.confidence < AUTO_PICK_CONFIDENCE) {
    return { ...verdict, decision: 'ask', reason: `Jev is not confident; the options are close.${overruled}` };
  }
  if (ranking[0].label !== pick) {
    return { ...verdict, decision: 'ask', reason: `The direct choice and the scored ranking disagree (ranking favors "${ranking[0].label}").${overruled}` };
  }
  return { ...verdict, decision: 'auto', reason: `Confident, reversible, and top of the scored ranking.${overruled}` };
}

async function readStdin(): Promise<string> {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  return raw;
}

async function writeLog(entry: Record<string, unknown>): Promise<void> {
  await mkdir(LOG_DIR, { recursive: true });
  await appendFile(LOG_FILE, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
}

const [flag, userPick] = process.argv.slice(2);
if (flag === '--user-pick') {
  if (!userPick) throw new Error('Pass the user\'s answer after --user-pick.');
  await writeLog({ userPick });
  process.exit(0);
}

const startedAt = Date.now();
let request: ChoiceRequest | null = null;
try {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) throw new Error('TYPESAFE_API_KEY is not set.');
  request = parseRequest(await readStdin());
  const result = await askJev(request, apiKey);
  const verdict = decide(request, result.answers);
  await writeLog({ request, verdict, model: result.model, usage: result.usage, ms: Date.now() - startedAt });
  const afterTask = `When the task is implemented, run \`node .agents/skills/jev-assistance/scripts/report.mts ${SESSION_ID}\` and paste its output under "Jev picks" at the end of your final message.`;
  const afterAnswer = `When you ask the user instead of taking the pick, log their answer with \`JEV_SESSION_ID=${SESSION_ID} node .agents/skills/jev-assistance/scripts/choose.mts --user-pick "<their answer>"\`.`;
  console.log(JSON.stringify({ ...verdict, afterAnswer, afterTask }, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await writeLog({ request, error: message, ms: Date.now() - startedAt });
  console.error(message);
  console.error(`After the user answers, log it with \`JEV_SESSION_ID=${SESSION_ID} node .agents/skills/jev-assistance/scripts/choose.mts --user-pick "<their answer>"\`.`);
  process.exit(1);
}
