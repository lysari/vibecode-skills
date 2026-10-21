---
name: vibecode
description: Use when writing or editing code, creating new files or folders, or adding features to a project, so changes stay clean, minimal, and easy to maintain
metadata:
  version: "0.0.1-20261021.5"
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
8. Never write section banners (e.g. `// Handlers`, `// State`, `<!-- Sidebar -->`, `/* Styles */`) or comments that restate code. Write code comments only in shared utility (helper function) files: a doc comment of one or two lines on each exported function saying what it is for and how to use it, and a one-line note for a hidden constraint or workaround.

## Framework rules

Check the project root, then read every file whose row matches before writing code. A project usually matches more than one row.

| Project has | Read |
|-------------|------|
| `angular.json` | `frameworks/angular/rules.md` |
| `next.config.js`, `next.config.mjs`, or `next.config.ts` | `frameworks/nextjs/rules.md` |
| `package.json` with `"react"` and no `next.config.*` | `frameworks/react/rules.md` |
| `package.json` with `"vue"` or `nuxt.config.*` | `frameworks/vue/rules.md` |
| `nest-cli.json` | `frameworks/nestjs/rules.md` |
| `package.json` with `"express"`, `"fastify"`, or `"hono"` | `frameworks/nodejs/rules.md` |
| `go.mod` | `frameworks/golang/rules.md` |
| `pyproject.toml`, `requirements.txt`, or `setup.py` | `frameworks/python/rules.md` |
| `bunfig.toml` or `bun.lockb` / `bun.lock` | `frameworks/bun/rules.md` |
| `tsconfig.json` | `frameworks/typescript/rules.md` |
| `firebase.json` | `frameworks/firebase/rules.md` |
| `.css`, `.scss`, `.sass` or `.less` files | `frameworks/css/rules.md` |

With no matching row, apply only the generic rules and the references below. A technology gets a folder and a row only when a rule for it has come up in real work; never add one ahead of time.

## Project rules

When the project has a `.agent/project-rules.md`, read it after the framework files and follow it. It holds that project's own folders, aliases, helpers and tools, and wins over the framework files where they differ.

When the project has no `.agent/project-rules.md`, do not start the task yet:

- Run `vibecode-init`. It first asks the user to keep the project's current structure or restructure it to follow these rules, and on "restructure" asks about each difference, always with a "Keep current" option.
- Never generate the file without the user's answers.
- Start the task only after the file exists, and follow it.

## Existing code and newly scaffolded projects

Before writing code, inspect git history, commit depth, and the file tree to determine whether the repository is an established codebase with existing domain features or a newly created, template-generated, or freshly scaffolded project:

- **In an established codebase**: The rules apply only to the code you write or change. Report pre-existing violations to the user and leave them in place until the user asks for a cleanup. Move comments out of edited files into their docs, as `references/code-structure.md` → "Comments and docs" says.
- **In a newly created or freshly scaffolded project**: Never preserve default CLI boilerplate, demo files, or scaffolded structures that violate Vibecode rules. Replace, restructure, or delete template boilerplate immediately upon initial implementation, e.g. move scaffolded co-located test files to the dedicated test directory and replace placeholder markup with the real layout shell.

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
- **Write a framework rule so it holds for every project on that technology.** Never name a project's own folders, aliases, helpers or tools in it. Those go in that project's `.agent/project-rules.md`.
- **Never edit a project's `AGENTS.md` or `CLAUDE.md`.** They belong to the project's owner.
- **Register each technology in the "Framework rules" table in `SKILL.md`**, keyed on a file an agent can check at the project root (for example `angular.json`, `pyproject.toml`). Never load a framework file without a matching row.
- **Move a rule into a framework file when it names a technology-only path, suffix, API, or tool.** Move it back into a generic file only after you can word it with no technology terms.
- **Put a technology's exclude entries under `frameworks.<name>` in `references/review-excludes.json`**, not in the top-level lists.
- **Check before you finish.** Grep the generic files for technology terms (framework names, language-only syntax, folder paths, file suffixes), and the framework files for project-only names. Rewrite or move every hit.
- **Keep the form of the rules.** Write each rule as an instruction an agent can follow and check. Do not add vague guidance or exceptions that reopen the rule.
- **Test a changed rule.** Run a subagent on a small task with and without the skill, and compare the results, before you call the change done.
