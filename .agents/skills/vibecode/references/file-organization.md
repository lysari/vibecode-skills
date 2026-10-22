# File Organization

## Before creating a file
- Search the project for an existing file that already owns this responsibility. Edit it instead of adding a new one.
- Create a new file only when the code is a distinct responsibility that no existing file covers.
- Put the new file in the folder where its siblings of the same kind live (handlers with handlers, tests with tests).

## Structure
- Follow the project's existing layout. When the project has no established layout, organize code into the standard three-tier enterprise structure: `core/`, `shared/`, and `features/`.
- Put app-wide singletons, environment configuration, base network/database clients, and cross-cutting authentication state in `core/`, e.g. `core/config` or `core/auth`.
- Put reusable, domain-agnostic UI primitives, generic utilities, and cross-feature types in `shared/`, grouped into subfolders by their kind; never put domain business logic in `shared/`, e.g. `shared/components/button` or `shared/utils/date`.
- Put each distinct business capability in its own self-contained directory under `features/<feature>/` (or `modules/<feature>/`), holding that feature's private UI views, domain services, state stores, and types, e.g. `features/checkout/order-form` and `features/checkout/payment-service`.
- Keep the root entry file to mounting the layout shell and router; never write header, sidebar, or page content directly in it, e.g. `app` mounts `layout` and `router`.
- Put each distinct UI region (layout, header, sidebar, content section, card) in its own file instead of combining them in the root or page file, e.g. `layout`, `header`, `sidebar`.
- One responsibility per file. Split a file when it covers two unrelated concerns.
- Keep related files close: a module and its types sit side by side.
- Move code from a feature into `shared/` only when 2 or more distinct modules consume it.
- Organize every file in a shared directory into a subfolder grouped by its kind (components, utils, constants, interfaces, services). Never place files loose directly in the root of the shared directory, e.g. `shared/interfaces/user` or `shared/utils/date`, never `shared/user`.
- Put tests in the project's dedicated test folder, at the same relative path as the code they test. Never put a test file beside the code it tests.

## Files not to add unless asked
- Extra READMEs, notes, changelogs.
- Scratch, demo, backup, or `*_old` / `*_v2` copies.
- New config files when an existing one can hold the setting.

## Temporary files
- Put scratch output in the session scratchpad or a temp directory, never in the project tree.
