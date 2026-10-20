# App

The app's one window: the rail, the projects panel, the session header, the Chat or Tree view with the composer below it, and the dialogs.

## `src/mainview/features/app-shell/App.tsx`

- The layout shell: composes the rail, the projects panel, the header, the error banner, the Chat or Tree view with the composer, the agent drawer and the dialogs, with state from `useError`, `useWorkspace`, `useRun` and `useTheme`.
- Holds only layout state: the Chat | Tree view, the panel toggle and the open dialog (`DialogState`: delete a session). The dialog closes once its action succeeds (`confirmDelete`); a failure stays in the dialog.
- The open project's skills listed in `AGENT_CLIS` are offered in the agent picker. Every other skill is offered in the skill picker when the session's agent can use it: a project skill always, a global skill when one of its `globalFolders` is in the agent's `skillFolders` (every global folder for the default agent).
- Opening an agent from the thread selects it and switches to the Tree view (`openAgent`).

## `src/mainview/features/app-shell/use-error.ts`

`useError()` holds the error banner (`error`, `setError`) that `App` shows and dismisses. `runRequest(failure, request)` runs an RPC request, clears the banner when it succeeds and shows `<failure>: <cause>` when it fails, and resolves to whether it succeeded. `App` passes it to `useWorkspace` and `useRun`, so every failed request reaches the one banner.

## `src/mainview/features/app-shell/use-workspace.ts`

`useWorkspace(runRequest)` mirrors the main process's projects and sessions stores: the workspace, each project's session list, the expanded projects, the open session, the selected agent and the reply target.

- It reads the workspace on start and reopens the last open project.
- Opening a project (`enterProject`) expands it in the panel and opens its latest session, or a new one when it has none. Opening a session of another project opens that project first (`switchProject`).
- Showing a session (`showSession`) clears the selected agent and the reply target.
- Run events are added to the open session. Events of the types in `STATUS_EVENTS` (`run.started`, `run.finished`, `agent.status`) can change a session's status dot, so they refresh that project's session list.
- Renaming a session and choosing its skills and agent update the open session at once, then save it.
- `deleteSession` throws on failure instead of using `runRequest`, so its dialog can show the error.

## `src/mainview/features/app-shell/use-run.ts`

`useRun(options)` plays the open session's events into the run view (`buildRunView`, `buildThread`) and handles the run actions.

- The Tree view shows the run of the selected agent, else the latest run (`treeRun`, `treeRoot`).
- A reply is only possible while its agent still waits on the user, so the reply target (`replyTarget`) is dropped once the agent leaves `needs-input`. `reply` sets it and bumps `focusKey`, which focuses the composer.
- `send` answers the reply target when there is one, else sends a message with the session's agent and skills; it resolves to whether it succeeded, so the composer keeps the text after a failure.
- `runAction(failure, action)` runs an action on the open session (`retry`, `stop`) through `runRequest`.

## `src/mainview/features/app-shell/use-theme.ts`

`useTheme()` holds the light/dark toggle and sets `data-theme` on the root element. The theme is kept in `localStorage` under `THEME_KEY` and defaults to the system colour scheme. `readStored` and `writeStored` ignore storage errors: storage can be unavailable in private or sandboxed webviews, and the app still works without it.

## `src/mainview/main.tsx`, `src/mainview/index.html`, `src/mainview/index.scss`

`main.tsx` mounts `App` in `StrictMode` into the `#root` element of `index.html` and loads `index.scss`, which loads the palette, fonts and global partials (see `palette.md`, `fonts.md`, `global.md`) and Tailwind's layers.

## `src/mainview/features/app-shell/Header.tsx`

The project name, the session title and the Chat | Tree toggle (`ViewButton`, labelled from `SESSION_VIEW_LABELS`). Clicking the title edits it: Enter or leaving the field saves a changed, non-empty title; Escape cancels.

## `src/mainview/features/app-shell/Rail.tsx`

The app's navigation: Projects (shows or hides the projects panel), New and, at the bottom, the light/dark toggle.

## `src/mainview/features/app-shell/session-view.ts`

`SESSION_VIEW_LABELS` lists the session's two views with their labels; `SessionView` is one of its keys.
