---
name: use-vibecode
description: "Use for end-to-end coding and UI tasks to run the complete Vibecode lifecycle: build clean code and UI with vibecode, and verify compliance with vibecode-review"
metadata:
  version: "0.0.1-20261022.3"
---

# Use Vibecode

## Overview

Execute software and UI engineering tasks through the complete, end-to-end Vibecode lifecycle. It coordinates two interconnected disciplines into a single workflow:

1. **`vibecode`**: Write minimal, clean, maintainable code following strict hygiene and framework rules, and token-driven, accessible UI through `references/design.md` whenever user interfaces or styling are touched.
2. **`vibecode-review`**: Conduct a mandatory post-implementation compliance review directly against the skill files on disk before considering the task complete.

```
       [ Stage 1: Preparation ]
                   │
                   ▼
       [ Stage 2: Implementation ]
        ├─ Core Logic: vibecode
        └─ UI / Styling: vibecode/references/design.md
                   │
                   ▼
       [ Stage 3: Post-Implementation Gate ]
        └─ Compliance Audit: vibecode-review
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   [FAIL / SKIP]            [PASS]
   Fix in-place & re-audit    Mark Done & Report
```

---

## When to use

- **Primary default for coding tasks**: Use whenever writing, editing, or refactoring code or creating UI features.
- **Fullstack and UI features**: Where both backend/logic and frontend/styles are created or altered.
- **Autonomous workflows**: Guarantees that code is not only written well, but strictly audited against the project's standards before finishing.

---

## The 3-Stage Lifecycle

### Stage 1: Preparation & Rule Discovery

Before modifying or writing any file:

1. **Determine Task Scope & Project Maturity**:
   - Is this logic/backend-only, UI/frontend-only, or fullstack?
   - Check if the project is a newly created, template-generated, or freshly scaffolded repository versus an established codebase. In a newly scaffolded project, never preserve CLI starter boilerplate, placeholder files, or co-located demo tests as legacy code; purge or restructure them immediately to conform to Vibecode rules.
   - If UI is touched, `vibecode/references/design.md` applies.
2. **Detect Matching Frameworks**:
   - Check the project root and every file type to be touched against the "Framework rules" table in `vibecode/SKILL.md`, and read every matching row. A project routinely matches several rows; never stop at the first match.
3. **Read Project Overrides & Onboarding**:
   - Check for `.agents/project-rules.md`, `AGENTS.md`, or `CLAUDE.md`.
   - **If no project rules exist**: The repository has not yet been profiled for Vibecode. Stop before implementing and follow `vibecode-init`: profile the codebase, ask the user to keep the current structure or restructure it to follow the Vibecode rules (on restructure, ask about each difference, always offering "Keep current"), and generate `.agents/project-rules.md` from the answers. Start the task only after the file exists.
4. **Precedence Hierarchy**:
   - **Level 1 (Highest)**: Project instructions (`AGENTS.md` / `CLAUDE.md`).
   - **Level 2**: Project-specific rules (`.agents/project-rules.md`).
   - **Level 3**: `vibecode` core, framework files, and topic references.

---

### Stage 2: Implementation

Read the skill files and follow them. This skill does not restate their rules, so never work from a summary of them.

1. **Code**: `vibecode/SKILL.md`, every framework file whose row matches, and the `references/` file for each topic the change touches, as its "References" table lists.
2. **UI and styles**: `vibecode/references/design.md` whenever a screen, component, layout, or stylesheet changes.

---

### Stage 3: Verification Gate & Remediation (`vibecode-review`)

Do **not** present the task as done or ask the user to test until `vibecode-review` has run and its verdict is `[PASS]`. Read `vibecode-review/SKILL.md` and follow its procedure, fixing every `[ ] FAIL` and `[!] SKIPPED` item in place before you conclude. A change that edits one existing file and creates no file gets its short review.

---

## Workflow Checklist

Before declaring any coding or UI task complete, confirm:

- [ ] Identified all applicable rules (`vibecode`, frameworks, references, `references/design.md` if UI).
- [ ] Searched for existing code/utilities before adding new files or helpers.
- [ ] Edited existing code in place without leaving `_old`, `New`, `V2`, or commented-out remnants.
- [ ] Kept code clean of section banners and restating comments.
- [ ] Extracted and used design tokens if UI was built or changed.
- [ ] Cleaned up all scratch files, debug logs, and unused imports.
- [ ] Re-read skills from disk and executed `vibecode-review`.
- [ ] Fixed any violations discovered during review.
- [ ] Output the review (the full checklist, or the short review for a one-file change) with verdict `[PASS]`.

---

## Common Mistakes

| Mistake | Correction |
|---|---|
| Stopping after writing code without running `vibecode-review` | `vibecode-review` is a mandatory gate; never conclude without the review checklist |
| Hardcoding CSS spacing or colors instead of tokens | Define tokens first, then reference tokens in components |
| Leaving `_old` files or commented-out backup code | Delete replaced code completely in the same edit |
| Skipping framework rules | Check the project root against the "Framework rules" table in `vibecode/SKILL.md` and read every matching file before coding |
| Working from a summary of the rules | Read `vibecode/SKILL.md` and its matching framework and reference files themselves; this skill only points to them |
| Reviewing from memory instead of disk | Re-read the raw skill and reference files directly from disk during Stage 3 |
| Leaving review failures unfixed | Fix every `[ ] FAIL` and `[!] SKIPPED` immediately before reporting done |

