# Global styles

## `src/mainview/styles/_global.scss`

- `@layer base`: full-height `html`, `body` and `#root`, the body's font and colours, and the focus ring, which fades in (`animate-focus-in`) unless the element runs an animation of its own. The light/dark crossfade (`::view-transition-old(root)`, `::view-transition-new(root)`, see `use-theme.ts` in `app.md`) uses the `standard` duration and easing. With `prefers-reduced-motion: reduce` every animation and transition takes `instant`, so it ends at once and `usePresence` still unmounts on its `animationend`; the crossfade, opacity only, stays.
- `@layer components`: the agent tree's connectors (see `agent-tree.md`), the streaming caret (see `thread-entry.md`), and `.markdown`, the typography of rendered assistant text (`Markdown`).
