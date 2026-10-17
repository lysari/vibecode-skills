import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LiquidMenuContent } from '@app/shared/components/liquid-menu-popup/liquid-menu-content.directive';
import { LiquidMenuItem } from '@app/shared/components/liquid-menu-popup/liquid-menu-item.directive';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';
import {
  LiquidSidebar,
  LiquidSidebarGroup,
  LiquidSidebarIcon,
  LiquidSidebarItem,
  LiquidSidebarSubmenu,
  type LiquidSidebarPosition,
  type LiquidSidebarVariant,
} from '@app/shared/components/liquid-sidebar/liquid-sidebar';
import {
  SIDEBAR_API,
  SIDEBAR_BRANCH_ITEMS,
  SIDEBAR_CSS,
  SIDEBAR_GROUP_API,
  SIDEBAR_ITEM_API,
  SIDEBAR_OUTPUTS,
  SIDEBAR_PLATFORM_ITEMS,
  SIDEBAR_PROJECT_ITEMS,
  SIDEBAR_SECTIONS,
  SIDEBAR_SETUP,
  SIDEBAR_SUBMENU_API,
  SIDEBAR_TUNES,
} from '@app/shared/constants/liquid-sidebar-docs.constant';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    LiquidPressable,
    LiquidSidebar,
    LiquidSidebarGroup,
    LiquidSidebarItem,
    LiquidSidebarSubmenu,
    LiquidSidebarIcon,
    LiquidMenuPopup,
    LiquidMenuTrigger,
    LiquidMenuItem,
    LiquidMenuContent,
  ],
  selector: 'app-liquid-sidebar-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-sidebar-docs.scss'],
  templateUrl: './liquid-sidebar-docs.html',
})
export class LiquidSidebarDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly sections = SIDEBAR_SECTIONS;
  protected readonly projectItems = SIDEBAR_PROJECT_ITEMS;
  protected readonly branchItems = SIDEBAR_BRANCH_ITEMS;
  protected readonly platformItems = SIDEBAR_PLATFORM_ITEMS;
  protected readonly tunes = SIDEBAR_TUNES;
  protected readonly setupCode = SIDEBAR_SETUP;

  protected readonly sidebarApi = SIDEBAR_API;
  protected readonly sidebarOutputs = SIDEBAR_OUTPUTS;
  protected readonly itemApi = SIDEBAR_ITEM_API;
  protected readonly submenuApi = SIDEBAR_SUBMENU_API;
  protected readonly groupApi = SIDEBAR_GROUP_API;
  protected readonly cssApi = SIDEBAR_CSS;

  protected readonly activePlayItem = signal('monitoring');
  protected readonly currentBranch = signal('production');
  protected readonly branches = ['production', 'staging', 'preview-feature-auth', 'dev'];

  protected readonly envExpanded = signal(true);
  protected readonly subActiveItem = signal('prod');
  protected readonly demoSubExpanded = signal(true);

  protected readonly play = {
    collapsed: signal(false),
    collapsible: signal(true),
    variant: signal<LiquidSidebarVariant>('docked'),
    position: signal<LiquidSidebarPosition>('left'),
    bordered: signal(true),
    showToggle: signal(true),
    disabledItem: signal(false),
    customBadge: signal('Live'),
    tuned: signal<Record<string, number>>({}),
  };

  protected readonly playLog = signal('Ready');

  protected readonly playStyle = computed(() => {
    const style: Record<string, string> = {};
    for (const tune of this.tunes) {
      const val = this.play.tuned()[tune.name];
      if (val !== undefined) {
        style[tune.name] = `${val}${tune.unit}`;
      }
    }
    return style;
  });

  protected readonly playMarkup = computed(() => {
    const p = this.play;
    const attrs = [
      p.collapsed() ? ' [(collapsed)]="isCollapsed"' : '',
      !p.collapsible() ? ' [collapsible]="false"' : '',
      p.variant() !== 'docked' ? ` variant="${p.variant()}"` : '',
      p.position() !== 'left' ? ` position="${p.position()}"` : '',
      !p.bordered() ? ' [bordered]="false"' : '',
      !p.showToggle() ? ' [showToggle]="false"' : '',
    ].filter(Boolean).join('');

    const styles = Object.entries(this.playStyle())
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');

    return [
      `<x-liquid-sidebar${attrs}${styles ? ` style="${styles}"` : ''} (toggle)="onToggle($event)">`,
      `  <div slot="search" class="search-box">`,
      `    <button type="button" class="search-trigger" liquidPress>`,
      `      <x-liquid-sidebar-icon name="search" class="search-icon" />`,
      `      <span class="search-placeholder">Search...</span>`,
      `      <kbd class="hotkey">/</kbd>`,
      `    </button>`,
      `  </div>`,
      ``,
      `  <div class="nav-section">`,
      `    <div class="section-title">Project</div>`,
      `    <a liquidSidebarItem>`,
      `      <x-liquid-sidebar-icon name="home" />`,
      `      <span class="liquid-sidebar-item-label">Overview</span>`,
      `    </a>`,
      `    <x-liquid-sidebar-submenu title="Environments" icon="environments" [(expanded)]="envOpen">`,
      `      <a liquidSidebarItem [subItem]="true" [active]="true">Production</a>`,
      `      <a liquidSidebarItem [subItem]="true">Staging</a>`,
      `      <a liquidSidebarItem [subItem]="true">Development</a>`,
      `    </x-liquid-sidebar-submenu>`,
      `    <a liquidSidebarItem>`,
      `      <x-liquid-sidebar-icon name="integrations" />`,
      `      <span class="liquid-sidebar-item-label">Integrations</span>`,
      `    </a>`,
      `  </div>`,
      ``,
      `  <div class="nav-section">`,
      `    <div class="section-title">Branch</div>`,
      `    <button type="button" class="branch-selector" liquidPress [liquidMenuTriggerFor]="branchMenu">`,
      `      <x-liquid-sidebar-icon name="branch" class="branch-icon" />`,
      `      <span class="branch-label">{{ currentBranch }}</span>`,
      `      <x-liquid-sidebar-icon name="chevron" class="chevron-duo" />`,
      `    </button>`,
      `    <a liquidSidebarItem [active]="true">`,
      `      <x-liquid-sidebar-icon name="monitoring" />`,
      `      <span class="liquid-sidebar-item-label">Monitoring</span>`,
      `      <span class="liquid-sidebar-item-badge">Live</span>`,
      `    </a>`,
      `  </div>`,
      ``,
      `  <div slot="footer" class="banner-box">`,
      `    <div class="star-badge">`,
      `      <x-liquid-sidebar-icon name="star" />`,
      `    </div>`,
      `    <span class="banner-label">Scale your infrastructure</span>`,
      `  </div>`,
      `</x-liquid-sidebar>`,
    ].filter(Boolean).join('\n');
  });

  protected onToggle(collapsed: boolean): void {
    this.play.collapsed.set(collapsed);
    this.playLog.set(`toggle(${collapsed}) fired at ${new Date().toLocaleTimeString()}`);
  }

  protected setCollapsed(val: boolean): void {
    this.play.collapsed.set(val);
    this.playLog.set(`setCollapsed(${val}) called`);
  }

  protected toggleCollapse(): void {
    const next = !this.play.collapsed();
    this.play.collapsed.set(next);
    this.playLog.set(`toggleCollapse() -> ${next}`);
  }

  protected selectBranch(branch: string): void {
    this.currentBranch.set(branch);
    this.playLog.set(`Switched branch to ${branch}`);
  }

  protected setVariant(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as LiquidSidebarVariant;
    this.play.variant.set(val);
  }

  protected setPosition(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as LiquidSidebarPosition;
    this.play.position.set(val);
  }

  protected setTune(name: string, event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.play.tuned.update((current) => ({ ...current, [name]: val }));
  }

  protected resetTunes(): void {
    this.play.tuned.set({});
  }

  protected applyCompactPreset(): void {
    this.play.tuned.set({
      '--liquid-sidebar-width': 220,
      '--liquid-sidebar-collapsed-width': 60,
      '--liquid-sidebar-radius': 12,
      '--liquid-sidebar-padding': 10,
      '--liquid-sidebar-gap': 8,
      '--liquid-sidebar-item-height': 30,
    });
  }

  protected applyLargePreset(): void {
    this.play.tuned.set({
      '--liquid-sidebar-width': 320,
      '--liquid-sidebar-collapsed-width': 74,
      '--liquid-sidebar-radius': 24,
      '--liquid-sidebar-padding': 18,
      '--liquid-sidebar-gap': 16,
      '--liquid-sidebar-item-height': 42,
    });
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    const el = this.document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
