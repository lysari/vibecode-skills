# Today page

`src/app/pages/today/` — the app's home route (`/`), and the reference screen the site's design values were measured from.

## Sections

- **Daily focus card** — the class picked for today, `Continue` (`.button.is-primary`) and `Change` (`.button`), and the activity rings.
- **Quick actions** — `Quick start` (`.action-button.is-accent`) and `Browse Classes` (`.action-button`).
- **Trainers you follow** — one card per followed trainer.

The buttons have no handlers yet; the page is a demo template.

## Data

- All content is dummy data in `src/app/shared/constants/today.ts` (`DAILY_FOCUS`, `ACTIVITY`, `FOLLOWED_TRAINERS`). Replace these with real data when a backend exists.
- Types live in `src/app/shared/interfaces/` (`daily-focus`, `activity`, `trainer`).

## Activity rings

- One 141px SVG: steps (blue, outer), move (red, middle), exercise (green, inner). Every ring has a 10px stroke and a 15px gap to the next, as measured in the reference.
- Each ring uses `pathLength="100"`, so `stroke-dasharray="<percent> 100"` fills it to that percent. `percentOf()` caps the value at 100.
- The ring group is rotated −90° and mirrored, so every ring starts at 12 o'clock and fills counter-clockwise, as in the reference.
- The red badge (28px, shoe icon) sits on the red ring's centre line, 6° left of 12 o'clock.
- The rings sit 17px (`--ring-inset`) from the card's top and right edges, inside the card's 26px padding, so the button row ends where the rings begin.
- The SVG has `role="img"` and an `aria-label` built in `activityLabel` that reads out each value and goal.

## Layout

- Above 480px (`$compact`): the card is a grid with the text and buttons on the left and the rings in the top-right corner.
- 480px and below: the rings shrink to 88px beside the title, and the buttons span the full row underneath.

## Matching the reference

- The page was compared with the reference screenshot (read at 3×) by rendering it at 518×1000 at 3× and measuring the same 69 edges, text boxes and ring segments in both images.
- 51 probes match within 0.7px; the rest differ by 1–2px, mostly a uniform ~1.3px horizontal offset below what the JPEG reference can resolve.
- Three reference colours are below WCAG AA (4.5:1) on white and are kept as-is to match the design; see `docs/palette.md`.
