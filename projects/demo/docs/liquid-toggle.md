# Liquid Toggle Component

`src/app/shared/components/liquid-toggle/` — accessible switch with fluid spring physics, ControlValueAccessor support, and track/thumb fill modes.

## Overview

The `LiquidToggle` (`<x-liquid-toggle>`) component implements the WAI-ARIA `switch` role. It delivers smooth tactile squashing during press interactions and fluid spring displacement between active and inactive states.

## Architecture

- **Selector**: `x-liquid-toggle`
- **ControlValueAccessor**: First-class Angular Reactive Forms and `ngModel` compatibility.
- **Fill Modes**:
  - `track` (default): The pill track fills with primary brand accent when active.
  - `thumb`: The pill track maintains a neutral backdrop while the moving thumb adopts primary brand accent.
- **Derived Radii**:
  - Follows `inner_radius = outer_radius - padding`.
  - Outer track radius: `calc(var(--liquid-toggle-height) / 2)`.
  - Inner thumb radius: `calc((var(--liquid-toggle-height) - (var(--liquid-toggle-padding) * 2)) / 2)`.

## Custom Properties

- `--liquid-toggle-height`: Total toggle pill height (defaults to `28px`).
- `--liquid-toggle-aspect-ratio`: Aspect ratio multiplier for track width (defaults to `1.8`).
- `--liquid-toggle-padding`: Inset padding between track and thumb (defaults to `3px`).
- `--liquid-toggle-active-track`: Active track background fill (defaults to `#0969da`).
- `--liquid-toggle-inactive-track`: Inactive track background fill (defaults to `#e5e7eb`).
- `--liquid-toggle-thumb`: Moving thumb color (defaults to `#ffffff`).
- `--liquid-toggle-thumb-shadow`: Elevation shadow on thumb.

