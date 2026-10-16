import { FocusKeyManager } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  Signal,
  ViewEncapsulation,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  type Box,
  animatedBox,
  animatedScale,
  cssLength,
  cssTime,
  offsetBox,
  pourKeyframes,
  prefersReducedMotion,
} from '@app/shared/utils/liquid-pour';
import { LiquidPress } from '@app/shared/utils/liquid-press';
import { type LiquidSwitcher, switchDirection } from './liquid-switcher';
import type { LiquidTabPanel } from './liquid-tab-panel.directive';
import { LiquidTab } from './liquid-tab.directive';

export type LiquidTabsOrientation = 'horizontal' | 'vertical';

/**
 * - `automatic`: the arrow keys select as they move — for panels that are cheap to show.
 * - `manual`: the arrow keys only move focus, and Enter or Space selects.
 */
export type LiquidTabsActivation = 'automatic' | 'manual';

/** Where a `persist` key keeps its selection: for the browser, or for this tab only. */
export type LiquidTabsStorage = 'local' | 'session';

/** Fallbacks for `--liquid-tabs-duration` (ms) and `--liquid-tabs-pull` (px). */
const DEFAULT_DURATION = 340;
const DEFAULT_PULL = 10;

/**
 * A segmented tab bar whose white pill slides under the selected tab.
 *
 * ```html
 * <x-liquid-tabs #tabs="liquidTabs" aria-label="Filter" [(value)]="filter">
 *   <button type="button" liquidTab="all">All</button>
 *   <button type="button" liquidTab="unread">Unread <span class="count">3</span></button>
 *   <button type="button" liquidTab="archived" disabled>Archived</button>
 * </x-liquid-tabs>
 *
 * <section liquidTabPanel="all" [liquidTabPanelFor]="tabs">…</section>
 * <section liquidTabPanel="unread" [liquidTabPanelFor]="tabs">…</section>
 * ```
 *
 * With nothing to bind, `default` picks the tab to start on:
 * `<x-liquid-tabs default="all">`.
 *
 * A bar given a `persist` key remembers its latest selection there and starts on
 * it again the next time it is built — `<x-liquid-tabs persist="inbox:filter">` —
 * leaving `default` to cover the first visit, or a remembered tab that has since
 * gone away or been disabled.
 *
 * Tabs are the consumer's own elements — put `liquidTab` on a `<button>` where
 * possible — so they can hold anything: an icon, a count. The pill is measured
 * off the selected tab, so tabs of different widths work, and it follows a tab
 * whose label changes size.
 *
 * A panel without a value (`<div liquidTabPanel [liquidTabPanelFor]="tabs">`) is
 * shared: every tab without a panel of its own controls it, it is never hidden,
 * and it is labelled by whichever tab is selected — a list the tabs filter.
 *
 * Content that should only exist while its tab is selected goes in an
 * `<ng-template liquidTabContent="value">`: inside a panel, where the value can be
 * left off to take the panel's, or anywhere with `[liquidTabContentFor]`. Switching
 * between such contents crossfades them with a blur while their container eases
 * to the new height.
 *
 * ```html
 * <div liquidTabPanel [liquidTabPanelFor]="tabs">
 *   <ng-template liquidTabContent="all">…</ng-template>
 *   <ng-template liquidTabContent="unread">…</ng-template>
 * </div>
 * ```
 *
 * Styles live in `--liquid-tabs-*` custom properties, settable on the element or
 * any ancestor: `padding`, `radius`, `background`, `indicator-color`,
 * `indicator-shadow`, `color`, `hover-color`, `selected-color`, `tab-padding`,
 * `font-size`, `duration` (of a move), `pull` — how far, in px, the pill reaches
 * toward the next tab before it sets off — and `press-duration`, how long a
 * pressed tab and the pill under it hold their squash (see {@link LiquidTab}).
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  exportAs: 'liquidTabs',
  host: {
    class: 'liquid-tabs',
    role: 'tablist',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[class.is-vertical]': "orientation() === 'vertical'",
    '[class.is-stretched]': 'stretch()',
    '[class.is-disabled]': 'disabled()',
    '[class.has-selection]': '!!selectedTab()',
    '(keydown)': 'onKeydown($event)',
  },
  selector: 'x-liquid-tabs',
  styleUrl: './liquid-tabs.scss',
  templateUrl: './liquid-tabs.html',
})
export class LiquidTabs<T = any> implements LiquidSwitcher<T> {
  /** The selected tab's value, or `null` for none. Two-way: `[(value)]`. */
  readonly value = model<T | null>(null);
  /**
   * The tab to start on while `value` is still `null` — for a bar nothing binds
   * `[(value)]` to. Applied once; a missing or disabled tab leaves none selected.
   */
  readonly defaultValue = input<T | undefined>(undefined, { alias: 'default' });
  /**
   * A storage key under which the bar remembers its latest selection, and which
   * it starts on again the next time it is built. A remembered tab beats
   * {@link defaultValue}; one that is gone or disabled falls back to it.
   *
   * Values are kept as JSON, so anything `JSON.stringify` survives works — a
   * string or number as itself, an object as long as its tab still builds the
   * same one.
   */
  readonly persist = input<string | undefined>(undefined);
  /** Which storage {@link persist} writes to. Read as a selection is restored or written. */
  readonly persistIn = input<LiquidTabsStorage>('local');
  readonly orientation = input<LiquidTabsOrientation>('horizontal');
  readonly activation = input<LiquidTabsActivation>('automatic');
  /** Tabs share the width equally and the bar fills its container, instead of hugging their labels. */
  readonly stretch = input(false, { transform: booleanAttribute });
  /** Disables every tab at once. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Every tab in the bar, in DOM order. */
  readonly tabs = contentChildren<LiquidTab<T>>(LiquidTab, { descendants: true });
  /** {@link tabs}, under the name the panels and contents follow a bar by. */
  readonly items = this.tabs;

  // Typed out: tabs read these back through their own `isSelected`, which TypeScript cannot infer around.
  readonly selectedTab: Signal<LiquidTab<T> | undefined> = computed(() => {
    const value = this.value();
    if (value === null) return undefined;
    return this.tabs().find((tab) => Object.is(tab.boundValue(), value));
  });

  /** Where the selected tab sits among {@link tabs}; `-1` when none is selected. */
  readonly selectedIndex: Signal<number> = computed(() => {
    const tab = this.selectedTab();
    return tab ? this.tabs().indexOf(tab) : -1;
  });

  /**
   * Which way the last switch went along the bar: `1` on to a later tab, `-1`
   * back to an earlier one, `0` when there was no tab to come from. Tab content
   * drifts by it.
   */
  readonly direction: Signal<-1 | 0 | 1> = switchDirection(this.selectedIndex);

  /** `ltr` or `rtl`: which way "later" points on a horizontal bar. */
  readonly textDirection = inject(Directionality).value;

  /** The one tab that Tab lands on: the selected tab, or the first enabled one while none is. */
  readonly tabStop: Signal<LiquidTab<T> | null> = computed(
    () => this.selectedTab() ?? this.tabs().find((tab) => !tab.disabled) ?? null,
  );

  /**
   * Panels register themselves (see {@link registerPanel}) rather than being
   * queried: they sit outside the bar, wherever the page puts them.
   */
  private readonly panels = signal<readonly LiquidTabPanel<T>[]>([]);

  /**
   * Whether the bar has settled on the tab it starts on. Nothing is written to
   * storage before that, so a bar that is still empty cannot forget what the
   * last build of it remembered.
   */
  private readonly restored = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly keyManager = new FocusKeyManager(this.tabs, inject(Injector))
    .withWrap()
    .withHomeAndEnd();

  private readonly indicator = viewChild.required<ElementRef<HTMLElement>>('indicator');
  /** Which tab the pill was last put on, and its box there — where the next move starts. */
  private placed: { tab: LiquidTab<T>; box: Box } | null = null;
  private motion: Animation | null = null;
  /** Built on the first press: the pill is a view child, so it is not there yet. */
  private pressed: LiquidPress | null = null;

  constructor() {
    effect(() => {
      const vertical = this.orientation() === 'vertical';
      this.keyManager
        .withVerticalOrientation(vertical)
        .withHorizontalOrientation(vertical ? null : this.textDirection);
    });

    // Once, as soon as there are tabs to check the remembered value and the
    // default against. Their values are tracked, not just their count: the tabs
    // of an `@for` are in the query a pass before Angular binds them, so this
    // waits for them to settle.
    effect(() => {
      const key = this.persist();
      const initial = this.defaultValue();
      const tabs = this.tabs();
      const settled = tabs.length > 0 && tabs.every((tab) => tab.boundValue() !== undefined);
      if (untracked(this.restored) || (key === undefined && initial === undefined) || !settled) {
        return;
      }
      untracked(() => {
        this.restored.set(true);
        // A bound value is the page's own: neither storage nor the default touches it.
        if (this.value() !== null) return;
        if (key !== undefined && this.selectStored(key)) return;
        if (initial !== undefined) this.select(initial);
      });
    });

    // Every selection after that one is remembered, so the next build of the bar
    // starts where this one left off. Deselecting forgets it.
    let remembered = false;
    effect(() => {
      const key = this.persist();
      const value = this.value();
      if (key === undefined || !this.restored()) return;
      // The tab the bar starts on is the one storage or `default` just gave it:
      // only a change made after that is worth writing back.
      if (!remembered) {
        remembered = true;
        return;
      }
      untracked(() => writeKey(this.storage(), key, value === null ? null : serialize(value)));
    });

    // Only moves made by the key manager land here — a click or focus just syncs it.
    const moves = this.keyManager.change.subscribe((index) => {
      if (this.activation() !== 'automatic') return;
      const tab = this.tabs()[index];
      if (tab) this.selectTab(tab);
    });

    afterRenderEffect(() => {
      const tab = this.selectedTab();
      // Tracked so a change of layout slides the pill to the tab's new box.
      this.orientation();
      this.stretch();
      // Read on every switch, so `direction` always steps from the tab just left
      // even when no tab content is there to ask.
      this.direction();
      this.placeIndicator(tab);
    });

    afterRenderEffect((onCleanup) => {
      const tabs = this.tabs();
      const Observer = this.document.defaultView?.ResizeObserver;
      if (!Observer) return;

      // A label that changes width — a count turning up, a web font landing —
      // moves the tabs out from under the pill.
      const observer = new Observer(() => this.placeIndicator(untracked(this.selectedTab)));
      observer.observe(this.host);
      for (const tab of tabs) observer.observe(tab.element);
      onCleanup(() => observer.disconnect());
    });

    inject(DestroyRef).onDestroy(() => {
      moves.unsubscribe();
      this.motion?.cancel();
      this.pressed?.cancel();
      this.keyManager.destroy();
    });
  }

  /** Selects the tab holding `value`. Returns whether there was an enabled one to select. */
  select(value: T): boolean {
    const tab = this.tabs().find((candidate) => Object.is(candidate.boundValue(), value));
    return tab ? this.selectTab(tab) : false;
  }

  /**
   * Forgets the remembered selection, so a later build of the bar starts on
   * {@link defaultValue} again. The tab selected now stays selected, and is
   * remembered again as soon as the selection next changes.
   */
  clearPersisted(): void {
    const key = this.persist();
    if (key !== undefined) writeKey(this.storage(), key, null);
  }

  /** Selects `tab`, unless it is disabled. Returns whether it was selected. */
  selectTab(tab: LiquidTab<T>): boolean {
    if (tab.disabled) return false;

    this.keyManager.updateActiveItem(tab);
    if (!Object.is(this.value(), tab.value())) this.value.set(tab.value());
    return true;
  }

  /**
   * Presses the pill along with the tab — the surface under the finger answers
   * as well as what is written on it. A pill that is already pouring is not
   * under anything, so it is left to finish its move.
   */
  pressIndicator(): void {
    if (this.motion?.playState === 'running') return;
    this.indicatorPress().press();
  }

  /** Lets the pill go, and it springs back — unless a pour has taken it over. */
  releaseIndicator(): void {
    this.pressed?.release();
  }

  private indicatorPress(): LiquidPress {
    return (this.pressed ??= new LiquidPress(
      this.indicator().nativeElement,
      this.document,
      '--liquid-tabs-press-duration',
    ));
  }

  /** Moves focus into the bar, onto its tab stop. */
  focus(options?: FocusOptions): void {
    this.tabStop()?.focus(undefined, options);
  }

  /** Keeps the arrow keys moving on from a tab that got focus by click or Tab. */
  syncActiveTab(tab: LiquidTab<T>): void {
    if (this.keyManager.activeItem !== tab) this.keyManager.updateActiveItem(tab);
  }

  /** Adds a panel to the bar, and returns what takes it away again. */
  registerPanel(panel: LiquidTabPanel<T>): () => void {
    // Untracked: a panel registers from an effect.
    untracked(() => this.panels.update((list) => [...list, panel]));
    return () =>
      untracked(() => this.panels.update((list) => list.filter((entry) => entry !== panel)));
  }

  /** The id of the panel `tab` controls: its own, or else the shared one. */
  panelIdFor(tab: LiquidTab<T>): string | null {
    const panels = this.panels();
    const own = panels.find(
      (panel) => panel.value() !== undefined && Object.is(panel.value(), tab.boundValue()),
    );
    return (own ?? panels.find((panel) => panel.value() === undefined))?.id() ?? null;
  }

  /** The id of the tab `panel` is labelled by: its own tab, or for a shared panel the selected one. */
  tabIdFor(panel: LiquidTabPanel<T>): string | null {
    const value = panel.value();
    const tab =
      value === undefined
        ? this.selectedTab()
        : this.tabs().find((candidate) => Object.is(candidate.boundValue(), value));
    return tab?.id() ?? null;
  }

  protected onKeydown(event: KeyboardEvent): void {
    const tab = this.tabs().find((candidate) => candidate.element === event.target);
    if (!tab) return;

    if (event.key === 'Enter' || event.key === ' ') {
      // Here rather than left to a native click, so a tab that is not a button answers too.
      event.preventDefault();
      this.selectTab(tab);
      return;
    }
    this.keyManager.onKeydown(event);
  }

  /** Selects the tab remembered under `key`, if it is still in the bar and enabled. */
  private selectStored(key: string): boolean {
    const stored = readKey(this.storage(), key);
    if (stored === null) return false;
    const tab = this.tabs().find((candidate) => serialize(candidate.boundValue()) === stored);
    return tab ? this.selectTab(tab) : false;
  }

  /** The storage {@link persist} uses, or `null` where there is none to reach. */
  private storage(): Storage | null {
    const view = this.document.defaultView;
    try {
      return (this.persistIn() === 'session' ? view?.sessionStorage : view?.localStorage) ?? null;
    } catch {
      // Reading the property itself throws where the page may not store anything.
      return null;
    }
  }

  /**
   * Puts the pill on `tab`'s box — layout offsets, so a scaling popup around the
   * bar does not skew it — and pours it over when it is moving from another tab.
   * The custom properties always hold the resting box; the motion plays on top.
   */
  private placeIndicator(tab: LiquidTab<T> | undefined): void {
    if (!tab) return;

    const to = offsetBox(tab.element);
    // Only a change of tab moves the pill; the same tab resizing just lands in place.
    const from = this.placed && this.placed.tab !== tab ? this.currentBox(this.placed.box) : null;
    this.placed = { tab, box: to };

    const style = this.host.style;
    style.setProperty('--liquid-tabs-indicator-x', `${to.x}px`);
    style.setProperty('--liquid-tabs-indicator-y', `${to.y}px`);
    style.setProperty('--liquid-tabs-indicator-width', `${to.width}px`);
    style.setProperty('--liquid-tabs-indicator-height', `${to.height}px`);

    if (from) this.pour(from, to);

    // The first selection fades in rather than fading in from nothing mid-render.
    if (!this.host.classList.contains('is-ready')) {
      this.document.defaultView?.requestAnimationFrame(() => this.host.classList.add('is-ready'));
    }
  }

  /**
   * The liquid move, played on top of the custom properties, which always hold
   * the resting box.
   */
  private pour(from: Box, to: Box): void {
    const indicator = this.indicator().nativeElement;
    const view = this.document.defaultView;
    // Read before the cancels below, each of which puts the pill back to its
    // resting scale in a frame. The move has to set off from the size the eye
    // can see, whether that came from a pour it is interrupting or from the
    // press that has just been let go on the way into this one.
    const live = animatedScale(indicator, view);
    const fromScale = live[0] !== 1 || live[1] !== 1 ? live : undefined;

    this.motion?.cancel();
    this.motion = null;
    // The pour owns the pill's scale from here; two animations on it would only
    // fight, and the second would start from its own `0%`.
    this.pressed?.cancel();

    if (!view || typeof indicator.animate !== 'function') return;
    if (prefersReducedMotion(view)) return;

    const keyframes = pourKeyframes(from, to, {
      axis: this.orientation() === 'vertical' ? 'y' : 'x',
      pull: cssLength(view, this.host, '--liquid-tabs-pull', DEFAULT_PULL),
      fromScale,
    });
    if (!keyframes) return;

    this.motion = indicator.animate(keyframes, {
      duration: cssTime(view, this.host, '--liquid-tabs-duration', DEFAULT_DURATION),
    });
  }

  /** The pill's box right now: mid-move, wherever the motion has it, so a quick second switch flows on. */
  private currentBox(resting: Box): Box {
    if (this.motion?.playState !== 'running') return resting;
    return animatedBox(this.indicator().nativeElement, resting, this.document.defaultView);
  }
}

/** Per browser, and allowed to fail: a private window or blocked storage just never remembers. */
function readKey(storage: Storage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeKey(storage: Storage | null, key: string, value: string | null): void {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Nothing to do: the next build just starts on the default.
  }
}

/** Values are matched back to their tabs as JSON; one that will not serialize is not remembered. */
function serialize(value: unknown): string | null {
  try {
    return JSON.stringify(value) ?? null;
  } catch {
    return null;
  }
}
