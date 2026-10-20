# Tailwind configuration

## `tailwind.config.js`

The design tokens: colour names that read the palette's design colours (see `palette.md`), the font stacks, and the app's type sizes, spacing and sizes (the sidebar's `sidebar`, `header`, `traffic-lights`, `search-h`, `item-gap`, `footer-x`, the `section` and `crumb` type and the `item` radius were measured from the sidebar reference screenshot), radii, border and outline widths, shadows and the dotted canvas background. The JSDoc `@type` line on top gives the editor the config's type.

`traffic-lights-toggle` is the header's start padding while the sidebar is hidden: the traffic lights (`traffic-lights`), the Show sidebar button (`control`) and a `card` gap.

### Motion

One small set of motion tokens, modelled on macOS sidebars and sheets:

- Easing (`EASE`, also the `ease-*` classes): `standard` (`cubic-bezier(0.32, 0.72, 0, 1)`, a fast start and long settle) for panels, entries and the view indicator; `spring` (a slight overshoot) for pop-ins and the Chat | Tree indicator; `quick` for hover, press and exits. `quick` is the default, so a bare `transition` or `transition-colors` uses it.
- Duration (`DURATION`, also the `duration-*` classes): `micro` (120ms, the default) for hover, press, focus and exits; `standard` (220ms) for entries, colour changes and the theme crossfade; `panel` (340ms) for panels that change the layout; `instant` (1ms) for reduced motion.
- `scale`: `press` (0.98) for the pressed state (`active:scale-press`), `pop` (0.96) for where pop-ins start.
- `transitionProperty`: `colors` adds `outline-color` to Tailwind's list, so a selection outline fades; `padding` for the header's start padding.
- `data`: the `data-enter:` and `data-exit:` variants match the `data-presence` attribute set by `usePresence` (see `use-presence.md`).
- Keyframes and animations: `fade-in`, `rise-in` (fade up from `rail-gap`), `drop-in` (fade down) and `pop-in` (fade and scale from `pop`, `spring`) enter; `fade-out` and `pop-out` exit; `expand` and `collapse` grow a panel's width from or to `0` (the keyframe leaves the other end to the element's own width token); `focus-in` fades the focus ring in. Entries fill `backwards` and exits `forwards`, so an entered element keeps no transform.
