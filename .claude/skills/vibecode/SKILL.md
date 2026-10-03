---
name: vibecode
description: Use when writing or editing code, creating new files or folders, or adding features to a project, so changes stay clean, minimal, and easy to maintain
metadata:
  version: "0.0.1-20261003.1"
---

# Vibecode

## Overview

Make the smallest change that solves the request, in the place the project already uses, so the next developer or agent can read and update it.

## Always

1. Search for an existing file, function, or constant before creating one. Edit it instead.
2. Change existing code in place and delete what it replaces. Never leave `fooNew`, `fooV2`, `_old`, or commented-out code beside it.
3. Define each piece of data once with one name per concept. Add no layer that copies it under new names.
4. Never disable a guard, validation, permission rule, or test to make a change work. Tell the user instead.
5. Keep secrets and environment-specific values out of source files.
6. Before finishing, remove debug output, unused code, and scratch files you created.

## Stack rules

Check the project root, then read the matching file before writing code:

| Project has | Read |
|-------------|------|
| `angular.json` | `references/stacks/angular-firebase/rules.md` |

For any other stack, apply only the generic rules and the references below. To add a stack, create `references/stacks/<name>/rules.md` and add a row here.

## Existing code

The rules apply to the code you write or change. Report old violations to the user and leave them in place until the user asks for a cleanup.

## Precedence

When the project's own `AGENTS.md` or `CLAUDE.md` sets a different rule, follow the project's rule.

## References

Read the file for the topic at hand before writing code that touches it.

| Topic | File |
|-------|------|
| Where files go, when to create one | `references/file-organization.md` |
| Naming files, functions, variables | `references/naming.md` |
| Function/file size, duplication, comments | `references/code-structure.md` |
| Keeping edits minimal | `references/change-scope.md` |
| Dead code, temp files, leftovers | `references/cleanup.md` |
| Secrets, safeguards, repo, tests, README, commits | `references/project-hygiene.md` |
| Directories to skip when reviewing a project | `references/review-excludes.md` |
