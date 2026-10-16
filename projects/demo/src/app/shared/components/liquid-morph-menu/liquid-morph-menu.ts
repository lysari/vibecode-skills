import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  type Box,
  animatedBox,
  cssLength,
  cssTime,
  inflate,
  offsetBox,
  pourKeyframes,
  prefersReducedMotion,
} from '@app/shared/utils/liquid-pour';
import { LiquidMorphItem } from './liquid-morph-item.directive';

/** Fallbacks for the `--liquid-morph-*` tunables the component has to read back. */
const DEFAULT_DURATION = 340;
const DEFAULT_LEAVE_DURATION = 220;
const DEFAULT_PULL = 10;

/**
 * A row (or column) of items with one highlight that morphs between them.
 *
 * ```html
 * <x-liquid-morph-menu pill>
 *   <button type="button" liquidMorphItem>…</button>
 *   <button type="button" liquidMorphItem>… <span class="liquid-morph-count">3</span></button>
 * </x-liquid-morph-menu>
 * ```
 *
 * The point of it is the enter and the leave. A highlight that is simply shown
 * and hidden blinks in and out under a pointer crossing the row; here it grows
 * in on the first item the pointer meets, pours between items — reaching ahead,
 * surging across, settling — and shrinks away from wherever it stands when the
 * pointer leaves, including mid-pour: the move is frozen where the eye last saw
 * it rather than snapped to its destination.
 *
 * Items are the consumer's own elements, so they keep their own semantics; the
 * highlight is decorative and the component adds no roles of its own. The focus
 * moves it too, so it tracks a keyboard through the row.
 *
 * Items that come and go — behind an `@if`, or in an `@for` over a changing list
 * — fold the row open and shut rather than appearing and vanishing in it; see
 * {@link LiquidMorphItem}. The highlight rides that reflow instead of jumping.
 *
 * `disabledHighlight` keeps the highlight away from the whole menu; an item's
 * own `liquidMorphDisabled` keeps it off that one item. `disabledHover` stops it
 * following the pointer, so it stays on the pinned item — a selection marker
 * that pours when the pin moves.
 *
 * An item can pin the highlight while something it owns is open — see
 * {@link LiquidMorphItem}'s `liquidMorphActive`. The pointer still wins, and the
 * highlight pours back to the pinned item when the pointer leaves.
 *
 * `pill` draws the header's icon bar: a dark glass pill of 24px icon items, with
 * `.liquid-morph-count` for a count bubble. Without it the menu draws only the
 * highlight and the page styles the items.
 *
 * Styles live in `--liquid-morph-*` custom properties, settable on the element or
 * any ancestor: `color`, `radius`, `shadow`, `pad-x` and `pad-y` — how far the
 * highlight spreads beyond the item's own box — `duration` (of a move),
 * `enter-duration`, `leave-duration`, `idle-scale` (how small it shrinks to when
 * it goes), `pull` — how far, in px, it reaches toward the next item before it
 * sets off — and `item-duration`, how long an item takes to fold in or out. A
 * pill adds `pill-background`, `pill-color` and `icon-size`.
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  exportAs: 'liquidMorphMenu',
  host: {
    class: 'liquid-morph-menu',
    '[class.is-active]': '!!activeItem()',
    '[class.is-vertical]': "orientation() === 'vertical'",
    '[class.is-pill]': 'pill()',
    '(mouseleave)': 'onPointerLeave()',
    '(focusout)': 'onFocusOut($event)',
  },
  selector: 'x-liquid-morph-menu',
  styleUrl: './liquid-morph-menu.scss',
  templateUrl: './liquid-morph-menu.html',
})
export class LiquidMorphMenu {
  /** Which way the items run — the axis the highlight pours along. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Draws the menu as the header's dark glass pill of icon items. */
  readonly pill = input(false, { transform: booleanAttribute });
  /** Keeps the highlight away entirely: no hover, no pin. */
  readonly disabledHighlight = input(false, { transform: booleanAttribute });
  /**
   * Stops the highlight following the pointer: it stays on the pinned item and
   * only the focus moves it. For a menu whose highlight marks a selection.
   */
  readonly disabledHover = input(false, { transform: booleanAttribute });

  /** Every item in the menu, in DOM order. */
  readonly items = contentChildren(LiquidMorphItem, { descendants: true });

  private readonly hovered = signal<LiquidMorphItem | null>(null);

  /** The item holding the highlight while the pointer is elsewhere, if any. */
  readonly pinnedItem = computed(
    () => this.items().find((item) => item.active() && !item.disabled()) ?? null,
  );

  /** Where the highlight is: under the pointer, or else on the pinned item. */
  readonly activeItem = computed(() => {
    if (this.disabledHighlight()) return null;
    const hovered = this.hovered();
    // Dropped as soon as it leaves the query — an item removed under the pointer
    // would otherwise hold the highlight over a gap. A disabled item lets it go
    // the same way, rather than leaving it on the item the pointer just left.
    const live = hovered && !hovered.disabled() && this.items().includes(hovered);
    return (live ? hovered : null) ?? this.pinnedItem();
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly indicator = viewChild.required<ElementRef<HTMLElement>>('indicator');

  /**
   * The item the highlight was last put on and the box it took there — where the
   * next move starts. Held through the leave as well, so a pointer that comes
   * straight back pours on from where the highlight stands instead of popping in.
   */
  private placed: { item: LiquidMorphItem; box: Box } | null = null;
  /**
   * Whether the menu has rendered once. Items read it as they are built — an item
   * that was there from the start is not arriving, it is just there, and a row
   * that folds itself open on every page load is noise.
   */
  settled = false;
  private motion: Animation | null = null;
  private restTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      this.settled = true;
    });

    afterRenderEffect(() => {
      const item = this.activeItem();
      // Tracked so a change of axis re-pours along the new one.
      this.orientation();
      if (item) this.place(item);
      else this.retire();
    });

    afterRenderEffect((onCleanup) => {
      const items = this.items();
      const Observer = this.document.defaultView?.ResizeObserver;
      if (!Observer) return;

      // An item that changes size under the highlight — a count turning up, a web
      // font landing — moves out from under it.
      const observer = new Observer(() => {
        const item = untracked(this.activeItem);
        if (item) this.place(item);
      });
      observer.observe(this.host);
      for (const item of items) observer.observe(item.element);
      onCleanup(() => observer.disconnect());
    });

    inject(DestroyRef).onDestroy(() => {
      this.clearRestTimer();
      this.motion?.cancel();
    });
  }

  /** Moves the highlight onto `item`. The pointer and the focus both do this. */
  activate(item: LiquidMorphItem): void {
    if (this.disabledHighlight()) return;
    this.hovered.set(item);
  }

  /**
   * Hands the highlight back: to the pinned item if there is one, otherwise away
   * altogether. The pointer leaving the menu does this.
   */
  release(): void {
    this.hovered.set(null);
  }

  /** The pointer arriving on `item` — a no-op while the highlight does not follow it. */
  onPointerEnter(item: LiquidMorphItem): void {
    if (this.disabledHover()) return;
    this.activate(item);
  }

  /**
   * The pointer leaving the menu. Ignored while the highlight does not follow it,
   * so a pointer passing through does not take away a highlight the focus placed.
   */
  protected onPointerLeave(): void {
    if (this.disabledHover()) return;
    this.release();
  }

  /** Only a focus that lands outside the menu releases it — moving between items does not. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.release();
  }

  /**
   * Puts the highlight on `item`'s box — layout offsets, so a popup scaling open
   * around the menu does not skew it — and pours it over from wherever it stands.
   *
   * Only a change of item pours. An item that changes size under the highlight —
   * a count turning up, a neighbour folding the row open — takes it along
   * instead: a pour restarted on every frame of that would only stutter.
   */
  private place(item: LiquidMorphItem): void {
    const previous = this.placed;
    // Coming back from a leave counts as a move: the highlight may have been
    // frozen mid-pour, so it has somewhere to travel from even on the same item.
    const moved = !!previous && (previous.item !== item || this.restTimer !== null);
    this.clearRestTimer();

    const view = this.document.defaultView;
    const pad = {
      x: cssLength(view, this.host, '--liquid-morph-pad-x', 0),
      y: cssLength(view, this.host, '--liquid-morph-pad-y', 0),
    };
    const to = inflate(offsetBox(item.element), pad.x, pad.y);
    const from = moved ? this.currentBox(previous!.box) : null;
    this.placed = { item, box: to };
    this.writeBox(to);

    // No `from` on the first arrival: the highlight grows in on the spot, which
    // is the CSS transition's job, not the pour's.
    if (from) this.pour(from, to);
  }

  /**
   * Lets the highlight go. Whatever it was doing is frozen into the resting box
   * first, so it shrinks away from where the eye last saw it rather than jumping
   * to the end of a move nobody is watching any more.
   */
  private retire(): void {
    if (!this.placed) return;

    const frozen = this.currentBox(this.placed.box);
    this.motion?.cancel();
    this.motion = null;
    this.writeBox(frozen);
    this.placed = { item: this.placed.item, box: frozen };

    // Once the leave has played out the highlight is gone, and the next arrival
    // is an arrival from nothing again.
    this.clearRestTimer();
    this.restTimer = setTimeout(
      () => {
        this.placed = null;
        this.restTimer = null;
      },
      cssTime(
        this.document.defaultView,
        this.host,
        '--liquid-morph-leave-duration',
        DEFAULT_LEAVE_DURATION,
      ),
    );
  }

  /** The liquid move, played on top of the custom properties, which hold the resting box. */
  private pour(from: Box, to: Box): void {
    this.motion?.cancel();
    this.motion = null;

    const indicator = this.indicator().nativeElement;
    const view = this.document.defaultView;
    if (!view || typeof indicator.animate !== 'function') return;
    if (prefersReducedMotion(view)) return;

    const keyframes = pourKeyframes(from, to, {
      axis: this.orientation() === 'vertical' ? 'y' : 'x',
      pull: cssLength(view, this.host, '--liquid-morph-pull', DEFAULT_PULL),
    });
    if (!keyframes) return;

    this.motion = indicator.animate(keyframes, {
      duration: cssTime(view, this.host, '--liquid-morph-duration', DEFAULT_DURATION),
    });
  }

  /** Where the highlight is right now: mid-pour, wherever the move has it. */
  private currentBox(resting: Box): Box {
    if (this.motion?.playState !== 'running') return resting;
    return animatedBox(this.indicator().nativeElement, resting, this.document.defaultView);
  }

  private writeBox(box: Box): void {
    const style = this.host.style;
    style.setProperty('--liquid-morph-x', `${box.x}px`);
    style.setProperty('--liquid-morph-y', `${box.y}px`);
    style.setProperty('--liquid-morph-width', `${box.width}px`);
    style.setProperty('--liquid-morph-height', `${box.height}px`);
  }

  private clearRestTimer(): void {
    if (this.restTimer === null) return;
    clearTimeout(this.restTimer);
    this.restTimer = null;
  }
}
