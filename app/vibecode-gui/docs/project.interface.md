# Project types

## `src/shared/project.interface.ts`

Used by both the main process and the webview.

- `Project`: a folder in the recent projects list. `root` is the absolute path of the folder; `isAvailable` is false when the folder was moved or deleted since it was last opened.
- `OpenProject`: the open project with `skills`, the library's skills, each with its install state in this project.
- `Workspace`: `projects` lists the recent projects, most recently opened first; `libraryRoot` is the library folder in use: the one chosen in Settings, else the default; `defaultLibraryRoot` is that default, null in a packaged app; `project` is the open project.
