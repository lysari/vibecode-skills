let raw = '';
for await (const chunk of process.stdin) raw += chunk;
const { conversation_id: sessionId } = JSON.parse(raw) as { conversation_id: string };

console.log(JSON.stringify({
  env: { JEV_SESSION_ID: sessionId },
  additional_context: `Your Jev session id is ${sessionId}. Always run choose.mts as \`JEV_SESSION_ID=${sessionId} node .claude/skills/jev-assistance/scripts/choose.mts\`, and pass the same prefix to every subagent that runs it.`,
}));
