/**
 * The liquid pour: how a highlight moves from one box to another. The edge
 * facing the target reaches toward it while the pill thins, then the pill surges
 * across with its far edge dragging behind, and both settle together.
 *
 * Kept apart from any one component because two of them pour: the pill under the
 * selected tab of `<x-liquid-tabs>`, and the hover highlight of
 * `<x-liquid-morph-menu>`. The motion is what makes them read as the same family.
 */

/** A box inside its offset parent, in px from that parent's padding edge. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A CSS `scale`, as `[x, y]`. */
export type Scale = [number, number];

export interface PourOptions {
  /** The axis the boxes are laid out along: `x` for a row, `y` for a column. */
  axis: 'x' | 'y';
  /** How far, in px, the leading edge reaches toward the target before setting off. */
  pull: number;
  /**
   * The scale the element is wearing right now (see {@link animatedScale}), for a
   * pour that interrupts another. Without it the new move starts from its own
   * `0%` and the highlight snaps back to full size as it sets off.
   */
  fromScale?: Scale;
}

/**
 * Where each leg of the pour ends, as a share of the duration. The reach is kept
 * short: any longer and the pill reads as waiting before it follows.
 */
const REACH_END = 0.14;
const SURGE_END = 0.5;

/** The pour's three legs: snap into the reach, surge ahead, settle with a little overshoot. */
const REACH = 'cubic-bezier(0.2, 0, 0.4, 1)';
const SURGE = 'cubic-bezier(0.55, 0, 0.25, 1)';
const SETTLE = 'cubic-bezier(0.25, 0, 0.3, 1.2)';

const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

/**
 * An element's box in layout offsets — not `getBoundingClientRect` — so a
 * popup scaling open around it does not skew what the highlight is sized to.
 */
export function offsetBox(element: HTMLElement): Box {
  const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = element;
  return { x: offsetLeft, y: offsetTop, width: offsetWidth, height: offsetHeight };
}

/** `box` grown by `x` px on each side across and `y` px on each side down. */
export function inflate(box: Box, x: number, y: number): Box {
  return {
    x: box.x - x,
    y: box.y - y,
    width: box.width + x * 2,
    height: box.height + y * 2,
  };
}

/**
 * Where a pouring element is right now, so a move that interrupts another
 * carries on from what the eye can see. Falls back to `resting` when nothing is
 * in flight, which is also what a browser without the Web Animations API gets.
 */
export function animatedBox(element: HTMLElement, resting: Box, view: Window | null): Box {
  if (!view) return resting;

  const style = view.getComputedStyle(element);
  const [x = 0, y = 0] = style.translate.split(' ').map((part) => parseFloat(part) || 0);
  return {
    x,
    y,
    width: parseFloat(style.width) || resting.width,
    height: parseFloat(style.height) || resting.height,
  };
}

/**
 * The scale a pouring element is wearing right now — the other half of
 * {@link animatedBox}, and just as necessary: the thinning is as much of the
 * highlight’s size as its width is, so a pour that interrupts another has to
 * pick it up too. `[1, 1]` at rest.
 */
export function animatedScale(element: HTMLElement, view: Window | null): Scale {
  const raw = view?.getComputedStyle(element).scale;
  if (!raw || raw === 'none') return [1, 1];

  const [x = 1, y = x] = raw.split(' ').map((part) => parseFloat(part) || 1);
  return [x, y];
}

/**
 * The pour from `from` to `to`, as keyframes for `element.animate()`. `null`
 * when the two boxes already line up along the axis: there is nothing to pour.
 */
export function pourKeyframes(
  from: Box,
  to: Box,
  { axis, pull, fromScale }: PourOptions,
): Keyframe[] | null {
  const vertical = axis === 'y';
  const size = vertical ? 'height' : 'width';

  const start = from[axis];
  const end = start + from[size];
  const nextStart = to[axis];
  const nextEnd = nextStart + to[size];
  if (start === nextStart && end === nextEnd) return null;

  const forward = nextStart + nextEnd > start + end;
  // Capped, so a narrow box does not stretch to half again its length.
  const reach = Math.min(pull, from[size] * 0.35);

  /** The pill only ever thins across the move; the press lives on the tab itself. */
  const scaleOf = (thin: number): Scale => (vertical ? [thin, 1] : [1, thin]);

  /** The pill `progress` of the way over, with its edges along the move pinned to `edges`. */
  const frame = (
    edges: [number, number],
    progress: number,
    thin: number,
    offset: number,
    easing: string,
  ): Keyframe => {
    const box: Box = {
      x: mix(from.x, to.x, progress),
      y: mix(from.y, to.y, progress),
      width: mix(from.width, to.width, progress),
      height: mix(from.height, to.height, progress),
    };
    box[axis] = edges[0];
    box[size] = edges[1] - edges[0];
    const [scaleX, scaleY] = scaleOf(thin);
    return {
      offset,
      easing,
      translate: `${box.x}px ${box.y}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
      scale: `${scaleX} ${scaleY}`,
    };
  };

  /** Only `edge` moves, `pin` holding the other: it reaches, overshoots and settles alone. */
  const alone = (pin: (edge: number) => [number, number], edge: number, next: number) => {
    const way = Math.sign(next - edge);
    return [
      frame(pin(edge), 0, 1, 0, REACH),
      frame(pin(edge + way * reach), 0, 0.94, REACH_END, SURGE),
      frame(pin(next + way * reach * 0.35), 0.62, 0.9, SURGE_END, SETTLE),
      frame(pin(next), 1, 1, 1, 'linear'),
    ];
  };

  // A box growing from, or shrinking back to, an edge it keeps (a progress fill) holds that
  // edge still; reaching out past it would pull the fill over the edge it starts from.
  const keyframes =
    start === nextStart
      ? alone((edge) => [start, edge], end, nextEnd)
      : end === nextEnd
        ? alone((edge) => [edge, end], start, nextStart)
        : forward
          ? [
              frame([start, end], 0, 1, 0, REACH),
              frame([start, end + reach], 0, 0.94, REACH_END, SURGE),
              frame(
                [mix(start, nextStart, 0.62), nextEnd + reach * 0.35],
                0.62,
                0.9,
                SURGE_END,
                SETTLE,
              ),
              frame([nextStart, nextEnd], 1, 1, 1, 'linear'),
            ]
          : [
              frame([start, end], 0, 1, 0, REACH),
              frame([start - reach, end], 0, 0.94, REACH_END, SURGE),
              frame(
                [nextStart - reach * 0.35, mix(end, nextEnd, 0.62)],
                0.62,
                0.9,
                SURGE_END,
                SETTLE,
              ),
              frame([nextStart, nextEnd], 1, 1, 1, 'linear'),
            ];

  // A pour that interrupts another sets off at the size the eye can see. Its box
  // already does (`animatedBox`); without this its scale would not, and the pill
  // would snap out of the thinning before starting the new move.
  if (fromScale) keyframes[0]['scale'] = `${fromScale[0]} ${fromScale[1]}`;
  return keyframes;
}

/** Whether motion should be dropped altogether — the state lands, it just does not travel. */
export function prefersReducedMotion(view: Window | null): boolean {
  return view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** A custom property holding a time (`ms` or `s`), in ms, or `fallback` when unset. */
export function cssTime(view: Window | null, element: HTMLElement, name: string, fallback: number) {
  const raw = cssProperty(view, element, name);
  const value = parseFloat(raw);
  if (Number.isNaN(value)) return fallback;
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : value;
}

/** A custom property holding a bare number — a ratio, a share — or `fallback` when unset. */
export function cssNumber(
  view: Window | null,
  element: HTMLElement,
  name: string,
  fallback: number,
) {
  const value = parseFloat(cssProperty(view, element, name));
  return Number.isNaN(value) ? fallback : value;
}

/** A custom property holding a length, in px, or `fallback` when unset. */
export function cssLength(
  view: Window | null,
  element: HTMLElement,
  name: string,
  fallback: number,
) {
  return cssNumber(view, element, name, fallback);
}

function cssProperty(view: Window | null, element: HTMLElement, name: string): string {
  return view?.getComputedStyle(element).getPropertyValue(name).trim() ?? '';
}
