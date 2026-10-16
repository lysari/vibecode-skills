import {
  type AnimationCallbackEvent,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterEveryRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  ionAlertCircleOutline,
  ionCheckmarkCircleOutline,
  ionClose,
  ionInformationCircleOutline,
  ionWarningOutline,
} from '@ng-icons/ionicons';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { NumberPopInDirective } from '@app/shared/directives/animations.directive';
import { cssTime, prefersReducedMotion } from '@app/shared/utils/liquid-pour';
import { LiquidPress } from '@app/shared/utils/liquid-press';
import {
  TOAST_EDGES,
  type Toast,
  type ToastButton,
  type ToastContext,
  type ToastEdge,
  type ToastId,
  type ToastPosition,
  type ToastTimer,
  type ToastType,
  toast,
  toastState,
} from './toast';

// ── The numbers ──────────────────────────────────────────────────────────────
// Every one of these is the twin's, one for one. See
// `.claude/demo/liquid-toast/liquid-toast.js` and the `liquid` skill.

const DEFAULT_OPEN_DURATION = 340;
const DEFAULT_CLOSE_DURATION = 240;
const DEFAULT_RESIZE_DURATION = 280;

/** The popup's spring: a card arriving out of nothing overshoots and settles. */
const SPRING = 'cubic-bezier(0.34, 1.32, 0.4, 1)';
const FOLD_OPEN = 'cubic-bezier(0.25, 0, 0.25, 1)';
const FOLD_SHUT = 'cubic-bezier(0.4, 0, 0.3, 1)';
/** Sets off at once, then slows into its origin: the close answers a click. */
const DROP_GATHER = 'cubic-bezier(0.2, 0, 0.2, 1)';
const DROP_FADE = 'cubic-bezier(0.4, 0, 0.6, 1)';
/** How far into the close the fade starts, so the shape moves before it thins. */
const FADE_FROM = 0.12;
/** How far into the close the target gives, so the squash answers the arrival. */
const ABSORBED = 0.75;
const RESIZE = 'cubic-bezier(0.32, 0.72, 0, 1)';

/** The drop a card at a screen edge grows out of, and gathers back into. */
const DROP_WIDTH = 96;
const DROP_HEIGHT = 36;
const DROP_RISE = 10;
/** The card leads its content in by this much, and the content leads out by it. */
const CONTENT_LAG = 40;
const TARGET_PRESS = 110;
/** How much of the press a card takes: a large surface gives less. */
const CARD_PRESS_DEPTH = 0.4;
/** The id on the toaster's own animations, so a resize leaves a press alone. */
const MOTION = 'liquid-toast';
/** The id on the pill's, so cancelling the pill never touches the card. */
const TIMER_MOTION = 'liquid-toast-timer';

const TIMER_OPEN_DURATION = 340;
const TIMER_CLOSE_DURATION = 200;
/** How much clear space a pill needs beside a stack before it sits outside it. */
const TIMER_ROOM = 72;
/** How often a showing countdown re-reads its remaining time. */
const TIMER_TICK = 250;

const TYPE_ICONS: Partial<Record<ToastType, string>> = {
  info: 'ionInformationCircleOutline',
  success: 'ionCheckmarkCircleOutline',
  warning: 'ionWarningOutline',
  error: 'ionAlertCircleOutline',
};

// ── What the toaster keeps per row ───────────────────────────────────────────

/** One stack: a screen edge in use, or a target in use. */
interface Group {
  key: string;
  edge: ToastEdge | null;
  target: HTMLElement | null;
  side: 'auto' | 'above' | 'below';
  toasts: readonly Toast[];
  /** How many are waiting behind the ghost; 0 when none are. */
  hidden: number;
  expanded: boolean;
}

/** The three elements a slot's motion moves. */
interface Parts {
  slot: HTMLElement;
  card: HTMLElement;
  body: HTMLElement;
}

/** What is animating a slot right now, so anything interrupting it can tell. */
interface Motion {
  kind: 'enter' | 'leave' | 'resize';
  /** Angular's, for an arrival: it holds the row until this is called. */
  complete?: () => void;
  /** The resting sizes the arrival measured, for a resize that interrupts it. */
  slot?: number;
  card?: number;
}

/** An arrival waiting for the rest of its batch to fold, before it measures. */
interface Arrival {
  view: Window;
  slot: HTMLElement;
  card: HTMLElement;
  body: HTMLElement;
  list: HTMLElement;
  state: Motion;
  fold: Animation;
  duration: number;
  /** The ghost it is coming back out of, or null for a fresh arrival. */
  fromQueue: HTMLElement | null;
  event: AnimationCallbackEvent;
}

/** The record a slot is showing, and the sizes to resize from. */
interface Seen {
  record: Toast;
  slot: number;
  card: number;
}

interface Timer {
  record: Toast;
  remaining: number;
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | null;
}

/** A box in viewport coordinates, which is all `origin` needs of one. */
interface AnchorBox {
  left: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Renders every toast in the store. Rebuilt from
 * `.claude/demo/liquid-toast/liquid-toast.js`, whose `createToaster` this is the
 * Angular form of — the same stacks, the same grouping, the same motion, the same
 * numbers. What differs is only what the framework owns: options arrive as
 * inputs rather than an options object, arrivals and departures hang off
 * `animate.enter` / `animate.leave` rather than being driven from a render
 * function, and a custom card is a template rather than a DOM node.
 *
 * Mount exactly one, where the app is always mounted:
 *
 * ```html
 * <x-liquid-toaster position="top-center" closeButton />
 * ```
 *
 * `hotkey` (Alt+T by default) moves focus to the toasts.
 *
 * Motion tuning, read with fallbacks so a value set on any ancestor reaches it:
 * `--liquid-toast-open-duration`, `--liquid-toast-close-duration`,
 * `--liquid-toast-resize-duration`, `--liquid-toast-width`,
 * `--liquid-toast-radius`, `--liquid-toast-max-height`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, NgTemplateOutlet, LiquidButton, LiquidPressable, NumberPopInDirective],
  providers: [
    // Outlined, not solid: the icon is drawn in the plate's own hue and the plate
    // carries the colour, so the two read as one glossy disc rather than a
    // coloured badge with a white glyph sitting on it.
    provideIcons({
      ionAlertCircleOutline,
      ionCheckmarkCircleOutline,
      ionClose,
      ionInformationCircleOutline,
      ionWarningOutline,
    }),
  ],
  host: {
    class: 'liquid-toaster',
    '(document:keydown)': 'onKeydown($event)',
    '(document:visibilitychange)': 'onVisibilityChange()',
    '(window:resize)': 'schedulePlace()',
    '(window:scroll)': 'schedulePlace()',
  },
  selector: 'x-liquid-toaster',
  styleUrl: './liquid-toast.scss',
  templateUrl: './liquid-toast.html',
})
export class LiquidToaster {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  // ── Options ────────────────────────────────────────────────────────────────

  /**
   * Where toasts go when they do not say: a screen edge, or a target element
   * (`{ target: 'notifications' }`). The newest toast is always the one nearest
   * the edge or the target it came from.
   */
  readonly position = input<ToastPosition>('top-center');
  /** A close button on every toast. One that cannot dismiss itself gets one anyway. */
  readonly closeButton = input(false, { transform: booleanAttribute });
  /** Whether a toast sees itself out. A `loading` toast never does. */
  readonly autoDismiss = input(true, { transform: booleanAttribute });
  /** How long a toast stays, in ms. A toast's own `duration` overrides it. */
  readonly duration = input(4000, { transform: numberAttribute });
  /** How many a stack shows before the rest go behind a ghost pill. */
  readonly visibleToasts = input(3, { transform: numberAttribute });
  /** Between the cards in a stack, in px. */
  readonly gap = input(8, { transform: numberAttribute });
  /** Between an edge stack and the screen: a number of px, or any CSS length. */
  readonly offset = input<number | string>(16);
  /**
   * The keys that move focus into the stack. Modifier names (`altKey`) are read
   * off the event; anything else is matched against `event.code`.
   */
  readonly hotkey = input<readonly string[]>(['altKey', 'KeyT']);
  /**
   * When a toast shows its countdown, in a pill that grows out of its side:
   * `hover`, `always` or `off`. A toast's own `timer` overrides it.
   *
   * Off by default. Hovering holds the countdown (see {@link pauseOnHover}), so a
   * pill shown on hover would sit on a number that never moves; ask for it where
   * the time matters — `always`, or `hover` with `pauseOnHover` off.
   */
  readonly timer = input<ToastTimer>('off');
  /**
   * Which side the countdown pill sits. `auto` faces into the screen — right of
   * a left or centre stack, left of a right one — and takes the other side when
   * that one has no room. With no room on either side, or while the stack
   * scrolls, the pill sits on the card's own edge instead.
   */
  readonly timerSide = input<'auto' | 'left' | 'right'>('auto');
  /** Whether hovering a stack holds its countdowns where they are. */
  readonly pauseOnHover = input(true, { transform: booleanAttribute });

  // ── State ──────────────────────────────────────────────────────────────────

  private readonly expanded = signal<ReadonlySet<string>>(new Set());
  private readonly hovered = signal(false);
  private readonly focused = signal(false);
  private readonly pageHidden = signal(false);
  /** Which toast the pointer is over, for a pill shown on hover. */
  protected readonly hoveredToast = signal<ToastId | null>(null);
  /** Re-read on a tick, so a showing countdown's digits follow the clock. */
  private readonly tick = signal(0);

  private readonly timers = new Map<ToastId, Timer>();
  /** A toast whose pill keeps its digits long enough to gather away. */
  private readonly timerHolds = signal<ReadonlySet<ToastId>>(new Set());
  /** Which pills were out last pass, so the one just hidden can be held. */
  private wasShown: ReadonlySet<ToastId> = new Set();
  private readonly timerShown = new WeakMap<HTMLElement, boolean>();

  private readonly motion = new WeakMap<HTMLElement, Motion>();
  private readonly seen = new WeakMap<HTMLElement, Seen>();
  /** Each slot's resting height plus margin, for measuring a stack mid-fold. */
  private readonly slotOuters = new WeakMap<HTMLElement, number>();
  private readonly presses = new WeakMap<HTMLElement, LiquidPress>();
  private readonly cardPresses = new WeakMap<HTMLElement, LiquidPress>();
  /** Which side a target's stack chose, so it never flips mid-stack. */
  private readonly sides = new WeakMap<HTMLElement, boolean>();
  private readonly elementKeys = new WeakMap<HTMLElement, number>();
  private nextElementKey = 1;

  private arriving: Arrival[] = [];
  private arrivalsQueued = false;
  private placeFrame = 0;
  private clock: ReturnType<typeof setInterval> | null = null;

  // ── Grouping ───────────────────────────────────────────────────────────────

  /**
   * Which stack a toast belongs to. A target that is not on screen is no target:
   * it falls back to the edge the caller named, so a toast is never placed
   * against something with no box.
   */
  private resolve(position: ToastPosition): Omit<Group, 'toasts' | 'hidden' | 'expanded'> {
    if (typeof position === 'string') return this.edgeGroup(position);

    const named = position.target;
    const element = typeof named === 'string' ? this.targets().get(named) : named;
    if (!this.isShowing(element)) return this.edgeGroup(position.fallback ?? 'top-center');

    const side = position.side ?? 'auto';
    return { key: `target-${this.keyOf(element)}-${side}`, edge: null, target: element, side };
  }

  private edgeGroup(edge: ToastEdge): Omit<Group, 'toasts' | 'hidden' | 'expanded'> {
    const safe = TOAST_EDGES.includes(edge) ? edge : 'top-center';
    return { key: `edge-${safe}`, edge: safe, target: null, side: 'auto' };
  }

  private keyOf(element: HTMLElement): number {
    let key = this.elementKeys.get(element);
    if (key === undefined) {
      key = this.nextElementKey++;
      this.elementKeys.set(element, key);
    }
    return key;
  }

  /** On screen means connected *and* laid out: `display: none` is not a target. */
  private isShowing(element: HTMLElement | null | undefined): element is HTMLElement {
    return !!element && element.isConnected && element.getClientRects().length > 0;
  }

  private readonly targets = computed(() => toastState.targets());

  /**
   * Every stack, with what it shows. A stack that stops overflowing forgets it
   * was expanded, so it does not come back expanded next time.
   */
  protected readonly groups = computed<readonly Group[]>(() => {
    const limit = Math.max(1, this.visibleToasts());
    const expanded = this.expanded();
    const buckets = new Map<string, Group>();

    for (const item of toastState.toasts()) {
      const where = this.resolve(item.position ?? this.position());
      const bucket = buckets.get(where.key);
      if (bucket) (bucket.toasts as Toast[]).push(item);
      else buckets.set(where.key, { ...where, toasts: [item], hidden: 0, expanded: false });
    }

    // A list stays once used, even empty, so its last toast can fold away inside
    // it — Angular keeps the `@for` row while `animate.leave` plays, and the row
    // needs a list to be in.
    for (const key of this.liveGroups) {
      if (!buckets.has(key)) {
        const known = this.groupShape.get(key);
        if (known) buckets.set(key, { ...known, toasts: [], hidden: 0, expanded: false });
      }
    }

    const groups: Group[] = [];
    for (const group of buckets.values()) {
      this.groupShape.set(group.key, {
        key: group.key,
        edge: group.edge,
        target: group.target,
        side: group.side,
      });
      const overflowing = group.toasts.length > limit;
      const open = overflowing && expanded.has(group.key);
      groups.push({
        ...group,
        toasts: open ? group.toasts : group.toasts.slice(0, limit),
        hidden: overflowing && !open ? group.toasts.length - limit : 0,
        expanded: open,
      });
    }
    return groups;
  });

  /** The shape of every stack ever used, so an emptied one can still render. */
  private readonly groupShape = new Map<string, Omit<Group, 'toasts' | 'hidden' | 'expanded'>>();
  /** Which stacks still have a row in the DOM, emptied or not. */
  private readonly liveGroups = new Set<string>();

  /** What every stack shows, flattened — what the timers and pills run off. */
  private readonly visible = computed(() => this.groups().flatMap((group) => group.toasts));

  /** Which stacks hold more than they can show, so a ghost belongs on them. */
  private readonly overflowing = computed(() => {
    const limit = Math.max(1, this.visibleToasts());
    const counts = new Map<string, number>();
    for (const item of toastState.toasts()) {
      const key = this.resolve(item.position ?? this.position()).key;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return new Set(
      Array.from(counts)
        .filter(([, count]) => count > limit)
        .map(([key]) => key),
    );
  });

  constructor() {
    // Gap and offset reach the stacks as custom properties, the way the twin's
    // `applyHostVars` does it.
    effect(() => {
      const offset = this.offset();
      this.host.style.setProperty('--_liquid-toast-gap', `${this.gap()}px`);
      this.host.style.setProperty(
        '--_liquid-toast-offset',
        typeof offset === 'number' ? `${offset}px` : offset,
      );
    });

    // A stack that stops overflowing forgets it was expanded, so it does not come
    // back expanded the next time it fills up — the twin clears this in `render`.
    // Only ever narrowing the set, so it settles rather than feeding itself.
    effect(() => {
      const over = this.overflowing();
      untracked(() => {
        const open = this.expanded();
        const next = new Set(Array.from(open).filter((key) => over.has(key)));
        if (next.size !== open.size) this.expanded.set(next);
      });
    });

    // A toast arriving gets a countdown, one leaving gives its up. This has to
    // happen before the view is checked, not after: the template asks `hasTimer`
    // whether to render a pill at all, and `timers` is a plain map that would not
    // call it back. A component effect runs inside change detection ahead of the
    // template, which is exactly the window this needs.
    effect(() => {
      this.visible();
      untracked(() => this.syncTimers());
    });

    // The clock runs only while a pill could be showing; a stack with none costs
    // nothing.
    effect(() => {
      const counting = this.visible().some((item) => this.hasTimer(item));
      untracked(() => this.runClock(counting));
    });

    // A pill that has just stopped being shown keeps its digits until its gather
    // has played. This has to happen here, ahead of the template, for the same
    // reason the countdowns do: the pill's width *is* its digits, and a pill
    // emptied in the frame the hover ends leaves the gather 18px of bare padding
    // to close instead of the width the eye was just looking at. The twin never
    // has to think about it — it clears its pill's content in `release()`, so the
    // digits are simply still there.
    effect(() => {
      const shown = new Set(
        this.visible()
          .filter((item) => this.showTimer(item))
          .map((item) => item.id),
      );
      untracked(() => {
        const hidden = Array.from(this.wasShown).filter((id) => !shown.has(id));
        this.wasShown = shown;
        if (!hidden.length) return;
        this.timerHolds.update((holds) => {
          const next = new Set(holds);
          for (const id of hidden) next.add(id);
          return next;
        });
      });
    });

    afterEveryRender({ mixedReadWrite: () => this.onRendered() });

    // Nothing of ours outlives the toaster: the tick would keep waking the app up,
    // and a pending countdown would close a toast into a component that is gone.
    inject(DestroyRef).onDestroy(() => {
      this.runClock(false);
      for (const timer of this.timers.values()) this.stop(timer);
      this.timers.clear();
      if (this.placeFrame) this.document.defaultView?.cancelAnimationFrame(this.placeFrame);
      this.placeFrame = 0;
    });
  }

  // ── What a toast is rendered as ────────────────────────────────────────────

  protected typeIcon(type: ToastType): string | null {
    return TYPE_ICONS[type] ?? null;
  }

  /** A `loading` toast never sees itself out; anything else follows the toaster. */
  private dismissesItself(item: Toast): boolean {
    if (item.autoDismiss != null) return item.autoDismiss;
    return item.type === 'loading' ? false : this.autoDismiss();
  }

  /**
   * A toast that cannot dismiss itself always offers a way out, or it is a
   * message with no exit. `dismissible: false` is the one thing that overrules
   * that — a toast code will close itself.
   */
  protected showClose(item: Toast): boolean {
    if (item.dismissible === false) return false;
    if (item.closeButton != null) return item.closeButton;
    return this.closeButton() || !this.dismissesItself(item);
  }

  protected contextFor(item: Toast): ToastContext {
    return { $implicit: item, toast: item, dismiss: () => toast.dismiss(item.id) };
  }

  protected toastDismiss(id: ToastId): void {
    toast.dismiss(id);
  }

  /** The button runs, and the toast closes unless the handler said not to. */
  protected onButton(event: MouseEvent, item: Toast, button: ToastButton): void {
    button.onClick(event);
    if (!event.defaultPrevented) toast.dismiss(item.id);
  }

  protected toggleExpanded(key: string): void {
    const next = new Set(this.expanded());
    if (!next.delete(key)) next.add(key);
    this.expanded.set(next);
  }

  // ── Placement ──────────────────────────────────────────────────────────────

  /**
   * A target's stack, beside its target: centred on it, kept inside the viewport,
   * and on the side it first chose. The side never flips under a stack that is
   * already open, which is what `sides` remembers.
   */
  private place(list: HTMLElement): void {
    const view = this.document.defaultView;
    const key = list.dataset['group'];
    const shape = key ? this.groupShape.get(key) : undefined;
    const target = shape?.target;
    if (!view || !target || !this.isShowing(target)) return;

    const rect = target.getBoundingClientRect();
    const viewportWidth = this.document.documentElement.clientWidth;
    const offset =
      parseFloat(view.getComputedStyle(this.host).getPropertyValue('--_liquid-toast-offset')) || 16;
    const gap = this.gap();
    const width = list.offsetWidth;

    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, offset),
      Math.max(offset, viewportWidth - offset - width),
    );

    let above = shape.side === 'above';
    if (shape.side === 'auto') {
      above = this.sides.get(list) ?? rect.top + rect.height / 2 > view.innerHeight / 2;
      this.sides.set(list, above);
    }

    list.classList.toggle('is-above', above);
    list.style.left = `${left}px`;
    list.style.top = above ? '' : `${rect.bottom + gap}px`;
    list.style.bottom = above ? `${view.innerHeight - rect.top + gap}px` : '';

    // The room it has on that side, which is what caps it when expanded.
    const room = above
      ? rect.top - gap - offset
      : view.innerHeight - rect.bottom - gap - offset;
    list.style.setProperty('--_liquid-toast-room', `${Math.max(120, room)}px`);
  }

  private placeAll(): void {
    for (const list of Array.from(
      this.host.querySelectorAll<HTMLElement>('.liquid-toast-list.is-anchored'),
    )) {
      if (list.childElementCount) this.place(list);
      else this.sides.delete(list);
    }
  }

  /** Coalesced to a frame: scroll and resize both fire far faster than layout. */
  protected schedulePlace(): void {
    const view = this.document.defaultView;
    if (!view || this.placeFrame) return;
    this.placeFrame = view.requestAnimationFrame(() => {
      this.placeFrame = 0;
      this.placeAll();
      this.syncTimerSides();
    });
  }

  // ── Hover, focus and the tab ───────────────────────────────────────────────

  // Each of these holds or releases the countdowns there and then, the way the
  // twin's handlers call `applyPause()` — through an effect it would not have run
  // by the time the pointer has left and the clock should already be going again.

  protected setHovered(value: boolean): void {
    this.hovered.set(value);
    if (!value) this.hoveredToast.set(null);
    this.applyPause();
  }

  protected onFocusIn(): void {
    this.focused.set(true);
    this.applyPause();
  }

  /** Focus moving between two toasts is not focus leaving the stacks. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.focused.set(false);
    this.applyPause();
  }

  protected onVisibilityChange(): void {
    this.pageHidden.set(this.document.visibilityState === 'hidden');
    this.applyPause();
  }

  /** Leaving a toast for one of its own buttons is not leaving the toast. */
  protected onToastPointerLeave(event: PointerEvent, item: Toast): void {
    this.onCardRelease(event);
    if (this.hoveredToast() === item.id) this.hoveredToast.set(null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const keys = this.hotkey();
    if (!keys.length || !this.visible().length) return;
    const pressed = keys.every((key) =>
      key.endsWith('Key')
        ? event[key as 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey']
        : event.code === key,
    );
    if (!pressed) return;
    event.preventDefault();
    // Past anything folding away: its row is still in the DOM, and focusing it
    // would put the focus on the stack a toast just left rather than one holding
    // a toast to read.
    const slot = this.host.querySelector('.liquid-toast-slot:not(.is-leaving)');
    (slot?.parentElement as HTMLElement | null)?.focus();
  }

  // ── The card's press ───────────────────────────────────────────────────────

  /** A press that starts on one of the card's buttons belongs to that button. */
  protected onCardPress(event: PointerEvent): void {
    const slot = (event.currentTarget as HTMLElement) ?? null;
    if (!slot || !(event.target instanceof Element)) return;
    if (event.target.closest('button, a, input, select, textarea')) return;
    // Nothing presses on its way out: the close already owns `scale`.
    if (this.motion.get(slot)?.kind === 'leave') return;

    let press = this.cardPresses.get(slot);
    if (!press) {
      // A large surface gives less, or the whole card visibly buckles.
      press = new LiquidPress(slot, this.document, '--liquid-toast-press-duration', CARD_PRESS_DEPTH);
      this.cardPresses.set(slot, press);
    }
    press.press();
  }

  protected onCardRelease(event: PointerEvent): void {
    const slot = (event.currentTarget as HTMLElement) ?? null;
    if (slot) this.cardPresses.get(slot)?.release();
  }

  // ── Countdowns ─────────────────────────────────────────────────────────────

  private readonly paused = computed(
    () => (this.hovered() && this.pauseOnHover()) || this.focused() || this.pageHidden(),
  );

  /**
   * Gives a countdown to every toast that is showing and has none, and takes one
   * from every toast that has stopped showing. A toast waiting behind the ghost
   * has no countdown at all, so its time starts when it appears rather than
   * running out unseen.
   */
  private syncTimers(): void {
    const showing = new Map(this.visible().map((item) => [item.id, item]));

    for (const [id, timer] of Array.from(this.timers)) {
      if (showing.get(id) === timer.record) continue;
      this.stop(timer);
      this.timers.delete(id);
    }

    for (const [id, record] of showing) {
      if (this.timers.has(id)) continue;
      const duration = this.dismissesItself(record)
        ? (record.duration ?? this.duration())
        : Infinity;
      const timer: Timer = { record, remaining: duration, startedAt: 0, handle: null };
      this.timers.set(id, timer);
      if (!this.paused()) this.start(timer);
    }
  }

  private applyPause(): void {
    const paused = this.paused();
    for (const timer of this.timers.values()) {
      if (paused) this.stop(timer);
      else if (timer.handle === null) this.start(timer);
    }
  }

  private start(timer: Timer): void {
    if (!Number.isFinite(timer.remaining) || timer.remaining <= 0 || timer.handle !== null) return;
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => toastState.autoClose(timer.record.id), timer.remaining);
  }

  /** Held, not reset: what is left is kept, so a toast resumes where it stopped. */
  private stop(timer: Timer): void {
    if (timer.handle === null) return;
    clearTimeout(timer.handle);
    timer.handle = null;
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
  }

  /** Runs only while a pill could be showing; a stack with none costs nothing. */
  private runClock(counting: boolean): void {
    if (counting && this.clock === null) {
      this.clock = setInterval(() => this.tick.update((n) => n + 1), TIMER_TICK);
    }
    if (!counting && this.clock !== null) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }

  // ── The countdown pill ─────────────────────────────────────────────────────

  private timerMode(item: Toast): ToastTimer {
    return item.timer ?? this.timer();
  }

  /** What is left on a toast's clock, or null when it has none to show. */
  private remaining(item: Toast): number | null {
    const timer = this.timers.get(item.id);
    if (!timer || timer.record !== item || !Number.isFinite(timer.remaining)) return null;
    if (timer.handle === null) return timer.remaining;
    return Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
  }

  /** Whether this toast has a pill at all — a clock and a mode that is not off. */
  protected hasTimer(item: Toast): boolean {
    return this.timerMode(item) !== 'off' && this.remaining(item) !== null;
  }

  /** Whether that pill is out right now. */
  protected showTimer(item: Toast): boolean {
    if (!this.hasTimer(item)) return false;
    return this.timerMode(item) === 'always' || this.hoveredToast() === item.id;
  }

  /** Its digits stay while it gathers away, so there is something to gather. */
  protected timerContent(item: Toast): boolean {
    return this.showTimer(item) || this.timerHolds().has(item.id);
  }

  private timerLeft(item: Toast): number {
    this.tick();
    return this.remaining(item) ?? 0;
  }

  /** Seconds up to 99, then minutes: three digits would resize the pill. */
  protected timerValue(item: Toast): number {
    const seconds = Math.ceil(this.timerLeft(item) / 1000);
    return seconds < 100 ? seconds : Math.ceil(seconds / 60);
  }

  protected timerUnit(item: Toast): string {
    return Math.ceil(this.timerLeft(item) / 1000) < 100 ? 's' : 'm';
  }

  /**
   * Faces into the screen, takes the other side when `auto` and that one has no
   * room, and otherwise sits on the card's own edge. A scrolling stack always
   * insets: a pill outside it would be clipped by the scroll container.
   */
  private syncTimerSides(): void {
    const view = this.document.defaultView;
    if (!view) return;
    const width = this.document.documentElement.clientWidth;
    const preference = this.timerSide();

    for (const list of Array.from(this.host.querySelectorAll<HTMLElement>('.liquid-toast-list'))) {
      if (!list.childElementCount) continue;
      const rect = list.getBoundingClientRect();
      const room = (side: 'left' | 'right') => (side === 'left' ? rect.left : width - rect.right);
      const edge = this.groupShape.get(list.dataset['group'] ?? '')?.edge ?? null;

      const facing: 'left' | 'right' =
        preference !== 'auto'
          ? preference
          : edge
            ? (edge.endsWith('right') ? 'left' : 'right')
            : rect.left + rect.width / 2 > width / 2
              ? 'left'
              : 'right';
      const other = facing === 'left' ? 'right' : 'left';

      let side = 'inset';
      if (!list.classList.contains('is-overflowing') && rect.width) {
        if (room(facing) >= TIMER_ROOM) side = facing;
        else if (preference === 'auto' && room(other) >= TIMER_ROOM) side = other;
      }
      list.setAttribute('data-timer-side', side);
    }
  }

  /**
   * Plays the pill's motion when its shown state changes. Driven from here rather
   * than from `animate.enter` / `animate.leave`, because the pill has to survive
   * being hidden: it turns around mid-way when the pointer comes straight back.
   */
  private syncTimerPills(): void {
    for (const anchor of Array.from(
      this.host.querySelectorAll<HTMLElement>('.liquid-toast-timer-anchor'),
    )) {
      const shown = anchor.hasAttribute('data-shown');
      const was = this.timerShown.get(anchor) ?? false;
      if (shown === was) continue;
      this.timerShown.set(anchor, shown);

      const pill = anchor.firstElementChild as HTMLElement | null;
      const slot = anchor.closest<HTMLElement>('.liquid-toast-slot');
      if (!pill || !slot) continue;
      if (shown) this.growTimer(slot, pill);
      else this.gatherTimer(slot, pill);
    }
  }

  /** The pill grows out of a sliver against the card's edge, and its digits pop in. */
  private growTimer(slot: HTMLElement, pill: HTMLElement): void {
    const view = this.document.defaultView;
    if (!view || prefersReducedMotion(view) || typeof pill.animate !== 'function') return;

    const interrupted = pill.getAnimations().length > 0;
    const live = interrupted ? this.timerLive(view, pill) : null;
    for (const motion of pill.getAnimations()) motion.cancel();

    const style = view.getComputedStyle(pill);
    const width = parseFloat(style.width);
    const height = parseFloat(style.height);
    const from = live ?? { ...this.timerOrigin(slot, width, height), opacity: '0' };
    // A toast still arriving lands first; a pill turning around goes at once.
    const delay =
      !interrupted && this.motion.get(slot)?.kind === 'enter' ? DEFAULT_OPEN_DURATION * 0.6 : 0;
    const { opacity, ...shape } = from;

    pill.animate([shape, { width: `${width}px`, height: `${height}px`, translate: '0 0' }], {
      id: TIMER_MOTION,
      delay,
      duration: TIMER_OPEN_DURATION,
      easing: SPRING,
      fill: 'backwards',
    });
    pill.animate([{ opacity }, { opacity: 1 }], {
      id: TIMER_MOTION,
      delay,
      duration: TIMER_OPEN_DURATION * 0.3,
      easing: 'ease-out',
      fill: 'backwards',
    });
  }

  /** The pill gathers back into the card's edge as it fades, then lets its digits go. */
  private gatherTimer(slot: HTMLElement, pill: HTMLElement): void {
    const view = this.document.defaultView;
    const id = slot.dataset['toastId'];
    const release = () => {
      if (!id) return;
      this.timerHolds.update((holds) => {
        const next = new Set(holds);
        for (const held of holds) if (String(held) === id) next.delete(held);
        return next;
      });
    };
    if (!view || prefersReducedMotion(view) || typeof pill.animate !== 'function') return release();

    // The hold is already on by now — `holdHiddenPills` took it in the change
    // detection pass that hid the pill, before the template could drop the
    // digits. Taking it here instead would be a pass too late: the view would
    // have emptied the pill first, this would measure 18px of bare padding, and
    // the gather would snap the width shut instead of shrinking it.

    // At rest the shown pill is fully open; the hidden state's `opacity: 0` is
    // already applied, so rest is read from the size and the opacity is known.
    const live = pill.getAnimations().length > 0 ? this.timerLive(view, pill) : null;
    for (const motion of pill.getAnimations()) motion.cancel();
    const style = view.getComputedStyle(pill);
    const width = parseFloat(style.width);
    const height = parseFloat(style.height);
    const from = live ?? { width: `${width}px`, height: `${height}px`, translate: '0 0', opacity: '1' };
    const { opacity, ...shape } = from;

    const motions = [
      pill.animate([shape, this.timerOrigin(slot, width, height)], {
        id: TIMER_MOTION,
        duration: TIMER_CLOSE_DURATION,
        easing: DROP_GATHER,
      }),
      pill.animate([{ opacity }, { opacity, offset: FADE_FROM, easing: DROP_FADE }, { opacity: 0 }], {
        id: TIMER_MOTION,
        duration: TIMER_CLOSE_DURATION,
      }),
    ];
    // Cancelled means it turned around and is growing again; the hold goes either way.
    this.whenDone(motions, release);
  }

  private timerLive(view: Window, pill: HTMLElement) {
    const style = view.getComputedStyle(pill);
    return {
      width: style.width,
      height: style.height,
      translate: style.translate === 'none' ? '0 0' : style.translate,
      opacity: style.opacity,
    };
  }

  /** The sliver against the card's edge the pill grows from and gathers into. */
  private timerOrigin(slot: HTMLElement, width: number, height: number): Keyframe {
    const list = slot.parentElement as HTMLElement | null;
    const side = list?.getAttribute('data-timer-side') ?? 'inset';
    const up = !!list && (list.classList.contains('is-up') || list.classList.contains('is-above'));
    const translate =
      side === 'right' ? '-8px 0' : side === 'left' ? '8px 0' : `0 ${up ? -6 : 6}px`;
    return {
      width: `${Math.min(height * 0.6, width)}px`,
      height: `${height * 0.6}px`,
      translate,
    };
  }

  // ── Motion ─────────────────────────────────────────────────────────────────

  /**
   * Angular's `animate.enter`, in two passes — the twin's `enterFold` then
   * `enterCard`. Every arriving row folds shut first; only then does each card
   * measure the stack and set off. Nothing is predicted that way: a toast timing
   * out beside it, its own room still collapsing, is in the measurement like
   * everything else, which is what a toast coming back out of the ghost needs to
   * leave from the pill rather than from where the pill was going to be.
   */
  protected onEnter(event: AnimationCallbackEvent): void {
    const parts = this.parts(event.target);
    const view = this.document.defaultView;
    if (!parts || !view || prefersReducedMotion(view)) return event.animationComplete();

    const { slot, card, body } = parts;
    const list = slot.parentElement as HTMLElement;
    this.liveGroups.add(list.dataset['group'] ?? '');
    // A target's stack is placed before anything is measured off it.
    if (list.classList.contains('is-anchored')) this.place(list);

    // The newest toast is always first in the list, so anything arriving behind
    // one came back out of the queue: it grows from the ghost that held it.
    const fromQueue = slot.previousElementSibling ? this.ghostOf(list) : null;
    // Out of the ghost is the gather played backwards: the same clock and the
    // same curve, so a toast looks the same going in and coming back out. The
    // spring belongs to a toast arriving out of nothing.
    const duration = fromQueue
      ? cssTime(view, slot, '--liquid-toast-close-duration', DEFAULT_CLOSE_DURATION)
      : cssTime(view, slot, '--liquid-toast-open-duration', DEFAULT_OPEN_DURATION);

    const slotStyle = view.getComputedStyle(slot);
    const slotHeight = parseFloat(slotStyle.height);
    const slotMargin = slotStyle.marginBottom;
    this.slotOuters.set(slot, slotHeight + parseFloat(slotMargin));

    const state: Motion = {
      kind: 'enter',
      complete: () => event.animationComplete(),
      slot: slotHeight,
      card: parseFloat(view.getComputedStyle(card).height),
    };
    this.motion.set(slot, state);

    const fold = slot.animate(
      [
        { height: '0px', marginBottom: '0px' },
        { height: `${slotHeight}px`, marginBottom: slotMargin },
      ],
      { id: MOTION, duration, easing: FOLD_OPEN },
    );

    this.arriving.push({ view, slot, card, body, list, state, fold, duration, fromQueue, event });
    if (this.arrivalsQueued) return;
    // After every arrival in this batch has folded, and before the frame paints.
    this.arrivalsQueued = true;
    queueMicrotask(() => {
      this.arrivalsQueued = false;
      const batch = this.arriving;
      this.arriving = [];
      for (const plan of batch) this.startArrival(plan);
    });
  }

  /** The second pass: the card measures the settled stack and grows out of its origin. */
  private startArrival(plan: Arrival): void {
    const { view, slot, card, body, list, state, fold, duration, fromQueue, event } = plan;
    if (this.motion.get(slot) !== state) return;

    const cardStyle = view.getComputedStyle(card);
    const width = parseFloat(cardStyle.width);
    const height = parseFloat(cardStyle.height);
    const growth = fromQueue ? DROP_GATHER : SPRING;

    // Measured with every arriving row already folded shut, so the ghost's box is
    // where it is on screen rather than where the layout will put it later.
    const { from, target } = this.origin(
      view,
      list,
      card.getBoundingClientRect(),
      fromQueue,
      fromQueue && fromQueue.getBoundingClientRect(),
    );
    const to: Keyframe = { width: `${width}px`, height: `${height}px`, translate: '0 0' };
    // The corners are their own animation: the spring overshoots, and a radius
    // overshooting its resting value goes *below* it — the card squaring off
    // halfway through its own arrival.
    const { borderRadius: fromRadius, ...fromBox } = from;

    // Frozen at its final layout, or the copy re-wraps as the card grows and the
    // whole toast boils on its way in.
    this.freeze(body);
    if (target && !slot.classList.contains('is-ghost')) this.squash(target, 0);

    const motions = [
      fold,
      // Only the origin end is chosen; the card lands on whatever the layout gave it.
      card.animate([fromBox, to], { id: MOTION, duration, easing: growth }),
      ...(fromRadius
        ? [
            card.animate([{ borderRadius: fromRadius }, { borderRadius: cardStyle.borderRadius }], {
              id: MOTION,
              duration,
              easing: DROP_GATHER,
            }),
          ]
        : []),
      // Out of a drop it condenses rather than blinking on. Out of the ghost it
      // does not fade at all: it starts as that pill, in its place and at its
      // size, so there is nothing to fade in from — and fading anyway is what
      // made it look like the toast appeared beside the pill rather than out of
      // it, since the first frames of the only thing moving were invisible.
      ...(fromQueue
        ? []
        : [
            card.animate([{ opacity: 0 }, { opacity: 1 }], {
              id: MOTION,
              duration: duration * 0.3,
              easing: 'ease-out',
            }),
          ]),
      // The card leads on the way in by one lag, so it reveals the content rather
      // than racing it, and both land together.
      body.animate(
        [
          { opacity: 0, filter: 'blur(12px)', scale: '0.96' },
          { opacity: 1, offset: 0.6 },
          { opacity: 1, filter: 'blur(0px)', scale: '1' },
        ],
        {
          id: MOTION,
          duration: duration - CONTENT_LAG,
          delay: CONTENT_LAG,
          easing: 'ease-out',
          fill: 'backwards',
        },
      ),
    ];

    this.whenDone(motions, () => {
      if (this.motion.get(slot) !== state) return;
      this.motion.delete(slot);
      this.thaw(body);
      event.animationComplete();
      this.syncOverflow();
    });
  }

  /**
   * Angular's `animate.leave` — the twin's `leave`. The content goes first, the
   * card gathers back into where it came from, and the room folds shut, all from
   * wherever they are on screen, so a toast dismissed mid-grow turns around
   * instead of jumping.
   */
  protected onLeave(event: AnimationCallbackEvent): void {
    const parts = this.parts(event.target);
    const view = this.document.defaultView;
    if (!parts || !view || prefersReducedMotion(view)) return event.animationComplete();

    const { slot, card, body } = parts;
    const list = slot.parentElement as HTMLElement;
    const previous = this.motion.get(slot);
    const state: Motion = { kind: 'leave' };
    this.motion.set(slot, state);
    // Marked for as long as it is still in the DOM: it is on screen but no longer
    // one of the toasts, so the hotkey has to look past it.
    slot.classList.add('is-leaving');

    // Read everything live before cancelling: cancelling reverts in one frame.
    const live = this.live(view, parts);
    // That includes a press: the squash was read into `live`, and the close
    // carries it on rather than a bounce fighting the close for `scale`.
    for (const motion of slot.getAnimations({ subtree: true })) motion.cancel();
    this.cardPresses.get(slot)?.cancel();
    // A countdown pill showing beside it goes with it, rather than hanging on
    // while the card gathers away.
    const pill = slot.querySelector<HTMLElement>('.liquid-toast-timer');
    pill?.animate([{ opacity: view.getComputedStyle(pill).opacity }, { opacity: 0 }], {
      id: MOTION,
      duration: 120,
      easing: 'ease-in',
      fill: 'forwards',
    });
    // An arrival cut short still owes Angular its completion.
    if (previous?.kind === 'enter') previous.complete?.();
    this.freeze(body);

    const duration = cssTime(view, slot, '--liquid-toast-close-duration', DEFAULT_CLOSE_DURATION);
    const fill = 'forwards';
    // Still in the store means it is not being dismissed at all — it has been
    // pushed past `visibleToasts` and is joining the queue, so it gathers into
    // the ghost that now counts it rather than away to the stack's origin.
    const id = slot.dataset['toastId'];
    const queued = id !== undefined && toastState.toasts().some((item) => String(item.id) === id);
    const intoGhost = queued ? this.ghostOf(list) : null;
    // Where it sits now is not where it will be: toasts opening above it push it
    // along while it gathers, so it aims that much short of the ghost.
    const up = list.classList.contains('is-up') || list.classList.contains('is-above');
    const drag = intoGhost ? this.drag(view, slot) : 0;
    const { from: gathered, target } = this.origin(
      view,
      list,
      card.getBoundingClientRect(),
      intoGhost,
      intoGhost && this.ghostRest(view, list, intoGhost),
      up ? drag : -drag,
    );
    if (target && !slot.classList.contains('is-ghost')) this.squash(target, duration * ABSORBED);
    // Size and fade are two animations, so the fade can hold off without the
    // shape waiting for it.
    const { opacity: _opacity, ...shape } = live.card;

    const motions = [
      // Content leads on the way out: whatever is leaving goes first, and it
      // starts going immediately — text still at full strength a third of the
      // way through is what makes a dismissal feel late.
      body.animate([live.body, { opacity: 0, filter: 'blur(8px)', scale: '0.96' }], {
        id: MOTION,
        duration: Math.max(1, duration - CONTENT_LAG * 3),
        easing: 'cubic-bezier(0.3, 0, 0.6, 1)',
        fill,
      }),
      // One movement, not a gather then a fade: the card slows into its origin
      // and is gone as it arrives. Stopping small first and fading after leaves a
      // drop sitting there for a beat, which reads as the close hanging.
      card.animate([shape, { ...gathered, scale: '1' }], { id: MOTION, duration, easing: DROP_GATHER, fill }),
      card.animate(
        [
          { opacity: live.card.opacity },
          { opacity: live.card.opacity, offset: FADE_FROM, easing: DROP_FADE },
          { opacity: 0 },
        ],
        { id: MOTION, duration, fill },
      ),
      // Same clock as the card, so the stack closes as the toast gathers instead
      // of waiting on an empty gap.
      slot.animate([live.slot, { height: '0px', marginBottom: '0px' }], {
        id: MOTION,
        duration,
        easing: FOLD_SHUT,
        fill,
      }),
      // Gathering into the ghost already aims short of where the stack is going,
      // the way the twin does it; a card dropping away instead has to be held
      // against the same shift, because nothing in its own motion allows for it.
      ...(intoGhost ? [] : this.holdAgainstDrag(view, slot, card, up)),
    ];

    this.whenDone(motions, () => {
      if (this.motion.get(slot) !== state) return;
      this.motion.delete(slot);
      event.animationComplete();
      // The row is gone only after Angular takes it out, so the overflow check
      // has to wait a frame or it measures the stack with the row still in it.
      this.document.defaultView?.requestAnimationFrame(() => this.syncOverflow());
    });
  }

  /**
   * Where a card comes from and goes back to, as a keyframe relative to the
   * card's resting box: a small drop just past the screen edge, or — for a
   * target's stack with the target still showing — the target's own box, corners
   * and all. `via` overrides both, for the ghost.
   */
  private origin(
    view: Window,
    list: HTMLElement,
    card: DOMRect,
    via: HTMLElement | null,
    viaBox: AnchorBox | DOMRect | null,
    shiftY = 0,
  ): { from: Keyframe; target: HTMLElement | null } {
    const key = list.dataset['group'] ?? '';
    const anchored = this.groupShape.get(key)?.target ?? null;
    const target = via ?? (this.isShowing(anchored) ? anchored : null);

    if (!target) {
      // Formed just past where it will rest, toward the edge it came from.
      const rise = list.classList.contains('is-up') ? DROP_RISE : -DROP_RISE;
      return {
        target: null,
        from: {
          width: `${Math.min(DROP_WIDTH, card.width)}px`,
          height: `${Math.min(DROP_HEIGHT, card.height)}px`,
          translate: `0 ${rise}px`,
        },
      };
    }

    const box = viaBox ?? target.getBoundingClientRect();
    // A stack aligned to one side shrinks its card toward that side, so there the
    // edges line up; centred, the centres do.
    const dx = list.classList.contains('is-left')
      ? box.left - card.left
      : list.classList.contains('is-right')
        ? box.left + box.width - (card.left + card.width)
        : box.left + box.width / 2 - (card.left + card.width / 2);
    // A stack growing upward is pinned by its bottom edge; one growing down by its top.
    const up = list.classList.contains('is-up') || list.classList.contains('is-above');
    const dy = (up ? box.bottom - card.bottom : box.top - card.top) + shiftY;

    return {
      target,
      from: {
        width: `${box.width}px`,
        height: `${box.height}px`,
        translate: `${dx}px ${dy}px`,
        borderRadius: `${this.targetRadius(view, target, box)}px`,
      },
    };
  }

  /**
   * The corner radius to grow out of: the target's own, but never more than a
   * pill for its box. Taken literally, a `999px` radius is a range of hundreds of
   * pixels down to the card's 22px, and anything overshooting that range drives
   * the corners to nearly nothing on the way.
   */
  private targetRadius(view: Window, target: HTMLElement, box: AnchorBox | DOMRect): number {
    const pill = Math.min(box.width, box.height) / 2;
    const declared = parseFloat(view.getComputedStyle(target).borderRadius);
    if (!Number.isFinite(declared) || declared <= 0) return Math.min(12, pill);
    return Math.min(declared, pill);
  }

  /** The target gives under the toast leaving it, or landing back in it. */
  private squash(target: HTMLElement, delay: number): void {
    let press = this.presses.get(target);
    if (!press) {
      press = new LiquidPress(target, this.document, '--liquid-toast-target-press-duration');
      this.presses.set(target, press);
    }
    const run = press;
    setTimeout(() => {
      run.press();
      setTimeout(() => run.release(), TARGET_PRESS);
    }, delay);
  }

  /**
   * The ghost of a stack, while it is showing one: what a toast joining the queue
   * gathers into, and what one coming back out of the queue grows from.
   *
   * A ghost on its way out is not one of those. Dismiss a toast from a stack of
   * four and two things happen at once — the last queued toast comes back out,
   * and the ghost goes, because nothing is waiting behind it any more. Angular
   * keeps the departing row in the DOM until its motion finishes, so a plain
   * query finds that pill and the returning toast grows out of something that is
   * itself gathering away: one pill that fades out and swells into a card in the
   * same frames, on the close's curve instead of the spring. The twin cannot have
   * this bug because it drops its `group.ghost` reference the moment it dismisses
   * it, and so the arrival falls back to the edge drop.
   *
   * Asked of the state rather than the class, so it does not depend on whether
   * this row's `animate.leave` happened to run before that one's `animate.enter`.
   */
  private ghostOf(list: HTMLElement | null): HTMLElement | null {
    if (!list) return null;
    const key = list.dataset['group'] ?? '';
    const group = this.groups().find((entry) => entry.key === key);
    if (!group || !(group.hidden || group.expanded)) return null;
    return list.querySelector<HTMLElement>(
      '.liquid-toast-slot.is-ghost:not(.is-leaving) > .liquid-toast-ghost',
    );
  }

  /**
   * Where the ghost will be once the stack has settled, which is not where it
   * appears to sit while a toast folds away beneath it. The stack's own edge is
   * fixed, so its rest is that edge plus the toasts that are staying — and what
   * is staying is what the stack shows, not what is still in the DOM.
   */
  private ghostRest(view: Window, list: HTMLElement, ghost: HTMLElement): AnchorBox {
    const box = ghost.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    const up = list.classList.contains('is-up') || list.classList.contains('is-above');
    const showing = new Set(this.visible().map((item) => String(item.id)));

    let stacked = 0;
    for (const child of Array.from(list.children) as HTMLElement[]) {
      const id = child.dataset['toastId'];
      if (id === undefined || !showing.has(id)) continue;
      // Its resting size, margin and all: a slot still folding open has neither yet.
      stacked += this.slotOuters.get(child) ?? this.outer(view, child);
    }

    const top = up ? listBox.bottom - stacked - box.height : listBox.top + stacked;
    return { left: box.left, top, bottom: top + box.height, width: box.width, height: box.height };
  }

  /** A slot's height and the space it keeps, as it is right now. */
  private outer(view: Window, slot: HTMLElement): number {
    return slot.offsetHeight + parseFloat(view.getComputedStyle(slot).marginBottom);
  }

  /**
   * Holds a departing card still against the stack shifting under it.
   *
   * Angular gives an arriving row its logical index, which is ahead of the row it
   * is still holding for `animate.leave`; the twin inserts an arrival *after* that
   * row, before the ghost. So here a toast returning from the queue unfolds above
   * the one being dismissed and carries it down the stack — dismiss the toast
   * nearest the pill and it rides its slot 60px, landing exactly on the ghost, so
   * a close that should gather upward reads as the pill swallowing it.
   *
   * Cancelled rather than aimed short of: one additive `translate` per pusher, on
   * that pusher's own clock and curve, so the two track frame for frame and the
   * card simply stays where the eye left it. Aiming short only agrees at the end —
   * with a 340ms arrival pushing against a 240ms close it measured the card rising
   * 26px and sinking back 10, against a twin that glides a clean, monotonic 10.
   */
  private holdAgainstDrag(
    view: Window,
    slot: HTMLElement,
    card: HTMLElement,
    up: boolean,
  ): Animation[] {
    const held: Animation[] = [];
    for (let el = slot.previousElementSibling; el; el = el.previousElementSibling) {
      const resting = this.slotOuters.get(el as HTMLElement);
      if (resting === undefined) continue;
      const pending = resting - this.outer(view, el as HTMLElement);
      // Under half a pixel is the layout settling, not a push worth answering.
      if (pending < 0.5) continue;

      // The pusher's own fold, so the cancellation shares its duration and easing
      // rather than guessing at them.
      const fold = (el as HTMLElement).getAnimations().find((motion) => motion.id === MOTION);
      const timing = fold?.effect?.getTiming();
      held.push(
        card.animate([{ translate: '0 0' }, { translate: `0 ${up ? pending : -pending}px` }], {
          id: MOTION,
          duration: Number(timing?.duration) || DEFAULT_OPEN_DURATION,
          easing: typeof timing?.easing === 'string' ? timing.easing : FOLD_OPEN,
          composite: 'add',
          fill: 'forwards',
        }),
      );
    }
    return held;
  }

  /**
   * How far this slot still has to be pushed by the stack above it: every slot
   * between it and the edge its stack is anchored to that is still folding open.
   * The card travels with its own layout, so where it is aiming has to allow for
   * where that layout is going.
   */
  private drag(view: Window, slot: HTMLElement): number {
    let pending = 0;
    for (let el = slot.previousElementSibling; el; el = el.previousElementSibling) {
      const resting = this.slotOuters.get(el as HTMLElement);
      if (resting === undefined) continue;
      pending += Math.max(0, resting - this.outer(view, el as HTMLElement));
    }
    return pending;
  }

  // ── After every render ─────────────────────────────────────────────────────

  /**
   * Keeps each target's stack beside its target, notices a toast whose record
   * changed under the same id and resizes it to its new content, and otherwise
   * keeps note of each resting size so the next change has something to resize
   * from. The twin does all of this at the end of its `render`.
   */
  private onRendered(): void {
    const view = this.document.defaultView;
    if (!view) return;

    // Which stacks still have rows, so an emptied one keeps rendering until its
    // last toast has finished folding away inside it.
    this.liveGroups.clear();
    for (const list of Array.from(this.host.querySelectorAll<HTMLElement>('.liquid-toast-list'))) {
      if (list.childElementCount) this.liveGroups.add(list.dataset['group'] ?? '');
    }

    this.placeAll();
    this.syncOverflow();
    this.syncTimerSides();
    // Last, the way the twin ends its `render`: each pill plays whatever its shown
    // state has just become, now that the anchors are in the DOM to play it on.
    this.syncTimerPills();

    const byId = new Map(this.visible().map((item) => [String(item.id), item]));
    for (const slot of Array.from(this.host.querySelectorAll<HTMLElement>('.liquid-toast-slot'))) {
      const item = byId.get(slot.dataset['toastId'] ?? '');
      const parts = this.parts(slot);
      const state = this.motion.get(slot);
      if (!item || !parts || state?.kind === 'leave') continue;

      const seen = this.seen.get(slot);
      if (seen && seen.record !== item) {
        this.resize(view, parts, item, seen, state);
      } else if (state?.kind === 'enter') {
        this.seen.set(slot, { record: item, slot: state.slot ?? 0, card: state.card ?? 0 });
      } else if (!state) {
        this.seen.set(slot, this.rest(view, parts, item));
      }
    }
  }

  /**
   * Content changed under the same id: the box follows its new size from wherever
   * it was. The twin's `update`.
   */
  private resize(
    view: Window,
    { slot, card, body }: Parts,
    item: Toast,
    seen: Seen,
    previous: Motion | undefined,
  ): void {
    const moving = previous !== undefined;
    const live = moving ? this.live(view, { slot, card, body }) : null;

    // Its own animations only: a press on the card is not a resize's business.
    for (const motion of slot.getAnimations({ subtree: true })) {
      if (motion.id === MOTION) motion.cancel();
    }
    if (previous?.kind === 'enter') previous.complete?.();
    this.thaw(body);

    if (prefersReducedMotion(view)) {
      this.motion.delete(slot);
      this.seen.set(slot, this.rest(view, { slot, card, body }, item));
      return;
    }

    const state: Motion = { kind: 'resize' };
    this.motion.set(slot, state);

    const cardStyle = view.getComputedStyle(card);
    const to = {
      slot: parseFloat(view.getComputedStyle(slot).height),
      card: parseFloat(cardStyle.height),
    };
    const toMargin = view.getComputedStyle(slot).marginBottom;
    const rest = {
      width: cardStyle.width,
      translate: '0 0',
      opacity: '1',
      borderRadius: cardStyle.borderRadius,
    };
    // `scale` is the press's; a resize never writes it.
    const liveCard = live ? (({ scale: _scale, ...keep }) => keep)(live.card) : null;

    const duration = cssTime(view, slot, '--liquid-toast-resize-duration', DEFAULT_RESIZE_DURATION);
    const motions = [
      slot.animate(
        [
          live ? live.slot : { height: `${seen.slot}px`, marginBottom: toMargin },
          { height: `${to.slot}px`, marginBottom: toMargin },
        ],
        { id: MOTION, duration, easing: RESIZE },
      ),
      card.animate(
        [liveCard ?? { ...rest, height: `${seen.card}px` }, { ...rest, height: `${to.card}px` }],
        { id: MOTION, duration, easing: RESIZE },
      ),
      body.animate(
        [
          live ? live.body : { opacity: 0, filter: 'blur(8px)', scale: '0.96' },
          { opacity: 1, filter: 'blur(0px)', scale: '1' },
        ],
        // No lag here, unlike the arrival: the old content is already gone, so
        // any wait before the new one is a frame of empty card.
        { id: MOTION, duration: duration - CONTENT_LAG, easing: 'ease-out' },
      ),
    ];

    this.seen.set(slot, { record: item, slot: to.slot, card: to.card });
    this.whenDone(motions, () => {
      if (this.motion.get(slot) === state) this.motion.delete(slot);
      this.syncOverflow();
    });
  }

  /**
   * Marks an expanded stack that is taller than its room, so only that one
   * scrolls. Checked after every render, and again whenever a toast finishes
   * folding in, resizing or folding away: mid-fold its height is not yet its own,
   * so a check taken then misses the overflow or keeps one that is gone.
   *
   * The rows are measured rather than read off `scrollHeight`, which calls a
   * stack that grows upward short however tall it is: it is `column-reverse`, so
   * it spills past its top edge, and overflow above a box is never scrollable
   * overflow. That stack would run off the screen and never scroll.
   */
  private syncOverflow(): void {
    const view = this.document.defaultView;
    for (const list of Array.from(this.host.querySelectorAll<HTMLElement>('.liquid-toast-list'))) {
      const rows = Array.from(list.children) as HTMLElement[];
      const gap = parseFloat(view?.getComputedStyle(list).getPropertyValue('--_gap') ?? '') || 0;
      const content =
        rows.reduce((total, row) => total + row.offsetHeight, 0) + gap * Math.max(0, rows.length - 1);
      const overflowing = list.classList.contains('is-expanded') && content > list.clientHeight + 1;
      list.classList.toggle('is-overflowing', overflowing);
    }
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  private rest(view: Window, { slot, card }: Parts, record: Toast): Seen {
    return {
      record,
      slot: parseFloat(view.getComputedStyle(slot).height),
      card: parseFloat(view.getComputedStyle(card).height),
    };
  }

  /** What is on screen right now, as keyframes to carry on from. */
  private live(view: Window, { slot, card, body }: Parts) {
    const slotStyle = view.getComputedStyle(slot);
    const cardStyle = view.getComputedStyle(card);
    const bodyStyle = view.getComputedStyle(body);
    return {
      slot: { height: slotStyle.height, marginBottom: slotStyle.marginBottom },
      card: {
        width: cardStyle.width,
        height: cardStyle.height,
        translate: cardStyle.translate === 'none' ? '0 0' : cardStyle.translate,
        scale: cardStyle.scale === 'none' ? '1' : cardStyle.scale,
        opacity: cardStyle.opacity,
        borderRadius: cardStyle.borderRadius,
      },
      body: {
        opacity: bodyStyle.opacity,
        filter: bodyStyle.filter === 'none' ? 'blur(0px)' : bodyStyle.filter,
        scale: bodyStyle.scale === 'none' ? '1' : bodyStyle.scale,
      },
    };
  }

  /** `finished` rejects when an animation is cancelled; either way it is over. */
  private whenDone(motions: Animation[], done: () => void): void {
    Promise.all(motions.map((motion) => motion.finished)).then(done, done);
  }

  private parts(target: Element): Parts | null {
    const slot = target as HTMLElement;
    const card = slot.firstElementChild as HTMLElement | null;
    const body = card?.firstElementChild as HTMLElement | null;
    if (!card || !body || typeof slot.animate !== 'function') return null;
    return { slot, card, body };
  }

  private freeze(body: HTMLElement): void {
    if (body.style.width) return;
    // The computed size, not `offsetWidth`: that rounds, and the thaw would step
    // by the fraction it dropped.
    const { width, height } = this.document.defaultView!.getComputedStyle(body);
    body.style.width = width;
    body.style.height = height;
  }

  private thaw(body: HTMLElement): void {
    body.style.width = '';
    body.style.height = '';
  }
}
