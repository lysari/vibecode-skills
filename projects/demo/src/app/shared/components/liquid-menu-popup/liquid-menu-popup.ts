import { FocusKeyManager } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { LiquidMenuContent } from './liquid-menu-content.directive';
import { LiquidMenuFooter } from './liquid-menu-footer.directive';
import { LiquidMenuHeaderIcon } from './liquid-menu-header-icon.directive';
import { LiquidMenuHeader, LiquidMenuHeaderContext } from './liquid-menu-header.directive';
import { LiquidMenuItem } from './liquid-menu-item.directive';
import { cssTime, prefersReducedMotion } from '../../utils/liquid-pour';

/** Space between the trigger and the panel, and between the panel and the viewport edge. */
const GAP = 8;

/** Fallback for the close: `animationend` is the real signal, this is the belt. */
const CLOSE_FALLBACK = 500;

/** The slide archetype's resize, for content that changes size once the panel is up. */
const RESIZE_DURATION = 280;
const RESIZE_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';

/**
 * - `menu`: a list of `liquidMenuItem`s — arrow keys move between them, Tab closes.
 * - `dialog`: anything else (text, images, forms) — Tab moves through the content.
 */
export type LiquidMenuRole = 'menu' | 'dialog';

/** The templates that fill the popup's frame rather than its body. */
export type LiquidMenuSlot = LiquidMenuHeader | LiquidMenuHeaderIcon | LiquidMenuFooter;

export type LiquidMenuCloseReason =
  | 'backdrop'
  | 'outside'
  | 'escape'
  | 'tab'
  | 'item'
  | 'focusout'
  | 'trigger'
  | 'program';

/** The panel's resting layout, read once per open before the grow animation drives its box. */
interface Size {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
}

/**
 * `measuring` is the frame the panel spends laid out but invisible: the grow
 * animation starts from the trigger's box, so the panel's own size has to be
 * read before it is in motion. `closing` keeps it mounted while it shrinks back.
 */
type Phase = 'closed' | 'measuring' | 'shown' | 'closing';

/** Per-instance, so several menus on one page can each label their own panel. */
let popupUid = 0;

@Component({
  exportAs: 'liquidMenu',
  host: {
    // `title` and `role` are inputs, but a static attribute also lands on the host
    // element: a tooltip over the whole panel, and a second role wrapping it.
    '[attr.role]': 'null',
    '[attr.title]': 'null',
  },
  imports: [NgTemplateOutlet],
  selector: 'x-liquid-menu-popup',
  styleUrl: './liquid-menu-popup.scss',
  templateUrl: './liquid-menu-popup.html',
})
export class LiquidMenuPopup<TData = any> {
  readonly title = input<string | null>(null);
  readonly role = input<LiquidMenuRole>('menu');
  /**
   * Whether a `menu` lands on its first item when it opens. `false` focuses the
   * panel instead — no focus ring on open, and the arrow keys still pick up from
   * the top. A `dialog` always focuses the panel.
   */
  readonly focusFirst = input(true, { transform: booleanAttribute });
  /**
   * The invisible overlay that takes a click outside the panel. Off, the page
   * behind stays live: hover, scroll and clicks all reach it while the panel is up.
   */
  readonly overlay = input(true, { transform: booleanAttribute });
  /** Closes on a click outside the panel — on the overlay, or anywhere else when there is none. */
  readonly closeOnOutsideClick = input(true, { transform: booleanAttribute });

  readonly opened = output<void>();
  readonly closed = output<LiquidMenuCloseReason>();

  private readonly uid = ++popupUid;
  /** What a trigger points `aria-controls` at while the panel is up. */
  readonly panelId = `liquid-menu-panel-${this.uid}`;
  /** Ties the rendered heading to the panel for screen readers. */
  protected readonly titleId = `liquid-menu-title-${this.uid}`;

  private readonly document = inject(DOCUMENT);
  private readonly overlayRef = viewChild<ElementRef<HTMLElement>>('overlay');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  private readonly items = contentChildren(LiquidMenuItem, { descendants: true });
  /** A `<ng-template liquidMenuContent>`, rendered only while the panel is up. */
  protected readonly lazyContent = contentChild(LiquidMenuContent);
  /**
   * Header, header icon and footer templates, in the order they turned up. They
   * register themselves (see {@link registerSlot}) rather than being queried, so
   * a component rendered in the popup can bring its own.
   */
  private readonly slots = signal<readonly LiquidMenuSlot[]>([]);
  /** A `<ng-template liquidMenuHeader>`, drawn in place of the `title` heading. */
  protected readonly header = computed(() => this.latestSlot(LiquidMenuHeader));
  /** A `<ng-template liquidMenuHeaderIcon>`, drawn in front of the default `title`. */
  protected readonly headerIcon = computed(() => this.latestSlot(LiquidMenuHeaderIcon));
  /** A `<ng-template liquidMenuFooter>`, drawn under the body. */
  protected readonly footer = computed(() => this.latestSlot(LiquidMenuFooter));
  /** Handed to both the header and the footer template. */
  protected readonly slotContext = computed<LiquidMenuHeaderContext<TData>>(() => ({
    $implicit: this.data(),
    close: () => this.close('program'),
  }));
  private readonly keyManager = new FocusKeyManager(this.items, inject(Injector))
    .withWrap()
    .withTypeAhead()
    .withHomeAndEnd();

  private readonly phase = signal<Phase>('closed');
  private readonly dataState = signal<TData | undefined>(undefined);
  private readonly openedBy = signal<HTMLElement | null>(null);
  /** The popup this one was opened from, by a trigger sitting inside it. */
  private readonly parentMenu = signal<LiquidMenuPopup | null>(null);
  /** A popup opened from inside this one: while it is up, this one waits underneath. */
  private readonly childMenu = signal<LiquidMenuPopup | null>(null);

  /**
   * What the trigger that opened this menu handed over via
   * `liquidMenuTriggerData` — how one panel serves several triggers.
   */
  readonly data = this.dataState.asReadonly();

  /** Measured once per open: mid-animation the panel's own box is in flight. */
  private size: Size | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeAnimation: Animation | null = null;
  /** A press on the trigger, with no overlay over it: its click is about to toggle the panel. */
  private pressingTrigger = false;

  readonly isOpen = computed(() => this.phase() === 'measuring' || this.phase() === 'shown');
  protected readonly isRendered = computed(() => this.phase() !== 'closed');
  protected readonly isShown = computed(() => this.phase() === 'shown');
  protected readonly isClosing = computed(() => this.phase() === 'closing');
  /**
   * Blurred and out of reach while a popup opened from it is up. Clears the moment
   * that one starts closing, so this one comes back into focus as it shrinks away.
   */
  protected readonly isCovered = computed(() => this.childMenu()?.isOpen() ?? false);
  /** The grow animation has played out, so a cover can fade the panel without softening the open. */
  protected readonly isSettled = signal(false);

  constructor() {
    afterRenderEffect(() => {
      if (this.phase() !== 'measuring') return;

      this.measure();
      this.place();
      this.phase.set('shown');
      this.focusOnOpen();
    });

    effect((onCleanup) => {
      if (this.phase() !== 'shown') return;

      const view = this.document.defaultView;
      if (!view) return;

      const onViewportChange = () => this.place();
      const onKeydown = (event: KeyboardEvent) => {
        // Escape belongs to the top of the stack: a covered popup lets the one above take it.
        if (event.key === 'Escape' && !this.isCovered()) this.close('escape');
      };

      view.addEventListener('resize', onViewportChange);
      // Capture: a scroll inside any ancestor moves the trigger too.
      view.addEventListener('scroll', onViewportChange, true);
      view.addEventListener('keydown', onKeydown);

      onCleanup(() => {
        this.resizeAnimation?.cancel();
        this.resizeAnimation = null;
        view.removeEventListener('resize', onViewportChange);
        view.removeEventListener('scroll', onViewportChange, true);
        view.removeEventListener('keydown', onKeydown);
      });
    });

    // With no overlay to catch it, a click outside is watched for on the page itself.
    effect((onCleanup) => {
      if (this.phase() !== 'shown' || this.overlay()) return;

      const onPointerdown = (event: PointerEvent) => this.onPagePointerdown(event);
      // Capture: content that stops propagation would otherwise keep the panel up.
      this.document.addEventListener('pointerdown', onPointerdown, true);
      onCleanup(() => this.document.removeEventListener('pointerdown', onPointerdown, true));
    });

    // A touch outside closes the panel on `pointerdown`, and the same finger often goes
    // on to scroll the page: the shrink has to land where the trigger ends up.
    effect((onCleanup) => {
      if (this.phase() !== 'closing') return;

      const view = this.document.defaultView;
      if (!view) return;

      const follow = () => this.followTrigger();
      view.addEventListener('resize', follow);
      view.addEventListener('scroll', follow, true);
      onCleanup(() => {
        view.removeEventListener('resize', follow);
        view.removeEventListener('scroll', follow, true);
      });
    });

    // Content that arrives after the open — an image loading, a list fetched async —
    // was not there to be measured, so the panel follows it once the grow is done.
    effect((onCleanup) => {
      if (this.phase() !== 'shown' || !this.isSettled()) return;

      const wrapper = this.content()?.nativeElement;
      const view = this.document.defaultView;
      if (!wrapper || !view || typeof view.ResizeObserver !== 'function') return;

      const observer = new view.ResizeObserver(() => this.refit());
      for (const part of wrapper.querySelectorAll(
        ':scope > .liquid-menu-popup-content > :not(.liquid-menu-popup-body), :scope > .liquid-menu-popup-content > .liquid-menu-popup-body > .liquid-menu-popup-body-inner',
      )) {
        observer.observe(part);
      }
      onCleanup(() => observer.disconnect());
    });

    inject(DestroyRef).onDestroy(() => {
      this.clearCloseTimer();
      this.attachTo(null);
      this.keyManager.destroy();
    });
  }

  /** Whether the panel is up for this particular trigger, not just for any. */
  isOpenFor(trigger: HTMLElement): boolean {
    return this.isOpen() && this.openedBy() === trigger;
  }

  /**
   * `parent` is the popup the trigger sits in, if any. That one stays open
   * underneath, covered, until this one closes — a confirm over a menu, say.
   */
  openFor(trigger: HTMLElement, data?: TData, parent?: LiquidMenuPopup | null): void {
    const wasOpen = this.isOpen();

    this.clearCloseTimer();
    this.isSettled.set(false);
    this.attachTo(parent === this ? null : (parent ?? null));
    this.openedBy.set(trigger);
    this.size = null;
    this.dataState.set(data);
    this.phase.set('measuring');

    if (!wasOpen) this.opened.emit();
  }

  toggleFor(trigger: HTMLElement, data?: TData, parent?: LiquidMenuPopup | null): void {
    if (this.isOpenFor(trigger)) {
      this.close('trigger');
      return;
    }
    this.openFor(trigger, data, parent);
  }

  close(reason: LiquidMenuCloseReason = 'program'): void {
    if (this.phase() === 'closed' || this.phase() === 'closing') return;

    // Anything opened from this popup goes first, so the focus unwinds back down the stack.
    this.childMenu()?.close(reason);
    this.phase.set('closing');

    // Hand the focus ring back now: the panel is on its way out either way. Focus
    // that wandered off on its own already landed where the user wanted it, and a
    // press outside is about to put it wherever that press landed.
    const trigger = this.openedBy();
    const focusMovesOn = reason === 'focusout' || reason === 'outside';
    if (!focusMovesOn && trigger?.isConnected) trigger.focus({ preventScroll: true });

    this.closed.emit(reason);
    this.closeTimer = setTimeout(() => this.finishClose(), CLOSE_FALLBACK);
  }

  /**
   * Closes this popup along with every popup under it — for an action that
   * finishes the whole flow, where `close()` would just step back to the menu.
   */
  closeAll(reason: LiquidMenuCloseReason = 'program'): void {
    let root: LiquidMenuPopup = this;
    for (let parent = this.parentMenu(); parent; parent = parent.parentMenu()) root = parent;
    root.close(reason);
  }

  /**
   * Adds a header, header icon or footer template, and returns what takes it away
   * again. The slot directives call this themselves from wherever they sit under
   * the popup — its content, or the view of a component rendered inside it — and
   * the latest of each kind is the one drawn.
   */
  registerSlot(slot: LiquidMenuSlot): () => void {
    // Untracked: a directive registers while its template is being created or torn down.
    untracked(() => this.slots.update((list) => [...list, slot]));
    return () =>
      untracked(() => this.slots.update((list) => list.filter((entry) => entry !== slot)));
  }

  /** Keeps arrow keys moving on from an item that got focus by click or Tab. */
  syncActiveItem(item: LiquidMenuItem): void {
    if (this.keyManager.activeItem !== item) this.keyManager.updateActiveItem(item);
  }

  protected onOverlayClick(): void {
    // A popup opened from this one is still up, or shrinking away: the click was meant for it.
    if (!this.closeOnOutsideClick() || this.childMenu()) return;
    this.close('backdrop');
  }

  private onPagePointerdown(event: PointerEvent): void {
    this.pressingTrigger = false;
    if (this.childMenu()) return;

    const target = event.target;
    if (!(target instanceof Node)) return;
    if (this.panel()?.nativeElement.contains(target)) return;
    // The trigger toggles on its own click. Closing here, or on the focusout this
    // press is about to cause, would only have that click open it again.
    if (this.openedBy()?.contains(target)) {
      this.pressingTrigger = true;
      return;
    }

    if (this.closeOnOutsideClick()) this.close('outside');
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (this.role() !== 'menu') return;

    if (event.key === 'Tab') {
      // Not prevented: the focus goes back to the trigger first, so Tab moves on from there.
      this.close('tab');
      return;
    }
    this.keyManager.onKeydown(event);
  }

  protected onPanelFocusout(event: FocusEvent): void {
    // Focus moving into a popup opened from here is not the user leaving.
    if (this.phase() !== 'shown' || this.childMenu() || this.pressingTrigger) return;

    // No target means the window lost focus or the click hit nothing focusable —
    // the backdrop covers the latter.
    const next = event.relatedTarget;
    if (!(next instanceof Node) || this.panel()?.nativeElement.contains(next)) return;

    this.close('focusout');
  }

  /** The shrink has played out — only now can the panel leave the DOM. */
  protected onPanelAnimationEnd(event: AnimationEvent): void {
    // The content inside animates too, and its event bubbles through here.
    if (event.target !== this.panel()?.nativeElement) return;
    if (this.phase() === 'closing') this.finishClose();
    else if (this.phase() === 'shown' && !this.isSettled()) {
      this.isSettled.set(true);
      // Anything that changed size during the grow was sized into its implicit end.
      this.refit();
    }
  }

  private finishClose(): void {
    this.clearCloseTimer();
    this.pressingTrigger = false;
    this.phase.set('closed');
    this.openedBy.set(null);
    this.size = null;
    this.dataState.set(undefined);
    this.isSettled.set(false);
    this.attachTo(null);
  }

  /** Stacks this popup on `parent`, letting go of whichever popup it sat on before. */
  private attachTo(parent: LiquidMenuPopup | null): void {
    const previous = this.parentMenu();
    if (previous && previous !== parent && previous.childMenu() === this) {
      previous.childMenu.set(null);
    }

    // One popup on top at a time: another one already open from the parent makes way.
    const sibling = parent?.childMenu();
    if (sibling && sibling !== this) sibling.close('program');

    this.parentMenu.set(parent);
    parent?.childMenu.set(this);
  }

  private latestSlot<T extends LiquidMenuSlot>(kind: abstract new (...args: never[]) => T): T | undefined {
    const slots = this.slots();
    for (let index = slots.length - 1; index >= 0; index--) {
      const slot = slots[index];
      if (slot instanceof kind) return slot;
    }
    return undefined;
  }

  private clearCloseTimer(): void {
    if (this.closeTimer === null) return;
    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  /** A menu lands on its first item; anything else on the panel, to be tabbed through. */
  private focusOnOpen(): void {
    const first =
      this.role() === 'menu' && this.focusFirst()
        ? this.items().find((item) => !item.disabled)
        : undefined;

    // `preventScroll`: the panel is still trigger-sized, and focus would scroll its clipped content.
    if (first) {
      this.keyManager.updateActiveItem(first);
      first.focus('program', { preventScroll: true });
      return;
    }

    // Content can name its own landing spot with `autofocus` — a search field, say.
    const panel = this.panel()?.nativeElement;
    const landing = panel?.querySelector<HTMLElement>('[autofocus]') ?? panel;
    landing?.focus({ preventScroll: true });
  }

  /**
   * Lifts the backdrop and the panel into the top layer, backdrop first so the
   * panel lands over it.
   *
   * `position: fixed` is only fixed to the viewport while no ancestor has a
   * `backdrop-filter`, `filter` or `transform` — any of those becomes the
   * containing block instead. The user panel's content well is frosted, so a
   * popup declared inside it was placed from the well's corner rather than the
   * window's (measured: 1427px across a 1360px viewport) and clipped by the
   * page's own scroll container. The top layer answers to neither, while the
   * elements stay where they are in the tree — so custom properties such as
   * `--svc-accent` still inherit into the popup.
   *
   * A popup opened from inside another is promoted after it, which stacks it
   * above; that is the order the `is-covered` z-indexes spell out for browsers
   * without the Popover API, where this does nothing.
   */
  private promote(): void {
    for (const element of [this.overlayRef()?.nativeElement, this.panel()?.nativeElement]) {
      if (!element || typeof element.showPopover !== 'function') continue;
      if (element.matches(':popover-open')) continue;
      element.popover = 'manual';

      // `showPopover()` focuses an `[autofocus]` inside on its own, without
      // `preventScroll`: a pinch-zoomed page pans to the panel still parked
      // trigger-sized at the corner. `focusOnOpen()` lands there anyway.
      const autofocus = [...element.querySelectorAll('[autofocus]')].map(
        (field) => [field, field.getAttribute('autofocus') ?? ''] as const,
      );
      for (const [field] of autofocus) field.removeAttribute('autofocus');
      element.showPopover();
      for (const [field, value] of autofocus) field.setAttribute('autofocus', value);
    }
  }

  private measure(): void {
    const panel = this.panel()?.nativeElement;
    const content = this.content()?.nativeElement;
    if (!panel || !content) return;

    this.promote();

    // A panel reopened for another trigger still sits where it was, and a fixed box
    // near the right edge shrink-wraps narrower than it would at the origin.
    panel.style.left = '0px';
    panel.style.top = '0px';

    const outer = layoutSize(panel);
    const inner = layoutSize(content);
    this.size = {
      width: outer.width,
      height: outer.height,
      contentWidth: inner.width,
      contentHeight: inner.height,
    };
  }

  /**
   * Re-measures the settled panel at its natural size and, when that moved, grows
   * or shrinks to it from wherever it is on screen right now.
   */
  private refit(): void {
    const panel = this.panel()?.nativeElement;
    const view = this.document.defaultView;
    const before = this.size;
    if (!panel || !view || !before || this.phase() !== 'shown') return;

    const live = view.getComputedStyle(panel);
    const from = {
      width: parseFloat(live.width),
      height: parseFloat(live.height),
      left: parseFloat(panel.style.left) || 0,
      top: parseFloat(panel.style.top) || 0,
    };
    // Off while measuring — it drives the very width and height being read.
    const running = this.resizeAnimation;
    const runningTime = running?.currentTime ?? null;
    running?.cancel();
    this.resizeAnimation = null;

    // At its natural size nothing inside overflows, so every scroller is clamped
    // back to its top-left corner; put them back once the cap is on again.
    const scrolled = scrollPositions(panel);
    panel.classList.add('is-measuring');
    this.measure();
    panel.classList.remove('is-measuring');
    this.place();
    for (const { element, top, left } of scrolled) element.scrollTo({ top, left, behavior: 'instant' });

    const after = this.size;
    if (
      !after ||
      (after.width === before.width &&
        after.height === before.height &&
        after.contentWidth === before.contentWidth &&
        after.contentHeight === before.contentHeight)
    ) {
      // Nothing moved: the observer answering the resize itself. Carry on where it was.
      if (running?.effect && runningTime !== null) this.playResize(new Animation(running.effect), runningTime);
      return;
    }
    if (prefersReducedMotion(view)) return;

    const to = view.getComputedStyle(panel);
    const dx = from.left - (parseFloat(panel.style.left) || 0);
    const dy = from.top - (parseFloat(panel.style.top) || 0);
    if (from.width === parseFloat(to.width) && from.height === parseFloat(to.height) && !dx && !dy) {
      return;
    }

    // Only the start, at `offset: 0` — a lone keyframe defaults to the end. The end is
    // the pinned resting size, so a later refit can retarget it.
    const effect = new KeyframeEffect(
      panel,
      [
        {
          offset: 0,
          width: `${from.width}px`,
          height: `${from.height}px`,
          // `margin`, not `translate`, to stay on the same thread as the size (see the keyframes).
          marginLeft: `${dx}px`,
          marginTop: `${dy}px`,
        },
      ],
      {
        duration: cssTime(view, panel, '--menu-resize-duration', RESIZE_DURATION),
        easing: RESIZE_EASING,
      },
    );
    this.playResize(new Animation(effect), 0);
  }

  private playResize(animation: Animation, currentTime: CSSNumberish): void {
    this.resizeAnimation = animation;
    animation.currentTime = currentTime;
    animation.onfinish = () => {
      if (this.resizeAnimation === animation) this.resizeAnimation = null;
    };
    animation.play();
  }

  /**
   * Centres the panel under the trigger. Flips above when only that side fits;
   * when neither does, takes the roomier side and lets the body scroll the rest.
   */
  private place(): void {
    const trigger = this.openedBy();
    const panel = this.panel()?.nativeElement;
    const view = this.document.defaultView;
    const size = this.size;
    if (!trigger || !panel || !view || !size) return;

    const rect = trigger.getBoundingClientRect();

    const left = clamp(
      rect.left + rect.width / 2 - size.width / 2,
      GAP,
      Math.max(GAP, view.innerWidth - size.width - GAP),
    );

    const spaceBelow = view.innerHeight - rect.bottom - GAP * 2;
    const spaceAbove = rect.top - GAP * 2;
    const below =
      size.height <= spaceBelow || (size.height > spaceAbove && spaceBelow >= spaceAbove);
    const height = Math.max(0, Math.min(size.height, below ? spaceBelow : spaceAbove));
    const top = below ? rect.bottom + GAP : rect.top - GAP - height;

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;

    // Pinned sizes — `fit-content` cannot be animated to. The content gives up
    // exactly what the cap took from the panel, and its body scrolls.
    panel.style.setProperty('--menu-width', `${size.width}px`);
    panel.style.setProperty('--menu-height', `${height}px`);
    panel.style.setProperty('--menu-content-width', `${size.contentWidth}px`);
    panel.style.setProperty(
      '--menu-content-height',
      `${Math.max(0, size.contentHeight - (size.height - height))}px`,
    );

    this.setOrigin(panel, rect, left, top);
  }

  /** What the panel grows out of and shrinks back into: the trigger's own box, in the panel's frame. */
  private setOrigin(panel: HTMLElement, rect: DOMRect, left: number, top: number): void {
    panel.style.setProperty('--menu-origin-x', `${rect.left - left}px`);
    panel.style.setProperty('--menu-origin-y', `${rect.top - top}px`);
    panel.style.setProperty('--menu-origin-width', `${rect.width}px`);
    panel.style.setProperty('--menu-origin-height', `${rect.height}px`);
  }

  /** Re-aims the shrink at wherever the trigger is now, leaving the panel where it is. */
  private followTrigger(): void {
    const trigger = this.openedBy();
    const panel = this.panel()?.nativeElement;
    if (!trigger || !panel) return;

    const left = parseFloat(panel.style.left) || 0;
    const top = parseFloat(panel.style.top) || 0;
    this.setOrigin(panel, trigger.getBoundingClientRect(), left, top);
  }
}

/**
 * An element's border-box size, rounded *up* to a whole pixel.
 *
 * `offsetWidth` and `offsetHeight` round to the nearest pixel, and what is
 * measured here is then pinned back onto the same elements. Khmer body text at
 * `13px / 1.6` lays out at fractions of a pixel — a three-line message measured
 * 138.39px and was pinned at 138 — which leaves the body 0.39px short of its own
 * content. With overlay scrollbars that is invisible; with classic ones, as on
 * Windows, the body grows a vertical scrollbar, the scrollbar takes 15px of
 * width, and that overflows it sideways into a horizontal one as well.
 *
 * Read off the computed style rather than `getBoundingClientRect()` so a popup
 * scaling around this one cannot skew it: used values ignore transforms. Both
 * elements are `border-box`, so `width` and `height` are the whole box. Rounding
 * up never re-wraps text — a line only breaks when there is *less* room.
 */
function layoutSize(element: HTMLElement): { width: number; height: number } {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  const width = Number.parseFloat(style?.width ?? '');
  const height = Number.parseFloat(style?.height ?? '');
  return {
    width: Number.isFinite(width) ? Math.ceil(width) : element.offsetWidth,
    height: Number.isFinite(height) ? Math.ceil(height) : element.offsetHeight,
  };
}

/** Every element under `root` scrolled away from its top-left corner, with where it sits. */
function scrollPositions(root: HTMLElement): { element: Element; top: number; left: number }[] {
  const positions = [];
  for (const element of root.querySelectorAll('*')) {
    if (element.scrollTop || element.scrollLeft) {
      positions.push({ element, top: element.scrollTop, left: element.scrollLeft });
    }
  }
  return positions;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
