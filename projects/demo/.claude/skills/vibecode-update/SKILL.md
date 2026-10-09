---
name: vibecode-update
description: Use when the user gives a coding rule or correction to keep ("add to vibecode", "update vibecode", "make this a rule", "from now on"), or runs /vibecode-update with no rule to turn the current session's corrections into vibecode rules
---

# Vibecode update

## Overview

Turn what the user said into one checkable line in the right `vibecode` file, and leave `vibecode`, the project's rules and memory saying the same thing. Never edit the project's `AGENTS.md` or `CLAUDE.md`.

`vibecode/SKILL.md` → "Updating the `vibecode` skill" decides placement and wording. Read it first; this skill is the procedure around it.

`vibecode` exists to make an agent write code the way a careful, experienced developer would, in any language and framework. Every rule you add serves that goal.

This skill works in any project. When you change it, write no framework, project, component or file name from the project you are in, e.g. "a caller that sets the option explicitly", never a real component of this repo.

## Modes

- **With a rule** (`/vibecode-update <rule>`): add or change that rule.
- **No rule** (`/vibecode-update`): take the rules from the current session only. Collect each correction, complaint or "why didn't you…" question the user gave in this conversation, e.g. "why docs not put all API that user can test?" → a docs playground rule. Run step 1 on each one; only the ones that pass go on to step 2. Do not ask which to add. Never pull rules from `AGENTS.md`, `CLAUDE.md` or memory that the user did not raise in this session.

## Procedure

1. **Decide whether it changes `vibecode`.** Write a rule only for a correction that is a general coding habit no line covers yet. Test it: picture a project in another language and framework, and ask whether following the rule there makes the agent work and write code the way a careful developer would. A generic rule passes only on yes; a stack rule passes only on yes for every project on that stack. Write nothing for:
   - A correction an existing line already covers. You missed the rule; it does not need a new one, e.g. you skipped a caller check the skill already asks for.
   - A fix to this session's bug or a design choice for one feature, e.g. which way a counter should roll.
   - A rule for one feature or one project, e.g. a project's own folder, alias or helper. It goes to that feature's skill or the project's `.claude/project-rules.md`, never `vibecode`.
   When no correction passes, change no file, bump no version, run no test, and report each correction with the reason it was skipped.
2. **Place it.** Holds for every project on one technology and names its path, suffix, API or tool → `frameworks/<technology>/rules.md`, in the section for its topic. Otherwise → the generic file from the References table in `vibecode/SKILL.md`.
   - Create a `frameworks/<technology>/` folder only when a correction for that technology passes step 1. Never write rules for a technology ahead of time.
3. **Search before writing.** Grep `.claude/skills/vibecode/`, `.claude/project-rules.md`, `AGENTS.md` and the memory folder for the topic.
   - Same rule exists → tighten that line in place.
   - Contradicts a line → replace it. Never keep the old line next to the new one.
   - Read `git status` first; build on uncommitted edits, not on HEAD.
4. **Ask before writing** with one AskUserQuestion when any of these is true:
   - The scope is unclear: which folders or files the rule covers.
   - The user named no exceptions, but existing code would break the rule in a way they might want to keep.
   - It reverses a rule set within the last week (check `git log -p` on the file and the memory `modified` date).
5. **Word it as a check.** Name the files it covers, say "do" or "never", give one example in backticks. No "prefer", "try", "where possible", and no "unless" clause. A real exception becomes its own line.
   - Write the habit behind the correction, not the session's bug. The rule and its example name no component, value or bug from this session, e.g. "a caller that sets the option explicitly", not "the date picker that passes `weekStart`".
6. **Sync the sources.**
   - `AGENTS.md` wins over the skill and you never edit it. If it says something different, tell the user and write the rule so it does not contradict it.
   - If a `feedback` memory holds the same rule, cut the memory down to what is not in the repo (the why, the date) and point at the rule.
7. **Bump** `metadata.version` in `vibecode/SKILL.md`: `0.0.1-<YYYYMMDD>.<n>`. Use today's date; `n` is 1, or the previous `n` plus 1 when the date is already today.
8. **Check.** Grep the generic files for technology terms (framework names, framework-only folder paths, file suffixes), and the framework files for project-only names. Move every hit.
9. **Test.** Run two dry-run subagents in parallel on a small task that tempts the rule: one told to use `vibecode`, one told not to. Neither edits files. The rule passes when only the `vibecode` agent follows it.
10. **Report.** Each correction with its step 1 decision (written, or skipped and why), the diff per file, the test result, and any existing code that breaks a new rule (list it, do not fix it).

## Common mistakes

| Mistake | Fix |
|---|---|
| New rule added, contradicting line left in place | Replace the old line in the same edit |
| Rule lands in vibecode, AGENTS.md still says the opposite | AGENTS.md wins; tell the user, never edit it |
| Same rule kept in memory and in vibecode | Memory keeps only the why |
| "Never X unless it matters" | Ask for the exception, write it as its own line |
| Technology path in a generic file | Move it to `frameworks/<technology>/rules.md` |
| Project's own folder or helper in a framework file | Move it to the project's `.claude/project-rules.md` |
| Version not bumped, test skipped | Steps 7 and 9 are part of done when a file changed |
| No-rule run lists AGENTS.md or memory rules and asks which to add | Use only this session's corrections, and decide each with step 1 |
| Every correction turned into a rule | Step 1 skips the ones a rule already covers, the one-off fixes and the feature-only ones |
| Rule or example retells the session's bug (its values, its component) | Write the general habit with a neutral example |
| Feature-specific rule (motion, one component) added to `vibecode` | Put it in that feature's skill or docs |
