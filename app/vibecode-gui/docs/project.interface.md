# Project types

## `src/shared/interfaces/project.interface.ts`

Used by both the main process and the webview.

- `Project`: a folder in the recent projects list. `root` is the absolute path of the folder; `isAvailable` is false when the folder was moved or deleted since it was last opened.
- `OpenProject`: the open project with `skills`: its own skills and the skills in the agents' global folders, one per name.
- `Workspace`: `projects` lists the recent projects, most recently opened first; `project` is the open project.
