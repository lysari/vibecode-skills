# Liquid Morph Menu Component

`src/app/shared/components/liquid-morph-menu/` — floating icon/tab toolbar with a continuous fluid highlight indicator driven by `pourKeyframes`.

## Overview

The `LiquidMorphMenu` (`<x-liquid-morph-menu>`) component and `[liquidMorphItem]` directive render an interactive horizontal or vertical strip with a single morphing highlight indicator that flows between items.

## Architecture

- **Selector**: `x-liquid-morph-menu`
- **Directive**: `[liquidMorphItem]` with `LiquidPressable` integration.
- **Layers**:
  - `.liquid-morph-indicator`: Background indicator layer moving via Web Animations API keyframes.
  - `.liquid-morph-item`: Projected interactive elements.
- **Derived Radii**:
  - Indicator radius: `var(--liquid-morph-radius, 999px)`.
  - Pill container: `var(--pill-radius, 999px)`.

## Custom Properties

- `--liquid-morph-color`: Highlight fill tint (defaults to `rgba(15, 98, 254, 0.12)`).
- `--liquid-morph-radius`: Indicator corner radius (defaults to `999px`).
- `--liquid-morph-duration`: Transition duration across items (defaults to `340ms`).
- `--liquid-morph-pull`: Liquid stretch distance before moving (defaults to `10px`).

