import {
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { LiquidSidebar } from './liquid-sidebar';

/**
 * A navigation item inside an `<x-liquid-sidebar>`.
 *
 * ```html
 * <a liquidSidebarItem [active]="isActive" routerLink="/dashboard">
 *   <svg class="liquid-sidebar-item-icon">...</svg>
 *   <span class="liquid-sidebar-item-label">Dashboard</span>
 *   <span class="liquid-sidebar-item-badge">4</span>
 * </a>
 * ```
 *
 * Integrates directly with {@link LiquidPressable} to squash and bounce on tap/click.
 * When the parent sidebar collapses into an icon rail, labels smoothly tuck away and
 * the item centers its icon. Hovering or focusing an item in collapsed mode exposes
 * the item label via title tooltip.
 */
@Directive({
  exportAs: 'liquidSidebarItem',
  host: {
    class: 'liquid-sidebar-item',
    '[class.is-active]': 'active()',
    '[class.is-disabled]': 'disabled()',
    '[class.is-collapsed]': 'isCollapsed()',
    '[class.is-sub-item]': 'subItem()',
    '[attr.aria-current]': 'active() ? "page" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.title]': 'effectiveTitle()',
  },
  hostDirectives: [LiquidPressable],
  selector: '[liquidSidebarItem], a[liquidSidebarItem], button[liquidSidebarItem]',
})
export class LiquidSidebarItem {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly sidebar = inject(LiquidSidebar, { optional: true });

  /** Marks this item as the currently active destination. */
  readonly active = input(false, { transform: booleanAttribute });

  /** Whether this item is a nested sub-item inside an expandable submenu. */
  readonly subItem = input(false, { transform: booleanAttribute });

  /** Whether the item is disabled and inaccessible. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Optional badge count or status pill. */
  readonly badge = input<string | number | null>(null);

  /** Optional tooltip text to show, especially when collapsed in rail mode. */
  readonly tooltip = input<string>('');

  /** Tracks whether the containing sidebar is currently collapsed. */
  readonly isCollapsed = computed(() => this.sidebar?.collapsed() ?? false);

  /** Title tooltip when collapsed if custom tooltip is absent. */
  protected readonly effectiveTitle = computed(() => {
    if (this.tooltip()) return this.tooltip();
    if (this.isCollapsed()) {
      return (
        this.element.getAttribute('aria-label') ||
        this.element.textContent?.trim() ||
        this.element.innerText?.trim() ||
        ''
      );
    }
    return null;
  });
}
