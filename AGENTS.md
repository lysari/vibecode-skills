# devOps

- Before writing or editing code, or creating files or folders, use the `vibecode` skill (`.claude/skills/vibecode/`).

## Updating the `vibecode` skill

This skill is for any project. It is not fixed to one language or framework. Follow these rules when you add to or change it.

- **Keep `SKILL.md` and the files directly under `references/` language-neutral.** Do not put a language, framework, folder layout, file suffix, or tool name in them (for example Angular, Firebase, TypeScript, `src/app/`, `.scss`). A short example in a neutral word is fine; a rule that only works in one stack is not.
- **Put stack-specific rules in their own files** at `references/stacks/<stack-name>/rules.md`, with extra files in the same folder when the rules need them (for example `interfaces.md`). Name the folder after the stack (`angular-firebase`, `python-django`).
- **Register each stack in the "Stack rules" table in `SKILL.md`**, keyed on a file or folder an agent can check at the project root (for example `angular.json`, `pyproject.toml`). Never load a stack file without a matching row.
- **Move a rule into a stack file when it names a stack-only path, suffix, API, or tool.** Move it back into a generic file only after you can word it with no stack terms.
- **Put stack-specific exclude entries under `stacks.<stack-name>` in `references/review-excludes.json`**, not in the top-level lists.
- **Check before you finish.** Grep the generic files for stack terms (framework names, language-only syntax, folder paths, file suffixes). Rewrite or move every hit.
- **Keep the form of the rules.** Write each rule as an instruction an agent can follow and check. Do not add vague guidance or exceptions that reopen the rule.
- **Test a changed rule.** Run a subagent on a small task with and without the skill, and compare the results, before you call the change done.
