# Palette

`src/styles/_palette.scss` — every colour on the site.

## How the values were made

- Each base colour is sampled from the reference screenshot's pixels: the median of a flat fill, or the core of a glyph or icon stroke.
- Every value was checked against the computed colour of the matching element in the rendered page.

## Rules

- Pages and components read only the `--color-*` design colours, never a base colour such as `--gray-900`.
- To add a colour, add the base colour first, then a design colour that points at it.

## Design colours

| Token | Base | Value | Used for |
| ----- | ---- | ----- | -------- |
| `--color-window-bg` | `--slate-200` | #e3e6eb | Window shell frosted background |
| `--color-window-border` | `--slate-400` | #d6eaf6 | Glassmorphic window border |
| `--color-sidebar-bg` | `--slate-100` | #ebecf0 | Left navigation sidebar background |
| `--color-panel-bg` | `--slate-50` | #f5f6fa | Main content panel background |
| `--color-card-bg` | `--white` | #ffffff | Cards and white surfaces |
| `--color-card-border` | `--gray-200` | #eaeaec | Card borders and icon box outlines |
| `--color-search-bg` | `--slate-300` | #dfe3e4 | Search input background |
| `--color-search-badge` | `--gray-300` | #dadada | Hotkey shortcut pill background |
| `--color-nav-active-bg` | `--slate-250` | #dfe0e4 | Active navigation link background |
| `--color-dropdown-bg` | `--gray-100` | #f6f6f6 | Dropdown selectors and header pills |
| `--color-manage-btn-bg` | `--gray-100` | #f6f6f6 | Manage button fill |
| `--color-badge-free-bg` | `--gray-200` | #eaeaec | Free plan badge background |
| `--color-logo-bg` | `--dark-squircle` | #161d20 | Neon logo squircle fill |
| `--color-text` | `--gray-900` | #0a0b0f | Standard body and label text |
| `--color-text-heading` | `--gray-900` | #0a0b0f | H1/H2 card titles |
| `--color-text-subheading`| `--gray-700` | #454648 | Secondary descriptions |
| `--color-text-section` | `--gray-800` | #404145 | Section header labels |
| `--color-text-nav` | `--gray-600` | #636469 | Inactive navigation links |
| `--color-text-nav-active`| `--gray-900` | #0a0b0f | Active navigation link text |
| `--color-text-badge` | `--gray-500` | #707173 | Free badge text |
| `--color-text-hotkey` | `--gray-500` | #707173 | Hotkey badge text |
| `--color-text-placeholder`| `--gray-600` | #636469 | Search input placeholder |
| `--color-status-live` | `--green-300` | #aee790 | Online status dot indicator |
| `--color-chart-bar` | `--blue-500` | #3b6cdb | Chart bar primary blue segment |
| `--color-chart-bar-light`| `--blue-200` | #cdd7f2 | Chart bar secondary light segment |
| `--color-chart-grid` | `--gray-200` | #eaeaec | Chart horizontal gridlines |
| `--color-star-icon` | `--blue-600` | #0f62fe | Scale banner star icon |
