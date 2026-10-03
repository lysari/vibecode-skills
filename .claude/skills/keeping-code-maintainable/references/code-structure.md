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

## Errors and values
- Handle errors at the layer that can act on them. Do not swallow them silently.
- Replace magic numbers and repeated strings with a named constant.
- Validate input at the boundary (user input, network, files), not on every internal call.
