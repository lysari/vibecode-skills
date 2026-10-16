import {
  type AnimationCallbackEvent,
  DOCUMENT,
  Directive,
  ElementRef,
  Signal,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { cssTime, prefersReducedMotion } from '@app/shared/utils/liquid-pour';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { pressedContent } from '@app/shared/utils/liquid-press';
import { LiquidMorphMenu } from './liquid-morph-menu';

/** Fallback for `--liquid-morph-item-duration` (ms): how long an item takes to fold in or out. */
const DEFAULT_FOLD_DURATION = 320;

/**
 * One clock for the box and for what it holds — they open and close together, so
 * an item gathers itself up as the row closes instead of emptying first and then
 * closing an empty gap. Both animations run on whichever of these applies.
 */
const FOLD_OPEN = 'cubic-bezier(0.25, 0, 0.25, 1)';
const FOLD_SHUT = 'cubic-bezier(0.4, 0, 0.3, 1)';

/**
 * The content's shape along the fold, from folded shut to fully open. It is
 * always a little smaller than the room the box has, which is what keeps the
 * closing box from ever cutting across it, and it swells past its own size near
 * the open end — the bulge a drop makes as it gathers, and again as it lets go.
 */
const BEAD_SCALE = 0.12;
const SEEN_SCALE = 0.2;
const SEEN_OFFSET = 0.15;
const SWELL_SCALE = 1.14;
const SWELL_OFFSET = 0.84;

/** The properties a fold collapses, per axis: the item's own size and the space it keeps. */
const FOLD_AXIS = {
  horizontal: ['width', 'paddingLeft', 'paddingRight', 'marginLeft', 'marginRight'],
  vertical: ['height', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom'],
} as const;

/**
 * One item of an `<x-liquid-morph-menu>` — the highlight morphs onto it when the
 * pointer or the focus arrives:
 *
 * ```html
 * <x-liquid-morph-menu>
 *   <button type="button" liquidMorphItem>…</button>
 * </x-liquid-morph-menu>
 * ```
 *
 * An item that comes and goes — one behind an `@if`, or an `@for` over a list
 * that changes — folds the row open on its way in and folds shut on its way out,
 * instead of appearing and vanishing while everything beside it jumps. Angular's
 * `animate.enter` and `animate.leave` drive it, so a leaving item stays in the
 * DOM until it has finished folding.
 *
 * `liquidMorphActive` pins the highlight to the item while something it owns is
 * open, so the highlight stays put instead of draining away when the pointer
 * moves off to use it:
 *
 * ```html
 * <button liquidMorphItem [liquidMorphActive]="menu.isOpen()" [liquidMenuTriggerFor]="menu">…</button>
 * ```
 *
 * Pressing an item squashes what it holds and bounces it back on release, so a
 * tap has something to answer it whatever the click itself goes on to do.
 *
 * `liquidMorphDisabled` keeps the highlight off the item — a pointer crossing it
 * lets the highlight go rather than pouring it under something that will not
 * answer — and marks it `aria-disabled`, which is also what stops the press.
 *
 * The item keeps whatever semantics it already had: the directive adds no role,
 * and marks the host `.is-active` for the page to style off.
 */
@Directive({
  exportAs: 'liquidMorphItem',
  host: {
    class: 'liquid-morph-item',
    '[class.is-active]': 'isActive()',
    '[class.is-pinned]': 'active()',
    '[class.is-disabled]': 'disabled()',
    '[attr.aria-disabled]': 'disabled() || null',
    '(animate.enter)': 'onEnter($event)',
    '(animate.leave)': 'onLeave($event)',
    '(mouseenter)': 'menu.onPointerEnter(this)',
    '(focusin)': 'menu.activate(this)',
  },
  // The press itself, shared with everything else liquid that answers a tap.
  hostDirectives: [LiquidPressable],
  selector: '[liquidMorphItem]',
})
export class LiquidMorphItem {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly menu = inject(LiquidMorphMenu);
  private readonly document = inject(DOCUMENT);

  /**
   * Holds the highlight here even once the pointer has left — for an item whose
   * menu, popup or panel is open. The pointer still wins while it is over
   * another item; the highlight returns here when it leaves.
   */
  readonly active = input(false, { alias: 'liquidMorphActive', transform: booleanAttribute });

  /** Keeps the highlight off this item: no hover, no pin, no press. */
  readonly disabled = input(false, { alias: 'liquidMorphDisabled', transform: booleanAttribute });

  /** Whether the highlight is on this item right now, hovered or pinned. */
  readonly isActive: Signal<boolean> = computed(() => this.menu.activeItem() === this);

  /**
   * Whether this item turned up after the menu had rendered. Read here, as the
   * item is built, rather than when it folds: by then the menu has settled
   * either way. An item that was there from the start does not fold itself open.
   */
  private readonly arriving = this.menu.settled;

  constructor() {
    // The menu keeps publishing its own name for the squash duration.
    inject(LiquidPressable).useDuration('--liquid-morph-press-duration');
  }

  /** Angular's `animate.enter`: the item folds the row open as it arrives. */
  onEnter(event: AnimationCallbackEvent): void {
    if (!this.arriving) {
      event.animationComplete();
      return;
    }
    this.fold(event, false);
  }

  /** Angular's `animate.leave`: the item holds its place in the DOM until it has folded shut. */
  onLeave(event: AnimationCallbackEvent): void {
    this.fold(event, true);
  }

  /**
   * Folds the item open or shut along the menu's axis. Its size, padding and
   * margin all go together, so the row closes the gap as it goes and everything
   * beside it — the highlight included — slides instead of jumping.
   *
   * The box and what it holds are two animations on one clock: the box folds and
   * the content pops with it — see {@link pop} — so the item contracts as a whole
   * rather than emptying out and then closing on nothing. The box is measured
   * here rather than written into CSS, since the item is the consumer's own
   * element and only it knows how big it is.
   */
  private fold(event: AnimationCallbackEvent, leaving: boolean): void {
    const element = this.element;
    const view = this.document.defaultView;
    if (!view || typeof element.animate !== 'function' || prefersReducedMotion(view)) {
      event.animationComplete();
      return;
    }

    const vertical = this.menu.orientation() === 'vertical';
    const [size, ...spacing] = FOLD_AXIS[vertical ? 'vertical' : 'horizontal'];
    const style = view.getComputedStyle(element);

    const open: Keyframe = {};
    const shut: Keyframe = {};
    // The border box, so the padding folds away with the rest of it; the
    // `boxSizing` below is what makes the two agree.
    open[size] = `${vertical ? element.offsetHeight : element.offsetWidth}px`;
    shut[size] = '0px';
    for (const property of spacing) {
      open[property] = style[property];
      shut[property] = '0px';
    }

    // Inline, not in a class: they have to beat whatever the page gives the item.
    const held = element.style.cssText;
    element.style.boxSizing = 'border-box';
    element.style.overflow = 'hidden';
    element.style.setProperty(vertical ? 'min-height' : 'min-width', '0');
    // The class holds the rest: what the item contains has to stay centred and
    // keep its own size while the box closes, or the fold squashes it.
    element.classList.add('is-folding');
    if (leaving) element.classList.add('is-leaving');

    const duration = cssTime(view, element, '--liquid-morph-item-duration', DEFAULT_FOLD_DURATION);
    const easing = leaving ? FOLD_SHUT : FOLD_OPEN;
    const motions = [
      element.animate(leaving ? [open, shut] : [shut, open], { duration, easing }),
      ...this.pop(leaving, duration, easing),
    ];

    const done = () => {
      // A leaving item is on its way out of the DOM; an arriving one has to be
      // handed back exactly the box the page gave it.
      if (leaving) return event.animationComplete();
      element.classList.remove('is-folding');
      element.style.cssText = held;
      event.animationComplete();
    };
    // `finished` rejects when an animation is cancelled — by a second fold, or by
    // the element going away mid-fold. Either way the fold is over.
    Promise.all(motions.map((motion) => motion.finished)).then(done, done);
  }

  /**
   * The pop: what the item holds beads up out of nothing as the box opens, and
   * gathers itself back into a bead as the box closes — a drop forming and a drop
   * letting go, not a picture faded in and out.
   *
   * It goes the whole length of the fold, in step with the box, so the two read
   * as one thing growing or contracting rather than one waiting on the other. It
   * runs on the item's own children, so the box can keep folding around them; an
   * item holding nothing but text has no child to move, so it pops itself.
   */
  private pop(leaving: boolean, duration: number, easing: string): Animation[] {
    // Written open-ward, and reversed for the way out: the two directions are
    // the same shape, which is why an item looks the same coming and going.
    const opening: Keyframe[] = [
      { offset: 0, scale: `${BEAD_SCALE}`, opacity: 0 },
      { offset: SEEN_OFFSET, scale: `${SEEN_SCALE}`, opacity: 0 },
      { offset: SWELL_OFFSET, scale: `${SWELL_SCALE}`, opacity: 1 },
      { offset: 1, scale: '1', opacity: 1 },
    ];
    const keyframes = leaving
      ? opening.map((frame) => ({ ...frame, offset: 1 - (frame.offset as number) })).reverse()
      : opening;

    return this.content().map((child) => child.animate(keyframes, { duration, easing }));
  }

  /**
   * What moves when the item does: its own children, so the box is left free to
   * fold around them — the same content the press squashes.
   */
  private content(): Element[] {
    return pressedContent(this.element);
  }
}
