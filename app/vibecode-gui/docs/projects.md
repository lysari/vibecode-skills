# Projects

The two-step sidebar: the projects sidebar, then the sessions panel of the open project to its right. Both take their look from the reference screenshot (see `palette.md`): a warm translucent surface, folder icons in the sidebar accent, and rounded rows with a soft grey highlight.

## `src/mainview/features/projects/Projects.tsx`

- Both panels grow and shrink their width (`expand`, `collapse`) while their content keeps its fixed width and stays pinned to the moving right edge, so it slides in and out without reflowing. Each panel owns its `usePresence` (see `use-presence.md`): `Projects` on `isSidebarOpen`, so it stays mounted (keeping its search) and renders nothing while hidden; `Sessions` on `project`, which `App` passes as `null` while the sidebar is hidden.
- Rows rise in when they appear (a new session, a project back in the search, the rows of another project), highlight with a colour transition and shrink slightly while pressed (`scale-press`). The hover-only buttons fade in.
- The first panel. The top row leaves room for the window's traffic lights (`pl-traffic-lights`) and holds **Hide sidebar**; it is a window drag region and the button opts out of it (see `app.md`).
- The search matches a project's name and path. ⌘F or Ctrl+F focuses it from anywhere in the window (`focusSearch`, removed when the panel unmounts).
- Projects are listed in two sections (`ProjectSection`): **Projects**, and **Unavailable** for a project whose folder was moved or deleted (`isAvailable` false), which is disabled.
- Clicking a project opens it (`aria-current` marks the open one), which opens its sessions panel. The × button, shown on hover or keyboard focus, removes a project from the list and leaves its folder on disk.
- The footer holds **Open folder…** (the native folder picker) and the light/dark toggle.

## `src/mainview/features/projects/Sessions.tsx`

- The second panel, shown while a project is open and the sidebar is shown, and kept while it animates out: `sessions` holds every project's session list and the panel reads the shown project's. Its sessions, newest first, with the title, the age (`formatTimeAgo`) and **New session** (+) in the top row.
- Only a session whose latest run is running, needs you or failed gets a status dot (`STATUS_DOTS`), with the matching `AGENT_STATUS_STYLES` label for screen readers.
- Clicking a session opens it in the main area (`aria-current` marks the open one). The trash button, shown on hover or keyboard focus, asks before deleting a session.

## `src/mainview/features/projects/time-ago.ts`

`formatTimeAgo(time)` gives a compact age for the narrow session list, e.g. `now`, `5m`, `3h`, `2d`, rounded to the nearest unit.
