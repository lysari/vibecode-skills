import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';

export type LiquidSidebarPosition = 'left' | 'right';
export type LiquidSidebarVariant = 'docked' | 'floating' | 'ghost';

/**
 * A fluid application sidebar container with smooth rail collapse, glassmorphic styling,
 * and built-in support for header brand, search trigger, navigation sections, and footer actions.
 *
 * ```html
 * <x-liquid-sidebar [(collapsed)]="isCollapsed">
 *   <div slot="header">...</div>
 *   <div slot="search">...</div>
 *   <x-liquid-sidebar-group title="Platform">
 *     <a liquidSidebarItem [active]="true">Overview</a>
 *     <a liquidSidebarItem>Settings</a>
 *   </x-liquid-sidebar-group>
 *   <div slot="footer">...</div>
 * </x-liquid-sidebar>
 * ```
 *
 * Sizing and appearance are driven entirely by `--liquid-sidebar-*` custom properties:
 * - `--liquid-sidebar-width`: expanded width (default 280px)
 * - `--liquid-sidebar-collapsed-width`: collapsed icon rail width (default 68px)
 * - `--liquid-sidebar-duration`: transition time for collapse/expand (default 320ms)
 * - `--liquid-sidebar-radius`: outer corner radius
 * - `--liquid-sidebar-padding`: inner padding
 * - `--liquid-sidebar-gap`: vertical spacing between sections
 * - `--liquid-sidebar-item-height`: row height for navigation items
 *
 * Inner elements calculate their corner radius from the container radius and padding
 * to maintain concentric curves: `inner_radius = outer_radius - padding`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'liquidSidebar',
  host: {
    class: 'x-liquid-sidebar',
    '[class.is-collapsed]': 'collapsed()',
    '[class.is-docked]': "variant() === 'docked'",
    '[class.is-floating]': "variant() === 'floating'",
    '[class.is-ghost]': "variant() === 'ghost'",
    '[class.is-bordered]': 'bordered()',
    '[class.is-right]': "position() === 'right'",
    '[attr.aria-expanded]': '!collapsed()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.role]': 'role()',
  },
  imports: [LiquidPressable],
  selector: 'x-liquid-sidebar, aside[liquidSidebar]',
  styleUrl: './liquid-sidebar.scss',
  templateUrl: './liquid-sidebar.html',
})
export class LiquidSidebar {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Whether the sidebar is collapsed to an icon rail. Two-way bindable: `[(collapsed)]`. */
  readonly collapsed = model<boolean>(false);

  /** Whether the sidebar allows interactive collapsing. */
  readonly collapsible = input<boolean, unknown>(true, { transform: booleanAttribute });

  /** Placement along the layout: 'left' or 'right'. */
  readonly position = input<LiquidSidebarPosition>('left');

  /** Visual surface style: 'docked' (flush shell pane), 'floating' (card island), or 'ghost' (transparent). */
  readonly variant = input<LiquidSidebarVariant>('docked');

  /** Whether to draw a border along the sidebar boundary. */
  readonly bordered = input<boolean, unknown>(true, { transform: booleanAttribute });

  /** Whether to render the built-in footer collapse toggle button. */
  readonly showToggle = input<boolean, unknown>(true, { transform: booleanAttribute });

  /** Accessible label for the sidebar landmark. */
  readonly ariaLabel = input<string>('Sidebar navigation');

  /** Landmark role for the host element. */
  readonly role = input<string>('navigation');

  /** Emitted whenever the sidebar is collapsed or expanded. */
  readonly toggle = output<boolean>();

  /** Toggles between expanded and collapsed rail mode. */
  toggleCollapse(): void {
    if (!this.collapsible()) return;
    const next = !this.collapsed();
    this.collapsed.set(next);
    this.toggle.emit(next);
  }

  /** Expands the sidebar to full width. */
  expand(): void {
    if (!this.collapsed()) return;
    this.collapsed.set(false);
    this.toggle.emit(false);
  }

  /** Collapses the sidebar to icon rail width. */
  collapse(): void {
    if (!this.collapsible() || this.collapsed()) return;
    this.collapsed.set(true);
    this.toggle.emit(true);
  }
}

export { LiquidSidebarItem } from './liquid-sidebar-item.directive';
export { LiquidSidebarGroup } from './liquid-sidebar-group';
export { LiquidSidebarSubmenu } from './liquid-sidebar-submenu';
export { LiquidSidebarIcon } from './liquid-sidebar-icon';

