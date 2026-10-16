import { Directive, ElementRef, computed, inject, input } from '@angular/core';
import { LiquidMenuPopup } from './liquid-menu-popup';

/** Hosts the keyboard already reaches, so the trigger leaves their tab order alone. */
const NATIVELY_FOCUSABLE = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);

/**
 * Opens an `<x-liquid-menu-popup>` from whatever element it sits on:
 *
 * ```html
 * <button [liquidMenuTriggerFor]="localeMenu">…</button>
 * <x-liquid-menu-popup #localeMenu="liquidMenu">…</x-liquid-menu-popup>
 * ```
 *
 * The menu places itself against this element, so the trigger owns the
 * position without having to know any coordinates.
 *
 * One menu can serve several triggers: `liquidMenuTriggerData` hands the menu
 * whatever the opening trigger wants it to show, and the menu exposes it as
 * `data()` for its projected content to read.
 *
 * ```html
 * <button [liquidMenuTriggerFor]="preview" [liquidMenuTriggerData]="photo">…</button>
 * <x-liquid-menu-popup #preview="liquidMenu">
 *   <img [src]="preview.data()?.src" alt="" />
 * </x-liquid-menu-popup>
 * ```
 *
 * A trigger that is not a button — a `div`, an `ng-icon` — is made focusable and
 * answers Enter and Space like one. It still needs an `aria-label` if it has no text.
 *
 * A trigger inside another popup stacks the new one on top: the first stays open,
 * blurred, and comes back when the new one closes. `closeAll()` ends both.
 *
 * ```html
 * <x-liquid-menu-popup #account="liquidMenu">
 *   <button liquidMenuItem [liquidMenuTriggerFor]="confirm">Sign out</button>
 * </x-liquid-menu-popup>
 * <x-liquid-menu-popup #confirm="liquidMenu" role="dialog">
 *   <button (click)="confirm.close()">Cancel</button>
 *   <button (click)="confirm.closeAll(); signOut()">Sign out</button>
 * </x-liquid-menu-popup>
 * ```
 */
@Directive({
  host: {
    '[attr.aria-controls]': 'expanded() ? menu().panelId : null',
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-haspopup]': 'menu().role()',
    '(click)': 'toggle($event)',
    '(keydown)': 'onKeydown($event)',
  },
  selector: '[liquidMenuTriggerFor]',
})
export class LiquidMenuTrigger {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** The popup this trigger sits inside, if any — the one the new popup stacks on. */
  private readonly parentMenu = inject(LiquidMenuPopup, { optional: true });

  readonly menu = input.required<LiquidMenuPopup>({ alias: 'liquidMenuTriggerFor' });

  /** Handed to the menu on every open, so each trigger can fill the same panel. */
  readonly data = input<unknown>(undefined, { alias: 'liquidMenuTriggerData' });

  /** Per trigger: a menu shared by several triggers is open for only one of them. */
  protected readonly expanded = computed(() => this.menu().isOpenFor(this.host.nativeElement));

  /** A `<button>` turns Enter and Space into a click on its own. */
  private readonly activatesNatively: boolean;

  constructor() {
    const el = this.host.nativeElement;
    const focusable =
      NATIVELY_FOCUSABLE.has(el.tagName) ||
      (el.tagName === 'A' && el.hasAttribute('href')) ||
      el.hasAttribute('tabindex');

    this.activatesNatively = el.tagName === 'BUTTON';

    if (!focusable) {
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    }
  }

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.menu().toggleFor(this.host.nativeElement, this.data(), this.parentMenu);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const menu = this.menu();

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (menu.role() !== 'menu') return;
      event.preventDefault();
      // Opening already puts the focus on the first item.
      if (!menu.isOpenFor(this.host.nativeElement)) {
        menu.openFor(this.host.nativeElement, this.data(), this.parentMenu);
      }
      return;
    }

    if (this.activatesNatively) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle(event);
    }
  }
}
