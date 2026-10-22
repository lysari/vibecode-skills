---
name: vibecode-init
description: Use when onboarding an existing or new project to the Vibecode ecosystem, to inspect repository architecture, code styles, path aliases, shared helpers, and test tooling, generate a tailored .agents/project-rules.md, and configure AGENTS.md to enforce /vibecode-workflow across all AI tools
metadata:
  version: "0.0.1-20261022.2"
---

# Vibecode Init

## Overview

Profile an existing or new repository and generate a tailored `.agents/project-rules.md` file. In addition, configure the root `AGENTS.md` to enforce the `/vibecode-workflow` skill for all coding tasks, and safely point auxiliary client files (`CLAUDE.md`, `GEMINI.md`) to `AGENTS.md`. This establishes a unified, project-specific contract that all AI tools follow. For every place the project differs from the Vibecode rules, the contract records the user's answer: keep the project's current way, or change it to follow the rule.

Vibecode skills treat `.agents/project-rules.md` and `AGENTS.md` as higher precedence than all generic and framework rules. Generating these files upfront is the primary safeguard when introducing Vibecode to legacy or established repositories.

---

## When to use

- **First-time repository onboarding**: Whenever working on a project that does not yet have `.agents/project-rules.md`.
- **Pre-flight in `use-vibecode`**: Triggered automatically during Stage 1 (Preparation & Rule Discovery) if no project rules or agent instructions are found.
- **On-demand initialization (`/vibecode-init`)**: When the user explicitly asks to profile, initialize, or adapt Vibecode to the current project.
- **After major refactors**: When directory structures, core utilities, or path aliases have changed and project rules need recalibration.

---

## Detect Project State

Before profiling, decide which state the repository is in from its manifests, file tree, and `git log --oneline` (when it is a git repository):

| State | Signs | Path |
|-------|-------|------|
| Established | Domain code beyond a starter template, or a history of real feature commits | "Profiling Procedure", then "Compare With Vibecode Rules & Ask the User" |
| Scaffolded | A manifest and only the files a generator created (`create-next-app`, `ng new`, `npm create vite`, ...), with one or two commits | "Scaffolded Project" |
| Empty | No manifest and no source files, possibly no git repository | "Empty Project" |

When the signs are mixed, ask the user which state fits.

### Scaffolded Project

1. Run the "Profiling Procedure" for the stack, aliases, styling, and verification commands. Never record the template's folders, demo files, or naming as project conventions.
2. Ask the first question with "Restructure to follow Vibecode (Recommended)" first. On "Restructure", take the structure and conventions from the matching `vibecode/frameworks/<stack>/rules.md` files (see the "Framework rules" table in `vibecode/SKILL.md`) without asking about each template difference, and ask only where those rules are silent, e.g. a folder name they do not set.
3. List the starter boilerplate to remove or move (demo components, placeholder markup, co-located sample tests) under "Pending Restructure".

### Empty Project

1. Skip profiling and the keep-or-restructure question: there is nothing to keep.
2. Ask the user for the stack: language and framework, package manager, styling approach when there is a UI, and test tool. Ask in batches of up to 4 questions, recommended option first, and record each answer under "Decisions".
3. Fill `.agents/project-rules.md` from the answers and the matching `vibecode/frameworks/<stack>/rules.md` files. Write "None yet" for sections with no facts, such as aliases, shared helpers, tokens, and verification commands.
4. Never scaffold the project or install packages. Init writes only the rule and instruction files.

For both new states, start `.agents/project-rules.md` with `> Provisional: generated for a new project. Re-run /vibecode-init once the first features exist.` When init runs on a provisional file, profile the project as Established and remove the note.

---

## Profiling Procedure

For an Established or Scaffolded project, execute a read-only, non-destructive audit of the repository across seven inspection dimensions. Base every rule on concrete findings from real files in the project—never guess or insert generic placeholders.

### 1. Detect Core Tech Stack & Build Tooling
Inspect the root directory:
- Manifests: `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `pom.xml`, `build.gradle`, `Gemfile`, `composer.json`.
- Framework configs: `angular.json`, `next.config.*`, `vite.config.*`, `nuxt.config.*`, `svelte.config.*`, `astro.config.*`, `firebase.json`.
- Language configs: `tsconfig.json`, `jsconfig.json`, `.eslintrc*`, `biome.json`.

Record the primary language, framework, runtime version, and package manager.

### 2. Extract Path Aliases & Module Resolution
Inspect path mapping configs (`tsconfig.json` `compilerOptions.paths`, `vite.config.*`, `webpack.config.*`):
- Record exact alias patterns (e.g. `@/*` -> `src/*`, `@components/*` -> `src/components/*`).
- Specify when to use relative imports vs alias imports.

### 3. Map Directory Anatomy & Responsibilities
Scan the tree to identify where responsibilities live:
- Where do domain features live? (e.g. `src/features/<feature>/` vs `src/modules/<feature>/`)
- Where do shared/reusable UI components live? (e.g. `src/components/ui/` vs `src/shared/components/`)
- Where do backend/API services live? (e.g. `src/services/`, `src/api/`, `src/lib/server/`)
- Where do state management stores live? (e.g. `src/store/`, `src/context/`, `src/state/`)
- Where do data models/types live? (e.g. co-located with features vs centralized in `src/types/`)
- Where do tests live? (e.g. adjacent `*.spec.ts` vs dedicated `tests/` or `specs/` directory)
- Generate a visual ASCII directory structure tree showing where each layer and responsibility lives (matching the project's actual structure on "Keep current", or the framework's Vibecode structure on "Restructure").

### 4. Sample Existing Code Style & Naming Conventions
Sample 5–10 representative files across different folders to determine dominant idioms:
- **File naming**: `kebab-case.ts`, `camelCase.ts`, or `PascalCase.tsx`.
- **Component naming**: `PascalCase` function declarations vs arrow constants.
- **Export patterns**: Named exports (`export function`) vs default exports (`export default`).
- **Function/variable style**: `camelCase`, `snake_case`.
- **Type/Interface prefixes**: `IUser` vs `User` vs `UserType`.
- **Domain vocabulary**: Identify canonical domain words (e.g. does the project use `order` or `purchase`? `member`, `user`, or `account`?).

### 5. Identify Core Shared Helpers & Singletons (Avoid Duplication)
Locate existing shared infrastructure so the agent never creates duplicate utilities:
- **HTTP / API client**: Name the existing wrapper or Axios/fetch instance (e.g. `src/lib/api-client.ts`).
- **Authentication**: How is current user/auth session accessed? (e.g. `useAuth()`, `sessionProvider`).
- **Notifications/Toasts**: Name the existing alert/toast utility (e.g. `toast.show()`).
- **Date/Time & Formatters**: Name existing formatting helpers.

### 6. Identify UI & Design System Patterns (If UI exists)
If the project has a frontend or UI layer:
- **Styling approach**: Tailwind CSS, CSS Modules, SCSS, Styled Components, Vanilla Extract, or UI libraries (Shadcn UI, Material UI, Ant Design, Chakra UI).
- **Design token location**: Where are theme colors, font families, and spacing defined? (e.g. `tailwind.config.js`, `src/styles/tokens.css`, `theme.ts`).
- **Icons**: What icon library does the project use? (e.g. Lucide, Heroicons, FontAwesome).

### 7. Map Verification & Quality Tooling
Inspect scripts in the manifest to document standard verification commands:
- Lint command: (e.g. `npm run lint`, `cargo clippy`, `flake8`)
- Type-check command: (e.g. `npm run type-check`, `tsc --noEmit`)
- Test command: (e.g. `npm test`, `pytest`, `cargo test`)
- Build command: (e.g. `npm run build`)

---

## Compare With Vibecode Rules & Ask the User

After profiling, and before drafting anything:

1. Ask the user one question first: "Keep this project's current structure and conventions, or restructure it to follow the Vibecode rules?", with the options "Keep current (adapt the rules to this project)" and "Restructure to follow Vibecode".
2. **Keep current**: ask nothing more. Record each observed pattern as the project's rule, record the choice under "Decisions", and go on to drafting.
3. **Restructure**: compare and ask about each difference.
   - Read `vibecode/SKILL.md`, every file under `vibecode/references/`, and the framework files whose row matches the project.
   - List each place the project differs from a rule, e.g. folder structure, shared code layout, naming, where tests, types or docs live. For each difference, record the rule (`file:line`) and what the project does (real paths).
   - Also list each place where the rules are silent and the project made its own choice, e.g. a folder name the rules do not set.
   - Ask the user about every item, e.g. "Tests live beside the source files: keep them there, or move them to a mirrored test folder?". Ask in batches of up to 4 questions until every item has an answer.
   - Give every question a "Keep current" option. Put the recommended option first and mark it "(Recommended)"; never drop "Keep current" from a question.
   - Never draft or write `.agents/project-rules.md` before every item has an answer.
4. When `.agents/project-rules.md` already exists, read it first, keep every answer listed under its "Decisions", and ask only the questions it does not answer, the first question included.
5. Init never moves or rewrites project code. Record each "change" answer as a rule and list the moves it needs under "Pending Restructure", then offer to run that restructure as a separate task.

---

## Output Template for `.agents/project-rules.md`

Generate `.agents/project-rules.md` using this standard structure, populated with project facts:

```markdown
# Project Rules

## Tech Stack
- Language & Framework: <Language> (<Framework> <Version>)
- Package Manager: <npm | pnpm | yarn | bun | cargo | etc.>

## Architecture & Directory Map

```text
<source-root>/
├── <directory-1>/                      # <responsibility>
│   ├── <sub-directory>/                # <responsibility>
│   └── ...
├── <directory-2>/                      # <responsibility>
└── ...
```

- `<folder-1>`: <responsibility>
- `<folder-2>`: <responsibility>
- New feature code belongs in: `<feature-path>`
- Shared primitives belong in: `<shared-path>`

## Import Aliases & Paths
- `<alias>`: `<maps-to>`
- Always use `<alias-style>` for imports across module boundaries.

## Naming Conventions
- Files: `<kebab-case | camelCase | PascalCase>`
- Components: `<PascalCase>`
- Utilities / Hooks: `<camelCase>` (`use<Name>`)
- Types / Interfaces: `<Name>` (no `I` prefix / with `T` prefix, etc.)
- Domain terms: Use `<canonical-term>`, never `<synonym>`.

## Core Shared Helpers (Do Not Duplicate)
- HTTP / API: Use `<path-to-api-client>`, never raw fetch/axios.
- Auth / Session: Use `<auth-hook-or-service>`.
- Notifications: Use `<toast-or-alert-service>`.
- Existing utility directory: `<path-to-utils>`.

## UI & Styling Conventions (If applicable)
- Framework: <Tailwind | CSS Modules | UI Library>
- Tokens & Theme: Defined in `<path-to-tokens-or-config>`
- Icons: Use `<icon-library>` from `<import-path>`

## Verification Commands
- Lint: `<lint-command>`
- Typecheck: `<typecheck-command>`
- Test: `<test-command>`
- Build: `<build-command>`

## Decisions
- <topic>: keep `<project way>` | follow `<vibecode rule>` (`<rule file:line>`), answered <YYYY-MM-DD>

## Pending Restructure
- <move or rename needed by a "follow" decision>, e.g. `<old path>` → `<new path>`
```

Write every section above from the user's answers and observed facts. Remove "Pending Restructure" once its moves are done.

---

## Agent Instructions & Cross-Agent Alignment

After profiling the codebase and drafting `.agents/project-rules.md`, configure the unified agent instruction files so all coding tools adhere to the same workflow:

### 8. Configure `AGENTS.md` (Unified Directive)
Ensure `AGENTS.md` at the project root contains the top-level directive to use `vibecode-workflow`:
- **Required Directives**:
  ```markdown
  # Agent Instructions

  - Always use skill `/vibecode-workflow` to write code in this project.
  - Follow project architecture, aliases, and conventions documented in `.agents/project-rules.md`.
  ```
- **Preservation Rule**: If `AGENTS.md` already exists, append or merge the `/vibecode-workflow` directive without overwriting or deleting any existing owner notes or rules. If it does not exist, create it with the standard directives.

### 9. Point Auxiliary Agent Files (`CLAUDE.md`, `GEMINI.md`)
Different AI tools look for specific root instruction files. Unify them by referencing `@AGENTS.md`:
- **If the file already exists (`CLAUDE.md` or `GEMINI.md`)**:
  - **Do NOT overwrite or delete existing content.**
  - Check if it already includes `@AGENTS.md`. If not, append `@AGENTS.md` on a new line.
- **If the file does NOT exist**:
  - Create the file containing only:
    ```markdown
    @AGENTS.md
    ```

---

## Workflow & User Safeguards

1. **Perform read-only scan**: Detect the project state, then profile without altering project files.
2. **Ask keep or restructure**: Follow "Compare With Vibecode Rules & Ask the User". On "Keep current", go straight to drafting; on "Restructure", ask until every difference has an answer. For a Scaffolded or Empty project, follow its section under "Detect Project State" instead.
3. **Draft project rules**: Populate the template from observed repository patterns and the user's answers.
4. **Present to the user**: Show the detected profile, proposed `.agents/project-rules.md`, and planned `AGENTS.md` directives to the user for review.
5. **Write `.agents/project-rules.md`**: Create `.agents/` if needed and write the project rules.
6. **Update or create `AGENTS.md`**: Add the `/vibecode-workflow` directive.
7. **Link auxiliary files (`CLAUDE.md`, `GEMINI.md`)**: Safely reference `@AGENTS.md` without clobbering existing content.
8. **Verify with Git**: Run `git status -s` to confirm only the intended instruction and rule files were touched. When the project is not a git repository, list the files written instead and offer to run `git init`.
9. **Offer the restructure**: When "Pending Restructure" lists moves, offer to run them as a separate task.

