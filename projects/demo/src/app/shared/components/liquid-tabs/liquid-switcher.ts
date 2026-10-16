import { type Signal, linkedSignal } from '@angular/core';
import type { LiquidTabPanel } from './liquid-tab-panel.directive';

export type LiquidSwitcherOrientation = 'horizontal' | 'vertical';

/** What the panels and contents of a bar need from its items: the value each one selects. */
export interface LiquidSwitcherItem<T> {
  readonly boundValue: Signal<T | undefined>;
}

/**
 * What `liquidTabPanel` and `liquidTabContent` ask of the bar they follow, so one
 * set of panels and contents serves both `<x-liquid-tabs>` and `<x-liquid-stepper>`.
 */
export interface LiquidSwitcher<T = any> {
  readonly value: Signal<T | null>;
  readonly orientation: Signal<LiquidSwitcherOrientation>;
  readonly selectedIndex: Signal<number>;
  /** Which way the last switch went along the bar; see {@link switchDirection}. */
  readonly direction: Signal<-1 | 0 | 1>;
  /** `ltr` or `rtl`: which way "later" points on a horizontal bar. */
  readonly textDirection: 'ltr' | 'rtl';
  /** Every item in the bar, in DOM order. */
  readonly items: Signal<readonly LiquidSwitcherItem<T>[]>;
  registerPanel(panel: LiquidTabPanel<T>): () => void;
  tabIdFor(panel: LiquidTabPanel<T>): string | null;
}

/**
 * `1` on to a later item, `-1` back to an earlier one, `0` when there was no item
 * to come from. Content drifts by it.
 */
export function switchDirection(selectedIndex: Signal<number>): Signal<-1 | 0 | 1> {
  return linkedSignal<number, -1 | 0 | 1>({
    source: selectedIndex,
    computation: (index, previous) => {
      if (!previous || previous.source < 0 || index < 0 || index === previous.source) return 0;
      return index > previous.source ? 1 : -1;
    },
  });
}
