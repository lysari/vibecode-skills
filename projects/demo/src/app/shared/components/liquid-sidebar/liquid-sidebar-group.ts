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
import { LiquidSidebar } from './liquid-sidebar';

/**
 * A categorized group of navigation items within `<x-liquid-sidebar>`.
 *
 * ```html
 * <x-liquid-sidebar-group title="Services" collapsible>
 *   <a liquidSidebarItem>PostgreSQL</a>
 *   <a liquidSidebarItem>Redis</a>
 * </x-liquid-sidebar-group>
 * ```
 *
 * Automatically harmonizes with the parent sidebar's rail state: when the sidebar
 * collapses, group headers disappear and the item list stays accessible via icons.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'liquidSidebarGroup',
  host: {
    class: 'liquid-sidebar-group',
    '[class.is-collapsed]': 'collapsed()',
    '[class.is-parent-collapsed]': 'isParentCollapsed()',
  },
  selector: 'x-liquid-sidebar-group, [liquidSidebarGroup]',
  template: `
    @if (title()) {
      <div class="liquid-sidebar-group-header">
        <span class="liquid-sidebar-group-title liquid-sidebar-hide-collapsed">{{ title() }}</span>
        @if (collapsible() && !isParentCollapsed()) {
          <button
            type="button"
            class="liquid-sidebar-group-collapse-btn"
            [attr.aria-label]="collapsed() ? 'Expand ' + title() : 'Collapse ' + title()"
            (click)="toggle()"
          >
            <svg
              class="liquid-sidebar-group-chevron"
              [class.is-open]="!collapsed()"
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
        }
      </div>
    }
    @if (!collapsed() || isParentCollapsed()) {
      <div class="liquid-sidebar-group-items">
        <ng-content />
      </div>
    }
  `,
})
export class LiquidSidebarGroup {
  private readonly sidebar = inject(LiquidSidebar, { optional: true });

  /** Section title displayed above the items. */
  readonly title = input<string>('');

  /** Whether this group can be collapsed independently while the sidebar is expanded. */
  readonly collapsible = input(false, { transform: booleanAttribute });

  /** Whether this group is collapsed. Two-way bindable: `[(collapsed)]`. */
  readonly collapsed = model(false);

  /** Whether the parent sidebar is collapsed into an icon rail. */
  readonly isParentCollapsed = computed(() => this.sidebar?.collapsed() ?? false);

  /** Toggles group collapse state. */
  toggle(): void {
    if (!this.collapsible()) return;
    this.collapsed.update((v) => !v);
  }
}

