---
name: vibecode-update
description: Use when the user gives a coding or UI rule or correction to keep ("add to vibecode", "update vibecode", "make this a rule", "make this a design rule", "from now on"), or runs /vibecode-update with no rule to turn the current session's corrections into vibecode rules
---

# Vibecode update

## Overview

Turn what the user said into one checkable line in the right `vibecode` file, and leave the skill, the project's rules and memory saying the same thing. Never edit the project's `AGENTS.md` or `CLAUDE.md`.

`vibecode/SKILL.md` → "Updating the `vibecode` skill" decides placement and wording. Read it first; this skill is the procedure around it.

`vibecode` exists to make an agent write code the way a careful, experienced developer would, in any language and framework, and build UI the way a careful designer and developer would, in any UI technology and visual style. Every rule you add serves that goal.

This skill works in any project. When you change it, write no framework, project, component, color or file name from the project you are in, e.g. "a caller that sets the option explicitly", never a real component of this repo.

## Modes

- **With a rule** (`/vibecode-update <rule>`): add or change that rule.
- **No rule** (`/vibecode-update`): take the rules from the current session only. Collect each correction, complaint or "why didn't you…" question the user gave in this conversation, e.g. "why docs not put all API that user can test?" → a docs playground rule, "why is this button a different blue from the others?" → a reuse-design-values rule in `references/design.md`. Run step 1 on each one; only the ones that pass go on to step 2. Do not ask which to add. Never pull rules from `AGENTS.md`, `CLAUDE.md` or memory that the user did not raise in this session.

## Procedure

1. **Decide whether it changes the skill.** Write a rule only for a correction that is a general coding or UI habit no line covers yet. Test it: picture a project in another language and framework, and for a UI rule another UI technology and visual style, and ask whether following the rule there makes the agent work the way a careful developer, or for UI a careful designer and developer, would. A generic rule passes only on yes; a technology rule passes only on yes for every project on that technology. Write nothing for:
   - A correction an existing line in `vibecode` already covers. You missed the rule; it does not need a new one, e.g. you skipped a caller check the skill already asks for, or added a new color when the skill already says to reuse the project's design values.
   - A fix to this session's bug or a choice for one feature or screen, e.g. which way a counter should roll, which icon a button shows.
   - A rule for one brand, feature or project, e.g. a project's own folder, alias, helper, colors, fonts or component names. It goes to that feature's skill or the project's `.agents/project-rules.md`, never `vibecode`.
   When no correction passes, change no file, bump no version, run no test, and report each correction with the reason it was skipped.
2. **Place it.** Holds for every project on one technology and names its path, suffix, API or tool → `vibecode/frameworks/<technology>/rules.md`, in the section for its topic. Otherwise → the generic file from the References table in `vibecode/SKILL.md`; UI rules go to `references/design.md`. A correction that holds both a coding habit and a UI habit becomes two lines.
   - Create a `frameworks/<technology>/` folder or a `references/` file only when a correction for it passes step 1, and add its row to the matching table in `vibecode/SKILL.md` in the same edit. Never write rules ahead of time.
3. **Search before writing.** Grep `.agents/skills/vibecode/`, `.agents/project-rules.md`, `AGENTS.md` and the memory folder for the topic.
   - Same rule exists → tighten that line in place.
   - Contradicts a line → replace it. Never keep the old line next to the new one.
   - Read `git status` first; build on uncommitted edits, not on HEAD.
4. **Ask before writing** with one AskUserQuestion when any of these is true:
   - The scope is unclear: which folders, files, screens or components the rule covers.
   - The user named no exceptions, but existing code or UI would break the rule in a way they might want to keep.
   - It reverses a rule set within the last week (check `git log -p` on the file and the memory `modified` date).
5. **Word it as a check.** Name what it covers, say "do" or "never", give one example in backticks. No "prefer", "try", "where possible", "looks good", and no "unless" clause. A real exception becomes its own line.
   - Write the habit behind the correction, not the session's bug. The rule and its example name no component, value, color, screen or bug from this session, e.g. "a caller that sets the option explicitly", not "the date picker that passes `weekStart`"; "a button that sets its own color", not "the save button that uses `#1a73e8`".
6. **Sync the sources.**
   - `AGENTS.md` wins over the skills and you never edit it. If it says something different, tell the user and write the rule so it does not contradict it.
   - If a `feedback` memory holds the same rule, cut the memory down to what is not in the repo (the why, the date) and point at the rule.
7. **Bump** `metadata.version` in `vibecode/SKILL.md`: `0.0.1-<YYYYMMDD>.<n>`. Use today's date; `n` is 1, or the previous `n` plus 1 when the date is already today.
8. **Check.** Grep the changed generic files for technology terms (framework names, framework-only folder paths, file suffixes), and the changed framework files for project-only names, colors and fonts. Move every hit.
9. **Test.** Run two dry-run subagents in parallel on a small task that tempts the rule, a UI task for a design rule: one told to use `vibecode`, one told not to. Neither edits files. The rule passes when only the agent using `vibecode` follows it.
10. **Report.** Each correction with its file and step 1 decision (written, or skipped and why), the diff per file, the test result, and any existing code or UI that breaks a new rule (list it, do not fix it).

## Common mistakes

| Mistake | Fix |
|---|---|
| UI rule written into a coding reference, or coding habit into `references/design.md` | Pick the file by topic from the References table |
| New rule added, contradicting line left in place | Replace the old line in the same edit |
| Rule lands in a skill, AGENTS.md still says the opposite | AGENTS.md wins; tell the user, never edit it |
| Same rule kept in memory and in a skill | Memory keeps only the why |
| "Never X unless it matters", "use consistent spacing where it looks right" | Ask for the exception and write it as its own line; name the check, e.g. `never write a spacing value the project's design values do not define` |
| Technology path in a generic file | Move it to `vibecode/frameworks/<technology>/rules.md` |
| Project's own folder, helper, colors, fonts or components in a skill file | Move them to the project's `.agents/project-rules.md` |
| New file added, no row in `vibecode/SKILL.md` | Add the row in the same edit |
| Version not bumped, test skipped | Steps 7 and 9 are part of done when a file changed |
| No-rule run lists AGENTS.md or memory rules and asks which to add | Use only this session's corrections, and decide each with step 1 |
| Every correction turned into a rule | Step 1 skips the ones a rule already covers, the one-off fixes and the feature-only ones |
| Rule or example retells the session's bug (its values, its component, its screen) | Write the general habit with a neutral example |
| Feature-specific rule (one component, one flow) added to a skill | Put it in that feature's skill or docs |
