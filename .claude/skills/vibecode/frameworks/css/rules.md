# CSS Rules

Apply these on top of the generic rules when the project has `.css`, `.scss`, `.sass` or `.less` files.

## Custom properties
- Declare a custom property that reads another custom property on the element a caller overrides, never on `:root`, e.g. `--cell: calc(var(--line) + 2 * var(--pad))` on the component's host. A custom property resolves its `var()`s where it is declared.
- Size every inner part of a component (padding, gap, icon, handle, mark, default font) from the component's size custom properties, e.g. `height: calc(var(--_height) * 3 / 8)` for a handle. Never give an inner part a fixed px value that only fits the default size.

## Colours
- Write every colour value as hex, e.g. `#0066d6`, or as `rgb()` when it has transparency, e.g. `rgb(16 24 40 / 0.08)`. Never write `oklch()`, `oklab()`, `lch()`, `lab()`, `hsl()` or `hwb()`.

## Nesting in `.scss`, `.sass` and `.less`
- Nest every selector inside the rule of the element it sits in, as deep as the markup goes. Never write the parent again at the top level, e.g. `.card { ul { … } li { span { … } } }`, not `.card ul { … }` and `.card li span { … }`.
- Write a state or modifier of the same element with `&` inside its rule, e.g. `.card { &:hover { … } &.is-open { … } }`, never `.card:hover { … }` beside `.card`.
- Write each `@media` inside the rule it changes, e.g. `.card { padding: 32px; @media (max-width: 640px) { padding: 16px; } }`. Never collect breakpoints in a block at the end of the file.
- Keep a selector at the top level when it styles elements under two or more different parents, e.g. a `.tag` used inside both `.header` and `.footer`. Never copy its declarations into each parent's block.

## Matching a reference
- When the user gives a reference image, measure every dimension in it at the image's scale (height, padding, radius, gap, font size, colour), list each one beside your component's value, and change each one that differs.
- Compare against a browser screenshot of your component at the reference's width, never by checking the default size alone.
