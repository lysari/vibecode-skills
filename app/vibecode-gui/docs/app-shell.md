# App shell

## `src/bun/index.ts`

The main process entry. In the `dev` channel it uses the Vite dev server for HMR when one is running, else the bundled views. Agent runs are mocked for now: `Chat` gets a `MockAgentRunner`; a runner for a real CLI implements the same `AgentRunner` interface and is passed here instead. The file ends by creating the main window.

## `src/mainview/App.tsx`

- Run events of type `run.started`, `run.finished` and `agent.status` can change a session's status dot, so they refresh that project's session list.
- The theme is kept in `localStorage`; storage can be unavailable in private or sandboxed webviews, and the app still works without it.
- A reply is only possible while its agent still waits on the user, so the reply target is dropped once the agent leaves "needs-input".
- Opening a project expands it in the panel and opens its latest session, or a new one when it has none.

## `src/mainview/rpc.ts`

`onRunEvent(listener)` calls the listener with every run event the main process streams and returns the unsubscribe function.

## `src/mainview/components/Projects.tsx`

Only a session whose latest run is running, needs you or failed gets a status dot.
