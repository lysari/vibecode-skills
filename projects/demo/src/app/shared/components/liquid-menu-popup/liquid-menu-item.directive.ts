import { FocusOrigin, FocusableOption } from '@angular/cdk/a11y';
import { Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { LiquidMenuPopup } from './liquid-menu-popup';
import { LiquidMenuTrigger } from './liquid-menu-trigger.directive';

/**
 * One entry of an `<x-liquid-menu-popup>`: reachable with the arrow keys and
 * type-ahead, and clicking it closes the menu — no `menu.close()` in the handler.
 *
 * ```html
 * <x-liquid-menu-popup #localeMenu="liquidMenu">
 *   <button liquidMenuItem type="button" (click)="switchTo('km')">ខ្មែរ</button>
 *   <button liquidMenuItem type="button" disabled>English</button>
 * </x-liquid-menu-popup>
 * ```
 *
 * Put it on a `<button>` where possible: `disabled` then also stops the click
 * natively, where on other elements only the menu's own handling honours it.
 *
 * An item that is also a `[liquidMenuTriggerFor]` does not close the menu: the
 * popup it opens stacks on top, and the menu waits underneath until it is done.
 */
@Directive({
  host: {
    '(click)': 'onClick($event)',
    '(focus)': 'menu.syncActiveItem(this)',
    '[attr.aria-disabled]': 'disabled || null',
    '[attr.disabled]': 'disabled || null',
    '[class.is-disabled]': 'disabled',
    role: 'menuitem',
    tabindex: '-1',
  },
  selector: '[liquidMenuItem]',
})
export class LiquidMenuItem implements FocusableOption {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly menu = inject(LiquidMenuPopup);
  private readonly trigger = inject(LiquidMenuTrigger, { self: true, optional: true });

  readonly isDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });

  /** A plain property, as the key manager reads it to skip the item. */
  get disabled(): boolean {
    return this.isDisabled();
  }

  focus(_origin?: FocusOrigin, options?: FocusOptions): void {
    this.host.nativeElement.focus(options);
  }

  getLabel(): string {
    return this.host.nativeElement.textContent?.trim() ?? '';
  }

  protected onClick(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Opens a popup of its own, which stacks on this menu rather than replacing it.
    if (this.trigger) return;
    this.menu.close('item');
  }
}
