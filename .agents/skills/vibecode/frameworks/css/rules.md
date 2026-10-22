# CSS Rules

Apply these on top of the generic rules when the project has `.css`, `.scss`, `.sass` or `.less` files.

## Custom properties
- Declare a custom property that reads a custom property callers override on the element they override it on, never on `:root`, e.g. `--cell: calc(var(--line) + 2 * var(--pad))` on the component's host. A custom property resolves its `var()`s where it is declared.
- Keep a component's own custom properties in that component's stylesheet, named `--<component>-*`, e.g. `--card-gap` in the card's stylesheet.
- When a component offers more than one size, size every inner part (padding, gap, icon, handle, mark, default font) from its size custom properties, e.g. `height: calc(var(--_height) * 3 / 8)` for a handle. Never give such a component's inner part a fixed px value that only fits the default size.
- Never add size custom properties to a component that has one size.

## Colours
- Write every colour value as hex, e.g. `#0066d6`, or as `rgb()` when it has transparency, e.g. `rgb(16 24 40 / 0.08)`. Never write `oklch()`, `oklab()`, `lch()`, `lab()`, `hsl()` or `hwb()`.
- Put every global colour in one palette file, e.g. `_palette.scss`: first each base colour with its value, e.g. `--primary: #0066d6`, `--gray-200: #e3e7ed`, then each design colour as a `var()` of a base colour, e.g. `--border: var(--gray-200)`. Never give a design colour a literal value.
- Read only design colours outside the palette file, e.g. `var(--brand)`, never `var(--primary)`. To change a colour for one part of the page, override the design colour there, never a base colour.

## Global styles
- Declare every global style variable (a custom property on `:root`, or a preprocessor variable read by 2 or more files) in a file of the project's global styles folder. Never declare one in the entry stylesheet or in a page or component stylesheet; the entry stylesheet only loads the global files, e.g. `@use 'palette';`.
- Put every `@font-face` and every font variable in one fonts file, e.g. `--font-sans` in `_fonts.scss`. Serve the font files from the project's own static folder, never from a font CDN `<link>` or `@import url()`.
- Put every other global variable (radius, shadow, layout size) in one variables file, e.g. `--radius-lg`, `--page-width` in `_variables.scss`.
- Put every global style rule (element defaults, form controls, shared classes such as `.eyebrow`) in one global rules file, e.g. `body { margin: 0; }` in `_global.scss`.

## Layout
- Give a full-screen application shell `width: 100%`, never a fixed `max-width` such as `max-width: 1200px`.
- Lock the shell to the viewport on desktop with `height: 100dvh; overflow: hidden`, and give each pane that scrolls on its own `min-height: 0; overflow-y: auto`.
- Fill the space under a header or toolbar with a flex or grid parent and `flex: 1; min-height: 0; overflow-y: auto` on the main panel, never `margin-top: 86px` or `position: fixed; top: 69px`.
- Wrap a wide table or grid in a container with `width: 100%; overflow-x: auto`.

## Nesting in `.scss`, `.sass` and `.less`
- Nest every selector inside the rule of the element it sits in, as deep as the markup goes. Never write the parent again at the top level, e.g. `.card { ul { … } li { span { … } } }`, not `.card ul { … }` and `.card li span { … }`.
- Write a state or modifier of the same element with `&` inside its rule, e.g. `.card { &:hover { … } &.is-open { … } }`, never `.card:hover { … }` beside `.card`.
- Write each `@media` inside the rule it changes, e.g. `.card { padding: 32px; @media (max-width: 640px) { padding: 16px; } }`. Never collect breakpoints in a block at the end of the file.
- Keep a selector at the top level when it styles elements under two or more different parents, e.g. a `.tag` used inside both `.header` and `.footer`. Never copy its declarations into each parent's block.

## Matching a reference
- When the user gives a reference image, measure every dimension in it at the image's scale (height, padding, radius, gap, font size, colour), list each one beside your component's value, and change each one that differs.
- Compare against a browser screenshot of your component at the reference's width, never by checking the default size alone.
