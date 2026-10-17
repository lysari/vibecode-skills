import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LiquidSidebar,
  LiquidSidebarGroup,
  LiquidSidebarIcon,
  LiquidSidebarItem,
  LiquidSidebarSubmenu,
  type LiquidSidebarPosition,
  type LiquidSidebarVariant,
} from '@app/shared/components/liquid-sidebar/liquid-sidebar';

@Component({
  imports: [
    LiquidSidebar,
    LiquidSidebarGroup,
    LiquidSidebarItem,
    LiquidSidebarSubmenu,
    LiquidSidebarIcon,
  ],
  template: `
    <x-liquid-sidebar
      #sidebar="liquidSidebar"
      [(collapsed)]="collapsed"
      [collapsible]="collapsible()"
      [variant]="variant()"
      [position]="position()"
      [bordered]="bordered()"
      [showToggle]="showToggle()"
      [ariaLabel]="ariaLabel()"
      (toggle)="onToggle($event)"
    >
      <div slot="header" id="test-header">Brand Logo</div>
      <div slot="search" id="test-search">Search Input</div>

      <x-liquid-sidebar-group id="test-group" title="Platform" [collapsible]="groupCollapsible()">
        <a
          id="item-overview"
          liquidSidebarItem
          [active]="activeItem() === 'overview'"
          (click)="activeItem.set('overview')"
        >
          <x-liquid-sidebar-icon name="home" />
          <span class="liquid-sidebar-item-label">Overview</span>
          <span class="liquid-sidebar-item-badge">4</span>
        </a>

        <x-liquid-sidebar-submenu
          id="test-submenu"
          title="Environments"
          icon="environments"
          [(expanded)]="submenuExpanded"
        >
          <a id="subitem-prod" liquidSidebarItem [subItem]="true" [active]="true">Production</a>
          <a id="subitem-stage" liquidSidebarItem [subItem]="true">Staging</a>
        </x-liquid-sidebar-submenu>

        <button
          id="item-settings"
          type="button"
          liquidSidebarItem
          [disabled]="settingsDisabled()"
          [active]="activeItem() === 'settings'"
        >
          <x-liquid-sidebar-icon name="settings" />
          <span class="liquid-sidebar-item-label">Settings</span>
        </button>
      </x-liquid-sidebar-group>

      <div slot="footer" id="test-footer">User Account</div>
    </x-liquid-sidebar>
  `,
})
class Host {
  readonly collapsed = signal(false);
  readonly collapsible = signal(true);
  readonly variant = signal<LiquidSidebarVariant>('docked');
  readonly position = signal<LiquidSidebarPosition>('left');
  readonly bordered = signal(true);
  readonly showToggle = signal(true);
  readonly ariaLabel = signal('App navigation');
  readonly activeItem = signal('overview');
  readonly settingsDisabled = signal(false);
  readonly groupCollapsible = signal(true);
  readonly submenuExpanded = signal(false);

  latestToggleEvent: boolean | null = null;

  onToggle(val: boolean): void {
    this.latestToggleEvent = val;
  }
}

describe('LiquidSidebar', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('renders with default dock variant, expanded state, and proper ARIA landmarks', () => {
    const sidebarEl = q('x-liquid-sidebar');
    expect(sidebarEl).not.toBeNull();
    expect(sidebarEl.classList).toContain('x-liquid-sidebar');
    expect(sidebarEl.classList).toContain('is-docked');
    expect(sidebarEl.classList).toContain('is-bordered');
    expect(sidebarEl.classList).not.toContain('is-collapsed');
    expect(sidebarEl.getAttribute('aria-expanded')).toBe('true');
    expect(sidebarEl.getAttribute('aria-label')).toBe('App navigation');
    expect(sidebarEl.getAttribute('role')).toBe('navigation');
  });

  it('projects header, search, navigation groups, and footer slots', () => {
    expect(q('#test-header')?.textContent?.trim()).toBe('Brand Logo');
    expect(q('#test-search')?.textContent?.trim()).toBe('Search Input');
    expect(q('#test-group')).not.toBeNull();
    expect(q('#test-footer')?.textContent?.trim()).toBe('User Account');
  });

  it('collapses and expands via the toggle button and emits toggle event', async () => {
    const toggleBtn = q<HTMLButtonElement>('.liquid-sidebar-toggle-btn');
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn.getAttribute('aria-label')).toBe('Collapse sidebar');

    toggleBtn.click();
    await settle();

    const sidebarEl = q('x-liquid-sidebar');
    expect(sidebarEl.classList).toContain('is-collapsed');
    expect(sidebarEl.getAttribute('aria-expanded')).toBe('false');
    expect(host.collapsed()).toBe(true);
    expect(host.latestToggleEvent).toBe(true);
    expect(toggleBtn.getAttribute('aria-label')).toBe('Expand sidebar');

    toggleBtn.click();
    await settle();

    expect(sidebarEl.classList).not.toContain('is-collapsed');
    expect(sidebarEl.getAttribute('aria-expanded')).toBe('true');
    expect(host.collapsed()).toBe(false);
    expect(host.latestToggleEvent).toBe(false);
  });

  it('supports programmatic expand() and collapse() methods', async () => {
    const sidebarInstance = fixture.debugElement.children[0].references['sidebar'] as LiquidSidebar;
    expect(sidebarInstance).not.toBeNull();

    sidebarInstance.collapse();
    await settle();
    expect(host.collapsed()).toBe(true);
    expect(host.latestToggleEvent).toBe(true);

    sidebarInstance.expand();
    await settle();
    expect(host.collapsed()).toBe(false);
    expect(host.latestToggleEvent).toBe(false);
  });

  it('does not collapse when collapsible is false', async () => {
    host.collapsible.set(false);
    await settle();

    expect(q('.liquid-sidebar-toggle-btn')).toBeNull();

    const sidebarInstance = fixture.debugElement.children[0].references['sidebar'] as LiquidSidebar;
    sidebarInstance.toggleCollapse();
    await settle();

    expect(host.collapsed()).toBe(false);
    expect(q('x-liquid-sidebar').classList).not.toContain('is-collapsed');
  });

  it('carries variant and position classes', async () => {
    host.variant.set('floating');
    host.position.set('right');
    await settle();

    const sidebarEl = q('x-liquid-sidebar');
    expect(sidebarEl.classList).toContain('is-floating');
    expect(sidebarEl.classList).toContain('is-right');
    expect(sidebarEl.classList).not.toContain('is-docked');

    host.variant.set('ghost');
    await settle();
    expect(sidebarEl.classList).toContain('is-ghost');
  });

  it('applies active and disabled states to LiquidSidebarItem', async () => {
    const itemOverview = q('#item-overview');
    const itemSettings = q('#item-settings');

    expect(itemOverview.classList).toContain('is-active');
    expect(itemOverview.getAttribute('aria-current')).toBe('page');
    expect(itemSettings.classList).not.toContain('is-active');
    expect(itemSettings.getAttribute('aria-current')).toBeNull();

    host.settingsDisabled.set(true);
    await settle();

    expect(itemSettings.classList).toContain('is-disabled');
    expect(itemSettings.getAttribute('aria-disabled')).toBe('true');
    expect(itemSettings.getAttribute('tabindex')).toBe('-1');
  });

  it('updates items and titles when sidebar is collapsed in rail mode', async () => {
    const itemOverview = q('#item-overview');
    expect(itemOverview.classList).not.toContain('is-collapsed');

    host.collapsed.set(true);
    await settle();

    expect(itemOverview.classList).toContain('is-collapsed');
    expect(itemOverview.getAttribute('title')).toContain('Overview');
  });

  it('supports collapsible group toggle', async () => {
    const groupEl = q('#test-group');
    expect(groupEl.classList).not.toContain('is-collapsed');

    const groupCollapseBtn = q<HTMLButtonElement>('.liquid-sidebar-group-collapse-btn');
    expect(groupCollapseBtn).not.toBeNull();

    groupCollapseBtn.click();
    await settle();

    expect(groupEl.classList).toContain('is-collapsed');
    expect(q('.liquid-sidebar-group-items')).toBeNull();

    groupCollapseBtn.click();
    await settle();

    expect(groupEl.classList).not.toContain('is-collapsed');
    expect(q('.liquid-sidebar-group-items')).not.toBeNull();
  });

  it('toggles expandable submenu and displays nested child items', async () => {
    const submenuEl = q('#test-submenu');
    expect(submenuEl).not.toBeNull();
    expect(submenuEl.classList).not.toContain('is-expanded');

    const panel = submenuEl.querySelector<HTMLElement>('.liquid-sidebar-submenu-panel')!;
    expect(panel).not.toBeNull();
    expect(panel.hasAttribute('inert')).toBe(true);
    expect(panel.classList).not.toContain('is-open');

    const triggerBtn = q<HTMLButtonElement>('.liquid-sidebar-submenu-trigger');
    expect(triggerBtn).not.toBeNull();
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
    expect(triggerBtn.getAttribute('aria-controls')).toBe(panel.id);

    triggerBtn.click();
    await settle();

    expect(submenuEl.classList).toContain('is-expanded');
    expect(host.submenuExpanded()).toBe(true);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hasAttribute('inert')).toBe(false);
    expect(panel.classList).toContain('is-open');

    const subitemProd = q('#subitem-prod');
    expect(subitemProd).not.toBeNull();
    expect(subitemProd.classList).toContain('is-sub-item');
    expect(subitemProd.classList).toContain('is-active');

    triggerBtn.click();
    await settle();

    expect(submenuEl.classList).not.toContain('is-expanded');
    expect(host.submenuExpanded()).toBe(false);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hasAttribute('inert')).toBe(true);
    expect(panel.classList).not.toContain('is-open');
  });

  it('renders native vector SVG icons without external font dependencies', () => {
    const iconHosts = fixture.nativeElement.querySelectorAll('x-liquid-sidebar-icon');
    expect(iconHosts.length).toBeGreaterThan(0);
    iconHosts.forEach((hostEl: HTMLElement) => {
      const svg = hostEl.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg?.querySelectorAll('path, circle').length).toBeGreaterThan(0);
    });
  });
});


