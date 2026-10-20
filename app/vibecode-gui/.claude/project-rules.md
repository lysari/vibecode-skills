# Project Rules

## Tech Stack
- Language & Framework: TypeScript 5.7 (strict), Electrobun 2.0.4 desktop app (not Electron), React 18.3 webview, Vite 6, Tailwind CSS 3.4 + Sass
- Runtime: Bun 1.4.2 (pinned in `devbox.json`) for the main process and tests
- Package Manager: `hutch` (`hutch.config.ts`, `hutch.lock`); install with `hutch run install`. Never add npm/pnpm/yarn lockfiles.
- Electrobun imports: `electrobun/main` (or `electrobun/bun`) in `src/bun/`, `electrobun/view` in `src/mainview/`. Read `llms.txt` before using an Electrobun API.

## Architecture & Directory Map
- `src/bun/`: main process, flat, one file per responsibility: `index.ts` (window, folder picker, RPC handlers), `chat.ts` (sessions and their runs), `sessions.ts` (sessions store), `workspace.ts` (projects store), `skills.ts` (library discovery and install), `mock-agent-runner.ts` (the mocked `AgentRunner`). A new main-process responsibility gets its own kebab-case file here.
- `src/shared/interfaces/`: types used by both processes, and run-view types used by several webview features, as `<name>.interface.ts`. `src/shared/` holds only kind subfolders.
- `src/mainview/features/<feature>/`: one folder per feature (`app-shell`, `projects`, `chat`, `agent-tree`, `composer`, `settings`) with its own components and private helpers.
- `src/mainview/components/`: components used by 2 or more features (`Icon`, `Dialog`, `StatusPill`, `ThreadEntry`, `Markdown`).
- `src/mainview/hooks/`: hooks used by 2 or more features (`useDismiss`).
- `src/mainview/services/`: app-wide services (`rpc.ts`, the Electroview RPC client).
- `src/mainview/utils/`: helpers used by 2 or more features (`run-view.ts`).
- `src/mainview/styles/`: global styles only: `_palette.scss`, `_fonts.scss`, `_global.scss`. `index.scss` only `@use`s them and loads Tailwind.
- `src/mainview/main.tsx`: mounts `App` only.
- `tests/`: `bun:test` tests that mirror `src/` without the `src/` prefix, e.g. `tests/bun/chat.test.ts` for `src/bun/chat.ts`, `tests/mainview/features/agent-tree/map-rows.test.ts` for `src/mainview/features/agent-tree/map-rows.ts`. Tests write only to temporary folders (`mkdtemp`).
- `docs/`: flat, one doc per file or page, e.g. `docs/sessions.md`, `docs/run.interface.md`, `docs/agent-tree.md`, each starting with a `## \`<path>\`` heading per file it covers.
- New feature code belongs in: `src/mainview/features/<feature>/`
- Shared webview primitives belong in: `src/mainview/{components,hooks,services,utils}/` (kept at the `src/mainview/` root, no `shared/` parent), once 2 or more features use them.

## Import Aliases & Paths
- No project path aliases. Use relative imports everywhere, e.g. `../../../shared/interfaces/session.interface`, `../../components/Icon`.
- The only aliases are the Electrobun SDK specifiers (`electrobun/*`), mapped by `.hutch/devkit/tsconfig.json` and `electrobunViteAliases` in `vite.config.ts`. Do not edit `.hutch/`.
- Import types with `import type`.

## Naming Conventions
- Files: a React component file is `PascalCase.tsx` named after its component (`SkillPicker.tsx`); every other file is `kebab-case.ts` (`map-rows.ts`, `use-dismiss.ts`, `mock-agent-runner.ts`). Both styles may share a feature folder.
- Interface files: `<name>.interface.ts` in `src/shared/interfaces/`.
- Components: `PascalCase` function declarations with named exports (`export function Composer(props: ComposerProps)`); props interface `<Component>Props` declared in the component file.
- Exports: named exports only, no `export default`.
- Utilities / Hooks: `camelCase` verbs (`buildRunView`, `formatTimeAgo`); hooks `use<Name>` in `use-<name>.ts`.
- Constants: `UPPER_SNAKE_CASE` (`MAX_REQUEST_MS`, `AGENT_CLIS`, `AGENT_STATUSES`).
- Booleans: `is`/`has` questions (`isRunning`, `isAvailable`).
- Types / Interfaces: PascalCase nouns, no `I` prefix (`Session`, `AgentNode`, `RunRequest`). Literal unions sit next to the constant that lists them (`AGENT_STATUSES` → `AgentStatus`).
- Domain terms: `project` (a folder the user opened), `session` (one chat thread), `run` (one agent run inside a session), `agent` (orchestrator or sub-agent), `skill`, `library` (the skill library folder, `libraryRoot`), `workspace` (the projects store state). Agent statuses are exactly `running`, `done`, `needs-input`, `failed`, `stopped`. Never use `chat` for a session, `job`/`task` for a run, or `repo`/`folder` for a project in code.
- Formatting: tabs, double quotes, semicolons, trailing commas in multi-line lists.

## Core Shared Helpers (Do Not Duplicate)
- RPC (webview → main): `skillsApi` and `onRunEvent` from `src/mainview/services/rpc.ts`. Never create another `Electroview` or call RPC another way. Every new request or message goes in `SkillsRPC` (`src/shared/interfaces/skills-rpc.interface.ts`) and gets its handler in `src/bun/index.ts`.
- File access: only in the main process. Use `src/bun/workspace.ts` (projects store, `assertRecentProject`), `src/bun/sessions.ts` (sessions store), and `src/bun/skills.ts` (`listSkills`, `installSkill`, which only reach the project and library folders). Never read or write files from the webview.
- Agent runs: implement `AgentRunner` from `src/shared/interfaces/run.interface.ts`; construct it in `src/bun/index.ts`. `AGENT_CLIS` maps agent skills to CLIs.
- Run events → views: `buildRunView`, `buildThread`, `listTreeAgents`, `formatCost`, `formatDuration` in `src/mainview/utils/run-view.ts`.
- Popover/picker dismissal: `useDismiss` from `src/mainview/hooks/use-dismiss.ts`.
- Icons: `Icon` from `src/mainview/components/Icon.tsx`. Add a new icon as a path in `ICON_PATHS`.
- Dialogs and confirms: `Dialog` from `src/mainview/components/Dialog.tsx`.
- Status labels: `StatusPill` and `AGENT_STATUS_STYLES` from `src/mainview/components/StatusPill.tsx`.
- Thread rendering: `ThreadEntry` and `Markdown` from `src/mainview/components/`.
- Relative time: `formatTimeAgo` in `src/mainview/features/projects/time-ago.ts` (feature-private; move it to `utils/` once a second feature needs it).
- Data read from disk or RPC is `unknown` until a `read*` validator checks it at the boundary (see `readStore`, `readStoredProject` in `src/bun/workspace.ts`).
- No auth and no toast system. Failed RPC calls reach the user through the `error` banner from `useError` (`src/mainview/features/app-shell/use-error.ts`), shown by `App`: wrap a request in that hook's `runRequest(failure, request)`, or an action on the open session in `runAction(failure, action)` in `src/mainview/features/app-shell/use-run.ts`.
- Per-viewer UI state (theme): `readStored`/`writeStored` in `src/mainview/features/app-shell/use-theme.ts`, which wrap `localStorage` in try/catch.

## UI & Styling Conventions
- Framework: Tailwind CSS utility classes in TSX, plus Sass for global styles.
- Tokens & Theme: sizes, spacing, type, radii, shadows and animations are tokens in `tailwind.config.js` (they stay there; no `_variables.scss`). Colours are base colours plus design colours in `src/mainview/styles/_palette.scss`, mapped to Tailwind names in `tailwind.config.js` (`ink`, `muted`, `surface`, `accent`, `line`, …). Fonts are `--font-sans` and `--font-mono` in `_fonts.scss` (system fonts, no CDN).
- Use only token classes (`text-body`, `h-control`, `rounded-card`, `bg-surface`). Never use Tailwind arbitrary values (`w-[13px]`, `bg-[#fff]`) or default palette colours (`bg-gray-100`). Add a missing value as a token first.
- Light/dark: `:root[data-theme="dark"]` in `_palette.scss`; components read only design colours.
- Icons: inline SVG through `Icon` (`<Icon name="plus" className="size-icon-sm" />`). No icon library.

## Comments & Docs
- Comments go only in reusable files: `src/mainview/{components,hooks,services,utils}/` and `src/bun/` modules imported by other modules (e.g. `skills.ts`). Comment why, not what.
- No comments in feature files, `src/shared/interfaces/`, styles or tests. Explain them in `docs/<file-or-page>.md`.
- Update the matching `docs/*.md` and `README.md` (behaviour, stores, project structure) in the same change as the code.

## Verification Commands
- Lint: none configured (decided; do not add one).
- Typecheck: `hutch pm exec -- tsc --noEmit`. The 2 errors in `.hutch/devkit/` (ES2020 lib) come from the devkit; `src/` must have none.
- Test: `hutch test` (or `bun test` inside `devbox shell`)
- Build: `hutch run build:canary` (stable: `hutch run build`)
- Run: `hutch run dev:hmr`

## Decisions
- Overall approach: restructure to follow Vibecode, item by item, answered 2026-10-20
- Shared webview folder: keep `src/mainview/{components,hooks,services,utils}/` at the `src/mainview/` root instead of a `shared/` dir (`vibecode/references/file-organization.md:14-15`), answered 2026-10-20
- File naming in feature folders: keep `PascalCase.tsx` for components and `kebab-case.ts` for other files, even in the same folder (`vibecode/references/naming.md:11`), answered 2026-10-20
- `App.tsx` size: follow the split rule, move state into hooks in `features/app-shell/` and switch to a named export (`vibecode/references/code-structure.md:15`), answered 2026-10-20
- Size/type/radius/shadow tokens: keep them in `tailwind.config.js` instead of `_variables.scss` (`vibecode/frameworks/css/rules.md:18`), answered 2026-10-20
- Linter/formatter: keep none (`vibecode/references/project-hygiene.md:31-33`), answered 2026-10-20
- `src/bun/mock-agent-runner.ts` size: keep as one file, since it is a stand-in to be replaced (`vibecode/references/code-structure.md:15`), answered 2026-10-20
- Comments in `src/bun/` modules imported by other modules: keep, they count as reusable (`vibecode/references/code-structure.md:31`), answered 2026-10-20
- Tests mirror `src/` without the `src/` prefix; `src/bun/` stays flat; `docs/` stays flat (the rules don't cover these): keep, answered 2026-10-20
