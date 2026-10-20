# Skills

## `src/bun/skills.ts`

Library skill discovery, install state and install, restricted to the project and library folders.

- `SKILL_SOURCES` are the folders agent tools read skills from, as `<folder>/<name>/SKILL.md`: Claude Code (`DEFAULT_SOURCE`, `.claude/skills`, where the app installs); Codex, Gemini CLI and OpenCode (`.agents`); then older Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode and Windsurf.
- `MAX_SCAN_DEPTH`: skill folders are also found in nested packages of a monorepo, down to this many folders below the library root. `SKIPPED_DIRS` and hidden folders are not scanned.
- `defaultLibraryRoot` is the skills repository the app runs from in development: the nearest folder at or above the app's own folder, else the working directory, that has `.claude/skills`. A packaged app has none and uses the library folder from Settings.
- `listSkillFiles` lists every file in a skill folder, relative to it, in a stable order, so `hashSkillFolder` gives the same hash for the same content.
- `SkillFrontmatter` holds the fields of a skill's `SKILL.md` frontmatter the app shows. `readFrontmatter` falls back to top-level `key: value` lines when the YAML does not parse, and to the folder name when there is no `name`.
- `readInstall` compares a library skill with its copy in the project's `.claude/skills`: by `metadata.version` when both have one, else by content.
- `listSkills` reads the library's skills, each with its install state in the project, sorted by name; nothing without a library folder.
- `installSkill` copies a library skill folder to the project's `.claude/skills`, moving an existing copy to the Trash first. It refuses when the copy cannot be moved to the Trash, when the project is the library, and for a path that leaves the library or the project.

## `tests/bun/skills.test.ts`

Uses temporary project and library folders (`writeSkill`, `projectSkill`, `librarySkill`). Covers reading the repo's own skills, finding skills in agent skill folders and nested packages, install state by version and by content, symlinks that leave the project, copying and updating through the Trash, and the path guards.
