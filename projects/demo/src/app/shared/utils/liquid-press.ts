/**
 * The press: what something holds squashes under the finger — wider as it
 * flattens, the way anything soft does — and springs back through the other
 * shape before it settles.
 *
 * Kept apart from any one component because two of them press: an item of
 * `<x-liquid-morph-menu>` and a tab of `<x-liquid-tabs>`. A tap has to have
 * something answer it whatever the click itself goes on to do, and it is the
 * answer, not the travel that follows, that reads as the click — so it is worth
 * only writing once.
 *
 * It presses the element's *children*, not the element: the box is usually busy
 * being sized or highlighted by something else, and a tab's box has the pill
 * pouring under it. An element holding nothing but text has no child to move, so
 * it stands in for its own content.
 */

import { cssTime, prefersReducedMotion } from './liquid-pour';

/**
 * The shapes the press passes through, as multiples of wherever the element was
 * resting — so something already scaled by its own hover squashes from that size
 * rather than from 1, and nothing jumps when the press lets go of it.
 */
type Shape = readonly [x: number, y: number];

/** Flattened and spread, held there for as long as the finger is down. */
const PRESSED: Shape = [1.08, 0.9];

// Timed on the keyframes rather than over the whole run: an easing across the
// lot would rush the overshoot past before the eye caught it.
const BOUNCE: readonly { offset: number; shape: Shape; easing: string }[] = [
  { offset: 0.34, shape: [0.95, 1.07], easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
  { offset: 0.68, shape: [1.02, 0.985], easing: 'cubic-bezier(0.4, 0, 0.4, 1)' },
];
const PRESS_EASING = 'cubic-bezier(0.3, 0, 0.2, 1)';

/** The bounce back out takes longer than the squash, having more to settle. */
const BOUNCE_SHARE = 3.4;

/** Fallback for whichever `--liquid-*-press-duration` the owner names (ms). */
export const DEFAULT_PRESS_DURATION = 110;

/**
 * What moves when an element is pressed: its own children, so its box is left
 * free to be sized by whatever owns it. Shared so that anything else animating
 * the same content — a fold, a pop — moves exactly what the press moved.
 */
export function pressedContent(element: HTMLElement): Element[] {
  return element.children.length ? [...element.children] : [element];
}

/** A computed `scale` as its two axes; `none`, or nothing, is 1 on both. */
function readScale(view: Window, element: Element): Shape {
  const raw = view.getComputedStyle(element).scale;
  if (!raw || raw === 'none') return [1, 1];
  const [x = 1, y = x] = raw.trim().split(/\s+/).map(Number);
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : [1, 1];
}

/** `shape` applied on top of `base`, written the way `scale` reads it back. */
function scaleOf(base: Shape, shape: Shape): string {
  const round = (n: number) => +n.toFixed(4);
  return `${round(base[0] * shape[0])} ${round(base[1] * shape[1])}`;
}

/** Holds one element's press between the finger going down and coming back up. */
export class LiquidPress {
  /** What the press is holding down, so the release knows where to bounce from. */
  private pressing: { child: Element; motion: Animation }[] | null = null;
  /** The springs back out, kept so an owner can take the content off them. */
  private bouncing: Animation[] = [];
  /**
   * Where each child rests when nothing is pressing it — its own hover scale,
   * say. Read at the start of a press and kept through the bounce, since a child
   * still springing back has no resting value left to read.
   */
  private resting = new WeakMap<Element, Shape>();

  /**
   * @param element The element pressed; {@link pressedContent} of it squashes.
   * @param document The document it lives in, for its view.
   * @param durationProperty The custom property holding the squash duration, so
   *   each component keeps its own name for it.
   * @param depth How much of the press's deformation to use, `1` being the full
   *   `1.08 0.9`. A large surface wants less: how far something gives scales
   *   with its size, and 8% of a 400px card is 32px of spread.
   */
  constructor(
    private readonly element: HTMLElement,
    private readonly document: Document,
    private readonly durationProperty: string,
    private readonly depth = 1,
  ) {}

  /**
   * Takes the press: what the element holds flattens and spreads under the
   * finger. It holds there — `fill: forwards` — until {@link release}, so a long
   * press stays pressed rather than springing back on its own.
   */
  press(): void {
    if (this.pressing) return;
    const view = this.document.defaultView;
    if (!view || prefersReducedMotion(view)) return;

    const duration = this.duration(view);
    // A child still springing back from the last press shows the bounce, not
    // where it rests, so it keeps the resting value that press read.
    const springing = this.bouncing.some((motion) => motion.playState === 'running');
    this.bouncing = [];
    this.pressing = pressedContent(this.element)
      .filter((child) => typeof child.animate === 'function')
      .map((child) => {
        const resting = (springing && this.resting.get(child)) || readScale(view, child);
        this.resting.set(child, resting);
        return {
          child,
          motion: child.animate([{ scale: scaleOf(resting, this.shape(PRESSED)) }], {
            duration,
            easing: PRESS_EASING,
            fill: 'forwards',
          }),
        };
      });
  }

  /**
   * Lets the press go, and the squash springs back out through the other shape.
   * The bounce starts from wherever the squash had got to, so a tap too quick to
   * flatten anything still bounces from where the eye left it.
   *
   * It ends on no scale of its own. The last keyframe is left implicit, so the
   * spring eases into whatever the element rests at *by then* rather than into a
   * value written down at the start — which matters most when the pointer
   * leaves: that releases the press and ends a hover in the same moment, and a
   * hover scale easing back to 1 underneath would otherwise be snapped to in a
   * single frame as the bounce is removed.
   */
  release(): void {
    const pressing = this.pressing;
    if (!pressing) return;
    this.pressing = null;

    const view = this.document.defaultView;
    if (!view) return;
    const duration = this.duration(view) * BOUNCE_SHARE;

    this.bouncing = pressing.map(({ child, motion }) => {
      const resting = this.resting.get(child) ?? [1, 1];
      const held = view.getComputedStyle(child).scale;
      motion.cancel();
      return child.animate(
        [
          {
            scale: held && held !== 'none' ? held : scaleOf(resting, [1, 1]),
            easing: BOUNCE[0]!.easing,
          },
          ...BOUNCE.map(({ offset, shape, easing }) => ({
            offset,
            scale: scaleOf(resting, this.shape(shape)),
            easing,
          })),
          { offset: 1 },
        ],
        { duration },
      );
    });
  }

  /**
   * Drops the press where it stands, squash or bounce, without springing
   * anything back — for an owner about to animate the same content itself.
   *
   * Cancelling reverts the scale in a single frame, so whatever takes over has to
   * have read the live scale *before* calling this and start from it. That is
   * what a tab bar does: the pill presses with the tab, and the pour that follows
   * picks the squash up and carries it into the move.
   */
  cancel(): void {
    for (const { motion } of this.pressing ?? []) motion.cancel();
    for (const motion of this.bouncing) motion.cancel();
    this.pressing = null;
    this.bouncing = [];
  }

  /** `shape` at this press's depth: the same deformation, only shallower or deeper. */
  private shape([x, y]: Shape): Shape {
    return [1 + (x - 1) * this.depth, 1 + (y - 1) * this.depth];
  }

  private duration(view: Window): number {
    return cssTime(view, this.element, this.durationProperty, DEFAULT_PRESS_DURATION);
  }
}
