# Liquid Sidebar Component

`src/app/shared/components/liquid-sidebar/` — fluid application sidebar container with smooth icon-rail collapse, concentric border radii, expandable sub-menus, branch dropdown menus, and glassmorphic surface styling matching the application sidebar 1:1.

## Overview

The `LiquidSidebar` (`<x-liquid-sidebar>`), `[liquidSidebarItem]` directive, `LiquidSidebarGroup` (`<x-liquid-sidebar-group>`), `LiquidSidebarSubmenu` (`<x-liquid-sidebar-submenu>`), and `LiquidSidebarIcon` (`<x-liquid-sidebar-icon>`) provide an application layout navigation panel aligned with the project's design system tokens, supporting smooth collapse into an icon rail, nested accordion sub-menus, popup branch menus, and keyboard accessibility.

## Architecture

- **Selector**: `x-liquid-sidebar, aside[liquidSidebar]`
- **Sub-components & Directives**:
  - `LiquidSidebar`: Main container host with collapse state management and landmark semantics (`role="navigation"`).
  - `LiquidSidebarItem` (`[liquidSidebarItem]`): Interactive navigation item with `LiquidPressable` squash & bounce on tap, active state styling, sub-item indentation support (`[subItem]="true"`), and collapsed title tooltips.
  - `LiquidSidebarGroup` (`<x-liquid-sidebar-group>`): Categorized navigation sections with optional independent collapsible accordion headers.
  - `LiquidSidebarSubmenu` (`<x-liquid-sidebar-submenu>`): Click-to-expand tree sub-menu item with rotating chevron indicator and nested child items container.
  - `LiquidSidebarIcon` (`<x-liquid-sidebar-icon>`): Native vector SVG glyphs matching `sidebar.html` 1:1 (`home`, `monitoring`, `environments`, `integrations`, `settings`, `grid`, `star`, `cube`, `history`, `mask`, `api`, `key`, `search`, `branch`, `chevron`).
- **Concentric Radii**:
  - Container outer radius: `--_radius: var(--liquid-sidebar-radius, var(--panel-radius, 20px))`
  - Inner item radius: `--_item-radius: var(--liquid-sidebar-item-radius, max(4px, calc(var(--_radius) - var(--_padding))))`
  - Sub-item radius: `max(0px, calc(var(--_item-radius) - 2px))`
- **Slots**:
  - `[slot=header]` / `[liquidSidebarHeader]`: Brand logo and workspace switcher slot.
  - `[slot=search]` / `[liquidSidebarSearch]`: Quick filter or search trigger input (`.search-box`).
  - Default `<ng-content>`: Navigation groups, sub-menus, and links.
  - `[slot=footer]` / `[liquidSidebarFooter]`: Bottom banner box (`.banner-box`), star badge, user account profile, and built-in collapse toggle button.

## Custom Properties

- `--liquid-sidebar-width`: Expanded width (default `280px`).
- `--liquid-sidebar-collapsed-width`: Collapsed icon rail width (default `68px`).
- `--liquid-sidebar-duration`: Transition duration for collapse/expand (default `280ms`).
- `--liquid-sidebar-easing`: Transition timing curve (default `cubic-bezier(0.2, 0.8, 0.2, 1)`).
- `--liquid-sidebar-radius`: Outer corner radius (default `var(--panel-radius, 20px)`).
- `--liquid-sidebar-padding`: Inner padding around sections (default `var(--sidebar-padding, 16px)`).
- `--liquid-sidebar-gap`: Vertical spacing between sections (default `14px`).
- `--liquid-sidebar-item-height`: Row height of navigation items (default `var(--nav-item-height, 34px)`).
- `--liquid-sidebar-item-gap`: Horizontal gap between icon and label (default `var(--space-inline-gap, 10px)`).
- `--liquid-sidebar-item-radius`: Row border radius (default `var(--control-radius, 10px)`).
- `--liquid-sidebar-bg`: Glass surface background color (default `var(--color-sidebar-bg, var(--glass-sidebar))`).
- `--liquid-sidebar-border-color`: Border color (default `var(--color-window-border, var(--glass-border))`).
- `--liquid-sidebar-active-bg`: Active item background (default `var(--color-nav-active-bg, var(--glass-nav-active))`).
- `--liquid-sidebar-active-color`: Active item accent text and icon color (default `var(--color-text-nav-active, var(--gray-900))`).
- `--liquid-sidebar-hover-bg`: Inactive item hover fill (default `rgb(255 255 255 / 0.45)`).
- `--liquid-sidebar-section-color`: Section title text color (default `var(--color-text-section, var(--gray-400))`).
- `--liquid-sidebar-shadow`: Drop shadow (default `var(--shadow-card)`).
