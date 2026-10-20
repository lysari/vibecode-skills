# App

The app's one window: the rail, the projects panel, the session header, the Chat or Tree view with the composer below it, and the dialogs.

## `src/mainview/features/app-shell/App.tsx`

- Holds the app state: the workspace, each project's session list, the expanded projects, the open session, the Chat | Tree view, the selected agent, the reply target, the panel and theme toggles, the open dialog (`DialogState`: update a skill, delete a session, settings) and the error banner.
- Run events of the types in `STATUS_EVENTS` (`run.started`, `run.finished`, `agent.status`) can change a session's status dot, so they refresh that project's session list.
- The theme is kept in `localStorage` under `THEME_KEY` and defaults to the system colour scheme. `readStored` and `writeStored` ignore storage errors: storage can be unavailable in private or sandboxed webviews, and the app still works without it.
- A reply is only possible while its agent still waits on the user, so the reply target (`replyTarget`) is dropped once the agent leaves `needs-input`.
- Opening a project (`enterProject`) expands it in the panel and opens its latest session, or a new one when it has none.
- Library skills listed in `AGENT_CLIS` are offered in the agent picker, every other library skill in the skill picker.
- The Tree view shows the run of the selected agent, else the latest run.

## `src/mainview/main.tsx`, `src/mainview/index.html`, `src/mainview/index.scss`

`main.tsx` mounts `App` in `StrictMode` into the `#root` element of `index.html` and loads `index.scss`, which loads the palette, fonts and global partials (see `palette.md`, `fonts.md`, `global.md`) and Tailwind's layers.

## `src/mainview/features/app-shell/Header.tsx`

The project name, the session title and the Chat | Tree toggle (`ViewButton`, labelled from `SESSION_VIEW_LABELS`). Clicking the title edits it: Enter or leaving the field saves a changed, non-empty title; Escape cancels.

## `src/mainview/features/app-shell/Rail.tsx`

The app's navigation: Projects (shows or hides the projects panel), New, Settings and the light/dark toggle.

## `src/mainview/features/app-shell/session-view.ts`

`SESSION_VIEW_LABELS` lists the session's two views with their labels; `SessionView` is one of its keys.

## `src/mainview/features/app-shell/rpc.ts`

The webview's Electroview RPC client. `skillsApi` holds the request functions of `SkillsRPC`; a request fails after `MAX_REQUEST_MS`. `onRunEvent(listener)` calls the listener with every run event the main process streams and returns the unsubscribe function.
