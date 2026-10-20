# File Organization

## Before creating a file
- Search the project for an existing file that already owns this responsibility. Edit it instead of adding a new one.
- Create a new file only when the code is a distinct responsibility that no existing file covers.
- Put the new file in the folder where its siblings of the same kind live (handlers with handlers, tests with tests).

## Structure
- Follow the project's existing layout. Add a new folder only when the project already groups files that way or the user asks.
- One responsibility per file. Split a file when it covers two unrelated concerns.
- Keep the root entry file to mounting the layout shell and router; never write header, sidebar, or page content directly in it, e.g. `app` mounts `layout` and `router`.
- Put each distinct UI region (layout, header, sidebar, content section, card) in its own file instead of combining them in the root or page file, e.g. `layout`, `header`, `sidebar`.
- Keep related files close: a module and its types sit side by side.
- Keep a feature module self-contained: place a module's private pages, components, and domain services inside that module's own directory, and move code into a shared directory only when 2 or more distinct modules consume it, e.g. a checkout module keeps its order form and payment service, while shared holds the button primitive.
- Organize every file in a shared directory into a subfolder grouped by its kind (components, utils, constants, interfaces, services). Never place files loose directly in the root of the shared directory, e.g. `shared/interfaces/user` or `shared/utils/date`, never `shared/user`.
- Put tests in the project's dedicated test folder, at the same relative path as the code they test. Never put a test file beside the code it tests.

## Files not to add unless asked
- Extra READMEs, notes, changelogs.
- Scratch, demo, backup, or `*_old` / `*_v2` copies.
- New config files when an existing one can hold the setting.

## Temporary files
- Put scratch output in the session scratchpad or a temp directory, never in the project tree.
