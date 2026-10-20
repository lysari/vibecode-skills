# Run view types

## `src/shared/interfaces/run-view.interface.ts`

What the webview's Chat and Tree views show of a session's runs, built by `buildRunView` in `src/mainview/utils/run-view.ts` (see `run-view.md`).

- `AgentNode`: an agent of a run's agent tree with its live status and usage; `replaces` is the failed agent this one replaces after a retry; `question` is the open question while the agent needs the user; `error` is the last error, kept while the agent stays failed.
- `AgentRun.rootId` is the orchestrator; null until it is spawned.
- `ThreadItem`: one entry of a chat or agent transcript, told apart by `kind`; `at` is its time in milliseconds since the epoch, which orders the merged chat thread.
- `ToolItem.result` is null while the tool runs.
- `AgentItem` is a sub-agent block, a question for the user or an error, each about one agent.
- `RunView`: every agent of the session by id (`agents`), its runs in start order (`runs`) and each agent's transcript by agent id (`items`).
