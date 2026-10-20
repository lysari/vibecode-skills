# Projects store

## `src/bun/workspace.ts`

The app's projects store (`ProjectsStore`), a JSON file in its user data folder.

- `ProjectsStore`: `openRoot` is the project open now, reopened on launch; `projects` are the recent projects, most recently opened first.
- `readStore` reads a missing file as empty and drops malformed entries. It ignores fields it does not know, such as the `libraryRoot` setting of earlier versions, so the next write drops them.
- `home` is the folder whose agent skill folders are read (see `skills.md`); the main process passes `Utils.paths.home`, the tests a temporary folder.
- `readRoots` returns the open project and the home folder, the only places `listSkills` reads from.
- `assertRecentProject` checks that a folder is in the recent projects list before its sessions are read or changed.
- `openProject` stores the folder's real path at the top of the list and makes it the open project.
- `removeProject` removes a project from the recent list; its folder on disk is left as it is.
- `readWorkspace` marks a project whose folder is gone as unavailable and opens nothing then; the open project comes with its skills (`listSkills`).

## `tests/bun/workspace.test.ts`

Uses a temporary store file, project folders and home folder. Covers a missing or malformed store and the old library setting, opening and reopening projects with their project and global skills, unavailable projects, removing a project, and accepting sessions only for recent projects.
