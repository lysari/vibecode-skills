# Code Structure

## Size and shape
- A function does one thing and fits on one screen. Extract a named function when a block needs a comment to explain what it does.
- A file stays small enough to read in one pass. Split by responsibility when it grows past what the project's other files look like.
- Keep nesting shallow: return early for error and edge cases instead of wrapping the main path in `if` blocks.
- Limit function parameters to what is needed. Group related ones into an object when there are more than three.

## Reuse and abstraction
- Search for an existing helper before writing a new one.
- Extract shared code on the third repeat, not the first. Two similar blocks are fine.
- Add an abstraction only when there are at least two real callers today. Do not build for imagined future needs.
- Use the project's existing libraries and patterns before adding a dependency.

## Comments
- Comment why, not what: a hidden constraint, a workaround, a surprising choice.
- Let names carry the meaning of the code. Delete comments that restate it.
- Match the comment density of the surrounding file.
- When the project's `AGENTS.md` or its stack rules set where comments and docs go, follow them.

## Errors and values
- Handle errors at the layer that can act on them. Do not swallow them silently.
- Replace magic numbers and repeated strings with a named constant.
- Validate input at the boundary (user input, network, files), not on every internal call.

## Data and constants
- Define each piece of data once, in one file, with one fully written type that lists every field.
- Type data you read separately from data you send or collect in a form. Each entity has 2 to 3 types, one per use, kept in the same file.
- Use the final shape in the UI and callers. Do not add a layer that copies the data and renames its fields.
- Use one name per concept in every layer. If the data says `order` and `line`, never also call them `purchase`, `row`, `child`, or `item`.
- Keep nesting to two levels. Move a third level into its own named constant or type.
- Build a type from another type (inheritance, or utility types such as `Omit` and `Pick` where the language has them) only when the base type lives in the same file.
- Route user-visible text through the project's i18n mechanism, the same way neighbouring code does.
- Before adding a constant, search for an existing constant for the same concept and extend it.
