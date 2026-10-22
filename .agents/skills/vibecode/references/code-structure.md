# Code Structure

## Prefer simple over clever

- Write the most direct and boring code that solves the problem.
- Do not introduce a new abstraction, helper, service, mapper, factory, or utility unless:
  - The same logic already appears in 3 or more places, **or**
  - The user explicitly asked for it.
- Keep helper logic inline in the file that uses it until 3 callers share it. Split UI regions into files as `references/file-organization.md` says.
- Prefer a little duplication over an abstraction that forces the reader to jump between files.
- Avoid patterns that add indirection without clear benefit (extra mappers, converters, adapters, strategy objects, etc.) unless the project already uses that pattern heavily.

## Size and shape
- A function does one thing and fits on one screen. Extract a named function when a block needs a comment to explain what it does.
- A file stays small enough to read in one pass. Split by responsibility when it grows past what the project's other files look like.
- Keep nesting shallow: return early for error and edge cases instead of wrapping the main path in `if` blocks.
- Limit function parameters to what is needed. Group related ones into an object when there are more than three.

## Explicit over generated
- Write each fixed item (a form field, a table column, a menu entry, a route) out as its own line, so it is easy to read and customize on its own.
- Do not build a config array plus a loop to produce a fixed list of items.
- Loop only over data whose count changes at runtime (rows the user adds or removes, records from a server).

## Reuse and abstraction
- Search for an existing helper before writing a new one.
- When an existing helper does part of the job, extend it in place so every current caller still passes its tests, e.g. let `optionOf(key)` also accept a key read as text. Never add a near-copy beside it.
- Never add a parameter, option, or branch that no caller uses today.
- Use the project's existing libraries and patterns before adding a dependency.

## Comments and docs
- Write code comments only in shared utility files, the files of helper functions reused across features, e.g. a shared date or retry helper.
- Never write a comment in any other file: components, pages and screens, their markup and styles, state stores, services, constants, interfaces and types, and tests.
- Write a `docs/<page-name>.md` for each page, grouped by topic, e.g. `docs/order-list.md`.
- Write a `docs/<file-name>.md` for any other file that may not hold comments only when it has a hidden constraint, a workaround, or a flow its names cannot carry. Never write a doc that restates the code.
- Never write section banners, such as a `Handlers` divider line between blocks of code.
- When you edit a file that holds comments it may not have, move what they explain into its `docs/<file-name>.md` or `docs/<page-name>.md` and delete them from the file.
- Add a `docs/<file-name>.md` or `docs/<page-name>.md` without being asked. It is the one kind of doc you may add unasked.
- When you create the `docs/` folder, create `docs/.gitignore` holding only `*` in the same change, so the docs stay out of version control.
- Never add, edit or delete `docs/.gitignore` in a `docs/` folder that already exists.
- In a utility file, write a doc comment of one or two lines above each exported function that says what it is for and how to use it, e.g. "Formats a date for display. Pass the date and an optional locale."
- Never describe the steps of an implementation in a comment. Explain them in the file's `docs/<file-name>.md`.
- Write a comment inside a function body only for a hidden constraint or a workaround, in one line.
- Let names carry the meaning of the code. Delete comments that restate it.
- Never copy the comment density of nearby code.
- When the project's `AGENTS.md`, its `.agents/project-rules.md` or its framework rules set where comments and docs go, follow them.

## Errors and values
- Handle errors at the layer that can act on them. Do not swallow them silently.
- Replace magic numbers and repeated strings with a named constant.
- Validate input at the boundary (user input, network, files), not on every internal call.
- When code decides whether a character in user-visible or user-entered text is a digit or a letter, accept every script the app displays, never ASCII alone, e.g. `/\p{Nd}/u` instead of `/[0-9]/`. Test it with a sample in each script, such as `១២៣` beside `123`.

## Resources and cleanup
- Clean up what you start: remove event listeners, cancel timers, and close subscriptions when a component, screen, or service is destroyed, so memory does not leak.
- Fetch large data in pages or chunks; never pull an unbounded list of records into memory at once.

## Data and constants
- Define each piece of data once, in one file, with one fully written type that lists every field.
- Type data you read separately from data you send or collect in a form. Give an entity one type per use it has today, at most 3, kept in the same file. Never add a form type for an entity no form edits.
- Use the final shape in the UI and callers. Do not add a layer that copies the data and renames its fields.
- Use one name per concept in every layer. If the data says `order` and `line`, never also call them `purchase`, `row`, `child`, or `item`.
- Keep nesting to two levels. Move a third level into its own named constant or type.
- Build a type from another type (inheritance, or utility types such as `Omit` and `Pick` where the language has them) only when the base type lives in the same file.
- Route user-visible text through the project's i18n mechanism, the same way neighbouring code does.
- Before adding a constant, search for an existing constant for the same concept and extend it.
