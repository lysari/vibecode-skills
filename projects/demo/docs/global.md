# Global styles

`src/styles/_global.scss` — element defaults and the shared control classes.

## Controls

| Class                      | Looks like                                                    | Markup                                                                             |
| -------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `.button`                  | White pill with a 1px border, 46px tall                       | `<button class="button" type="button">Change</button>`                             |
| `.button.is-primary`       | Dark filled pill                                              | `<button class="button is-primary" type="button">Continue</button>`                |
| `.action-button`           | White pill with a soft shadow and a 24px icon before the text | `<button class="action-button" type="button"><svg …></svg>Browse Classes</button>` |
| `.action-button.is-accent` | Same, with red text and a light red icon                      | `<button class="action-button is-accent" type="button">…</button>`                 |

Icons inside `.action-button` are stroked SVGs in a 24×24 `viewBox` with `aria-hidden="true"`; the class sets their size, stroke width and colour.

## Defaults

- `:root` sets the font stack and text colour; `body` sets the page background.
- `:focus-visible` draws a 2px `--color-focus` outline on every focusable element.
