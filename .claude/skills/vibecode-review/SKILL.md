---
name: vibecode-review
description: Use after an agent finishes implementing a task or when reviewing work done in the current session, to re-read all skills used, verify compliance against every rule, detect skipped or violated rules, and produce a checklist review
metadata:
  version: "0.0.1-20261020.1"
---

# Vibecode review

## Overview

Perform a post-implementation compliance review on the current session's work. Call this skill immediately after an agent completes writing, editing, or refactoring code or UI, before presenting the task as complete to the user.

The reviewer never relies on memory, cached summaries, or assumptions. It must **re-read the full skill files directly from disk** for every skill used or applicable in the session, extract every checkable rule, inspect the actual session changes (`git diff`, modified/created files, commands executed, scratch files), and evaluate compliance rule by rule as a structured checklist.

## When to use

- **Automatic post-implementation gate**: Run immediately after finishing a code or UI implementation task, before saying "Done" or asking the user to review.
- **On-demand session audit** (`/vibecode-review`): When the user asks to review the session's work, verify compliance, or check if any rules were skipped.
- **Targeted skill review** (`/vibecode-review <skill-name>`): When auditing against a specific skill (e.g. `vibecode`, `vibecode-design`).

---

## Procedure

### 1. Identify all skills used or applicable

Scan the session context, project root, and modified files to list every skill that governed or should have governed the work:

1. **Active session skills**: Any skill loaded, mentioned, or invoked during the session (e.g. `vibecode`, `vibecode-design`).
2. **Project- and diff-matching framework rules**: Check both project root files AND all file extensions created or modified in `git status -s` against the table in `vibecode/SKILL.md`. Projects routinely match multiple rows:
   - If any `.css`, `.scss`, `.sass`, or `.less` file was created or modified, `frameworks/css/rules.md` is **mandatory** in the re-read list.
   - If `tsconfig.json` or any `.ts`/`.tsx` file was modified, `frameworks/typescript/rules.md` is **mandatory**.
   - If `angular.json` is present or any Angular component/service was touched, `frameworks/angular/rules.md` is **mandatory**.
   - Never stop after the first framework match. Every matching row must be included.
3. **Reference files**: Any topic reference files relevant to the changes made (e.g., `file-organization.md`, `naming.md`, `code-structure.md`, `change-scope.md`, `cleanup.md`, `project-hygiene.md`).
4. **Project rules & instructions**: `.claude/project-rules.md`, `AGENTS.md`, and `CLAUDE.md`.

### 2. Re-read the full skill files from disk

**Do not rely on memory, abbreviated context, or previous turns.**

Use file-reading tools to read the raw files from start to finish:
- Read `SKILL.md` for each identified skill.
- Read every relevant file under `references/` and `frameworks/`.
- Read `.claude/project-rules.md` if present.
- Extract every explicit rule, directive, "Always", and "Never" instruction into a list of verification criteria.

> [!IMPORTANT]
> If `AGENTS.md` or `CLAUDE.md` sets a rule that contradicts a skill, follow the project's rule. If `vibecode` and `vibecode-design` conflict, `vibecode` takes precedence.

### 3. Collect ground-truth session changes

Gather the exact footprint of what the agent did in the session:

1. **Git status & diff**:
   - Run `git status -s` to list all modified, staged, unstaged, and untracked files.
   - Run `git diff` and `git diff --cached` to inspect the exact additions and deletions.
2. **File lifecycle checks**:
   - Inspect newly created files: Were they necessary? Did an existing file or helper already exist?
   - Inspect deleted or replaced code: Was old code cleaned up in place, or left commented out / suffixed (`_old`, `New`, `V2`)?
3. **Hygiene checks**:
   - Check for leftover debug statements (`console.log`, `print`, `debugger`, `dump`).
   - Check for temporary/scratch files, test artifacts, or leftover scripts.
   - Check for hardcoded secrets, environment variables, or bypasses of validations/guards/tests.

### 4. Evaluate each rule as a checklist

Compare the actual changes against every extracted rule from the re-read skills. Mark every rule with one of four statuses:

- `[x] PASS`: The rule was strictly followed. Provide concise evidence (file and line numbers).
- `[ ] FAIL`: The rule was violated. Provide file path, line number, offending snippet, and the specific rule text broken.
- `[!] SKIPPED`: The rule applied to the work done, but the agent omitted or skipped it (e.g. forgot to check existing helpers, didn't extract design tokens, didn't remove scratch files).
- `[-] N/A`: The rule does not apply to the changes made in this session (e.g. no stylesheets modified for a backend-only change).

### 5. Generate the review report

Output the review formatted as a clear checklist:

```markdown
# Vibecode Review: <Task Name / Description>

## 1. Skills Re-read from Disk
| Skill / File | Path | Status |
|---|---|---|
| vibecode | `.claude/skills/vibecode/SKILL.md` | Re-read |
| vibecode/change-scope | `.claude/skills/vibecode/references/change-scope.md` | Re-read |
| vibecode/cleanup | `.claude/skills/vibecode/references/cleanup.md` | Re-read |
| ... | ... | ... |

## 2. Changes Inspected
- Modified: `path/to/file1.ts` (+12, -4)
- Created: `path/to/file2.ts` (+35)
- Untracked / Scratch: none

## 3. Compliance Checklist

### Core Rules (vibecode)
- [x] Search before creating: Verified no existing helper for X existed ([file.ts:20](file:///...))
- [x] In-place edit: Replaced old logic directly; no `_old`, `New`, `V2`, or commented-out code
- [x] Single concept, single name: No duplicate mapping or renamed proxy models
- [x] Guards & validations preserved: No guards, permissions, or tests disabled
- [x] No secrets in source: Environment variables used properly
- [x] Cleanup completed: No leftover debug statements, unused imports, or scratch files
- [x] Minimal abstraction: No unnecessary helper created (<3 call sites)

### Topic & Framework Rules
- [x] Scope: Kept diff minimal to solve only the request ([change-scope.md](file:///...))
- [ ] Code structure: Function `calculateStats` exceeds 50 lines without sub-helpers ([file.ts:104](file:///...))
- [-] CSS / Styling: N/A (no styles changed)

### Design Rules (vibecode-design) *(if UI touched)*
- [!] Design tokens: Hardcoded `padding: 24px` instead of using project spacing token ([card.component.html:15](file:///...))

## 4. Discrepancies & Violations
| Status | File:Line | Violated / Skipped Rule | Remediation |
|---|---|---|---|
| `[ ] FAIL` | `src/stats.ts:104` | Function size limit (code-structure.md) | Break helper logic into smaller focused functions |
| `[!] SKIPPED` | `src/card.html:15` | Never hardcode spacing (vibecode-design) | Replace `24px` with `space-section` token |

## 5. Verdict
- **[ACTION REQUIRED]**: 1 violation, 1 skipped rule. Fix discrepancies before marking done.
*(or **[PASS]**: All skills satisfied. Work is clean and compliant.)*
```

### 6. Remediate findings

- If any item is marked `[ ] FAIL` or `[!] SKIPPED`:
  - Perform the immediate in-place remediation to fix the violations.
  - Re-verify the amended diff against the checklist.
  - Report the final clean state to the user.

---

## Common mistakes

| Mistake | Fix |
|---|---|
| Assuming rules from memory without re-reading files | Always read the actual `SKILL.md`, `references/`, and `frameworks/` files from disk before checking |
| Auditing only the primary framework (e.g., checking only Angular but skipping CSS rules when styles were touched) | Inspect `git status -s` file extensions against all rows in `vibecode/SKILL.md`; include every matching framework in the Step 1 re-read list |
| Giving a vague high-level "looks good" text | Output an explicit checklist with `[x]`, `[ ]`, `[!]`, and `[-]` for every rule |
| Ignoring silent skips | If a rule applies to the work (e.g. check existing callers, remove debug code) and wasn't done, mark it `[!] SKIPPED` |
| Overriding project instructions | `AGENTS.md` and `CLAUDE.md` always take precedence over skill rules |
| Flagging pre-existing code violations | The review applies strictly to code written or modified in the current session; note pre-existing issues separately without failing the session |
| Leaving scratch files or debug logs behind | Check untracked files and git diff for temporary files or console prints before approving |

