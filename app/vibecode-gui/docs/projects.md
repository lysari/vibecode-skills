# Projects

The projects panel beside the rail.

## `src/mainview/features/projects/Projects.tsx`

- The search matches a project's name and path; a project that does not match is still shown with only the sessions whose titles match, and is expanded while the search is active.
- Clicking the open, expanded project collapses it; clicking any other project opens it.
- Only a session whose latest run is running, needs you or failed gets a status dot (`STATUS_DOTS`), with the matching `AGENT_STATUS_STYLES` label for screen readers.
- A project whose folder was moved or deleted (`isAvailable` false) is disabled and shows **Unavailable**. The × button removes a project from the list and leaves its folder on disk; the trash button asks before deleting a session.

## `src/mainview/features/projects/time-ago.ts`

`formatTimeAgo(time)` gives a compact age for the narrow session list, e.g. `now`, `5m`, `3h`, `2d`, rounded to the nearest unit.
