# Palette

## `src/mainview/styles/_palette.scss`

- The first `:root` block holds the base colours. They were sampled from the reference screenshot and screen recording, and darkened where text needs WCAG AA contrast.
- The second `:root` block holds the design colours of the light theme, each a `var()` of a base colour; `&[data-theme="dark"]` holds those of the dark theme. `App` sets `data-theme` from the theme toggle.
- The sidebar colours (`--surface-sidebar*`, `--border-sidebar*`, `--text-sidebar*`, `--icon-sidebar`) were sampled from the sidebar reference screenshot. Its surfaces are alpha colours (`--sand-tint-*`, `--black-alpha-*`, `--white-alpha-*`) laid over the window's surface, so the sidebar reads as a warm translucent layer in both themes.
- Components read only the design colours, through the Tailwind colour names in `tailwind.config.js`.
