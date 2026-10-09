# Code Structure

## Prefer simple over clever

- Write the most direct and boring code that solves the problem.
- Do not introduce a new abstraction, helper, service, mapper, factory, or utility unless:
  - The same logic already appears in 3 or more places, **or**
  - The user explicitly asked for it.
- When in doubt, keep the logic inline or in the existing function/file.
- Never create a new file or layer just to make the code look “cleaner” or more “professional”.
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

## Comments
- Comment why, not what: a hidden constraint, a workaround, a surprising choice.
- Let names carry the meaning of the code. Delete comments that restate it.
- Never copy the comment density of nearby code. Write a comment only where the project's rules allow one, and only for a why.
- When the project's `AGENTS.md`, its `.claude/project-rules.md` or its framework rules set where comments and docs go, follow them.

## Errors and values
- Handle errors at the layer that can act on them. Do not swallow them silently.
- Replace magic numbers and repeated strings with a named constant.
- Validate input at the boundary (user input, network, files), not on every internal call.
- When code decides whether a character in user-visible or user-entered text is a digit or a letter, accept every script the app displays, never ASCII alone, e.g. `/\p{Nd}/u` instead of `/[0-9]/`. Test it with a sample in each script, such as `១២៣` beside `123`.

## Data and constants
- Define each piece of data once, in one file, with one fully written type that lists every field.
- Type data you read separately from data you send or collect in a form. Each entity has 2 to 3 types, one per use, kept in the same file.
- Use the final shape in the UI and callers. Do not add a layer that copies the data and renames its fields.
- Use one name per concept in every layer. If the data says `order` and `line`, never also call them `purchase`, `row`, `child`, or `item`.
- Keep nesting to two levels. Move a third level into its own named constant or type.
- Build a type from another type (inheritance, or utility types such as `Omit` and `Pick` where the language has them) only when the base type lives in the same file.
- Route user-visible text through the project's i18n mechanism, the same way neighbouring code does.
- Before adding a constant, search for an existing constant for the same concept and extend it.
