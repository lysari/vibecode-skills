# File Organization

## Before creating a file
- Search the project for an existing file that already owns this responsibility. Edit it instead of adding a new one.
- Create a new file only when the code is a distinct responsibility that no existing file covers.
- Put the new file in the folder where its siblings of the same kind live (handlers with handlers, tests with tests).

## Structure
- Follow the project's existing layout. Add a new folder only when the project already groups files that way or the user asks.
- One responsibility per file. Split a file when it covers two unrelated concerns.
- Keep related files close: a module, its tests, and its types sit side by side or follow the project's test convention.

## Files not to add unless asked
- Extra READMEs, notes, changelogs.
- Scratch, demo, backup, or `*_old` / `*_v2` copies.
- New config files when an existing one can hold the setting.

## Temporary files
- Put scratch output in the session scratchpad or a temp directory, never in the project tree.
