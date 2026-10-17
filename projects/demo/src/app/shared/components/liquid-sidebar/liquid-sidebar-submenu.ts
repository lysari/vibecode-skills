import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { LiquidSidebar } from './liquid-sidebar';
import { LiquidSidebarIcon } from './liquid-sidebar-icon';

let submenuUid = 0;

/**
 * An expandable navigation branch inside an `<x-liquid-sidebar>`.
 *
 * ```html
 * <x-liquid-sidebar-submenu title="Environments" icon="environments" [(expanded)]="isEnvOpen">
 *   <a liquidSidebarItem [subItem]="true" [active]="true">Production</a>
 *   <a liquidSidebarItem [subItem]="true">Staging</a>
 *   <a liquidSidebarItem [subItem]="true">Development</a>
 * </x-liquid-sidebar-submenu>
 * ```
 *
 * Provides a click-to-expand menu item with rotating chevron indicator and fluid grid-row animation.
 * When the parent sidebar collapses into an icon rail, nested items tuck away and the trigger
 * behaves as a centered icon.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'liquidSidebarSubmenu',
  host: {
    class: 'liquid-sidebar-submenu',
    '[class.is-expanded]': 'isOpen()',
    '[class.is-parent-collapsed]': 'isParentCollapsed()',
  },
  imports: [LiquidSidebarIcon, LiquidPressable],
  selector: 'x-liquid-sidebar-submenu, [liquidSidebarSubmenu]',
  template: `
    <button
      type="button"
      class="liquid-sidebar-item liquid-sidebar-submenu-trigger"
      [class.is-expanded]="isOpen()"
      [class.is-disabled]="disabled()"
      liquidPress
      (click)="toggle()"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-controls]="panelId()"
      [attr.aria-label]="title()"
    >
      @if (icon()) {
        <span class="liquid-sidebar-item-icon">
          <x-liquid-sidebar-icon [name]="icon()" />
        </span>
      }
      <span class="liquid-sidebar-item-label">{{ title() }}</span>
      @if (badge()) {
        <span class="liquid-sidebar-item-badge">{{ badge() }}</span>
      }
      <svg
        class="liquid-sidebar-submenu-chevron liquid-sidebar-hide-collapsed"
        [class.is-open]="isOpen()"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 9L12 15L18 9"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div
      class="liquid-sidebar-submenu-panel"
      [id]="panelId()"
      role="region"
      [class.is-open]="isOpen()"
      [attr.aria-label]="title() + ' submenu'"
      [attr.inert]="isOpen() ? null : ''"
    >
      <div class="liquid-sidebar-submenu-inner">
        <div class="liquid-sidebar-submenu-items" role="group">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class LiquidSidebarSubmenu {
  private readonly uniqueId = ++submenuUid;
  private readonly sidebar = inject(LiquidSidebar, { optional: true });

  readonly panelId = computed(() => `liquid-sidebar-sub-${this.uniqueId}`);

  /** Section label displayed on the trigger item. */
  readonly title = input<string>('');

  /** Icon name displayed on the trigger item. */
  readonly icon = input<string>('');

  /** Optional badge text or count. */
  readonly badge = input<string | number | null>(null);

  /** Whether this submenu is currently expanded. Two-way bindable: `[(expanded)]`. */
  readonly expanded = model(false);

  /** Whether the submenu trigger is disabled. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether the parent sidebar is collapsed into an icon rail. */
  readonly isParentCollapsed = computed(() => this.sidebar?.collapsed() ?? false);

  /** Effective open state considering both expanded state and parent collapsed state. */
  readonly isOpen = computed(() => this.expanded() && !this.isParentCollapsed());

  /** Toggles submenu expanded state. */
  toggle(): void {
    if (this.disabled()) return;
    this.expanded.update((v) => !v);
  }

  /** Expands the submenu. */
  expand(): void {
    if (this.disabled() || this.expanded()) return;
    this.expanded.set(true);
  }

  /** Collapses the submenu. */
  collapse(): void {
    if (this.disabled() || !this.expanded()) return;
    this.expanded.set(false);
  }
}

