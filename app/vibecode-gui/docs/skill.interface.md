# Skill types

## `src/shared/skill.interface.ts`

Used by both the main process and the webview.

- `SkillInstall`: a library skill is not in the project yet (`available`), has an identical copy there (`installed`), or has a copy that differs (`outdated`).
- `Skill`: a skill of the library with its install state in the open project; `dir` is the absolute path of the skill folder; `version` is its `metadata.version`, null when it has none.
