# Skill types

## `src/shared/interfaces/skill.interface.ts`

Used by both the main process and the webview.

- `GLOBAL_SKILL_FOLDERS`: the global skill folders of the agent CLIs, relative to the home folder, in the order `listSkills` reads them: Claude Code (`~/.claude/skills`), the shared folder of Codex and Gemini CLI (`~/.agents/skills`), older Codex (`~/.codex/skills`), Cursor (`~/.cursor/skills`), the Antigravity CLI's global customization folder (`~/.gemini/config/skills`) and the Antigravity editor's (`~/.gemini/antigravity/skills`). Built-in skills a CLI ships with (e.g. `~/.codex/skills/.system`, `~/.cursor/skills-cursor`) are not listed. `AGENT_CLIS` names which of them each agent reads; the default agent reads all of them.
- `SkillSource`: where a skill comes from: the open project (`project`) or only an agent's global folder (`global`).
- `Skill`: a skill the open project's agents can use, one per name. `globalFolders` are the global folders that hold a skill with this name, empty when only the project has it; a `project` skill can have some too, since the project's copy wins over global ones.
