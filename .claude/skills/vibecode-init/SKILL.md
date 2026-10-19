---
name: vibecode-init
description: Use when onboarding an existing or new project to the Vibecode ecosystem, to inspect repository architecture, code styles, path aliases, shared helpers, and test tooling, generate a tailored .claude/project-rules.md, and configure AGENTS.md to enforce /vibecode-workflow across all AI tools
metadata:
  version: "0.0.1-20261019.2"
---

# Vibecode Init

## Overview

Profile an existing or new repository and generate a tailored `.claude/project-rules.md` file. In addition, configure the root `AGENTS.md` to enforce the `/vibecode-workflow` skill for all coding tasks, and safely point auxiliary client files (`CLAUDE.md`, `GEMINI.md`) to `AGENTS.md`. This establishes a unified, project-specific contract that ensures all AI tools adapt faithfully to the project's existing architecture and idioms without breaking legacy conventions.

Vibecode skills treat `.claude/project-rules.md` and `AGENTS.md` as higher precedence than all generic and framework rules. Generating these files upfront is the primary safeguard when introducing Vibecode to legacy or established repositories.

---

## When to use

- **First-time repository onboarding**: Whenever working on a project that does not yet have `.claude/project-rules.md`.
- **Pre-flight in `use-vibecode`**: Triggered automatically during Stage 1 (Preparation & Rule Discovery) if no project rules or agent instructions are found.
- **On-demand initialization (`/vibecode-init`)**: When the user explicitly asks to profile, initialize, or adapt Vibecode to the current project.
- **After major refactors**: When directory structures, core utilities, or path aliases have changed and project rules need recalibration.

---

## Profiling Procedure

Execute a read-only, non-destructive audit of the repository across seven inspection dimensions. Base every rule on concrete findings from real files in the project—never guess or insert generic placeholders.

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
- Where do tests live? (e.g. adjacent `*.spec.ts` vs dedicated `tests/` directory)

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

## Output Template for `.claude/project-rules.md`

Generate `.claude/project-rules.md` using this standard structure, populated with project facts:

```markdown
# Project Rules

## Tech Stack
- Language & Framework: <Language> (<Framework> <Version>)
- Package Manager: <npm | pnpm | yarn | bun | cargo | etc.>

## Architecture & Directory Map
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
```

---

## Agent Instructions & Cross-Agent Alignment

After profiling the codebase and drafting `.claude/project-rules.md`, configure the unified agent instruction files so all coding tools adhere to the same workflow:

### 8. Configure `AGENTS.md` (Unified Directive)
Ensure `AGENTS.md` at the project root contains the top-level directive to use `vibecode-workflow`:
- **Required Directives**:
  ```markdown
  # Agent Instructions

  - Always use skill `/vibecode-workflow` to write code in this project.
  - Follow project architecture, aliases, and conventions documented in `.claude/project-rules.md`.
  ```
- **Preservation Rule**: If `AGENTS.md` already exists, append or merge the `/vibecode-workflow` directive without overwriting or deleting any existing owner notes or rules. If it does not exist, create it with the standard directives.

### 9. Point Auxiliary Agent Files (`CLAUDE.md`, `GEMINI.md`)
Different AI tools look for specific root instruction files. Unify them by pointing to `AGENTS.md`:
- **If the file already exists (`CLAUDE.md` or `GEMINI.md`)**:
  - **Do NOT overwrite or delete existing content.**
  - Check if it already references `AGENTS.md`. If not, prepend or append:
    ```markdown
    > See [AGENTS.md](./AGENTS.md) for unified project instructions, architecture, and workflow rules.
    ```
- **If the file does NOT exist**:
  - Create the file with a clean pointer to `AGENTS.md`:
    ```markdown
    # Instructions

    See [AGENTS.md](./AGENTS.md) for unified project instructions, architecture, and workflow rules.
    ```

---

## Workflow & User Safeguards

1. **Perform read-only scan**: Never alter project files during profiling.
2. **Draft project rules**: Populate the template based strictly on observed repository patterns.
3. **Present to the user**: Show the detected profile, proposed `.claude/project-rules.md`, and planned `AGENTS.md` directives to the user for review.
4. **Write `.claude/project-rules.md`**: Create `.claude/` if needed and write the project rules.
5. **Update or create `AGENTS.md`**: Add the `/vibecode-workflow` directive.
6. **Link auxiliary files (`CLAUDE.md`, `GEMINI.md`)**: Safely point them to `AGENTS.md` without clobbering existing content.
7. **Verify with Git**: Run `git status -s` to confirm only the intended instruction and rule files were touched.

