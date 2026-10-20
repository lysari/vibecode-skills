---
name: vibecode
description: Use when writing or editing code, creating new files or folders, or adding features to a project, so changes stay clean, minimal, and easy to maintain
metadata:
  version: "0.0.1-20261020.3"
---

# Vibecode

## Overview

Write code that reads as if a careful, experienced developer wrote it by hand: the smallest change that solves the request, in the place the project already uses, so the next developer or agent can read and update it. The rules hold for any language and framework; a framework file only adds to them.

## Philosophy

Vibecode contrasts "vibe coders" who fix bugs by adding more code (quick, superficial fixes) with disciplined software developers who address the root cause by improving the underlying architecture.

Where a brittle "vibe coded" structure cracks and fails under load, resilient, well-engineered code flexibly absorbs stress and remains strong. Rather than relying on superficial, intuition-based patches that create fragile systems, Vibecode demands thoughtful engineering that builds clean, resilient code.

## Always

1. Search for an existing file, function, or constant before creating one. Edit it instead.
2. Change existing code in place and delete what it replaces. Never leave `fooNew`, `fooV2`, `_old`, or commented-out code beside it.
3. Define each piece of data once with one name per concept. Add no layer that copies it under new names.
4. Never disable a guard, validation, permission rule, or test to make a change work. Tell the user instead.
5. Keep secrets and environment-specific values out of source files.
6. Before finishing, remove debug output, unused code, and scratch files you created.
7. Prefer simple, direct code. Create no new abstraction or helper unless the same logic already exists in 3+ places or the user asked for it.

## Framework rules

Check the project root, then read every file whose row matches before writing code. A project usually matches more than one row.

| Project has | Read |
|-------------|------|
| `angular.json` | `frameworks/angular/rules.md` |
| `tsconfig.json` | `frameworks/typescript/rules.md` |
| `firebase.json` | `frameworks/firebase/rules.md` |
| `.css`, `.scss`, `.sass` or `.less` files | `frameworks/css/rules.md` |

With no matching row, apply only the generic rules and the references below. A technology gets a folder and a row only when a rule for it has come up in real work; never add one ahead of time.

## Project rules

When the project has a `.claude/project-rules.md`, read it after the framework files and follow it. It holds that project's own folders, aliases, helpers and tools, and wins over the framework files where they differ.

When the project has no `.claude/project-rules.md`, do not start the task yet:

- Run `vibecode-init`. It first asks the user to keep the project's current structure or restructure it to follow these rules, and on "restructure" asks about each difference, always with a "Keep current" option.
- Never generate the file without the user's answers.
- Start the task only after the file exists, and follow it.

## Existing code

The rules apply to the code you write or change. Report old violations to the user and leave them in place until the user asks for a cleanup.

Move the comments out of every file you edit into its doc, as `references/code-structure.md` → "Comments and docs" says. It is the one old violation you fix without being asked.

## Precedence

When the project's own `AGENTS.md` or `CLAUDE.md` sets a different rule, follow the project's rule.

## References

Read the file for the topic at hand before writing code that touches it.

| Topic | File |
|-------|------|
| Where files go, when to create one | `references/file-organization.md` |
| Naming files, functions, variables | `references/naming.md` |
| Function/file size, duplication, comments and docs | `references/code-structure.md` |
| Keeping edits minimal | `references/change-scope.md` |
| Dead code, temp files, leftovers | `references/cleanup.md` |
| Secrets, safeguards, repo, tests, README, commits | `references/project-hygiene.md` |
| Directories to skip when reviewing a project | `references/review-excludes.md` |

## Updating the `vibecode` skill

This skill is for any project. It is not fixed to one language or framework. Follow these rules when you add to or change it.

- **Keep `SKILL.md` and the files under `references/` language-neutral.** Do not put a language, framework, folder layout, file suffix, or tool name in them (for example Angular, Firebase, TypeScript, `src/app/`, `.scss`). A short example in a neutral word is fine; a rule that only works with one technology is not.
- **Put each technology's rules in its own folder** at `frameworks/<name>/rules.md`, one folder per technology (`angular`, `firebase`, `django`), never one per combination. A project loads every folder that matches.
- **Write a framework rule so it holds for every project on that technology.** Never name a project's own folders, aliases, helpers or tools in it. Those go in that project's `.claude/project-rules.md`.
- **Never edit a project's `AGENTS.md` or `CLAUDE.md`.** They belong to the project's owner.
- **Register each technology in the "Framework rules" table in `SKILL.md`**, keyed on a file an agent can check at the project root (for example `angular.json`, `pyproject.toml`). Never load a framework file without a matching row.
- **Move a rule into a framework file when it names a technology-only path, suffix, API, or tool.** Move it back into a generic file only after you can word it with no technology terms.
- **Put a technology's exclude entries under `frameworks.<name>` in `references/review-excludes.json`**, not in the top-level lists.
- **Check before you finish.** Grep the generic files for technology terms (framework names, language-only syntax, folder paths, file suffixes), and the framework files for project-only names. Rewrite or move every hit.
- **Keep the form of the rules.** Write each rule as an instruction an agent can follow and check. Do not add vague guidance or exceptions that reopen the rule.
- **Test a changed rule.** Run a subagent on a small task with and without the skill, and compare the results, before you call the change done.
