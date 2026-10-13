---
name: vibecode-design-update
description: Use when the user gives a UI or design rule or correction to keep ("add to vibecode-design", "update vibecode-design", "make this a design rule"), or runs /vibecode-design-update with no rule to turn the current session's UI corrections into vibecode-design rules
---

# Vibecode design update

## Overview

Turn what the user said about UI into one checkable line in the right `vibecode-design` file, and leave `vibecode-design`, `vibecode`, the project's rules and memory saying the same thing. Never edit the project's `AGENTS.md` or `CLAUDE.md`.

`vibecode/SKILL.md` → "Updating the `vibecode` skill" decides placement and wording. Read it first and apply it to `vibecode-design` the same way; this skill is the procedure around it.

`vibecode-design` exists to make an agent build UI the way a careful designer and developer would, in any UI technology and visual style. Every rule you add serves that goal.

This skill works in any project. When you change it, write no framework, project, component, color or file name from the project you are in, e.g. "a screen that defines its own spacing value", never a real screen of this repo.

## Modes

- **With a rule** (`/vibecode-design-update <rule>`): add or change that rule.
- **No rule** (`/vibecode-design-update`): take the rules from the current session only. Collect each correction, complaint or "why didn't you…" question the user gave in this conversation about screens, components, layout, styles or accessibility, e.g. "why is this button a different blue from the others?" → a reuse-design-values rule. Run step 1 on each one; only the ones that pass go on to step 2. Do not ask which to add. Never pull rules from `AGENTS.md`, `CLAUDE.md` or memory that the user did not raise in this session.

## Procedure

1. **Decide whether it changes `vibecode-design`.** Write a rule only for a correction that is a general UI habit no line covers yet. Test it: picture a project with another UI technology and another visual style, and ask whether following the rule there makes the agent build UI the way a careful designer and developer would. A generic rule passes only on yes; a technology rule passes only on yes for every project on that technology. Write nothing for:
   - A correction an existing line in `vibecode-design` or `vibecode` already covers. You missed the rule; it does not need a new one, e.g. you added a new color when the skill already says to reuse the project's design values.
   - A coding habit that is not about UI, e.g. function size or naming. Report it and point the user to `/vibecode-update`.
   - A fix to this session's bug or a look chosen for one screen, e.g. which icon a button shows.
   - A rule for one brand, feature or project, e.g. a project's own colors, fonts or component names. It goes to that project's `.claude/project-rules.md`, never `vibecode-design`.
   When no correction passes, change no file, bump no version, run no test, and report each correction with the reason it was skipped.
2. **Place it.** Holds for every project on one UI technology and names its path, suffix, API or tool → `vibecode-design/frameworks/<technology>/rules.md`, in the section for its topic. Otherwise → the section or `references/` file for its topic in `vibecode-design`.
   - Create a `frameworks/<technology>/` folder or a `references/` file only when a correction for it passes step 1, and add its row to the matching table in `vibecode-design/SKILL.md` in the same edit. Never write rules ahead of time.
3. **Search before writing.** Grep `.claude/skills/vibecode-design/`, `.claude/skills/vibecode/`, `.claude/project-rules.md`, `AGENTS.md` and the memory folder for the topic.
   - Same rule exists → tighten that line in place.
   - Contradicts a line in `vibecode-design` → replace it. Never keep the old line next to the new one.
   - Contradicts a line in `vibecode` → `vibecode` wins. Tell the user, and write nothing until they say which to change.
   - Read `git status` first; build on uncommitted edits, not on HEAD.
4. **Ask before writing** with one AskUserQuestion when any of these is true:
   - The scope is unclear: which screens, components or files the rule covers.
   - The user named no exceptions, but existing UI would break the rule in a way they might want to keep.
   - It reverses a rule set within the last week (check `git log -p` on the file and the memory `modified` date).
5. **Word it as a check.** Name what it covers, say "do" or "never", give one example in backticks. No "prefer", "try", "where possible", "looks good", and no "unless" clause. A real exception becomes its own line.
   - Write the habit behind the correction, not the session's bug. The rule and its example name no component, color value, screen or bug from this session, e.g. "a button that sets its own color", not "the save button that uses `#1a73e8`".
6. **Sync the sources.**
   - `AGENTS.md` wins over the skill and you never edit it. If it says something different, tell the user and write the rule so it does not contradict it.
   - If a `feedback` memory holds the same rule, cut the memory down to what is not in the repo (the why, the date) and point at the rule.
7. **Bump** `metadata.version` in `vibecode-design/SKILL.md`: `0.0.1-<YYYYMMDD>.<n>`. Use today's date; `n` is 1, or the previous `n` plus 1 when the date is already today.
8. **Check.** Grep the generic `vibecode-design` files for technology terms (framework names, framework-only folder paths, file suffixes), and its framework files for project-only names, colors and fonts. Move every hit.
9. **Test.** Run two dry-run subagents in parallel on a small UI task that tempts the rule: one told to use `vibecode-design`, one told not to. Neither edits files. The rule passes when only the `vibecode-design` agent follows it.
10. **Report.** Each correction with its step 1 decision (written, sent to `/vibecode-update`, or skipped and why), the diff per file, the test result, and any existing UI that breaks a new rule (list it, do not fix it).

## Common mistakes

| Mistake | Fix |
|---|---|
| New rule added, contradicting line left in place | Replace the old line in the same edit |
| Design rule contradicts `vibecode` | `vibecode` wins; tell the user before writing |
| Coding habit written into `vibecode-design` | Point the user to `/vibecode-update` |
| Rule lands in the skill, AGENTS.md still says the opposite | AGENTS.md wins; tell the user, never edit it |
| Same rule kept in memory and in the skill | Memory keeps only the why |
| "Use consistent spacing where it looks right" | Name the check: `never write a spacing value the project's design values do not define` |
| Technology path in a generic file | Move it to `vibecode-design/frameworks/<technology>/rules.md` |
| Project's colors, fonts or components in a skill file | Move them to the project's `.claude/project-rules.md` |
| New file added, no row in the `vibecode-design/SKILL.md` table | Add the row in the same edit |
| Version not bumped, test skipped | Steps 7 and 9 are part of done when a file changed |
| No-rule run lists AGENTS.md or memory rules and asks which to add | Use only this session's corrections, and decide each with step 1 |
| Rule or example retells the session's bug (its values, its screen) | Write the general habit with a neutral example |
