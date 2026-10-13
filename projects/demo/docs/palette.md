# Palette

`src/styles/_palette.scss` — every colour on the site.

## How the values were made

- Each base colour is sampled from the reference screenshot's pixels: the median of a flat fill, or the core of a glyph or icon stroke.
- Every value was checked against the computed colour of the matching element in the rendered page.

## Rules

- Pages and components read only the `--color-*` design colours, never a base colour such as `--gray-900`.
- To add a colour, add the base colour first, then a design colour that points at it.

## Design colours

| Token                   | Base          | Value   | Used for                       |
| ----------------------- | ------------- | ------- | ------------------------------ |
| `--color-page`          | `--gray-100`  | #f4f4f4 | Page background                |
| `--color-rail`          | `--gray-200`  | #e6e6e6 | Side rail and bottom bar       |
| `--color-surface`       | `--white`     | #ffffff | Cards, pills, outline buttons  |
| `--color-border`        | `--slate-200` | #dfe4e8 | Outline button border          |
| `--color-text`          | `--gray-900`  | #2e2e2e | Headings and body text         |
| `--color-text-muted`    | `--slate-600` | #727886 | Secondary text (coach line)    |
| `--color-text-subtle`   | `--slate-400` | #989aa2 | Eyebrow labels ("Daily focus") |
| `--color-icon`          | `--slate-500` | #88909d | Icons                          |
| `--color-primary`       | `--gray-800`  | #373737 | Primary button fill            |
| `--color-accent`        | `--red-600`   | #f31f23 | Accent text                    |
| `--color-accent-icon`   | `--red-300`   | #fa8486 | Accent icons                   |
| `--color-focus`         | `--blue-500`  | #0f6dff | Keyboard focus outline         |
| `--color-ring-steps`    | `--blue-500`  | #0f6dff | Steps ring                     |
| `--color-ring-move`     | `--red-500`   | #fd2b4a | Move ring and badge            |
| `--color-ring-exercise` | `--green-500` | #26c444 | Exercise ring                  |
| `--color-ring-track`    | `--slate-100` | #e2e6ef | Unfilled ring track            |

## Contrast

Three colours are below WCAG AA (4.5:1) on white and are kept to match the reference:

- `--color-text-subtle` 2.8:1
- `--color-text-muted` 4.4:1
- `--color-accent` 4.2:1 (passes only as large bold text)
