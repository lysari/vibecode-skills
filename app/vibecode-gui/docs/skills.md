# Skills

## `src/bun/skills.ts`

Skill discovery for the composer: the open project's own skills and the skills in the agents' global folders in the user's home folder. It only reads, and only `SKILL.md` files; the app never installs, copies or changes a skill.

- `SkillRoots`: the open project and the home folder (`Utils.paths.home` in the app, a temporary folder in the tests).
- `SKILL_SOURCES` are the folders agent tools read a project's skills from, as `<folder>/<name>/SKILL.md`: Claude Code (`.claude/skills`); Codex, Gemini CLI, OpenCode and Antigravity (`.agents`); then older Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode and Windsurf.
- `MAX_SCAN_DEPTH`: project skill folders are also found in nested packages of a monorepo, down to this many folders below the project root. `SKIPPED_DIRS` and hidden folders are not scanned.
- `listSourceSkillDirs` lists the skill folders of one source folder: folders and symlinks that hold a `SKILL.md`, so a skill linked into `~/.claude/skills` from a skills repository is found. A dangling link or a folder without `SKILL.md` is skipped.
- `findProjectSkillDirs` keeps only the project skill folders whose real path stays inside the project, so a link that leads outside is not read.
- `SkillFrontmatter` holds the fields of a skill's `SKILL.md` frontmatter the app shows. `readFrontmatter` reads `SKILL.md` through its symlinks, falls back to top-level `key: value` lines when the YAML does not parse, and to the folder name when there is no `name`.
- `listSkills` lists each skill name once, sorted by name: first the project's skills (the first folder in `SKILL_SOURCES` order wins a name the project has twice), then the global folders in `GLOBAL_SKILL_FOLDERS` order under the home folder. A global skill with the name of a project skill is not listed again; its folder is added to the project skill's `globalFolders`. A skill in several global folders (e.g. linked into both `~/.claude/skills` and `~/.cursor/skills`) gets every folder in `globalFolders` and the description of the first one.

## `tests/bun/skills.test.ts`

Uses temporary project and home folders (`writeSkill`), never the real home folder. Covers finding project skills in agent skill folders and nested packages, skipping links that leave the project, reading each global folder through symlinks with one entry per name, a project skill winning over a global one, skipping folders without `SKILL.md` and dangling links, and that listing changes no file.
