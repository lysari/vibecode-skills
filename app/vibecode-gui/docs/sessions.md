# Sessions store

## `src/bun/sessions.ts`

One JSON file per session at `<sessionsRoot>/<project hash>/<session id>.json`.

- `PROJECT_HASH_LENGTH`: a project's folder name in the store is the first hex digits of the SHA-256 of its path, so any path maps to one safe folder name.
- `SESSION_ID`: session ids must be UUIDs, so no id leads to a path outside the store.
- `EVENT_FIELDS` lists the fields each run event type has besides `type`, `runId` and `at`, checked when a session file is read.
- `parseSession(text)` reads a session file's JSON, keeping its valid messages and events; it returns null when the session itself is malformed. `readSession` also rejects a file stored for another project or id.
- `listSessions` returns the project's sessions, most recently updated first; malformed files are skipped.
- `writeSession` writes to a temporary file first and renames it, so a crash mid-write never leaves half a session behind.
- `createSession` starts a session in the project, or returns its latest one when nothing was sent there yet.
- `titleFromText(text)` titles a session from its first message: the first line without the slash commands in front, shortened to `TITLE_LENGTH`.
- `readLastRun(events)` finds the last run and the latest status of each of its agents (`LastRun.statuses`).
- `summarizeSession(session, isLive)`: `isLive` is false when no runner is working on the session, so an unfinished run was interrupted by a quit and counts as stopped.

## `tests/bun/sessions.test.ts`

Uses a temporary sessions folder. Covers creating, reusing, listing, renaming and deleting sessions; skipping a malformed file and dropping malformed messages and events; refusing ids that are not session ids and files stored for another project; the latest run's summary state; and titles without slash commands.
