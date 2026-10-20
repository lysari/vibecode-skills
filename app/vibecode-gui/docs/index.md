# Main process entry

## `src/bun/index.ts`

- Stores both live in the app's user data folder: the projects store at `STORE_PATH` (see `workspace.md`) and the sessions store at `SESSIONS_ROOT` (see `sessions.md`). `HOME` is the user's home folder, whose agent skill folders are read for the composer (see `skills.md`).
- `getMainViewUrl`: in the `dev` channel the window loads the Vite dev server (`DEV_SERVER_URL`) for HMR when one is running, else the bundled views at `views://mainview/index.html`.
- Agent runs are mocked for now: `Chat` gets a `MockAgentRunner`. A runner for a real CLI implements the same `AgentRunner` interface and is passed here instead.
- The RPC handlers serve every `SkillsRPC` request. `inRecentProject` checks that a request's project is in the recent projects list before a session is read or changed; `sendMessage` also requires the session's project to be the open one.
- The file ends by creating the main window. Its `hiddenInset` title bar draws the traffic lights over the webview, so the sidebar and header leave room for them and act as drag regions (see `app.md`).
