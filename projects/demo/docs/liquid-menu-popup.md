# Liquid Menu Popup Component

`src/app/shared/components/liquid-menu-popup/` — trigger-anchored popup panel with origin morphing keyframe animation, Popover API promotion, and roving keyboard navigation.

## Overview

The `LiquidMenuPopup` (`<x-liquid-menu-popup>`) component and companion `[liquidMenuTriggerFor]` directive render a floating overlay that visually expands directly out of its trigger. It supports both menu roving navigation and dialog content trapping.

## Architecture

- **Directives & Components**:
  - `LiquidMenuTrigger`: `[liquidMenuTriggerFor]` directive attaching click and keyboard listeners to trigger elements.
  - `LiquidMenuPopup`: `<x-liquid-menu-popup>` floating container.
  - `LiquidMenuItem`: `[liquidMenuItem]` interactive menu choices.
  - `LiquidMenuHeader`: `[liquidMenuHeader]` template replacing default title bar.
  - `LiquidMenuFooter`: `[liquidMenuFooter]` template pinned under the scrolling body.
  - `LiquidMenuContent`: `[liquidMenuContent]` template lazily instantiated only while open.
- **Top Layer Promotion**:
  - Calls native Popover API (`element.showPopover()`) so nested transforms, frosted glass parents, and ancestor overflow clips never crop the panel.
- **Derived Radii**:
  - Outer panel radius: `var(--menu-radius, 20px)`.
  - Inner body radius: `calc(var(--menu-radius, 20px) - var(--menu-padding, 6px))` = `14px`.

## Custom Properties

- `--menu-radius`: Corner radius of the popup (defaults to `var(--panel-radius, 20px)`).
- `--menu-padding`: Inner spacing around the menu body (defaults to `6px`).
- `--menu-open-duration`: Duration of entrance grow keyframes (defaults to `320ms`).
- `--menu-close-duration`: Duration of exit shrink keyframes (defaults to `200ms`).

