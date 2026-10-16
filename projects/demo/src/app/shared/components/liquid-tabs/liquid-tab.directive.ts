import { FocusOrigin, FocusableOption } from '@angular/cdk/a11y';
import {
  Directive,
  ElementRef,
  type OnInit,
  Signal,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { LiquidTabs } from './liquid-tabs';

/** Per instance, so the default ids never collide. */
let tabUid = 0;

/**
 * One tab of an `<x-liquid-tabs>`, holding the value it selects:
 *
 * ```html
 * <x-liquid-tabs [(value)]="view">
 *   <button type="button" liquidTab="list">List</button>
 *   <button type="button" [liquidTab]="gridView" [disabled]="!canGrid">Grid</button>
 * </x-liquid-tabs>
 * ```
 *
 * Put it on a `<button>` where possible. Any other element works — the bar
 * answers Enter and Space for it — but it needs its own `aria-label` if it has no
 * text. Only the tab stop is in the tab order; the arrow keys reach the rest.
 *
 * Pressing a tab squashes what it holds — and the pill under it — and bounces
 * them back on release, the same answer an item of an `<x-liquid-morph-menu>`
 * gives. That, rather than the pill
 * setting off, is what reads as the click: it lands under the finger, on the tab
 * actually pressed, and it answers a tab that is already selected — where there
 * is no pill to move — just as readily. `--liquid-tabs-press-duration` (ms) times
 * the squash; the bounce back out takes 3.4× longer.
 */
@Directive({
  exportAs: 'liquidTab',
  host: {
    class: 'liquid-tab',
    role: 'tab',
    '[id]': 'id()',
    '[attr.aria-selected]': 'isSelected()',
    '[attr.aria-disabled]': 'disabled || null',
    '[attr.aria-controls]': 'tabs.panelIdFor(this)',
    '[attr.tabindex]': 'tabs.tabStop() === this ? 0 : -1',
    '[class.is-selected]': 'isSelected()',
    '[class.is-disabled]': 'disabled',
    '(click)': 'tabs.selectTab(this)',
    '(focus)': 'tabs.syncActiveTab(this)',
    // The pill under the tab, on the same clock as the tab's own press: both
    // handlers for an event run in the one task, so the two set off together.
    // The tab's own squash is the host directive's; only the pill is wired here.
    '(pointerdown)': 'onPress()',
    '(pointerup)': 'onRelease()',
    '(pointerleave)': 'onRelease()',
    '(pointercancel)': 'onRelease()',
    '(keydown.enter)': 'onPress()',
    '(keydown.space)': 'onPress()',
    '(keyup.enter)': 'onRelease()',
    '(keyup.space)': 'onRelease()',
  },
  // The tab's own press, shared with everything else liquid that answers a tap.
  // It reads the `aria-disabled` this already writes, so a disabled tab is
  // skipped without being told.
  hostDirectives: [LiquidPressable],
  selector: '[liquidTab]',
})
export class LiquidTab<T = any> implements FocusableOption, OnInit {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly tabs = inject<LiquidTabs<T>>(LiquidTabs);

  /** What `[(value)]` on the bar becomes when this tab is selected. */
  readonly value = input.required<T>({ alias: 'liquidTab' });
  readonly isDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
  /** Defaults to a generated one; panels point `aria-labelledby` at it. */
  readonly id = input(`liquid-tab-${++tabUid}`);

  readonly isSelected: Signal<boolean> = computed(() => this.tabs.selectedTab() === this);

  /** Flipped in {@link ngOnInit}, the first point Angular has set {@link value}. */
  private readonly bound = signal(false);

  /**
   * {@link value}, or `undefined` until Angular has set it — what the bar reads
   * of a tab other than the one it is working on. A tab joins the bar's query a
   * pass before its inputs are bound: the tabs of an `@for` are all built before
   * any of them is updated, so the bar sees them while reading `value` would
   * still throw. Their readers run again as the tabs settle.
   */
  readonly boundValue: Signal<T | undefined> = computed(() =>
    this.bound() ? this.value() : undefined,
  );

  constructor() {
    // The bar keeps publishing its own name for the squash duration.
    inject(LiquidPressable).useDuration('--liquid-tabs-press-duration');
  }

  /** A plain property, as the key manager reads it to skip the tab. */
  get disabled(): boolean {
    return this.isDisabled() || this.tabs.disabled();
  }

  ngOnInit(): void {
    this.bound.set(true);
  }

  /** A disabled tab moves no pill: nothing about it is going to answer. */
  protected onPress(): void {
    if (this.disabled) return;
    this.tabs.pressIndicator();
  }

  protected onRelease(): void {
    this.tabs.releaseIndicator();
  }

  focus(_origin?: FocusOrigin, options?: FocusOptions): void {
    this.element.focus(options);
  }

  getLabel(): string {
    return this.element.textContent?.trim() ?? '';
  }
}
