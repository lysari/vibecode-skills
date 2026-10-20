# Run types

## `src/shared/interfaces/run.interface.ts`

The contract between a session and the agent runner, used by both the main process and the webview.

- `AGENT_STATUSES`: the states an agent of a run moves through; `needs-input` waits for the user's reply, `failed` for a retry. `RUN_END_STATUSES`: how a run can finish.
- `AgentCli` / `AGENT_CLIS`: the coding agent CLIs that run a session, keyed by the skill that teaches how to drive each one; `command` is what a real runner starts; `skillFolders` are the global skill folders (of `GLOBAL_SKILL_FOLDERS`) the CLI reads: Claude Code its own, Cursor its own plus Claude Code's and Codex's, which it also loads, Antigravity its CLI's and its editor's. A session without one uses the default agent, which reads every global folder.
- Every event carries `runId` and `at` (milliseconds since the epoch).
- `run.started` is a run's first event; the first agent spawned without a parent is its orchestrator, the root of its agent tree.
- `agent.spawned`: `model` is the model or CLI the agent runs on, e.g. `claude · opus`; `replaces` is the failed agent this one replaces after a retry.
- `agent.usage`: `costUsd` and `durationMs` are totals so far, not increments.
- `text.delta`: deltas with the same `messageId` join into one assistant message.
- `RunEventBody`: an event before a runner stamps it with its run id and time, for each event type.
- `RunRequest`: `prompt` is the user's message with the selected skills as slash commands in front, e.g. `/vibecode-review fix the header`; `agent` is a key of `AGENT_CLIS` or null; `skills` are the names of the selected skills the agent can use, from the project or the agent's global folders; the app copies none of them.
- `AgentRunner` runs a prompt as a tree of agents and reports everything that happens as run events: `start` sends every event of the run to `emit`, from `run.started` to `run.finished`; `stop` makes running agents "stopped" and finishes the run as "stopped"; `reply` answers an agent waiting in "needs-input"; `retry` replaces a failed agent with a new one for the same task and marks the failed one "stopped".
