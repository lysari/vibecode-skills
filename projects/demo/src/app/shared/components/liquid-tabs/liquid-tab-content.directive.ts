import {
  DOCUMENT,
  Directive,
  EmbeddedViewRef,
  Injector,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { cssLength } from '@app/shared/utils/liquid-pour';
import { LiquidTabPanel, type LiquidTabPanelMode } from './liquid-tab-panel.directive';
import type { LiquidSwitcher } from './liquid-switcher';

export interface LiquidTabContentContext<T = any> {
  /** The value of the tab the content belongs to. */
  $implicit: T;
  /** The bar that tab sits in. */
  tabs: LiquidSwitcher<T>;
}

/**
 * How far content blurs as it crosses over, in px. Small on purpose: both halves
 * of the cross are on screen together, so whatever blur is set is paid twice, and
 * a panel the size of a section goes to mush long before the number looks bold.
 */
const BLUR = 3;
/**
 * How far content drifts along the bar as it crosses over, in px: the old content
 * away from the tab picked, the new content in from that tab's side. Small for
 * the same reason — the further apart the two are mid-cross, the more the old one
 * reads as a ghost stuck beside the new rather than as the same content leaving.
 */
const DRIFT = 6;
/**
 * One curve and one duration, both ways, so the old content's opacity is the new
 * one's subtracted from 1 at every frame and the two always cover the panel
 * between them. Fading the old out over a shorter window than the new fades in
 * lets the page through in the middle, and across a whole section that dip reads
 * as a flash rather than as a change of content.
 */
const SWAP: KeyframeAnimationOptions = { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };
/**
 * How long, in ms, a fade gets to finish once a further switch has started on top
 * of it, and the most it may be sped up to get there. A bar can be clicked far
 * quicker than a cross takes, and left alone every click would add another
 * half-faded copy of the content to the pile — four of them stacked over each
 * other is not a crossfade, it is a smear. Giving each one a tail rather than
 * cutting it means what is on screen is at most the content leaving, the content
 * arriving, and one on its way out fast.
 */
const TAIL = 60;
const MAX_RUSH = 12;
/**
 * How many contents a container may have on their way out at once. A tail still
 * takes time, and a bar clicked faster than the tail is long would stack them up
 * anyway, so past this the oldest is sent straight to its last frame — which is
 * the one where it is not there, the least visible place to cut a fade short.
 */
const MAX_LEAVING = 2;
const RESIZE: KeyframeAnimationOptions = { duration: 280, easing: 'cubic-bezier(0.2, 0, 0, 1)' };

/**
 * How long a slide takes, and its curve — longer than the crossfade, and far
 * more front-loaded. A fade is over as soon as the new content is legible, but
 * the eye follows a slide the whole way across, so it has to leave at once and
 * then settle rather than still be travelling when it arrives.
 */
const SLIDE: KeyframeAnimationOptions = { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' };

/**
 * How far apart neighbouring slides sit, as a share of a slide's own size, plus
 * the gap between them. A slide's own size, not the panel's, because the slides
 * are narrower than the panel — that difference is what leaves the one before
 * and the one after showing at the edges.
 */
const STRIDE = 100;

/**
 * Fallbacks for the slider's custom properties: `--liquid-slider-gap` (px, and
 * px because a custom property is not resolved to one before it is read back),
 * `--liquid-slider-scale` and `--liquid-slider-dim` — how far the neighbours are
 * played down, so the selected slide reads as the one being looked at rather
 * than as the middle of three equals. The width the slides share is
 * `--liquid-slider-width`, which only the stylesheet needs.
 */
const GAP = 16;
const SCALE = 0.94;
const DIM = 0.5;

/** Put on every slide the slider lays out, and on the one of them in the flow. */
const SLIDE_CLASS = 'liquid-tab-slide';
const CURRENT_CLASS = 'is-current';

/**
 * How many steps either side of the selected tab a slider keeps built: one, so
 * the panel holds the content before, the content selected, and the content
 * after. Slides therefore have to be wide enough that a third of them covers
 * the panel's edge — much narrower and the outer edges would show empty.
 */
const REACH = 1;

/** Where a slide rests: along the row, and how far it is played down there. */
interface SlideStyle {
  translate: string;
  scale: string;
  opacity: string;
}

interface HeightMotion {
  from: number;
  pending: boolean;
  animation: Animation | null;
  /** The container's own inline `overflow`, put back once it stops moving. */
  overflow: string;
}

/** Per container, so the content leaving and the content arriving share one resize. */
const heightMotions = new WeakMap<HTMLElement, HeightMotion>();

/** The `position` values that already make a container a containing block. */
const POSITIONED = new Set(['relative', 'absolute', 'fixed', 'sticky']);

/**
 * The pin that holds a container's leaving content, and how many are holding it.
 * Counted, because a bar being spammed has a fade start before the one before it
 * has ended, and the first to finish would otherwise pull the pin out from under
 * the rest — their boxes would jump to whatever is positioned further up the page.
 */
interface Anchor {
  held: number;
  /** The container's own inline `position`, put back once the last hold goes. */
  position: string;
}

const anchors = new WeakMap<HTMLElement, Anchor>();

/**
 * The content each container has in its normal flow. Contents are separate
 * directives that only meet at the container, so the one arriving looks the one
 * leaving up here rather than waiting its turn — see {@link LiquidTabContent.show}.
 */
const inFlow = new WeakMap<HTMLElement, LiquidTabContent<any>>();

/** A fade in progress, which a later one can hurry along or cut off. */
interface Fade {
  rush: (tail: number) => void;
  /** Jumps to the last frame, where the content has already gone. */
  end: () => void;
}

/** The fades each container has running, so a new one can hurry the rest. */
const fades = new WeakMap<HTMLElement, Set<Fade>>();

interface Leaving<T> {
  view: EmbeddedViewRef<LiquidTabContentContext<T>>;
  animations: Animation[];
  restore: () => void;
}

const rootElements = (view: EmbeddedViewRef<unknown>) =>
  view.rootNodes.filter((node): node is HTMLElement => node instanceof HTMLElement);

/** Speeds a fade up to land within `tail` ms, and never slows one back down. */
const rush = (animation: Animation, tail: number): void => {
  const timing = animation.effect?.getComputedTiming?.();
  if (!timing || typeof animation.updatePlaybackRate !== 'function') return;

  const left = Number(timing.activeDuration ?? 0) - Number(animation.currentTime ?? 0);
  if (!(left > 0)) return;
  animation.updatePlaybackRate(
    Math.min(Math.max(left / tail, animation.playbackRate || 1), MAX_RUSH),
  );
};

/**
 * Tab content built only while its tab is selected, and destroyed once another
 * is — for content that is costly to build, or should start fresh on each visit.
 *
 * Inside a panel it takes the panel's bar, and its value too when left off:
 *
 * ```html
 * <div liquidTabPanel [liquidTabPanelFor]="tabs">
 *   <ng-template liquidTabContent="all">…</ng-template>
 *   <ng-template liquidTabContent="unread">…</ng-template>
 * </div>
 *
 * <section liquidTabPanel="profile" [liquidTabPanelFor]="tabs">
 *   <ng-template liquidTabContent>…</ng-template>
 * </section>
 * ```
 *
 * Anywhere else, it names its bar — though a panel is what gives the content its
 * `tabpanel` role, so prefer one:
 *
 * ```html
 * <ng-template liquidTabContent="all" [liquidTabContentFor]="tabs" let-value>…</ng-template>
 * ```
 *
 * Inside a `[panelMode]="'slider'"` panel these are carried like a carousel
 * instead — see {@link LiquidTabPanelMode}. Everything below describes the
 * default, `dissolve`.
 *
 * Switching dissolves: the old content pulls aside, away from the tab picked, and
 * blurs away on top, while the new one drifts in from that tab's side and sharpens
 * in underneath over exactly the same window, so the two cover the panel between
 * them the whole way across and the page never shows through. Meanwhile the
 * container eases to its new height. The old content is only destroyed once it
 * has faded, and picking its tab again mid-fade brings the same content back. The crossfade shows where contents share a
 * container — a shared panel, or standalone — since a panel with a value of its
 * own is hidden the moment its tab is not selected. Content that is there from
 * the first render just appears, reduced motion skips it all, and
 * `[liquidTabContentAnimate]="false"` turns it off.
 */
@Directive({
  selector: 'ng-template[liquidTabContent]',
})
export class LiquidTabContent<T = any> {
  /** The value of the tab that shows this content; left empty, it takes its panel's. */
  readonly value = input<T | undefined, T | '' | undefined>(undefined, {
    alias: 'liquidTabContent',
    transform: (value) => (value === '' ? undefined : (value as T | undefined)),
  });
  /** The bar to follow, when the content does not sit inside a panel. */
  readonly tabsFor = input<LiquidSwitcher<T> | undefined>(undefined, { alias: 'liquidTabContentFor' });
  /** Whether switching crossfades. */
  readonly animate = input(true, { alias: 'liquidTabContentAnimate', transform: booleanAttribute });

  private readonly template = inject<TemplateRef<LiquidTabContentContext<T>>>(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly panel = inject<LiquidTabPanel<T>>(LiquidTabPanel, { optional: true });
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  /** The bar it follows: the one it was given, or else its panel's. */
  readonly tabs = computed(() => {
    const tabs = this.tabsFor() ?? this.panel?.tabs();
    if (!tabs) {
      throw new Error(
        'liquidTabContent needs a bar: set [liquidTabContentFor], or put it inside a liquidTabPanel.',
      );
    }
    return tabs;
  });

  /** Its own value, or else its panel's. */
  readonly resolvedValue = computed(() => this.value() ?? this.panel?.value());

  readonly isShown = computed(() => {
    const value = this.resolvedValue();
    return value !== undefined && Object.is(this.tabs().value(), value);
  });

  /** How the panel changes over; standalone content always dissolves. */
  readonly mode = computed<LiquidTabPanelMode>(() => this.panel?.mode() ?? 'dissolve');

  /**
   * How many steps along the bar this content is from the selected tab — `-1`
   * for the one before it, `1` for the one after — or null when there is no
   * selection, or no tab carrying this content's value.
   */
  readonly slideOffset = computed<number | null>(() => {
    const value = this.resolvedValue();
    const tabs = this.tabs();
    const selected = tabs.selectedIndex();
    if (value === undefined || selected < 0) return null;
    const index = tabs.items().findIndex((tab) => Object.is(tab.boundValue(), value));
    return index < 0 ? null : index - selected;
  });

  private view: EmbeddedViewRef<LiquidTabContentContext<T>> | null = null;
  private leaving: Leaving<T> | null = null;
  /**
   * The fade bringing this content in, kept so the fade taking it out again can
   * cancel it. Switching back off a tab before its content has finished arriving
   * would otherwise leave both running on the same element, each setting the same
   * three properties, and the fade that ends first would hand its last frame to
   * whichever one is still going.
   */
  private entering: Animation[] = [];
  /** False through the first render, so content that is there from the start just appears. */
  private ready = false;

  /**
   * Slider state. `slot` is how many steps from the selected tab this content is
   * laid out at, or null while it is not built; `sliding` holds a slide on its
   * way off, so picking its tab again mid-slide catches the same content rather
   * than building a second copy behind it.
   */
  private slot: number | null = null;
  private sliding: EmbeddedViewRef<LiquidTabContentContext<T>> | null = null;
  private motions: Animation[] = [];
  /** The mode the content is currently laid out for; null while nothing is built. */
  private placedMode: LiquidTabPanelMode | null = null;

  constructor() {
    afterNextRender(() => (this.ready = true));

    effect(() => {
      const mode = this.mode();
      const shown = this.isShown();
      const offset = this.slideOffset();
      const tabs = this.tabs();
      const value = this.resolvedValue() as T;

      // Untracked: whatever the template reads while it is built is its own business.
      untracked(() => {
        // The two modes lay content out in ways that do not survive each other,
        // so a panel switched between them starts over rather than animating
        // from a state the new mode has no way to read.
        if (this.placedMode !== null && this.placedMode !== mode) this.reset();
        this.placedMode = mode;

        if (mode === 'slider') this.slide(offset, value, tabs);
        else if (shown) this.show(value, tabs);
        else this.hide();
      });
    });
  }

  private show(value: T, tabs: LiquidSwitcher<T>): void {
    if (this.view) return;

    const animate = this.canAnimate();
    const container = this.container();

    // The content going the other way has not necessarily had its turn: contents
    // are separate directives and Angular runs them in template order, so picking
    // an earlier tab reaches this before the tab just left reaches `hide`. Taking
    // it out of the flow here rather than leaving it there means this content —
    // and, when it is a fade being caught, the content that hides next — reads its
    // place in an empty container, instead of measuring itself one whole content
    // further down the page and fading out from there.
    const current = container && inFlow.get(container);
    if (current && current !== this) current.hide();

    if (animate) this.captureHeight();

    if (this.leaving) {
      // Picked again mid-fade: the same content comes back, state and all.
      const { view, animations, restore } = this.leaving;
      this.leaving = null;
      animations.forEach((animation) => animation.cancel());
      restore();
      this.view = view;
    } else {
      this.view = this.viewContainer.createEmbeddedView(this.template, { $implicit: value, tabs });
    }
    if (container) inFlow.set(container, this);

    if (animate) this.fadeIn(this.view, this.drift(tabs));
  }

  private hide(): void {
    const view = this.view;
    if (!view) return;
    this.view = null;

    const container = this.container();
    if (container && inFlow.get(container) === this) inFlow.delete(container);

    if (!this.canAnimate()) {
      view.destroy();
      return;
    }
    this.captureHeight();
    this.fadeOut(view, this.drift(this.tabs()));
  }

  /** What the content is rendered into: whatever holds the template's anchor. */
  private container(): HTMLElement | null {
    return this.viewContainer.element.nativeElement.parentElement as HTMLElement | null;
  }

  /**
   * Makes `container` the containing block its leaving content is pinned to, and
   * returns what lets go again. Anchored to some positioned ancestor further up
   * instead, that content would neither be clipped by the container while it eases
   * to its new height nor follow it if the page around the panel reflowed.
   */
  private anchor(container: HTMLElement | null): () => void {
    if (!container) return () => undefined;

    const held = anchors.get(container);
    const anchor: Anchor = held ?? { held: 0, position: container.style.position };
    if (!held) {
      anchors.set(container, anchor);
      const position = this.document.defaultView?.getComputedStyle(container).position ?? '';
      if (!POSITIONED.has(position)) container.style.position = 'relative';
    }
    anchor.held++;

    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--anchor.held > 0) return;
      anchors.delete(container);
      container.style.position = anchor.position;
    };
  }

  /**
   * The offset toward the tab just picked: along the bar's axis, `DRIFT` px on to
   * later tabs or back to earlier ones, flipped for a right-to-left bar.
   */
  private drift(tabs: LiquidSwitcher<T>): { x: number; y: number } {
    const step = tabs.direction();
    if (!step) return { x: 0, y: 0 };
    if (tabs.orientation() === 'vertical') return { x: 0, y: step * DRIFT };
    return { x: (tabs.textDirection === 'rtl' ? -step : step) * DRIFT, y: 0 };
  }

  /** Sharpens the content in, drifting from the picked tab's side to where it belongs. */
  private fadeIn(
    view: EmbeddedViewRef<LiquidTabContentContext<T>>,
    drift: { x: number; y: number },
  ): void {
    this.entering.forEach((animation) => animation.cancel());
    this.entering = rootElements(view).map((element) =>
      element.animate(
        [
          { opacity: 0, filter: `blur(${BLUR}px)`, translate: `${drift.x}px ${drift.y}px` },
          { opacity: 1, filter: 'blur(0px)', translate: '0px 0px' },
        ],
        SWAP,
      ),
    );
  }

  /** Lifts the content out of the flow where it stands, pulls it aside and fades it off, then destroys it. */
  private fadeOut(
    view: EmbeddedViewRef<LiquidTabContentContext<T>>,
    drift: { x: number; y: number },
  ): void {
    const elements = rootElements(view);
    const container = this.container();

    // It may still be arriving; it cannot do both at once.
    this.entering.forEach((animation) => animation.cancel());
    this.entering = [];

    // Pinned before anything is measured, since the pin is what the offsets below
    // are measured from.
    const unanchor = this.anchor(container);

    // Whatever is already on its way out of this container goes faster now, so a
    // spammed bar clears back down to one leaving content instead of stacking a
    // half-faded copy per click. Oldest first and the tail split between them, so
    // the further behind a fade has fallen the less of one it gets.
    const running = [...(container ? (fades.get(container) ?? []) : [])];
    running.forEach((fade, index) => fade.rush(TAIL / (running.length - index)));
    running.slice(0, Math.max(running.length - MAX_LEAVING + 1, 0)).forEach((fade) => fade.end());

    // Measured before any is lifted out, so one leaving the flow does not move the next.
    const boxes = elements.map((element) => ({
      element,
      style: element.getAttribute('style'),
      top: element.offsetTop,
      left: element.offsetLeft,
      width: element.offsetWidth,
    }));

    for (const { element, top, left, width } of boxes) {
      // Its containing block is the container, which `anchor` has just made sure of.
      Object.assign(element.style, {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        margin: '0',
        pointerEvents: 'none',
      });
      element.inert = true;
    }

    const animations = elements.map((element) =>
      element.animate(
        [
          { opacity: 1, filter: 'blur(0px)', translate: '0px 0px' },
          {
            opacity: 0,
            filter: `blur(${BLUR}px)`,
            translate: `${-drift.x}px ${-drift.y}px`,
          },
        ],
        { ...SWAP, fill: 'forwards' },
      ),
    );

    // Retimed rather than cut: the content carries on from wherever it has got to,
    // only quicker, so being hurried never shows as a step in its opacity.
    const fade: Fade = {
      rush: (tail) => animations.forEach((animation) => rush(animation, tail)),
      end: () =>
        animations.forEach((animation) => {
          if (typeof animation.finish === 'function') animation.finish();
        }),
    };
    if (container) {
      const set = fades.get(container) ?? new Set<Fade>();
      fades.set(container, set);
      set.add(fade);
    }
    const forget = () => {
      if (container) fades.get(container)?.delete(fade);
      unanchor();
    };

    const leaving: Leaving<T> = {
      view,
      animations,
      restore: () => {
        forget();
        boxes.forEach(({ element, style }) => {
          element.inert = false;
          if (style === null) element.removeAttribute('style');
          else element.setAttribute('style', style);
        });
      },
    };
    this.leaving = leaving;

    Promise.all(animations.map((animation) => animation.finished)).then(
      () => {
        if (this.leaving !== leaving) return;
        this.leaving = null;
        forget();
        view.destroy();
      },
      // Cancelled: its tab was picked again, and the view is back in use.
      () => undefined,
    );
  }

  /**
   * Lays the content out `offset` steps from the selected tab, or takes it away
   * once it is further off than {@link REACH}. Every content in the panel runs
   * this on the same switch — they are separate directives, run in template
   * order — so between them they move the whole row one step along.
   */
  private slide(offset: number | null, value: T, tabs: LiquidSwitcher<T>): void {
    const within = offset !== null && Math.abs(offset) <= REACH;
    const from = this.slot;
    if (from === (within ? offset : null)) return;

    const animate = this.canAnimate();
    // Taken here, before any content has left the flow, so the panel eases from
    // the height it is actually at — whichever of them gets its turn first.
    if (animate) this.captureHeight();

    if (!within) {
      this.slideOut(offset, animate);
      return;
    }

    const container = this.container();
    // The slide holding the flow has not necessarily had its turn yet, and until
    // it does it is still giving the panel its height. Pushing it out here means
    // the panel measures the content arriving, not the two of them stacked.
    if (offset === 0) {
      const current = container && inFlow.get(container);
      if (current && current !== this) current.stepAside();
    }

    if (this.sliding) {
      // Picked again mid-slide: the same content turns round, state and all.
      this.view = this.sliding;
      this.sliding = null;
    } else if (!this.view) {
      this.view = this.viewContainer.createEmbeddedView(this.template, { $implicit: value, tabs });
    }

    const elements = rootElements(this.view);
    for (const element of elements) {
      element.classList.add(SLIDE_CLASS);
      if (offset === 0) this.stepIn(element);
      else this.stepOut(element);
    }
    if (container && offset === 0) inFlow.set(container, this);

    // Built for this switch, so it has nowhere on screen to come from. The one
    // taking the panel comes in from the side the bar moved toward; a neighbour
    // comes in over the nearer edge, so a jump of several tabs reads as the row
    // gathering around the tab picked rather than racing past it.
    const entry = offset === 0 ? tabs.direction() || 1 : Math.sign(offset as number) * (REACH + 1);
    this.place(elements, offset as number, from ?? entry, animate);
    this.slot = offset;
  }

  /** Slides the content off the panel toward `offset`'s side and destroys it. */
  private slideOut(offset: number | null, animate: boolean): void {
    const view = this.view;
    const from = this.slot;
    this.view = null;
    this.slot = null;

    const container = this.container();
    if (container && inFlow.get(container) === this) inFlow.delete(container);
    if (!view) return;

    const elements = rootElements(view);
    for (const element of elements) this.stepOut(element);

    // Every slide the panel holds is on show, the neighbours included, so one
    // being dropped is seen out over the edge rather than simply removed.
    if (animate && from !== null && offset !== null) {
      this.place(elements, Math.sign(offset) * (REACH + 1), from, true);
    }
    if (this.motions.length === 0) {
      this.drop(view, elements);
      return;
    }

    this.sliding = view;
    Promise.all(this.motions.map((motion) => motion.finished)).then(
      () => {
        if (this.sliding !== view) return;
        this.sliding = null;
        this.drop(view, elements);
      },
      // Cancelled: its tab was picked again, and the view is back in use.
      () => undefined,
    );
  }

  /** Gives the flow up where it stands, for the slide that is taking it. */
  private stepAside(): void {
    const container = this.container();
    if (container && inFlow.get(container) === this) inFlow.delete(container);
    if (!this.view) return;
    for (const element of rootElements(this.view)) this.stepOut(element);
  }

  /**
   * Takes a slide out of the flow: the panel is sized by the selected content
   * alone, and a neighbour waiting off to the side is neither reachable nor read
   * out while it waits.
   */
  private stepOut(element: HTMLElement): void {
    element.classList.remove(CURRENT_CLASS);
    element.inert = true;
    element.setAttribute('aria-hidden', 'true');
  }

  private stepIn(element: HTMLElement): void {
    element.classList.add(CURRENT_CLASS);
    element.inert = false;
    element.removeAttribute('aria-hidden');
  }

  /**
   * Where a slide `steps` from the selected one rests: `steps` of its own size
   * plus a gap along the bar's axis, and played down unless it is the selected
   * one. Its own size rather than the panel's, so the row stays put as the panel
   * is resized without anything having to measure it again.
   */
  private restingStyle(steps: number): SlideStyle {
    const tabs = this.tabs();
    const panel = this.container();
    const view = this.document.defaultView;
    const read = (name: string, fallback: number) =>
      panel ? cssLength(view, panel, name, fallback) : fallback;

    const vertical = tabs.orientation() === 'vertical';
    const step = vertical || tabs.textDirection !== 'rtl' ? steps : -steps;
    const along = `calc(${step * STRIDE}% + ${step * read('--liquid-slider-gap', GAP)}px)`;
    const translate = vertical ? `0px ${along}` : `${along} 0px`;

    if (steps === 0) return { translate, scale: '1', opacity: '1' };
    return {
      translate,
      scale: `${read('--liquid-slider-scale', SCALE)}`,
      opacity: `${read('--liquid-slider-dim', DIM)}`,
    };
  }

  /** Puts the slides at `offset` and glides them there from `from`. */
  private place(elements: HTMLElement[], offset: number, from: number, animate: boolean): void {
    const view = this.document.defaultView;
    const entry = this.restingStyle(from);
    // Read before the resting style is rewritten and the motion cancelled, since
    // mid-glide this is where the slide actually is: a bar clicked again before
    // the row has settled carries on from there instead of snapping back to the
    // offset it never reached. A slide built for this switch has no such place —
    // an empty inline `translate` is what says so — and starts from `from`.
    const starts = elements.map((element): SlideStyle => {
      const style = element.style.translate === '' ? null : view?.getComputedStyle(element);
      if (!style) return entry;
      return {
        translate:
          style.translate && style.translate !== 'none' ? style.translate : entry.translate,
        scale: style.scale && style.scale !== 'none' ? style.scale : entry.scale,
        opacity: style.opacity || entry.opacity,
      };
    });

    this.motions.forEach((motion) => motion.cancel());
    this.motions = [];

    const to = this.restingStyle(offset);
    elements.forEach((element, index) => {
      Object.assign(element.style, to);
      if (!animate) return;
      this.motions.push(element.animate([{ ...starts[index] }, { ...to }], SLIDE));
    });
  }

  /** Destroys a slide and takes the slider's marks back off it. */
  private drop(view: EmbeddedViewRef<LiquidTabContentContext<T>>, elements: HTMLElement[]): void {
    for (const element of elements) {
      element.classList.remove(SLIDE_CLASS, CURRENT_CLASS);
      element.style.translate = '';
      element.style.scale = '';
      element.style.opacity = '';
      element.inert = false;
      element.removeAttribute('aria-hidden');
    }
    view.destroy();
  }

  /** Tears everything down without animating, for a panel that has changed mode. */
  private reset(): void {
    const container = this.container();
    if (container && inFlow.get(container) === this) inFlow.delete(container);

    this.entering.forEach((animation) => animation.cancel());
    this.entering = [];
    this.motions.forEach((motion) => motion.cancel());
    this.motions = [];

    if (this.leaving) {
      const { view, animations, restore } = this.leaving;
      this.leaving = null;
      animations.forEach((animation) => animation.cancel());
      restore();
      view.destroy();
    }
    if (this.sliding) {
      this.drop(this.sliding, rootElements(this.sliding));
      this.sliding = null;
    }
    if (this.view) {
      this.drop(this.view, rootElements(this.view));
      this.view = null;
    }
    this.slot = null;
  }

  /**
   * Notes the container's height before the swap, then after the render eases it
   * to the new one. Whichever content moves first takes the note; the other finds
   * it pending and leaves it be.
   */
  private captureHeight(): void {
    const container = this.viewContainer.element.nativeElement.parentElement as HTMLElement | null;
    const view = this.document.defaultView;
    if (!container || !view) return;

    const motion = heightMotions.get(container) ?? {
      from: 0,
      pending: false,
      animation: null,
      overflow: '',
    };
    heightMotions.set(container, motion);
    if (motion.pending) return;

    motion.pending = true;
    // Mid-resize this is the height the running animation has it at.
    motion.from = container.offsetHeight;

    afterNextRender(
      {
        mixedReadWrite: () => {
          motion.pending = false;
          if (motion.animation) motion.animation.cancel();
          else motion.overflow = container.style.overflow;

          const to = container.offsetHeight;
          if (Math.abs(to - motion.from) < 1) {
            motion.animation = null;
            container.style.overflow = motion.overflow;
            return;
          }

          // `offsetHeight` is the border box; `height` may not be.
          const style = view.getComputedStyle(container);
          const frame =
            style.boxSizing === 'border-box'
              ? 0
              : ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce(
                  (sum, key) =>
                    sum + (parseFloat(style[key as keyof CSSStyleDeclaration] as string) || 0),
                  0,
                );

          container.style.overflow = 'clip';
          const animation = container.animate(
            [{ height: `${motion.from - frame}px` }, { height: `${to - frame}px` }],
            RESIZE,
          );
          motion.animation = animation;

          const settle = () => {
            if (motion.animation !== animation) return;
            motion.animation = null;
            container.style.overflow = motion.overflow;
          };
          animation.onfinish = settle;
          animation.oncancel = settle;
        },
      },
      { injector: this.injector },
    );
  }

  private canAnimate(): boolean {
    const view = this.document.defaultView;
    return (
      this.ready &&
      this.animate() &&
      typeof HTMLElement.prototype.animate === 'function' &&
      !view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );
  }

  static ngTemplateContextGuard<T>(
    _directive: LiquidTabContent<T>,
    context: unknown,
  ): context is LiquidTabContentContext<T> {
    return true;
  }
}
