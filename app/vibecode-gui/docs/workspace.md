# Projects store

## `src/bun/workspace.ts`

The app's projects store (`ProjectsStore`), a JSON file in its user data folder.

- `ProjectsStore`: `libraryRoot` is the library folder chosen in Settings, null for the default (`defaultLibraryRoot`); `openRoot` is the project open now, reopened on launch; `projects` are the recent projects, most recently opened first.
- `readStore` reads a missing file as empty and drops malformed entries.
- `readRoots` returns the open project and the library, for checking every path a request reads or writes.
- `assertRecentProject` checks that a folder is in the recent projects list before its sessions are read or changed.
- `openProject` stores the folder's real path at the top of the list and makes it the open project.
- `removeProject` removes a project from the recent list; its folder on disk is left as it is.
- `readWorkspace` marks a project whose folder is gone as unavailable and opens nothing then.

## `tests/bun/workspace.test.ts`

Uses a temporary store file and project folders. Covers a missing or malformed store, opening and reopening projects, unavailable projects, removing a project, accepting sessions only for recent projects, and the library folder with its default.
