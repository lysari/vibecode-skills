---
name: liquid
description: The motion language shared by every liquid-* component — popups, tab bars, morph menus, glass surfaces, accordions, drawers. Use when building or tuning anything that opens, closes, expands, collapses or moves between positions, before changing any easing, duration or keyframe, and whenever motion is described as snappy, janky, abrupt, or "like a hit". Carries copy-paste references (plain CSS, vanilla JS, framework-free TS) and the measured traps in `fr` tracks, animation removal, interrupts and `animationend`.
---

# Liquid motion

One language, five archetypes. Everything in `src/app/shared/components/liquid-*`
speaks it, and so does `home-page-faq.scss`. Read this before writing new motion;
copy an archetype rather than inventing a sixth.

## What "liquid" means

Things have weight, and they behave like a volume of liquid rather than a
rectangle being repositioned. They arrive and settle; they never snap into place,
and they never stop dead. Someone should be able to believe the thing was pushed
and came to rest, rather than that a value changed.

Six rules carry the whole language:

1. **Decelerate into every stop.** An element still travelling fast when it
   reaches its destination reads as an impact — users describe it as a "hit".
   This applies to closing as much as opening. A close may be quicker and tighter
   than an open, but it still has to land.
2. **Overshoot, then settle.** Arriving exactly on target and stopping is
   mechanical. Go a little past and come back. How far scales with size: a panel
   hundreds of pixels tall overshoots by tens of pixels, the tab pill by 3.5px, a
   38px icon by a few percent of its scale.
3. **Deform while travelling.** Liquid does not move rigidly. The tab pill
   stretches from 151px to 209px and thins to 0.90 on the cross axis while it
   crosses, then recovers. A pressed item flattens *and widens* (`1.08 0.9`), the
   way anything soft does. A folding item swells past its own size (`1.14`) as it
   gathers and again as it lets go.
4. **Nothing moves in lockstep.** A box and its contents arriving together reads
   as one rigid object sliding. Offset them — the box leads on the way in, the
   content leads on the way out.
5. **One clock for a box and what it holds.** They open and close together, so an
   item gathers itself up as the row closes instead of emptying first and then
   closing an empty gap. Offset them in *phase*, never in duration.
6. **An interrupted motion carries on from where the eye sees it.** Never from
   the resting value, and never from a new animation's `0%`. Switching tabs
   mid-pour measures a 0px jump; that is the standard.

## The archetypes

| Archetype | Where | Numbers |
| --- | --- | --- |
| **Pour** — a highlight moving between boxes | `liquid-tabs`, `liquid-morph-menu`, via `utils/liquid-pour.ts`; `reference/liquid-pour.ts` | 340ms, 10px reach; legs at 14% / 50% / 100%; thins to 0.94 → 0.90. |
| **Grow from origin** — a panel out of its trigger | `liquid-menu-popup`; `reference/liquid-popup.*` | 340ms open / 200ms close; spring `cubic-bezier(0.34, 1.32, 0.4, 1)`; content in at +40ms from `blur(12px)`, `scale(0.96)` |
| **Fold** — an item entering or leaving a row | `liquid-morph-item.directive.ts`; `reference/liquid-fold.js` | 320ms; open `cubic-bezier(0.25, 0, 0.25, 1)`, shut `cubic-bezier(0.4, 0, 0.3, 1)`; bead 0.12, swell 1.14 at 84% |
| **Press** — something soft under a finger | `utils/liquid-press.ts`, used by `liquid-morph-item` and `liquid-tab`; `reference/liquid-press.js` | 110ms to `1.08 0.9`; the bounce back takes 3.4× longer, through `0.95 1.07` → `1.02 0.985` → `1`. It squashes the element's *children*, so whatever sizes or highlights the box is left free. A tab presses its own content **and** the pill under it, on one clock. Optional `depth` scales the deformation for large surfaces — a toast card presses at 0.4 (`1.032 0.96`) |
| **Disclosure** — expand and collapse in place | `home-page-faq.scss`, `reference/` | 250ms open / 220ms close; see the `fr` traps below |
| **Slide** — content swapped inside a frame | `liquid-tab-content.directive.ts`; `reference/liquid-slide.*` | slide 420ms `cubic-bezier(0.32, 0.72, 0, 1)`; swap 260ms; resize 280ms; neighbours at `scale(0.94)`, 50% dim, 3px blur |

`liquid-glass-wrapper` is the *material*, not motion: an SVG-refraction surface
with a frosted `backdrop-filter` fallback. It only reads over a busy backdrop —
on a flat surface it costs a per-element filter and looks like nothing, which is
why the home page uses it in the hero and plain solid cards below.

## Shared mechanics

Every one of these is built the same way, and new motion should be too:

- **CSS holds the resting state; script plays the motion on top.** The pour
  writes `--liquid-tabs-indicator-{x,y,width,height}` for where the pill *lives*
  and runs the move as a Web Animation. Do not also put a CSS transition on those
  same properties — only the fade and the idle scale are transitioned.
- **Tunables are read with fallbacks, never declared in the component.** So a
  `--liquid-morph-*` set on any ancestor retunes the menu. Use `cssTime` and
  `cssLength` from `liquid-pour.ts`; they accept `ms`, `s` or a bare number.
- **Measure with layout offsets, not `getBoundingClientRect`.** A popup scaling
  open around a bar would otherwise skew everything sized to it. `offsetBox()`.
- **Read the live position before starting a new motion.** `animatedBox()` gives
  where a pouring element is right now, so a second switch flows on from it.
- **A changing value moves the way the whole value moved.** Rose → up, fell →
  down, for every part of it: `1` → `10` rolls every digit up, `10` → `9` every
  digit down. Never pick a direction per digit or per character.
- **Check `prefers-reduced-motion` in script as well as CSS.** Script-driven
  motion is not covered by the media query; `prefersReducedMotion(view)` returns
  early and the state simply lands.

## The reference

| File | What it is |
| --- | --- |
| `reference/liquid.css` | The disclosure archetype, whole. Copy as-is; retune the variables at the top. |
| `reference/liquid.js` | ~40 lines of class handling. One open at a time, `aria-expanded`, `inert`. |
| `reference/demo.html` | Runnable. The disclosure numbers below came from this page. |
| `reference/liquid-pour.ts` | The pour, framework-free and dependency-free. A copy of `src/app/shared/utils/liquid-pour.ts`, which is canonical — keep them in step. |
| `reference/liquid-util.js` | The reads every script-driven archetype starts with: `cssTime`, `cssNumber`, `offsetBox`, `content`, `animatedScale`, `prefersReducedMotion`. Everything below needs it. |
| `reference/liquid-press.js` | The press, as a plain-JS `Liquid.Press` plus `Liquid.pressable(el)` for pointer and keyboard. Twin of `utils/liquid-press.ts`. |
| `reference/liquid-fold.js` | The fold: `Liquid.foldIn` / `Liquid.foldOut`, box and content on one clock. Twin of the fold in `liquid-morph-item.directive.ts`. |
| `reference/liquid-popup.{css,js}` | Grow from origin, whole: measure, pin, place, grow from the trigger's box. Twin of `liquid-menu-popup`. |
| `reference/liquid-slide.{css,js}` | Slide, in both arrangements — a travelling track with live neighbours, and a crossfade. Twin of `liquid-tab-content.directive.ts`. |
| `reference/liquid-item.css` | The surface the press and the fold happen on, and the list rules a fold needs. |
| `reference/demo-ui.html` | Runnable. The four archetypes `demo.html` does not cover; the figures for them below came from this page. |

Opening either demo straight off disk works for watching and for sampling
geometry. To read the CSSOM — checking that the reduced-motion rules parse, for
instance — serve it instead (`python3 -m http.server`), because a `file://`
stylesheet is an opaque origin and `cssRules` throws.

**Acceptance figures**, measured, to re-check after any edit:

- *Disclosure* at 250ms open / 220ms close: box and copy both landing at 182ms,
  9.7px overshoot settling by ~420ms, close speed peaking at 38% of the travel
  and decaying to zero, 5px squash past the closed height, interrupts under 2px
  in any single frame, nothing left over at rest.
- *Pour* at 340ms across 143px: peak speed at 33% of the duration, pill stretching
  151px → 209px while thinning to `scale-y` 0.90, 3.5px overshoot past the
  resting edge, landing by ~336ms, and a mid-flight interrupt jumping 0px.
- *Interrupting a pour* leaves the scale continuous, not just the box: measured
  1.0px of rendered-width step in the switch frame against the previous frame's
  own 1.48px. `animatedScale` is what buys that. `animatedBox` alone reads
  `translate`/`width`/`height` and never `scale`, so without it the highlight
  snaps out of its thinning as the new move sets off.
- *Press* held and released: `1.08 0.9` reached by ~130ms, the bounce peaking at
  `0.95 1.07` around 257ms, through `1.02 0.985`, and back to exactly `1 1` with
  no animations left on the element by ~510ms.
- *Fold* at 320ms, measured on the list in `demo-ui.html`: peak speed at 23% of
  the fold opening and 33% closing, both decaying to zero; biggest single-frame
  step 4px, which is the fold's own travel; **nothing at all after 300ms**; the
  row handed back its exact inline styles and no `is-folding` left on it. Two
  removals 90ms apart interrupt cleanly — 5.8px in the busiest frame, both rows
  gone, list settled where it should be.
- *Grow from origin* at 340ms open: the panel's first frame is the trigger's own
  box (measured 138.7 × 35 against a 139 × 35 trigger), peak speed at 12% of the
  open, 5.8px of overshoot past its resting height, speed exactly 0 at the end,
  `is-settled` on, and the panel out of the DOM after the close. Sample from the
  *first animation frame*, not from the click: the pinned resting height is still
  showing in the click's own task and fakes a peak at 4%.
- *Slide* at 420ms travel / 280ms resize: the track lands exactly on the frame
  width, the frame's height follows 129 → 181px and stops at 267ms — before the
  content arrives, not under it — peak speed early, zero at the end, and a
  mid-flight switch starting **0px** from the live position.
- *Swap* at 260ms: the two panels' opacities sum to exactly 1.000 at every
  sampled frame, minimum and maximum both 1. Anything less and the frame shows
  through the middle of the cross, which reads as a flash.
- *Press handed to a pour* — a tab pressed, then released onto a switch: the pill
  eases straight out of the squash into the pour's own thinning, `1.080 0.900` →
  `1.065 0.908` → `1.020 0.930` → `1.000 0.940`, biggest single-frame step 0.037.
  It only does that because the pour reads the live scale and then cancels the
  press; leaving both running hands the pill to whichever animated `scale` last.

**Porting.** The classes are the whole contract: `is-open` for state,
`is-settling` and `is-squashing` for in-flight animations. Any framework can
drive them — in this repo that is three signals and two handlers on `HomePage`
(`openFaq`, `settling`, `squashing`), with `[class.is-settling]` bindings and
`(animationend)` on the row and on the trigger. Keep the `event.target ===
event.currentTarget` checks wherever you put them.

## Traps that have already cost a day

**`grid-template-rows: 0fr → 1fr` is not linear and cannot overshoot.** An `fr`
track in a container of indefinite height resolves to the content's size, so
`1.32fr` and `1fr` render identically — a spring on the track is silently thrown
away. Worse, the rendered height is the *eased value squared*: `0.5fr` draws at a
quarter height. Consequences:

- The curve you write is not the curve you get. Compensate: give the track
  roughly the square root of the curve you want. `cubic-bezier(0.25, 1, 0.5, 1)`
  on open yields a clean ease-out; a plain ease-out yields a snap.
- An ease-in on close becomes a slam, because squaring compounds it. Measured
  before the fix: the panel left at 0.1px/ms and arrived at 0.63px/ms, then
  stopped dead. `cubic-bezier(0.6, 0.45, 0.35, 1)` peaks a third of the way
  through and decelerates into the stop.
- The bounce must come from elsewhere — hence the padding keyframes in the
  reference, rather than a spring on the track.

**Removing an animation reverts its value in a single frame, and a transition
does not catch it.** This was tested: a `transition: padding-bottom` on the base
state does nothing when the class carrying the animation goes away. So an
animation must never hang off a class that can be pulled mid-flight. Give it its
own class, set it when the interaction starts, clear it on `animationend`, and
let a row closed mid-bounce keep playing its settle while it collapses.

**Two animations on one element will jump.** The second starts from its own `0%`,
skipping exactly the distance the first had travelled. Put the in and out
animations on different elements where you can (the row settles, its header
squashes), and where you cannot, guard the second:
`.is-squashing:not(.is-settling) &`.

**`animationend` bubbles.** Any handler that clears state must check
`event.target === event.currentTarget`, or a child's shorter animation finishing
first pulls the parent's class out from under it.

**Easing across a multi-stop keyframe run rushes the overshoot past.** Put the
easing on the individual keyframes, the way the press bounce does, rather than on
the animation as a whole.

**What reads as a click is the press, and the press goes on the thing that was
clicked — not on the highlight that answers it.** This cost two rounds. Putting a
squash on the tab pill as it pours looks right in the numbers and reads as
nothing: the pill is already travelling and stretching 157 → 200px, so a few
percent of scale on top is lost in it, and worse, a *uniform* shrink lands on the
same axis the reach is growing and cancels it outright — measured, the rendered
width went 157 → 159.5px over the first 90ms, a press that was perfectly present
and completely invisible. The highlight pours; the content presses. That is what
`liquid-morph-menu` does, and it is why its items feel clicked.

The pill can still press — it is under the finger when the selected tab is the
one pressed — but as a *press*, on pointerdown, on the same clock as the label,
not as a deformation folded into the travel. Where a press and a move want the
same property, the move takes it: read the live value, cancel the press, and
start the move from what was read.

Two corollaries. Check a deformation against the *rendered* box
(`width * scale-x`), never against the scale alone — the scale was exactly right
in both failed attempts. And a press on the content answers a click even when
nothing else moves, which is the case a travelling highlight can never cover:
clicking the tab that is already selected.

**A fold cannot collapse a `gap`, and `:last-child` is the same bug wearing a
disguise.** A fold animates the properties the folding element owns — its size,
its padding, its margin. A flex or grid `gap` belongs to the *container*: it
stays at full size for the whole fold and then vanishes in one frame when the
element is finally removed. Measured: an 8px step at 323ms of a 320ms fold,
after everything else had settled.

Moving the spacing to a `margin-bottom` on each row fixes it — but only if every
row has it. Adding `:last-child { margin-bottom: 0 }` reproduces the step
exactly: the row being folded out is the exempt one, so it has no margin left to
collapse, and its neighbour picks the exemption up a frame *after* the removal.
Measured again at 8px at 324ms, identical. Give every row the same margin and
let the list swallow the trailing one with a negative margin of its own. See
`.liquid-fold-list` in `reference/liquid-item.css`.

Two smaller ones from the same build. A custom property read off the folding
element has to be declared *on* it — `--liquid-fold-duration` on the item inside
never reaches the row, because properties inherit downward and never up. And
`ul.list` (0,1,1) out-specifies `.liquid-fold-list` (0,1,0), so a list carrying
both classes keeps its `gap` and the whole fix is silently undone.

**In Safari, `translate` and `width`/`height` in one animation run on different
threads.** WebKit hands `translate` (and `scale`, `opacity`, `filter`) to the
compositor and keeps layout properties on the main thread, even inside a single
`@keyframes`. Chrome keeps the whole animation on the main thread as soon as it
holds `width`, so it looks right there and in Playwright's WebKit. Any main-thread
hitch — and an open is one — then pulls them apart: measured, the popup's size sat
at the trigger's while its position had already run to the resting corner, so the
panel slid out from under the trigger instead of growing out of it. Script cannot
see it: `getBoundingClientRect` and `getComputedStyle` read the main thread's value,
which was exact on every frame. Move the box with something that lives on the same
thread as its size — the popup uses `margin-left`/`margin-top` — and check by
blocking the main thread for ~1.5s right after the open and capturing the window
from another process (`screencapture -l <window id>`) mid-block. A screen
*recording* is no good for this: it stalls Safari's main thread on its own
(measured 85ms with no frame), which fakes the bug.

**Never scale text.** Type rendered between subpixels goes soft while it moves.
Shift it instead, 2–3px.

## Verify by measuring, not by looking

Motion is the one thing you cannot review by reading the diff, and screenshots
cannot show it either. Drive the page with the Chrome DevTools MCP and sample the
real geometry frame by frame:

```js
const s = []; const t0 = performance.now();
await new Promise(res => { const tick = () => { const t = performance.now() - t0;
  s.push([t, el.getBoundingClientRect().height]);
  if (t < 500) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
// Velocity tells the story that position hides:
const v = []; for (let i = 1; i < s.length; i++) v.push((s[i-1][1] - s[i][1]) / (s[i][0] - s[i-1][0]));
```

For a pour, sample `translate`, `width` and `scale` off the indicator instead:
the stretch and the thinning *are* the motion, and position alone will not show
whether they happened.

What the numbers should say:

- Peak speed falls in the **first half** of the travel, and speed near the end is
  ~0. Peak speed at 67% with the element still moving when it stops is the
  signature of a hit.
- The box and its content finish within a frame or two of each other. If the box
  is done at 158ms of a 340ms open while the text is at half opacity, the open is
  a snap followed by a lag, however good the easing looked.
- Interrupting mid-flight moves nothing more than a pixel or two in one frame.
- Once settled, no state classes remain, computed `scale` / `translate` are back
  to `none`, and anything placed off another element's box matches it exactly.

Take the viewport into account: a sample taken while the window is still being
sized measures the resize, not the animation. Settle the page first. (This
produced a reading of 111px of "bounce" on a component that was working fine.)

Tuning by eye burns turns and lands on the wrong curve. Try three or four
candidates in the live page, print peak speed and where it falls, and pick from
that.

## Reduced motion

`@media (prefers-reduced-motion: reduce)` keeps every end state and removes all
travel — see the block at the end of `liquid.css`. The open row is still white,
the chevron still points up, the content is simply there. Script-driven motion
needs the same check in TypeScript. Check the rules actually parse; a typo here
is invisible in normal use.
