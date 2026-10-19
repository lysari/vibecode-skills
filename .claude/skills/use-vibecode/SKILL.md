---
name: use-vibecode
description: Use for end-to-end coding and UI tasks to run the complete Vibecode lifecycle: build clean code with vibecode, apply design tokens and layout rules with vibecode-design, and verify compliance with vibecode-review
metadata:
  version: "0.0.1-20261019.1"
---

# Use Vibecode

## Overview

Execute software and UI engineering tasks through the complete, end-to-end Vibecode lifecycle. It coordinates three interconnected disciplines into a single workflow:

1. **`vibecode`**: Write minimal, clean, maintainable code following strict hygiene and framework rules.
2. **`vibecode-design`**: Build pixel-consistent, token-driven, accessible UI screens and components whenever user interfaces or styling are touched.
3. **`vibecode-review`**: Conduct a mandatory post-implementation compliance review directly against the skill files on disk before considering the task complete.

```
       [ Stage 1: Preparation ]
                   │
                   ▼
       [ Stage 2: Implementation ]
        ├─ Core Logic: vibecode
        └─ UI / Styling: vibecode-design
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

1. **Determine Task Scope**:
   - Is this logic/backend-only, UI/frontend-only, or fullstack?
   - If UI is touched, `vibecode-design` rules are automatically activated.
2. **Detect Matching Frameworks**:
   - Inspect the project root against the framework table in `vibecode/SKILL.md`:
     - `angular.json` → `frameworks/angular/rules.md`
     - `tsconfig.json` → `frameworks/typescript/rules.md`
     - `firebase.json` → `frameworks/firebase/rules.md`
     - `.css`, `.scss`, `.sass`, `.less` → `frameworks/css/rules.md`
3. **Read Project Overrides**:
   - Check for `.claude/project-rules.md`, `AGENTS.md`, or `CLAUDE.md`.
4. **Precedence Hierarchy**:
   - **Level 1 (Highest)**: Project instructions (`AGENTS.md` / `CLAUDE.md`).
   - **Level 2**: Project-specific rules (`.claude/project-rules.md`).
   - **Level 3**: `vibecode` core and topic references.
   - **Level 4**: `vibecode-design` rules. Where `vibecode` and `vibecode-design` conflict, `vibecode` wins.

---

### Stage 2: Implementation

Write changes adhering strictly to both code and design principles:

#### 1. Code Construction Rules (`vibecode`)
- **Search before creating**: Look for existing files, functions, types, and constants before creating new ones. Extend or edit existing utilities.
- **In-place replacement**: Edit existing code in place and delete what it replaces. Never leave dead code, commented-out blocks, `_old`, `New`, or `V2` suffixes.
- **Single concept, single name**: Define each concept once. Never introduce translation layers that duplicate data under new names.
- **Preserve safeguards**: Never disable a guard, validation, permission check, or test to make code work.
- **No secrets in code**: Keep environment values and secrets strictly out of source files.
- **Minimal abstraction**: Do not introduce generic wrappers or helpers unless the exact same logic already occurs in 3+ places or was explicitly requested.
- **Consult topic references**:
  - `references/file-organization.md` for folder structure and placement.
  - `references/naming.md` for consistent naming conventions.
  - `references/code-structure.md` for function size, duplication limits, and comments.
  - `references/change-scope.md` for keeping diffs minimal.
  - `references/cleanup.md` for removing temporary code and scratch files.
  - `references/project-hygiene.md` for tests, repo cleanliness, and commits.

#### 2. Design & UI Rules (`vibecode-design`) *(When UI or styles are involved)*
- **Token-first from reference images**:
  - Sample colors from flat fills and glyph cores; measure spacing, radii, font sizes, line heights, and borders at the image scale.
  - Never estimate by eye or hardcode raw literal values in components (e.g. use `space-section`, never `32px`).
  - Store sampled values in project design tokens before building components.
  - For surfaces over blurred backdrops, use alpha below `1` (`rgb(255 255 255 / 0.7)` with blur, never opaque `#ffffff`).
- **Layout & viewport scaling**:
  - Stretch app layouts to `100%` width and height. Never constrain the outer container with a fixed `max-width` that leaves dead margins on wide screens.
  - Lock desktop viewport height (`height: 100dvh; overflow: hidden`) and let sidebar and content areas scroll independently (`min-height: 0; overflow-y: auto`).
  - Subsection navigation belongs in layout-level split panes/sidebars, never inside scrollable page bodies.
- **Navigation & controls**:
  - Never squeeze horizontal tab strips into narrow sidebars where text clips; use vertical lists or scrollable pills.
  - Never wrap toolbars or badge pills in an outer enclosing pill container; let individual pills sit on transparent containers.
- **Corner radius calculation**:
  - Calculate nested radii: `inner_radius = outer_radius - padding`.
  - Set inner radius to `0` when padding is greater than or equal to outer radius.

---

### Stage 3: Verification Gate & Remediation (`vibecode-review`)

Do **not** present the task as done or ask the user to test until the post-implementation review has completed and passed.

1. **Re-read skills from disk**:
   - Re-read `vibecode/SKILL.md`, `vibecode-design/SKILL.md` (if UI touched), `vibecode-review/SKILL.md`, and applicable framework/reference files. Never rely on memory.
2. **Collect actual session changes**:
   - Inspect `git status -s` and `git diff`.
   - Verify file lifecycles: check newly added files, deleted code, and untracked files.
   - Check hygiene: verify zero debug statements (`console.log`, `print`, `debugger`), no leftover scratch files, no bypassed tests.
3. **Score against the checklist**:
   - `[x] PASS`: Rule followed with concrete evidence (file and line).
   - `[ ] FAIL`: Rule violated (specify file, line, offending code, and broken rule).
   - `[!] SKIPPED`: Applicable rule was skipped or forgotten.
   - `[-] N/A`: Rule not applicable to this change.
4. **Output the Vibecode Review Report**:
   - Follow the standard checklist layout from `vibecode-review/SKILL.md`.
5. **Remediate immediately**:
   - If any item is `[ ] FAIL` or `[!] SKIPPED`, fix it in place immediately.
   - Re-inspect `git diff` to confirm the fix.
   - Only conclude when the verdict is `[PASS]`.

---

## Workflow Checklist

Before declaring any coding or UI task complete, confirm:

- [ ] Identified all applicable skills (`vibecode`, `vibecode-design` if UI, frameworks, references).
- [ ] Searched for existing code/utilities before adding new files or helpers.
- [ ] Edited existing code in place without leaving `_old`, `New`, `V2`, or commented-out remnants.
- [ ] Extracted and used design tokens if UI was built or changed.
- [ ] Cleaned up all scratch files, debug logs, and unused imports.
- [ ] Re-read skills from disk and executed `vibecode-review`.
- [ ] Fixed any violations discovered during review.
- [ ] Output the final review checklist with verdict `[PASS]`.

---

## Common Mistakes

| Mistake | Correction |
|---|---|
| Stopping after writing code without running `vibecode-review` | `vibecode-review` is a mandatory gate; never conclude without the review checklist |
| Hardcoding CSS spacing or colors instead of tokens | Define tokens first, then reference tokens in components |
| Leaving `_old` files or commented-out backup code | Delete replaced code completely in the same edit |
| Skipping framework rules | Check project root for `angular.json`, `tsconfig.json`, `firebase.json`, etc., and read the matching rules before coding |
| Reviewing from memory instead of disk | Re-read the raw skill and reference files directly from disk during Stage 3 |
| Leaving review failures unfixed | Fix every `[ ] FAIL` and `[!] SKIPPED` immediately before reporting done |

