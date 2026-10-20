# Run view

## `src/mainview/utils/run-view.ts`

Turns a session's run events into what the Chat and Tree views show, typed by `run-view.interface.ts` (see `run-view.interface.md`).

- `buildRunView(events)` plays a session's run events into its agent trees (`agents`, `runs`) and each agent's transcript (`RunView.items`, in event order). A finished run adds a note to its orchestrator's transcript.
- `buildThread(session, view, agentId)` with no agent gives the chat thread: the user's messages and system notes merged by time with each run's orchestrator transcript. For an agent, it gives its own transcript and the replies sent to it.
- `listTreeAgents(root)` lists every agent of the tree under `root`, the root first.
- `formatCost` and `formatDuration` give compact labels, e.g. `<$0.01`, `$0.42`, `45s`, `2m 05s`.

## `tests/mainview/utils/run-view.test.ts`

Plays a fixed list of events and checks the agent tree with live status, question and usage; text deltas joined by message and tool results filled in place; the run's end note and cleared questions; the merged chat thread and an agent's own thread; and the cost and duration labels.
