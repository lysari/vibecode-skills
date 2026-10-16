import {
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  Renderer2,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';

// ─────────────────────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────────────────────

/** `null` in, `null` out: an unset input drops its host binding entirely. */
const optionalNumber = (value: unknown) => (value == null ? null : numberAttribute(value));

const ms = (value: number | null): string | null =>
  value === null ? null : `${Math.max(0, value)}ms`;

const px = (value: number | null): string | null =>
  value === null ? null : `${value}px`;

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Reads a custom property off an element as milliseconds.
 *
 * The stylesheet owns the timings, so JS that has to wait for one has to ask
 * rather than keep its own copy — a second copy is a second thing to get out of
 * step. Read off the element rather than the document (as the upstream snippet
 * does) so a host-level override is picked up too.
 */
function readCssMs(element: HTMLElement, name: string, fallback: number): number {
  if (typeof getComputedStyle !== 'function') return fallback;

  const raw = getComputedStyle(element).getPropertyValue(name).trim();
  if (!raw) return fallback;

  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;

  // A bare number is already treated as ms by the callers' fallbacks.
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : value;
}

/**
 * The value behind a directive that renders text as something other than text.
 *
 * Both directives in this file have the same problem: they replace the host's
 * content with markup of their own, and the text node an Angular interpolation
 * owns must survive that. Clearing the host would detach it and leave the
 * binding writing to a node outside the document — the number would simply never
 * appear. So on first use whatever the template rendered is *moved* into a hidden
 * span: moving preserves node identity, the binding goes on updating the same
 * node, and a `MutationObserver` turns each write into the next value.
 *
 * A bound input takes precedence and is written into the same span, which is then
 * no longer watched — there would be nothing to see but this class's own writes.
 */
class AdoptedValue {
  private span: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly renderer: Renderer2,
    private readonly zone: NgZone,
    /**
     * Whether the span is hidden from assistive tech. `false` where it is the
     * only readable copy of the value (the digits that replace it are split per
     * character); `true` where the directive renders a readable copy of its own.
     */
    private readonly hidden: boolean,
    /** Called when a watched write changes the value. */
    private readonly onChange: () => void,
  ) {}

  get element(): HTMLElement | null {
    return this.span;
  }

  /** The value to render: the bound input if there is one, the span if not. */
  read(bound: string | number | null | undefined): string {
    const span = this.ensure();

    if (bound !== undefined) {
      this.unobserve();
      const text = bound === null ? '' : String(bound);
      if (span.textContent !== text) {
        this.renderer.setProperty(span, 'textContent', text);
      }
      return text;
    }

    this.observe(span);
    return (span.textContent ?? '').trim();
  }

  /** Moves a node that turned up in the host later into the span. */
  adopt(node: Node): void {
    if (this.span) this.renderer.appendChild(this.span, node);
  }

  destroy(): void {
    this.unobserve();
  }

  private ensure(): HTMLElement {
    if (this.span) return this.span;

    const span: HTMLElement = this.renderer.createElement('span');
    this.renderer.addClass(span, this.hidden ? 't-text-swap-src' : 't-digit-sr');
    if (this.hidden) this.renderer.setAttribute(span, 'aria-hidden', 'true');

    for (const node of Array.from(this.host.childNodes)) {
      this.renderer.appendChild(span, node);
    }

    this.renderer.appendChild(this.host, span);
    this.span = span;
    return span;
  }

  /**
   * Only the span's own subtree is watched, never the host's child list, so the
   * markup a directive adds and removes on every render can't feed back in as
   * another value change.
   */
  private observe(span: HTMLElement): void {
    if (this.observer || typeof MutationObserver === 'undefined') return;

    this.zone.runOutsideAngular(() => {
      this.observer = new MutationObserver(() => this.onChange());
      this.observer.observe(span, {
        // `characterData` is the one that matters — an interpolation sets
        // `nodeValue` on the node it already made — but content assembled from
        // more than one binding can add and drop nodes too.
        characterData: true,
        childList: true,
        subtree: true,
      });
    });
  }

  private unobserve(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Number pop-in
// ─────────────────────────────────────────────────────────────────────────────

/** Which way a digit travels on its way in. */
export type NumberPopInDirection = 'up' | 'down' | 'left' | 'right';

/**
 * `[--digit-dir-x, --digit-dir-y]` per direction. The keyframe starts at
 * `distance * dir` and lands on zero, so the multipliers point at where a digit
 * comes *from*: `up` starts below its resting place and rises into it. The exit
 * negates them, so the old value carries on the way the new one arrived.
 */
const DIRECTION_VECTORS: Record<NumberPopInDirection, readonly [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [1, 0],
  right: [-1, 0],
};

const GROUP_CLASS = 't-digit-group';
const LAYER_CLASS = 't-digit-layer';
const DIGIT_CLASS = 't-digit';
const ANIMATING_CLASS = 'is-animating';
const LEAVING_CLASS = 'is-leaving';
const SWAPPING_CLASS = 'is-swapping-in';
/** An incoming digit that is unchanged, so it is painted rather than animated. */
const STATIC_CLASS = 'is-static';
/** An outgoing digit whose character is still on screen: it just goes away. */
const HELD_CLASS = 'is-held';
/** The value went up / went down, and no `popDirection` said otherwise. */
const RISING_CLASS = 'is-rising';
const FALLING_CLASS = 'is-falling';

/**
 * Splits a number into per-character spans and pops each one into place, with a
 * stagger, whenever the value changes — the Transitions.dev "Number pop-in"
 * (https://transitions.dev/detail.html?t=number-pop-in), plus the way out that
 * transition leaves to the caller. The keyframes live in
 * `src/styles/_number-pop-in.scss`; this owns the markup, the stagger indices,
 * the swap and the replay.
 *
 * The value can come from either side, and interpolation is the shorter one:
 *
 * ```html
 * <span numberPopIn>{{ statistic()?.scam_online?.total | number }}</span>
 * <span [numberPopIn]="total() | number" popStaggerBy="decimal"></span>
 * <span [numberPopIn]="score()" popDirection="down" [popStagger]="40"></span>
 * ```
 *
 * Interpolated content is adopted rather than replaced — see {@link AdoptedValue}
 * — so a figure that arrives late, the usual case since it comes from a request,
 * pops when it lands rather than needing to be present at first render.
 *
 * **The swap.** Each value gets its own layer. On a change the outgoing layer is
 * taken out of flow and animated away while the incoming one pops in, so the two
 * overlap instead of the old value blinking out of existence. The exit continues
 * in the direction of travel rather than reversing it, reuses each digit's
 * stagger delay, and runs shorter than the entrance — see `--digit-exit-*` in
 * the stylesheet. `popAnimateExit="false"` drops the outgoing value immediately,
 * which is the upstream behaviour.
 *
 * **Only what changed moves.** Positions are compared left to right against the
 * value being replaced, and a position holding the same character holds still:
 * `10` → `11` pops the `1` on the right and leaves the one on the left alone. The
 * stagger closes up behind the digits that stay, so the first one that did change
 * starts immediately instead of waiting out beats nobody can see.
 * `popAnimateChangedOnly="false"` goes back to popping the whole value.
 *
 * **The way it moves follows the value.** Left to itself the group reads like an
 * odometer: a number that went up arrives from below and the old one carries on
 * upward, a number that went down does the opposite. Both values move together,
 * so the direction is the change made visible rather than decoration. It needs a
 * number it can compare — the text is parsed back through `popDecimalSeparator`,
 * so grouping separators and a currency symbol are no obstacle — and where there
 * isn't one (the first paint, a value that isn't a number) it falls back to the
 * stylesheet's `up`. {@link direction} pins it and turns all of this off.
 *
 * A new value builds new spans, so the entrance restarts on its own: there is no
 * state to reset and no reflow to force, unlike the upstream React snippet that
 * re-renders the same nodes and needs a double `requestAnimationFrame` to make
 * the keyframes start over. {@link replay} runs it again on an unchanged value:
 *
 * ```html
 * <span [numberPopIn]="total()" #popIn="numberPopIn"></span>
 * <button (click)="popIn.replay()">Again</button>
 * ```
 *
 * Three things worth knowing about the host:
 *
 * - **The bound input wins.** Bind `[numberPopIn]` *or* interpolate, not both:
 *   a bound value overwrites the adopted node and stops it being watched, which
 *   leaves the interpolation updating a node that is no longer in the document.
 * - **Adoption happens once.** Plain interpolation updates its text node in
 *   place, which is what makes this work. Content that is structurally rebuilt
 *   inside the host — an `@if` or `@for` around the number — appends new nodes
 *   the directive never adopted; it recovers by adopting them on the next paint,
 *   but the block belongs outside the span and the directive on the span within.
 * - **It becomes a positioned inline-flex box** (`.t-digit-group`): baseline-
 *   aligned inline-blocks are what keep a decimal point from drifting off the
 *   baseline, and the outgoing layer needs a containing block.
 *
 * `prefers-reduced-motion: reduce` is honoured twice over: the stylesheet
 * neutralises both keyframes, and the directive skips the swap and the
 * `.is-animating` class, so digits are simply painted where they belong and no
 * outgoing layer waits on an `animationend` that will never come.
 */
@Directive({
  selector: '[numberPopIn]',
  standalone: true,
  exportAs: 'numberPopIn',
  host: {
    class: GROUP_CLASS,
    '[style.--digit-dur]': 'durationStyle()',
    '[style.--digit-distance]': 'distanceStyle()',
    '[style.--digit-stagger]': 'staggerStyle()',
    '[style.--digit-blur]': 'blurStyle()',
    '[style.--digit-ease]': 'ease()',
    '[style.--digit-dir-x]': 'directionX()',
    '[style.--digit-dir-y]': 'directionY()',
    '[style.--digit-exit-dur]': 'exitDurationStyle()',
  },
})
export class NumberPopInDirective {
  // ── Value ────────────────────────────────────────────────────────────────
  /**
   * What to display. Formatting is the call site's job — pass the string you
   * want on screen (`| number`, `| currency`, a locale format) and every
   * character of it, separators included, gets its own span.
   *
   * Left unbound the host's own content is the value instead. `null` is not the
   * same as unbound: a binding that resolves to `null` empties the group — the
   * digits animate out and nothing replaces them — while an absent binding hands
   * the job to whatever the template rendered inside.
   */
  readonly value = input<string | number | null | undefined>(undefined, {
    alias: 'numberPopIn',
  });

  // ── Timing ───────────────────────────────────────────────────────────────
  /**
   * How long one digit takes to arrive, in ms. `null` leaves `--digit-dur`
   * alone, which is how the stylesheet's default (500ms) stays the single source
   * of truth rather than being repeated here.
   */
  readonly duration = input<number | null>(null, {
    alias: 'popDuration',
    transform: optionalNumber,
  });

  /**
   * How long one digit takes to leave, in ms. Unset it tracks the entrance at
   * 0.6×, which keeps a swap from reading as two numbers sharing the space.
   */
  readonly exitDuration = input<number | null>(null, {
    alias: 'popExitDuration',
    transform: optionalNumber,
  });

  /** Gap between one digit's start and the next, in ms. Used both ways. */
  readonly stagger = input<number | null>(null, {
    alias: 'popStagger',
    transform: optionalNumber,
  });

  /** Easing curve for the entrance. The default overshoots — that's the "pop". */
  readonly ease = input<string | null>(null, { alias: 'popEase' });

  // ── Motion ───────────────────────────────────────────────────────────────
  /** How far a digit travels on its way in, in px. */
  readonly distance = input<number | null>(null, {
    alias: 'popDistance',
    transform: optionalNumber,
  });

  /** Blur a digit starts with, in px. `0` turns it off. */
  readonly blur = input<number | null>(null, {
    alias: 'popBlur',
    transform: optionalNumber,
  });

  /**
   * Which way the digits come from — and, negated, the way the old ones go.
   *
   * Unset the value picks for itself: up when it rose, down when it fell. Naming
   * a direction here pins it for every change, `"up"` being the one that matches
   * the upstream transition. Set this *or* `--digit-dir-x` / `--digit-dir-y` by
   * hand for a diagonal; the input wins where both are used, because it writes
   * those same properties inline, while the value's own direction is a class and
   * so loses to either.
   */
  readonly direction = input<NumberPopInDirection | null>(null, {
    alias: 'popDirection',
  });

  // ── Stagger shape ────────────────────────────────────────────────────────
  /**
   * What earns a digit its own step in the stagger.
   *
   * - `char` — every character, left to right. What the upstream React snippet
   *   does, and it reads as typing.
   * - `decimal` — everything up to the decimal separator pops as one block,
   *   then the separator and each character after it step. This is the shape the
   *   upstream usage example shows (`1`, `2`, then `.` and `3` at steps 1 and
   *   2); it reads as a total landing and its cents settling after it, and it
   *   keeps long amounts from turning into a slow crawl.
   */
  readonly staggerBy = input<'char' | 'decimal'>('char', { alias: 'popStaggerBy' });

  /**
   * The character `popStaggerBy="decimal"` splits on. Locale-dependent, hence
   * an input rather than a hardcoded `.` — pass `','` where that's the decimal
   * mark. Only the last occurrence counts, so thousands separators sharing the
   * character are left in the integer block.
   */
  readonly decimalSeparator = input<string>('.', { alias: 'popDecimalSeparator' });

  /**
   * Which end the stagger starts from. `end` runs it right to left, which suits
   * a counter whose last digits change most. Applies to `popStaggerBy="char"`;
   * `decimal` has its own order.
   */
  readonly staggerFrom = input<'start' | 'end'>('start', { alias: 'popStaggerFrom' });

  // ── Behaviour ────────────────────────────────────────────────────────────
  /**
   * Whether the first value animates. `false` paints it in place and animates
   * only later changes — right for a figure that is on screen at page load and
   * would otherwise pop for no reason the user can see.
   *
   * An empty group doesn't count as the first value, so a number that starts out
   * as `null` and arrives with the response still pops on arrival.
   */
  readonly animateOnInit = input(true, {
    alias: 'popAnimateOnInit',
    transform: booleanAttribute,
  });

  /**
   * Whether the value being replaced animates away. `false` drops it the instant
   * its replacement is built — the upstream behaviour, and the one to pick for a
   * figure that updates faster than it can leave.
   */
  readonly animateExit = input(true, {
    alias: 'popAnimateExit',
    transform: booleanAttribute,
  });

  /**
   * Whether a digit that didn't change is left alone. On by default: a counter
   * ticking `01` → `02` should move the digit that ticked, and a leading digit
   * that pops for a change it had no part in reads as noise.
   *
   * Positions are compared by index from the *left*, which is why a padded value
   * (`| strPad`, `| number` with a fixed fraction) is the one that behaves: pad
   * `9` to `09` and its tens digit stays put on the way to `10`. Without padding
   * a value that gains a character shifts every position along and the whole
   * number pops, which is the honest answer — every digit did move.
   *
   * `false` restores the upstream behaviour, where every character of every new
   * value pops. {@link replay} ignores this either way: asking for the animation
   * again means all of it.
   */
  readonly animateChangedOnly = input(true, {
    alias: 'popAnimateChangedOnly',
    transform: booleanAttribute,
  });

  /**
   * Turns both animations off while leaving the split markup in place, so a
   * value can stop popping (a table mid-sort, a feed that updates every second)
   * without the spans coming and going underneath it.
   */
  readonly disabled = input(false, {
    alias: 'popDisabled',
    transform: booleanAttribute,
  });

  // ── Custom properties ────────────────────────────────────────────────────
  protected readonly durationStyle = computed(() => ms(this.duration()));
  protected readonly exitDurationStyle = computed(() => ms(this.exitDuration()));
  protected readonly staggerStyle = computed(() => ms(this.stagger()));
  protected readonly distanceStyle = computed(() => px(this.distance()));
  protected readonly blurStyle = computed(() => px(this.blur()));

  private readonly vector = computed(() => {
    const direction = this.direction();
    return direction === null ? null : DIRECTION_VECTORS[direction];
  });
  protected readonly directionX = computed(() => this.axis(this.vector()?.[0]));
  protected readonly directionY = computed(() => this.axis(this.vector()?.[1]));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);

  /**
   * Where the value is read from, and — since the digit layers are
   * `aria-hidden`, a screen reader walking them reading "1 2 . 3" instead of
   * "12.3" — the only copy assistive tech is offered.
   */
  private readonly source = new AdoptedValue(
    this.host,
    this.renderer,
    this.zone,
    false,
    () => this.onSourceChange(),
  );

  /** The layer showing the current value. */
  private layer: HTMLElement | null = null;
  /** The layer on its way out, if a swap is in flight. At most one. */
  private leaving: HTMLElement | null = null;
  /** Text of the last paint, so a mutation that changes nothing changes nothing. */
  private painted: string | null = null;
  /** What that text came to as a number, or `null` if it didn't come to one. */
  private paintedNumber: number | null = null;
  /** Which way the value last went: `1` up, `-1` down, `0` never established. */
  private trend = 0;
  /** Whether a non-empty value has been painted; gates `popAnimateOnInit`. */
  private seenValue = false;
  private stopListening: (() => void) | null = null;

  constructor() {
    // Runs after change detection, so the host's interpolated text is in place
    // by the time the first paint goes looking for it.
    effect(() => {
      // Every input the markup depends on is read here, so a change to any of
      // them re-paints: the value itself, and the shape of the stagger.
      const text = this.source.read(this.value());
      this.staggerBy();
      this.decimalSeparator();
      this.staggerFrom();
      this.disabled();

      this.render(text);
    });

    inject(DestroyRef).onDestroy(() => {
      this.source.destroy();
      this.unlisten();
    });
  }

  /**
   * Runs the animation again on the value that is already showing. Building new
   * spans is what restarts it — re-adding `.is-animating` to the same nodes
   * would not, since nothing about their animation would have changed.
   */
  replay(): void {
    this.render(this.source.read(this.value()), true);
  }

  private onSourceChange(): void {
    const text = this.source.read(this.value());
    // Angular writes the same value on plenty of change detection runs that have
    // nothing to do with this number.
    if (text === this.painted) return;
    this.render(text);
  }

  /** The stagger step for each character of `text`, index for index. */
  private stepsFor(text: string): number[] {
    const characters = Array.from(text);

    if (this.staggerBy() === 'decimal') {
      const separator = this.decimalSeparator();
      const split = separator ? characters.lastIndexOf(separator) : -1;
      // No separator: the whole number is one block and pops together.
      if (split < 0) return characters.map(() => 0);
      return characters.map((_, index) => Math.max(0, index - split + 1));
    }

    const fromEnd = this.staggerFrom() === 'end';
    return characters.map((_, index) =>
      fromEnd ? characters.length - 1 - index : index,
    );
  }

  /**
   * The positions that hold still: same character at the same index as the value
   * being replaced, so there is nothing for the eye to follow there.
   *
   * Compared from the left, and only over the length the two values share — a
   * position past the end of either one is a character arriving or leaving, and
   * that is a change by definition.
   */
  private heldPositions(
    characters: string[],
    previous: string | null,
    forced: boolean,
  ): Set<number> {
    const held = new Set<number>();

    // Untracked for the same reason as `animateOnInit`: the flag decides how the
    // *next* change is drawn, so flipping it is not itself a change to draw.
    if (forced || previous === null || !untracked(this.animateChangedOnly)) return held;

    const before = Array.from(previous);
    const shared = Math.min(before.length, characters.length);

    for (let index = 0; index < shared; index++) {
      if (before[index] === characters[index]) held.add(index);
    }

    return held;
  }

  /**
   * What the painted text comes to as a number, for telling a rise from a fall.
   *
   * A bound number is taken as it stands. A string has to survive whatever the
   * call site formatted into it — grouping separators, a currency symbol, a
   * percent sign, spaces — so everything but the digits and the decimal mark is
   * dropped and the mark is normalised: under `popDecimalSeparator=","`,
   * `1.234,5` has to come back as 1234.5 rather than 1.2345.
   *
   * `null` where there is no number to compare, which is not a failure — a label
   * that isn't a number simply doesn't have a direction of its own.
   */
  private numberOf(text: string): number | null {
    const bound = untracked(this.value);
    if (typeof bound === 'number') return Number.isFinite(bound) ? bound : null;

    const separator = this.decimalSeparator();
    const digits = Array.from(text)
      .filter((char) => (char >= '0' && char <= '9') || char === separator)
      .map((char) => (char === separator ? '.' : char))
      .join('');

    const value = Number.parseFloat(digits);
    if (!Number.isFinite(value)) return null;

    // The sign is read off the original rather than carried through the filter,
    // since a minus is one of the characters it drops. `(1.00)` is a negative
    // too wherever accounting format is in play, and `−` is the typographic
    // minus a locale formatter is entitled to use.
    return /^\s*[-−(]/.test(text) ? -value : value;
  }

  /**
   * Points the animation the way the value went: up for a rise, down for a fall,
   * and left alone where there is nothing to compare or the call site named a
   * direction of its own.
   *
   * A class rather than the inline custom properties, which is what keeps the
   * precedence in order — `popDirection` and a hand-written `--digit-dir-*` are
   * both inline on the host, and inline beats a stylesheet rule. Only the
   * vertical axis is touched, so a diagonal set elsewhere keeps its `x`.
   */
  private applyTrend(): void {
    const pinned = this.direction() !== null;

    this.host.classList.toggle(RISING_CLASS, !pinned && this.trend > 0);
    this.host.classList.toggle(FALLING_CLASS, !pinned && this.trend < 0);
  }

  /**
   * Closes the gaps the held positions leave in the stagger: the earliest step
   * that still has a digit on it becomes step 0, and the ones after it move up.
   * Distinct steps stay distinct and stay in order, so `decimal`'s blocks come
   * through the squeeze intact — an unchanged integer part doesn't leave the
   * cents waiting on beats that nothing plays.
   */
  private compressSteps(steps: number[], held: ReadonlySet<number>): number[] {
    if (held.size === 0) return steps;

    const surviving = [...new Set(steps.filter((_, index) => !held.has(index)))].sort(
      (a, b) => a - b,
    );
    const rank = new Map(surviving.map((step, index) => [step, index]));

    return steps.map((step, index) => (held.has(index) ? 0 : (rank.get(step) ?? 0)));
  }

  /**
   * Swaps in a layer for `text`: the outgoing one animates away, the new one
   * pops in, and both run at once.
   */
  private render(text: string, forced = false): void {
    const characters = Array.from(text);
    const first = !this.seenValue;
    const muted = this.disabled() || prefersReducedMotion();
    // Read before `painted` is overwritten: it is the value being replaced.
    const held = this.heldPositions(characters, this.painted, forced);
    const steps = this.compressSteps(this.stepsFor(text), held);

    // Both layers travel the way the value went, so the direction is settled
    // before either of them is touched. Nothing to compare — a value that isn't
    // a number, or one that dropped out and came back — leaves the last
    // direction standing rather than guessing at a new one.
    const number = this.numberOf(text);
    const before = this.paintedNumber;
    this.paintedNumber = number;
    if (number !== null && before !== null && number !== before) {
      this.trend = number > before ? 1 : -1;
    }
    this.applyTrend();

    this.painted = text;
    // An empty group is not a value: a figure that starts out `null` and arrives
    // with the response should pop on arrival, not be written off as the initial
    // paint that `popAnimateOnInit="false"` suppresses.
    this.seenValue ||= characters.length > 0;

    this.unlisten();
    // A swap that arrived before the last one finished: the value two changes
    // ago has had its time, and stacking layers is how a fast-updating figure
    // would turn into a pile of them.
    this.dropLeaving();
    this.adoptStrays();
    // Ends the entrance on the layer being replaced, so it starts its exit from
    // where it actually sits rather than from wherever the keyframes had it.
    this.host.classList.remove(ANIMATING_CLASS);

    const outgoing = this.layer;
    // A held position is one the incoming layer paints in place, so its
    // counterpart on the way out has nothing to animate: it is hidden instead,
    // and it is not one of the exits there is anything to wait for.
    const outgoingDigits = outgoing?.childElementCount ?? 0;
    const leavingDigits = Math.max(0, outgoingDigits - held.size);
    const exiting = !!outgoing && leavingDigits > 0 && !muted && this.animateExit();
    const enteringDigits = characters.length - held.size;

    const incoming = this.buildLayer(characters, steps, held, exiting);
    this.layer = incoming;
    this.renderer.appendChild(this.host, incoming);

    if (outgoing && exiting) {
      this.leaving = outgoing;
      this.holdOutgoing(outgoing, held);
      // It waited its turn on the way in; on the way out it goes first.
      this.renderer.removeClass(outgoing, SWAPPING_CLASS);
      // Takes it out of flow and hands it the exit keyframes, which outrank the
      // entrance rule on specificity — the two layers share a host.
      this.renderer.addClass(outgoing, LEAVING_CLASS);
    } else if (outgoing) {
      this.renderer.removeChild(this.host, outgoing);
    }

    const entering =
      enteringDigits > 0 &&
      !muted &&
      // Untracked: this decides whether an *existing* paint animates, so a flip
      // of the flag is not itself a reason to tear the digits down again.
      (!first || forced || untracked(this.animateOnInit));

    if (entering) this.host.classList.add(ANIMATING_CLASS);

    if (entering || exiting) {
      this.track(
        entering ? incoming : null,
        enteringDigits,
        exiting ? outgoing : null,
        leavingDigits,
      );
    }
  }

  /**
   * Turns the layer being replaced into one that leaves: the digits the incoming
   * layer is already painting are hidden, and the rest are handed back their
   * animation — a digit that arrived without one (unchanged last time round) is
   * changing now, or it wouldn't be leaving.
   *
   * Hidden by `visibility` rather than removed: the layer is out of flow and
   * anchored to the start edge, so every digit still has to occupy its old width
   * for the ones that *are* leaving to line up with where they were.
   */
  private holdOutgoing(layer: HTMLElement, held: ReadonlySet<number>): void {
    Array.from(layer.children).forEach((digit, index) => {
      this.renderer.removeClass(digit, STATIC_CLASS);
      if (held.has(index)) this.renderer.addClass(digit, HELD_CLASS);
    });
  }

  /** One layer per value: a row of digit spans, hidden from assistive tech. */
  private buildLayer(
    characters: string[],
    steps: number[],
    held: ReadonlySet<number>,
    swapping: boolean,
  ): HTMLElement {
    const layer: HTMLElement = this.renderer.createElement('span');
    this.renderer.addClass(layer, LAYER_CLASS);
    // Arriving into a swap rather than onto an empty group, which is what buys
    // the outgoing value a head start. The class carries `--digit-enter-delay`
    // down to the digits below.
    if (swapping) this.renderer.addClass(layer, SWAPPING_CLASS);
    // On the layer rather than each digit: the unsplit value in the source span
    // is what gets read out, and these would be spelled character by character.
    this.renderer.setAttribute(layer, 'aria-hidden', 'true');

    characters.forEach((character, index) => {
      const digit = this.renderer.createElement('span');
      this.renderer.addClass(digit, DIGIT_CLASS);
      this.renderer.setProperty(digit, 'textContent', character);

      // Unchanged, so it is simply drawn where it belongs: no keyframes, no
      // stagger, and nothing for `track` to wait on. The class is scoped in the
      // stylesheet to a layer that isn't leaving, so this same digit still
      // animates out later if the value that replaces it does change here.
      if (held.has(index)) {
        this.renderer.addClass(digit, STATIC_CLASS);
        this.renderer.appendChild(layer, digit);
        return;
      }

      const step = steps[index] ?? 0;
      // The attribute is for the stylesheet's hand-written `data-stagger` rules;
      // the inline delay is what actually drives this markup, since those rules
      // only cover steps 1 and 2 and a number is as long as it is. Inline wins
      // where the two overlap and they agree on the value.
      if (step > 0) this.renderer.setAttribute(digit, 'data-stagger', String(step));
      // Set even at step 0, because `--digit-enter-delay` is what a swap adds and
      // the first digit needs to wait with the rest. It resolves to 0ms outside a
      // swap, and to 0ms on the outgoing layer — which reuses these same delays,
      // so a digit leaves in the order it arrived.
      this.renderer.setStyle(
        digit,
        'animation-delay',
        `calc(var(--digit-stagger) * ${step} + var(--digit-enter-delay))`,
      );

      this.renderer.appendChild(layer, digit);
    });

    return layer;
  }

  /**
   * Moves anything in the host that isn't ours into the source span.
   *
   * Content that turns up after the source span was built — a node from a
   * structural block inside the host, say — would otherwise show raw next to the
   * digits, and deleting it would throw a value away. The move lands in the
   * observed subtree, so it comes back as the next value on its own.
   */
  private adoptStrays(): void {
    const source = this.source.element;
    if (!source) return;

    for (const node of Array.from(this.host.childNodes)) {
      if (node === source || node === this.layer || node === this.leaving) continue;

      // nodeType 1 rather than `Node.ELEMENT_NODE`: the constant is on a global
      // that doesn't exist everywhere this can be rendered.
      const ours =
        node.nodeType === 1 &&
        ((node as Element).classList.contains(LAYER_CLASS) ||
          (node as Element).classList.contains(DIGIT_CLASS));

      if (ours) {
        this.renderer.removeChild(this.host, node);
      } else {
        this.source.adopt(node);
      }
    }
  }

  private dropLeaving(): void {
    const leaving = this.leaving;
    this.leaving = null;
    if (leaving?.parentNode === this.host) {
      this.renderer.removeChild(this.host, leaving);
    }
  }

  /**
   * Waits out both halves of the swap on one listener: `.is-animating` comes off
   * when the incoming layer has landed — which is what releases the
   * `will-change` layers the stylesheet scopes to that class — and the outgoing
   * layer leaves the DOM when its last digit has gone.
   */
  private track(
    incoming: HTMLElement | null,
    incomingDigits: number,
    outgoing: HTMLElement | null,
    outgoingDigits: number,
  ): void {
    let landed = 0;
    let left = 0;
    let inDone = !incoming;
    let outDone = !outgoing;

    // Outside the zone: a group of digits is a group of `animationend` events,
    // and none of them is a reason to run change detection.
    this.zone.runOutsideAngular(() => {
      this.stopListening = this.renderer.listen(
        this.host,
        'animationend',
        (event: AnimationEvent) => {
          const digit = event.target as HTMLElement | null;
          if (!digit?.classList?.contains(DIGIT_CLASS)) return;
          // Neither total counts a digit that holds still, so an event off one
          // of them — a transition the stylesheet grew, say — would push a total
          // over the line before its animating digits had landed.
          if (
            digit.classList.contains(STATIC_CLASS) ||
            digit.classList.contains(HELD_CLASS)
          ) {
            return;
          }

          // Which half an event belongs to is settled by its layer: during a
          // swap both are animating inside this host at the same time.
          const parent = digit.parentElement;

          if (!inDone && parent === incoming && ++landed >= incomingDigits) {
            inDone = true;
            this.host.classList.remove(ANIMATING_CLASS);
          }

          if (!outDone && parent === outgoing && ++left >= outgoingDigits) {
            outDone = true;
            this.dropLeaving();
          }

          if (inDone && outDone) this.unlisten();
        },
      );
    });
  }

  private unlisten(): void {
    this.stopListening?.();
    this.stopListening = null;
  }

  private axis(value: number | undefined): string | null {
    return value === undefined ? null : String(value);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Text states swap
// ─────────────────────────────────────────────────────────────────────────────

const TEXT_GROUP_CLASS = 't-text-swap-group';
const TEXT_CLASS = 't-text-swap';
const EXIT_CLASS = 'is-exit';
const ENTER_START_CLASS = 'is-enter-start';

/**
 * Swaps one piece of text for another: the old text slides off and blurs away,
 * the new one arrives from the other side — the Transitions.dev "Text states
 * swap" (https://transitions.dev/detail.html?t=text-states-swap). The transition
 * lives in `src/styles/_text-states-swap.scss`; this drives the three phases.
 *
 * Made for text that reports a state — a status line, a stage of a process, a
 * label that flips between a count and a message:
 *
 * ```html
 * <span textStatesSwap>{{ uploadStatus() }}</span>
 * <span [textStatesSwap]="stage()" swapDirection="down" [swapDuration]="220"></span>
 * ```
 *
 * Values come from either an interpolation or the input, exactly as with
 * {@link NumberPopInDirective} — see {@link AdoptedValue} for why the
 * interpolated node is adopted rather than replaced. What that buys here is the
 * whole point: Angular would otherwise overwrite the text the instant the value
 * changed, leaving the outgoing state nothing to animate. The visible span lags
 * the value by one phase on purpose.
 *
 * **The three phases**, upstream's sequence, on a timer because CSS transitions
 * have no way to hold an element at a state while its text is replaced:
 *
 * 1. `.is-exit` — the current text leaves against the travel direction.
 * 2. after `--text-swap-dur` (plus `--text-swap-enter-delay`) — the text is
 *    replaced and `.is-enter-start` puts it on the far side with no transition,
 *    so the jump is instant and invisible.
 * 3. a forced reflow, then `.is-enter-start` comes off and the transition
 *    carries it back to rest. The reflow is not optional: without it the browser
 *    coalesces the two class changes into one style resolution and the new text
 *    simply appears.
 *
 * `swapEnterDelay` is a *signed* offset between phases 1 and 2, as upstream
 * defines it: positive pauses between them, `0` runs them back-to-back, negative
 * overlaps them so both sides cross through transparent. It cannot pull the swap
 * earlier than the change itself — the total is clamped at zero.
 *
 * A change arriving mid-swap doesn't queue up behind the one in flight; the
 * latest value replaces whatever was pending, since a status line rushing
 * through states nobody can read is worse than one that skips to the current
 * one. {@link swapping} reports whether one is in flight.
 *
 * The first value is not a swap — there is no previous state to see off — so it
 * plays the entrance alone, or appears outright under `swapAnimateOnInit="false"`.
 *
 * Two things worth knowing about the host:
 *
 * - **Bind `[textStatesSwap]` or interpolate, not both.** A bound value
 *   overwrites the adopted node and stops it being watched.
 * - **It wraps two spans**: the visible text and the hidden node the value is
 *   read from. Style the host, not the inner span, and put `aria-live="polite"`
 *   on the host if the state should be announced as it changes — the hidden node
 *   is `aria-hidden`, so only the visible text is read.
 */
@Directive({
  selector: '[textStatesSwap]',
  standalone: true,
  exportAs: 'textStatesSwap',
  host: {
    class: TEXT_GROUP_CLASS,
    '[style.--text-swap-dur]': 'durationStyle()',
    '[style.--text-swap-enter-delay]': 'enterDelayStyle()',
    '[style.--text-swap-distance]': 'distanceStyle()',
    '[style.--text-swap-dir]': 'directionStyle()',
    '[style.--text-swap-blur]': 'blurStyle()',
    '[style.--text-swap-ease]': 'ease()',
  },
})
export class TextStatesSwapDirective {
  /**
   * The text to show. Left unbound the host's own content is the value instead;
   * `null` swaps to nothing, which is not the same as leaving it unbound.
   */
  readonly value = input<string | number | null | undefined>(undefined, {
    alias: 'textStatesSwap',
  });

  /**
   * How long each half takes, in ms — a swap costs two of them. `null` leaves
   * `--text-swap-dur` alone, keeping the stylesheet's 150ms the one definition.
   */
  readonly duration = input<number | null>(null, {
    alias: 'swapDuration',
    transform: optionalNumber,
  });

  /**
   * Signed gap between the exit ending and the entrance starting, in ms.
   * Positive pauses, `0` is back-to-back, negative overlaps the two halves.
   */
  readonly enterDelay = input<number | null>(null, {
    alias: 'swapEnterDelay',
    transform: optionalNumber,
  });

  /** How far the text travels, in px. */
  readonly distance = input<number | null>(null, {
    alias: 'swapDistance',
    transform: optionalNumber,
  });

  /** Blur at the far end of the travel, in px. `0` turns it off. */
  readonly blur = input<number | null>(null, {
    alias: 'swapBlur',
    transform: optionalNumber,
  });

  /** Easing for both halves. */
  readonly ease = input<string | null>(null, { alias: 'swapEase' });

  /**
   * Which way the text moves: `up` sends the old text up and brings the new one
   * from below — the upstream direction, and the one that reads as progress.
   * `down` reverses it, which suits going back a step.
   */
  readonly direction = input<'up' | 'down'>('up', { alias: 'swapDirection' });

  /**
   * Whether the first value plays the entrance. `false` shows it outright, which
   * is right for text that is on screen at page load.
   */
  readonly animateOnInit = input(true, {
    alias: 'swapAnimateOnInit',
    transform: booleanAttribute,
  });

  /** Sets text outright, no phases — for a state changing faster than it reads. */
  readonly disabled = input(false, {
    alias: 'swapDisabled',
    transform: booleanAttribute,
  });

  protected readonly durationStyle = computed(() => ms(this.duration()));
  protected readonly distanceStyle = computed(() => px(this.distance()));
  protected readonly blurStyle = computed(() => px(this.blur()));

  /** Signed, so `Math.max(0, …)` is the transition's job, not the binding's. */
  protected readonly enterDelayStyle = computed(() => {
    const value = this.enterDelay();
    return value === null ? null : `${value}ms`;
  });

  /** `null` for the upstream direction, so the stylesheet's `1` stands. */
  protected readonly directionStyle = computed(() =>
    this.direction() === 'down' ? '-1' : null,
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);

  private readonly source = new AdoptedValue(
    this.host,
    this.renderer,
    this.zone,
    true,
    () => this.onSourceChange(),
  );

  /** The visible span — the one the transition is on. */
  private text: HTMLElement | null = null;
  /** What the visible span currently reads, as opposed to the current value. */
  private shown: string | null = null;
  /** The value waiting for the swap in flight. Only ever the latest one. */
  private queued: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Whether a swap is running — a change made now becomes the one after it.
   * A signal rather than a flag so a template can hang something off it (a
   * spinner, a disabled button) and be told when it changes, instead of being
   * re-read on every change detection run and hoping.
   */
  readonly swapping = signal(false);

  constructor() {
    effect(() => {
      const text = this.source.read(this.value());
      this.disabled();
      this.apply(text);
    });

    inject(DestroyRef).onDestroy(() => {
      this.source.destroy();
      this.clearTimer();
    });
  }

  private onSourceChange(): void {
    this.apply(this.source.read(this.value()));
  }

  private apply(next: string): void {
    const element = this.ensureText();
    this.adoptStrays();

    // Untracked: the lock is written from a timer while this runs inside an
    // effect, so tracking it would make the effect re-trigger itself on every
    // swap. Whether a swap is in flight is not a reason to re-render.
    if (untracked(this.swapping)) {
      // Not a queue: a status line that renders every state it passed through is
      // a status line nobody can read.
      this.queued = next;
      return;
    }

    if (next === this.shown) return;

    // Nothing to see off — the first value, or one arriving into an empty span.
    if (!this.shown) {
      this.setText(element, next);
      if (next && !this.muted() && untracked(this.animateOnInit)) {
        this.enter(element);
        // The entrance owns the element for its duration here as much as it does
        // mid-swap: a value landing in the middle of it would otherwise exit from
        // a state that never finished arriving.
        this.hold(readCssMs(element, '--text-swap-dur', 150));
      }
      return;
    }

    if (this.muted()) {
      this.setText(element, next);
      return;
    }

    this.exit(element, next);
  }

  /** Phase 1, and the timer that carries the rest. */
  private exit(element: HTMLElement, next: string): void {
    this.swapping.set(true);
    this.renderer.addClass(element, EXIT_CLASS);

    const duration = readCssMs(element, '--text-swap-dur', 150);
    // Signed, and clamped as upstream clamps it: a delay past the negative of
    // the duration means "swap now", not "swap before the change arrived".
    const delay = readCssMs(element, '--text-swap-enter-delay', 0);
    const swapAt = Math.max(0, duration + delay);

    this.zone.runOutsideAngular(() => {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.swap(element, next);

        // The entrance owns the element until it has run its course; a change
        // arriving before then is the *next* swap, not a competing one.
        this.hold(duration);
      }, swapAt);
    });
  }

  /** Phases 2 and 3: replace the text on the far side, then release it. */
  private swap(element: HTMLElement, next: string): void {
    this.setText(element, next);
    this.renderer.removeClass(element, EXIT_CLASS);
    this.enter(element);
  }

  /**
   * Puts the element on the far side without a transition, commits that, then
   * lets it go — the entrance on its own, which is also the whole of a first
   * paint.
   */
  private enter(element: HTMLElement): void {
    this.renderer.addClass(element, ENTER_START_CLASS);
    // Forces the jumped-to state to be resolved while the class is still on, so
    // there is a "from" for the transition to run from. A method call rather
    // than upstream's `void el.offsetWidth`: a bare property read is the kind of
    // thing a minifier is entitled to drop, and dropping it would silently turn
    // the entrance into a cut.
    element.getBoundingClientRect();
    this.renderer.removeClass(element, ENTER_START_CLASS);
  }

  /**
   * Keeps the swap lock for `duration`, then lets whatever arrived meanwhile
   * have its turn. The last value wins; the ones before it are dropped.
   */
  private hold(duration: number): void {
    this.swapping.set(true);

    this.zone.runOutsideAngular(() => {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.swapping.set(false);

        const queued = this.queued;
        this.queued = null;
        if (queued !== null && queued !== this.shown) this.apply(queued);
      }, duration);
    });
  }

  private setText(element: HTMLElement, text: string): void {
    this.shown = text;
    this.renderer.setProperty(element, 'textContent', text);
  }

  private ensureText(): HTMLElement {
    if (this.text) return this.text;

    const element: HTMLElement = this.renderer.createElement('span');
    this.renderer.addClass(element, TEXT_CLASS);
    this.renderer.appendChild(this.host, element);
    this.text = element;
    return element;
  }

  /** Anything in the host that is neither of our two spans is a value. */
  private adoptStrays(): void {
    const source = this.source.element;
    if (!source) return;

    for (const node of Array.from(this.host.childNodes)) {
      if (node === source || node === this.text) continue;
      this.source.adopt(node);
    }
  }

  private muted(): boolean {
    return this.disabled() || prefersReducedMotion();
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Number slot
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which way a reel travels. `up` is an odometer; `down` is a slot reel; `auto`
 * rolls every reel up when the whole value rose and down when it fell.
 */
export type NumberSlotDirection = 'up' | 'down' | 'auto';

interface SlotColumn {
  char: string;
  from: number;
  /** Code point of the `0` in the reel's numeral set. */
  zero: number;
  steps: number;
  step: number;
  up: boolean;
  /** The reel or static already showing this column, left in place. */
  keep: HTMLElement | null;
}

const SLOT_GROUP_CLASS = 't-slot-group';
const SLOT_REEL_CLASS = 't-slot-reel';
const SLOT_STATIC_CLASS = 't-slot-static';
const SLOT_STRIP_CLASS = 't-slot-strip';
const SLOT_SPINNING_CLASS = 'is-spinning';
/** Full revolutions, capped so a stray binding cannot build thousands of cells. */
const SLOT_SPIN_CAP = 12;
/**
 * Shortest gap between two retargets while a reel is moving. A new spin starts
 * from the digit in the window, so values arriving every frame (a slider drag)
 * would restart every reel each frame and none of them would ever move.
 */
const SLOT_RETARGET_GAP = 120;
/** The `0` of each numeral set that spins: Latin `0`–`9` and Khmer `០`–`៩`. */
const SLOT_ZEROS = [0x30, 0x17e0];

function slotDigit(char: string | undefined): { value: number; zero: number } | null {
  if (char === undefined) return null;
  const code = char.charCodeAt(0);
  const zero = SLOT_ZEROS.find((start) => code >= start && code <= start + 9);
  return zero === undefined ? null : { value: code - zero, zero };
}

/**
 * The text read as a number for `auto`: digits from any spinning numeral set,
 * a `.` and a `-`. Grouping marks and currency are dropped, so `$1,280.50` is
 * `1280.5`. Text that isn't a number gives `NaN`.
 */
function slotNumber(text: string): number {
  let plain = '';
  for (const char of text) {
    const digit = slotDigit(char);
    if (digit) plain += digit.value;
    else if (char === '.' || char === '-') plain += char;
  }
  return Number(plain);
}

/**
 * Splits a number into columns and spins each digit that changed, like a slot
 * machine — the sibling of {@link NumberPopInDirective}. The keyframes live in
 * `src/styles/_number-slot.scss`.
 *
 * ```html
 * <span numberSlot>{{ total() | number }}</span>
 * <span [numberSlot]="score()" slotDirection="down" [slotSpins]="2"></span>
 * <span [numberSlot]="total()" #slot="numberSlot"></span>
 * <button (click)="slot.replay()">Replay the spin</button>
 * ```
 *
 * Digits are reels, Latin `0`–`9` and Khmer `០`–`៩` alike; a reel rolls
 * through the numeral set of the digit it lands on. A separator, a sign, or a
 * currency mark stays put, so `$1,280.50` → `$1,349.00` spins only the digits
 * that differ. Columns are
 * compared from the right, which keeps the ones place still when a value gains
 * a digit (`9` → `10`).
 *
 * `slotSpins` is how many extra full turns a reel takes on the way to its
 * digit. `0` is the short roll; the default `1` is what makes a one-digit
 * change read as a spin rather than a tick. Reels share one duration and are
 * offset by `slotStagger`, so they stop one after another. `slotStaggerFrom`
 * `start` stops the left reel first.
 *
 * The value is adopted the same way as `numberPopIn` — see {@link AdoptedValue}.
 * Bind `[numberSlot]` or interpolate, not both. `prefers-reduced-motion`
 * paints the final value with no reels.
 */
@Directive({
  selector: '[numberSlot]',
  standalone: true,
  exportAs: 'numberSlot',
  host: {
    class: SLOT_GROUP_CLASS,
    '[style.--slot-dur]': 'durationStyle()',
    '[style.--slot-stagger]': 'staggerStyle()',
    '[style.--slot-blur]': 'blurStyle()',
    '[style.--slot-overshoot]': 'overshootStyle()',
  },
})
export class NumberSlotDirective {
  /**
   * What to display. Pass an already formatted string (`| number`, a price) —
   * every character is a column, and only a digit (`0`–`9`, `០`–`៩`) spins.
   *
   * Left unbound, the host's own content is the value. `null` clears it.
   */
  readonly value = input<string | number | null | undefined>(undefined, {
    alias: 'numberSlot',
  });

  /** How long one reel spins, in ms. `null` keeps the stylesheet's `--slot-dur`. */
  readonly duration = input<number | null>(null, {
    alias: 'slotDuration',
    transform: optionalNumber,
  });

  /** Gap between one reel's start and the next, in ms. Same duration, later start. */
  readonly stagger = input<number | null>(null, {
    alias: 'slotStagger',
    transform: optionalNumber,
  });

  /** Blur at the fast part of the spin, in px. `0` turns it off. */
  readonly blur = input<number | null>(null, {
    alias: 'slotBlur',
    transform: optionalNumber,
  });

  /** How far a reel slips past its digit before settling, in px. `0` lands flush. */
  readonly overshoot = input<number | null>(null, {
    alias: 'slotOvershoot',
    transform: optionalNumber,
  });

  /**
   * Extra full revolutions before the digit lands. `0` rolls the short way.
   * Clamped to 0–12.
   */
  readonly spins = input(1, { alias: 'slotSpins', transform: numberAttribute });

  /**
   * `auto` rolls every reel up when the value rose and down when it fell, so
   * `1` → `0` is one step down. `up` always brings the next digit from below.
   * `down` always brings it from above.
   */
  readonly direction = input<NumberSlotDirection>('auto', { alias: 'slotDirection' });

  /** Which reel stops first. `start` is the left column — a slot machine. */
  readonly staggerFrom = input<'start' | 'end'>('start', { alias: 'slotStaggerFrom' });

  /**
   * Whether the first value spins in from 0. `false` paints it and spins only
   * later changes. An empty group is not a first value, so a number that
   * arrives after `null` still spins.
   */
  readonly animateOnInit = input(true, {
    alias: 'slotAnimateOnInit',
    transform: booleanAttribute,
  });

  /**
   * Whether a digit that didn't change is left alone. Positions are compared
   * from the right. {@link replay} spins every digit anyway.
   */
  readonly animateChangedOnly = input(true, {
    alias: 'slotAnimateChangedOnly',
    transform: booleanAttribute,
  });

  /** Paints the value with no spin. */
  readonly disabled = input(false, {
    alias: 'slotDisabled',
    transform: booleanAttribute,
  });

  protected readonly durationStyle = computed(() => ms(this.duration()));
  protected readonly staggerStyle = computed(() => ms(this.stagger()));
  protected readonly blurStyle = computed(() => px(this.blur()));
  protected readonly overshootStyle = computed(() => px(this.overshoot()));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);

  private readonly source = new AdoptedValue(
    this.host,
    this.renderer,
    this.zone,
    false,
    () => this.onSourceChange(),
  );

  /** Text of the last paint, so a mutation that changes nothing changes nothing. */
  private painted: string | null = null;
  /** Whether a non-empty value has been painted; gates `slotAnimateOnInit`. */
  private seenValue = false;
  private stopListening: (() => void) | null = null;
  private lastRender = 0;
  private held: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const text = this.currentText();
      this.direction();
      this.spins();
      this.staggerFrom();
      this.disabled();
      this.render(text);
    });

    inject(DestroyRef).onDestroy(() => {
      this.source.destroy();
      this.unlisten();
      if (this.held !== null) clearTimeout(this.held);
    });
  }

  /**
   * Spins every digit again, including ones that match what's showing. A reel
   * that is already moving starts from the digit on screen.
   */
  replay(): void {
    this.render(this.currentText(), true);
  }

  /**
   * A bare `numberSlot` attribute arrives as `''`, which is how
   * `<span numberSlot>{{ total() }}</span>` is written. That is not a value —
   * `null` is the binding that clears the reels — so `''` falls through to the
   * text the template rendered.
   */
  private currentText(): string {
    const bound = this.value();
    if (bound === undefined || bound === '') return this.source.read(undefined);
    return this.source.read(bound);
  }

  private onSourceChange(): void {
    const text = this.currentText();
    if (text === this.painted) return;
    this.render(text);
  }

  private render(text: string, forced = false): void {
    if (!forced && this.hold()) return;

    const previous = this.liveColumns();
    const intro = !this.seenValue;

    this.painted = text;
    this.seenValue ||= text.length > 0;
    this.lastRender = performance.now();

    this.unlisten();
    this.adoptStrays();

    const columns = this.columnsFor(text, previous, intro, forced);
    this.clearColumns(new Set(columns.map((column) => column.keep)));

    // Built from the right and inserted before the column after it, so a kept
    // reel is never moved — re-inserting a node restarts its animation.
    let after: Node | null = null;
    let spinning = 0;
    for (const column of [...columns].reverse()) {
      const node =
        column.keep ??
        (column.steps > 0 ? this.buildReel(column) : this.buildStatic(column.char));
      if (!column.keep) this.renderer.insertBefore(this.host, node, after);
      if (node.classList.contains(SLOT_SPINNING_CLASS)) spinning += 1;
      after = node;
    }

    if (spinning > 0) this.track();
  }

  /**
   * Holds a change that arrives too soon after the last one while a reel is
   * still moving, then renders whatever is current when the gap is up.
   */
  private hold(): boolean {
    if (this.held !== null) return true;

    const wait = this.lastRender + SLOT_RETARGET_GAP - performance.now();
    if (wait <= 0 || !this.host.querySelector(`.${SLOT_REEL_CLASS}.${SLOT_SPINNING_CLASS}`)) {
      return false;
    }

    this.zone.runOutsideAngular(() => {
      this.held = setTimeout(() => {
        this.held = null;
        this.render(this.currentText());
      }, wait);
    });
    return true;
  }

  /**
   * Per column, what's in the window right now and the character it is
   * heading to, or `null` when nothing has been painted. A reel mid-spin
   * reports the digit under the window, so the next spin continues from it
   * instead of jumping back to the digit it had already left.
   */
  private liveColumns(): { shown: string; target: string; element: HTMLElement }[] | null {
    const columns = Array.from(this.host.children).filter(
      (element) =>
        element.classList.contains(SLOT_REEL_CLASS) ||
        element.classList.contains(SLOT_STATIC_CLASS),
    ) as HTMLElement[];
    if (columns.length === 0) return null;
    return columns.map((element) => ({
      shown: this.shownChar(element),
      target: element.getAttribute('data-rest') ?? element.textContent ?? '',
      element,
    }));
  }

  private shownChar(element: HTMLElement): string {
    if (element.classList.contains(SLOT_STATIC_CLASS)) return element.textContent ?? '';

    const rest = element.getAttribute('data-rest') ?? '';
    const strip = element.querySelector(`.${SLOT_STRIP_CLASS}`);
    const sequence = strip?.getAttribute('data-seq') ?? '';
    if (!strip || !sequence) return rest;

    const cell = strip.querySelector('.t-slot-cell') as HTMLElement | null;
    const height = cell?.getBoundingClientRect().height ?? 0;
    if (height <= 0 || typeof getComputedStyle !== 'function') return rest;

    let offset = 0;
    try {
      const transform = getComputedStyle(strip).transform;
      if (transform && transform !== 'none') offset = new DOMMatrix(transform).m42;
    } catch {
      return rest;
    }

    const index = Math.min(sequence.length - 1, Math.max(0, Math.round(-offset / height)));
    return sequence[index] ?? rest;
  }

  /**
   * A column already showing, or still heading to, the character it is asked
   * for again is kept as it is, so a reel mid-spin carries on rather than
   * starting over. While any reel is moving, new reels start without a stagger:
   * they are retargets, and a delay would hold them still.
   */
  private columnsFor(
    text: string,
    previous: { shown: string; target: string; element: HTMLElement }[] | null,
    intro: boolean,
    forced: boolean,
  ): SlotColumn[] {
    const characters = Array.from(text);
    const prior = previous ?? [];
    const width = Math.max(prior.length, characters.length);
    const allow =
      !this.disabled() &&
      !prefersReducedMotion() &&
      (forced || !intro || untracked(this.animateOnInit));
    const holdStill = !forced && untracked(this.animateChangedOnly);
    const retarget = prior.some((column) => column.element.classList.contains(SLOT_SPINNING_CLASS));
    const up = this.rollsUp(prior.map((column) => column.target).join(''), text);
    const built: SlotColumn[] = [];

    for (let index = 0; index < width; index++) {
      const before = prior[index - (width - prior.length)];
      const toChar = characters[index - (width - characters.length)];
      if (toChar === undefined) continue;

      const keep = allow && holdStill && before?.target === toChar ? before.element : null;
      const fromChar = before?.shown;
      const to = slotDigit(toChar);
      const fromDigit = slotDigit(fromChar)?.value ?? 0;
      const same = fromChar === toChar;
      const steps =
        keep || !allow || !to || (same && holdStill)
          ? 0
          : this.distance(fromDigit, to.value, this.turns(), forced, up);

      built.push({ char: toChar, from: fromDigit, zero: to?.zero ?? 0x30, steps, step: 0, up, keep });
    }

    if (retarget) return built;

    const moving = built.flatMap((column, index) => (column.steps > 0 ? [index] : []));
    const ordered = this.staggerFrom() === 'end' ? [...moving].reverse() : moving;
    ordered.forEach((index, step) => {
      built[index].step = step;
    });

    return built;
  }

  /** An unchanged value, or one that isn't a number, rolls up. */
  private rollsUp(from: string, to: string): boolean {
    const direction = this.direction();
    if (direction !== 'auto') return direction === 'up';
    return !(slotNumber(to) < slotNumber(from));
  }

  /** Cells the strip travels past, not counting the digit it starts on. */
  private distance(from: number, to: number, turns: number, forced: boolean, up: boolean): number {
    const delta = up ? (to - from + 10) % 10 : (from - to + 10) % 10;

    if (delta === 0) return (forced ? Math.max(turns, 1) : turns) * 10;
    return turns * 10 + delta;
  }

  private turns(): number {
    const value = this.spins();
    if (!Number.isFinite(value)) return 1;
    return Math.max(0, Math.min(SLOT_SPIN_CAP, Math.trunc(value)));
  }

  /**
   * Top to bottom. `up` starts on `from` and ends on the target, so translating
   * up reveals the next digit. `down` is that strip flipped: the target sits at
   * the top and the reel translates down onto it.
   */
  private sequence(from: number, steps: number, up: boolean, zero: number): string {
    let sequence = '';
    for (let index = 0; index <= steps; index++) {
      const digit = up ? (from + index) % 10 : (((from - index) % 10) + 10) % 10;
      sequence += String.fromCharCode(zero + digit);
    }
    return up ? sequence : [...sequence].reverse().join('');
  }

  private buildStatic(char: string): HTMLElement {
    const span: HTMLElement = this.renderer.createElement('span');
    this.renderer.addClass(span, SLOT_STATIC_CLASS);
    this.renderer.setAttribute(span, 'aria-hidden', 'true');
    this.renderer.setProperty(span, 'textContent', char);
    return span;
  }

  /**
   * The resting transform is the inline end position. The spin animation paints
   * over it and, once `.is-spinning` comes off, the inline value is what's left —
   * removing an animation otherwise snaps the strip back to `translate: none`
   * in one frame. The variables stay on the reel after the class goes, because
   * the transform still reads them.
   */
  private buildReel(column: SlotColumn): HTMLElement {
    const up = column.up;
    const reel: HTMLElement = this.renderer.createElement('span');
    this.renderer.addClass(reel, SLOT_REEL_CLASS);
    this.renderer.addClass(reel, SLOT_SPINNING_CLASS);
    this.renderer.setAttribute(reel, 'aria-hidden', 'true');
    this.renderer.setAttribute(reel, 'data-rest', column.char);
    this.renderer.setAttribute(reel, 'data-steps', String(column.steps));
    this.renderer.setStyle(reel, '--slot-steps', String(column.steps));
    this.renderer.setStyle(reel, '--slot-delay', `calc(var(--slot-stagger) * ${column.step})`);
    this.renderer.setStyle(
      reel,
      '--slot-from-y',
      up ? '0px' : 'calc(var(--slot-steps) * -1 * var(--slot-cell))',
    );
    this.renderer.setStyle(
      reel,
      '--slot-end-y',
      up ? 'calc(var(--slot-steps) * -1 * var(--slot-cell))' : '0px',
    );
    this.renderer.setStyle(
      reel,
      '--slot-over-y',
      up ? 'calc(var(--slot-end-y) - var(--slot-overshoot))' : 'var(--slot-overshoot)',
    );

    const sizer: HTMLElement = this.renderer.createElement('span');
    this.renderer.addClass(sizer, 't-slot-sizer');
    this.renderer.setProperty(sizer, 'textContent', column.char);

    const frame: HTMLElement = this.renderer.createElement('span');
    this.renderer.addClass(frame, 't-slot-window');

    const strip: HTMLElement = this.renderer.createElement('span');
    this.renderer.addClass(strip, SLOT_STRIP_CLASS);
    const sequence = this.sequence(column.from, column.steps, up, column.zero);
    this.renderer.setAttribute(strip, 'data-seq', sequence);
    this.renderer.setStyle(strip, 'transform', 'translate3d(0, var(--slot-end-y), 0)');

    for (const digit of sequence) {
      const cell: HTMLElement = this.renderer.createElement('span');
      this.renderer.addClass(cell, 't-slot-cell');
      this.renderer.setProperty(cell, 'textContent', digit);
      this.renderer.appendChild(strip, cell);
    }

    this.renderer.appendChild(frame, strip);
    this.renderer.appendChild(reel, sizer);
    this.renderer.appendChild(reel, frame);
    return reel;
  }

  private adoptStrays(): void {
    const source = this.source.element;
    if (!source) return;

    for (const node of Array.from(this.host.childNodes)) {
      if (node === source) continue;

      const ours =
        node.nodeType === 1 &&
        ((node as Element).classList.contains(SLOT_REEL_CLASS) ||
          (node as Element).classList.contains(SLOT_STATIC_CLASS));

      if (!ours) this.source.adopt(node);
    }
  }

  private clearColumns(kept: Set<HTMLElement | null>): void {
    const source = this.source.element;
    for (const node of Array.from(this.host.childNodes)) {
      if (node === source || kept.has(node as HTMLElement)) continue;
      this.renderer.removeChild(this.host, node);
    }
  }

  /**
   * One `animationend` per reel, and only for the travel — the blur animation
   * on the same strip finishes too, and would clear `.is-spinning` while the
   * reel was still moving. `animationend` bubbles, so the listener sits on the
   * host and checks the strip.
   *
   * `animationcancel` lands the reel too. Hiding the number mid-spin cancels
   * the animation, and a reel left with `.is-spinning` replays its whole spin
   * from the start the moment it is shown again.
   */
  private track(): void {
    const land = (event: AnimationEvent) => {
      if (event.animationName !== 't-slot-spin') return;

      const strip = event.target as HTMLElement | null;
      const reel = strip?.parentElement?.parentElement;
      if (!reel?.classList.contains(SLOT_REEL_CLASS)) return;

      this.renderer.removeClass(reel, SLOT_SPINNING_CLASS);
      if (!this.host.querySelector(`.${SLOT_REEL_CLASS}.${SLOT_SPINNING_CLASS}`)) {
        this.unlisten();
      }
    };

    this.zone.runOutsideAngular(() => {
      const stopEnd = this.renderer.listen(this.host, 'animationend', land);
      const stopCancel = this.renderer.listen(this.host, 'animationcancel', land);
      this.stopListening = () => {
        stopEnd();
        stopCancel();
      };
    });
  }

  private unlisten(): void {
    this.stopListening?.();
    this.stopListening = null;
  }
}
