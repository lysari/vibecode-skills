import { ApiRow, Section } from '@app/pages/components-docs/liquid-input-docs/liquid-input-docs.reference';

export interface SidebarTune {
  name: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  default: number;
}

export interface SidebarDemoItem {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
  route?: string;
}

export const SIDEBAR_SECTIONS: Section[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'playground', title: 'Playground' },
  { id: 'expand-menu', title: 'Expand Menu' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'variants', title: 'Variants' },
  { id: 'rail', title: 'Rail Collapse' },
  { id: 'setup', title: 'Setup' },
  { id: 'api', title: 'API Reference' },
];

export const SIDEBAR_PROJECT_ITEMS: SidebarDemoItem[] = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'integrations', label: 'Integrations', icon: 'integrations' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export const SIDEBAR_BRANCH_ITEMS: SidebarDemoItem[] = [
  { id: 'branch-overview', label: 'Overview', icon: 'grid' },
  { id: 'monitoring', label: 'Monitoring', icon: 'monitoring', badge: 'Live' },
  { id: 'sql-editor', label: 'SQL Editor', icon: 'star' },
  { id: 'configuration', label: 'Configuration', icon: 'cube' },
  { id: 'backup-restore', label: 'Backup & Restore', icon: 'history' },
  { id: 'data-masking', label: 'Data Masking', icon: 'mask' },
];

export const SIDEBAR_PLATFORM_ITEMS: SidebarDemoItem[] = [
  { id: 'api-access', label: 'API Access', icon: 'api' },
  { id: 'authentication', label: 'Authentication', icon: 'key' },
];

export const SIDEBAR_API: ApiRow[] = [
  {
    name: 'collapsed',
    type: 'boolean',
    value: 'false',
    does: 'Whether the sidebar is collapsed into an icon rail. Two-way bindable via [(collapsed)].',
  },
  {
    name: 'collapsible',
    type: 'boolean',
    value: 'true',
    does: 'Whether the sidebar allows collapsing into rail mode.',
  },
  {
    name: 'variant',
    type: "'docked' | 'floating' | 'ghost'",
    value: "'docked'",
    does: 'Surface and layout style.',
  },
  {
    name: 'position',
    type: "'left' | 'right'",
    value: "'left'",
    does: 'Sidebar placement side.',
  },
  {
    name: 'bordered',
    type: 'boolean',
    value: 'true',
    does: 'Whether to render borders around the sidebar container.',
  },
  {
    name: 'showToggle',
    type: 'boolean',
    value: 'true',
    does: 'Whether to render the built-in footer collapse toggle button.',
  },
  {
    name: 'ariaLabel',
    type: 'string',
    value: "'Sidebar navigation'",
    does: 'Accessible label for the sidebar landmark.',
  },
  {
    name: 'role',
    type: 'string',
    value: "'navigation'",
    does: 'Landmark role attribute for the host element.',
  },
];

export const SIDEBAR_OUTPUTS: ApiRow[] = [
  {
    name: 'collapsedChange',
    type: 'EventEmitter<boolean>',
    does: 'Emitted when the collapsed state changes.',
  },
  {
    name: 'toggle',
    type: 'EventEmitter<boolean>',
    does: 'Emitted when the sidebar is collapsed or expanded.',
  },
];

export const SIDEBAR_ITEM_API: ApiRow[] = [
  {
    name: 'active',
    type: 'boolean',
    value: 'false',
    does: 'Whether the item represents the current active route or view.',
  },
  {
    name: 'subItem',
    type: 'boolean',
    value: 'false',
    does: 'Whether this item is a nested child row inside an expandable submenu.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    value: 'false',
    does: 'Disables user interactions and removes item from tab order.',
  },
  {
    name: 'badge',
    type: 'string | number | null',
    value: 'null',
    does: 'Optional status counter or badge displayed on the right.',
  },
  {
    name: 'tooltip',
    type: 'string',
    value: "''",
    does: 'Custom tooltip label rendered when the sidebar is collapsed.',
  },
];

export const SIDEBAR_SUBMENU_API: ApiRow[] = [
  {
    name: 'title',
    type: 'string',
    value: "''",
    does: 'Trigger label for the expandable submenu row.',
  },
  {
    name: 'icon',
    type: 'string',
    value: "''",
    does: 'Icon name rendered inside the submenu trigger.',
  },
  {
    name: 'expanded',
    type: 'boolean',
    value: 'false',
    does: 'Whether the submenu is currently open. Two-way bindable via [(expanded)].',
  },
  {
    name: 'badge',
    type: 'string | number | null',
    value: 'null',
    does: 'Optional badge text or counter next to the title.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    value: 'false',
    does: 'Disables submenu expansion.',
  },
];

export const SIDEBAR_GROUP_API: ApiRow[] = [
  {
    name: 'title',
    type: 'string',
    value: "''",
    does: 'Section title text for the category group.',
  },
  {
    name: 'collapsible',
    type: 'boolean',
    value: 'false',
    does: 'Whether the section can be collapsed independently.',
  },
  {
    name: 'collapsed',
    type: 'boolean',
    value: 'false',
    does: 'Whether the section is collapsed. Two-way bindable via [(collapsed)].',
  },
];

export const SIDEBAR_CSS: ApiRow[] = [
  {
    name: '--liquid-sidebar-width',
    type: '280px',
    does: 'Expanded sidebar width.',
  },
  {
    name: '--liquid-sidebar-collapsed-width',
    type: '68px',
    does: 'Collapsed icon rail width.',
  },
  {
    name: '--liquid-sidebar-duration',
    type: '280ms',
    does: 'Animation transition duration for collapsing and expanding.',
  },
  {
    name: '--liquid-sidebar-radius',
    type: 'var(--panel-radius, 20px)',
    does: 'Outer corner radius of the sidebar container.',
  },
  {
    name: '--liquid-sidebar-padding',
    type: 'var(--sidebar-padding, 16px)',
    does: 'Internal padding around the sidebar content.',
  },
  {
    name: '--liquid-sidebar-gap',
    type: '14px',
    does: 'Vertical gap between sections and items.',
  },
  {
    name: '--liquid-sidebar-item-height',
    type: 'var(--nav-item-height, 34px)',
    does: 'Row height of navigation items.',
  },
  {
    name: '--liquid-sidebar-item-gap',
    type: 'var(--space-inline-gap, 10px)',
    does: 'Horizontal gap between icon and label.',
  },
  {
    name: '--liquid-sidebar-bg',
    type: 'var(--color-sidebar-bg)',
    does: 'Background color and glass surface tint.',
  },
  {
    name: '--liquid-sidebar-border-color',
    type: 'var(--color-window-border)',
    does: 'Color of the sidebar outer border.',
  },
  {
    name: '--liquid-sidebar-active-bg',
    type: 'var(--color-nav-active-bg)',
    does: 'Background surface for the active navigation item.',
  },
  {
    name: '--liquid-sidebar-active-color',
    type: 'var(--color-text-nav-active)',
    does: 'Accent text and icon color for the active item.',
  },
];

export const SIDEBAR_TUNES: SidebarTune[] = [
  {
    name: '--liquid-sidebar-width',
    min: 220,
    max: 360,
    step: 10,
    unit: 'px',
    default: 280,
  },
  {
    name: '--liquid-sidebar-collapsed-width',
    min: 56,
    max: 88,
    step: 4,
    unit: 'px',
    default: 68,
  },
  {
    name: '--liquid-sidebar-radius',
    min: 0,
    max: 32,
    step: 2,
    unit: 'px',
    default: 20,
  },
  {
    name: '--liquid-sidebar-padding',
    min: 8,
    max: 24,
    step: 2,
    unit: 'px',
    default: 16,
  },
  {
    name: '--liquid-sidebar-gap',
    min: 6,
    max: 24,
    step: 2,
    unit: 'px',
    default: 14,
  },
  {
    name: '--liquid-sidebar-item-height',
    min: 28,
    max: 48,
    step: 2,
    unit: 'px',
    default: 34,
  },
];

export const SIDEBAR_SETUP = `import {
  LiquidSidebar,
  LiquidSidebarGroup,
  LiquidSidebarItem,
  LiquidSidebarSubmenu,
  LiquidSidebarIcon,
} from '@app/shared/components/liquid-sidebar/liquid-sidebar';

@Component({
  imports: [
    LiquidSidebar,
    LiquidSidebarGroup,
    LiquidSidebarItem,
    LiquidSidebarSubmenu,
    LiquidSidebarIcon,
  ],
  template: \`
    <x-liquid-sidebar [(collapsed)]="isCollapsed">
      <!-- Search Box -->
      <div slot="search" class="search-box">
        <button type="button" class="search-trigger" liquidPress>
          <x-liquid-sidebar-icon name="search" class="search-icon" />
          <span class="search-placeholder">Search...</span>
          <kbd class="hotkey">/</kbd>
        </button>
      </div>

      <!-- Navigation Section -->
      <div class="nav-section">
        <div class="section-title">Project</div>

        <!-- Expandable Submenu -->
        <x-liquid-sidebar-submenu title="Environments" icon="environments" [(expanded)]="envExpanded">
          <a liquidSidebarItem [subItem]="true" [active]="true">Production</a>
          <a liquidSidebarItem [subItem]="true">Staging</a>
          <a liquidSidebarItem [subItem]="true">Development</a>
        </x-liquid-sidebar-submenu>

        <a liquidSidebarItem>
          <x-liquid-sidebar-icon name="integrations" />
          <span class="liquid-sidebar-item-label">Integrations</span>
        </a>
      </div>

      <!-- Banner Box -->
      <div slot="footer" class="banner-box">
        <div class="star-badge">
          <x-liquid-sidebar-icon name="star" />
        </div>
        <span class="banner-label">Scale your infrastructure</span>
      </div>
    </x-liquid-sidebar>
  \`,
})
export class ShellComponent {
  isCollapsed = false;
  envExpanded = true;
}`;

