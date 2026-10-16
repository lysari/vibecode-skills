import { Directive, computed, effect, input } from '@angular/core';
import type { LiquidSwitcher } from './liquid-switcher';

/** Per instance, so the default ids never collide. */
let panelUid = 0;

/**
 * How a panel changes between the `liquidTabContent` templates inside it.
 *
 * - `dissolve` (the default): the old content pulls aside and blurs away while
 *   the new one sharpens in underneath — only ever the two of them, built as
 *   their tab is picked.
 * - `slider`: a carousel. The selected content sits in the middle, narrower than
 *   the panel, with the content before it and the content after it showing at
 *   the edges either side; a switch carries the whole row left or right. Three
 *   contents are built at a time, and the panel still takes its height from the
 *   selected one.
 *
 * The carousel is sized with custom properties, settable on the panel or any
 * ancestor: `--liquid-slider-width` (how much of the panel a slide takes —
 * `100%` with a gap of `0` gives a plain full-width slider), and
 * `--liquid-slider-gap`, `--liquid-slider-scale` and `--liquid-slider-dim` for
 * the space between the slides and how far the two neighbours are played down.
 * The gap is read back unresolved, so give it in px.
 */
export type LiquidTabPanelMode = 'dissolve' | 'slider';

/**
 * The content one tab of an `<x-liquid-tabs>` shows. It can sit anywhere, so it
 * names its bar explicitly:
 *
 * ```html
 * <x-liquid-tabs #tabs="liquidTabs" [(value)]="section">…</x-liquid-tabs>
 *
 * <section liquidTabPanel="profile" [liquidTabPanelFor]="tabs">…</section>
 * <section liquidTabPanel="security" [liquidTabPanelFor]="tabs">…</section>
 * ```
 *
 * A panel is `hidden` while its tab is not selected. Put its content in an
 * `<ng-template liquidTabContent>` if it should only be built while it shows.
 *
 * Without a value it is the shared panel: never hidden, controlled by every tab
 * that has no panel of its own, and labelled by the selected tab — for one list
 * the tabs filter rather than several panels they swap between.
 *
 * A shared panel holding several `liquidTabContent` templates can carry them like
 * a carousel instead of dissolving between them — see {@link mode}.
 *
 * Add `tabindex="0"` when the panel holds nothing focusable, so the keyboard can
 * still reach it from the tabs.
 */
@Directive({
  exportAs: 'liquidTabPanel',
  host: {
    class: 'liquid-tab-panel',
    role: 'tabpanel',
    '[id]': 'id()',
    '[attr.aria-labelledby]': 'tabs().tabIdFor(this)',
    '[hidden]': 'isHidden()',
    '[class.is-slider]': 'isSlider()',
    '[class.is-vertical]': "isSlider() && tabs().orientation() === 'vertical'",
  },
  selector: '[liquidTabPanel]',
})
export class LiquidTabPanel<T = any> {
  /** The value of the tab that shows this panel; left empty, the panel is shared. */
  readonly value = input<T | undefined, T | '' | undefined>(undefined, {
    alias: 'liquidTabPanel',
    transform: (value) => (value === '' ? undefined : (value as T | undefined)),
  });
  readonly tabs = input.required<LiquidSwitcher<T>>({ alias: 'liquidTabPanelFor' });
  /** Defaults to a generated one; tabs point `aria-controls` at it. */
  readonly id = input(`liquid-tab-panel-${++panelUid}`);
  /**
   * How the `liquidTabContent` templates inside change over: `dissolve`, or
   * `slider` for a carousel that keeps the neighbouring contents built and
   * slides the row along. See {@link LiquidTabPanelMode}.
   *
   * A slider panel is the frame the contents are clipped to, so leave its own
   * padding off and let the contents carry theirs — a neighbour showing at the
   * edge is laid out against the panel's padding box, not its content box.
   */
  readonly mode = input<LiquidTabPanelMode>('dissolve', { alias: 'panelMode' });

  readonly isHidden = computed(() => {
    const value = this.value();
    return value !== undefined && !Object.is(this.tabs().value(), value);
  });

  protected readonly isSlider = computed(() => this.mode() === 'slider');

  constructor() {
    // Re-registers with whichever bar `liquidTabPanelFor` points at now.
    effect((onCleanup) => onCleanup(this.tabs().registerPanel(this)));
  }
}
