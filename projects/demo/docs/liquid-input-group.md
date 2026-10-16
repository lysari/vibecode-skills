# Liquid Input Group Component

`src/app/shared/components/liquid-input-group/` — composite form container unifying multiple input segments under a single continuous frame.

## Overview

The `LiquidInputGroup` (`<x-liquid-input-group>`) component draws a continuous pill outline and shared focus ring around multiple `<x-liquid-input bare>` controls. It aggregates child segment values into a cohesive record dictionary (`{ key: value }`).

## Architecture

- **Selector**: `x-liquid-input-group`
- **ControlValueAccessor**: Supports `[formControl]`, `formControlName`, and two-way `[(value)]` model binding with dictionary values.
- **Auto-Advance**: Focus advances to adjacent segments when a child with a fixed capacity or mask completes.
- **Layers**:
  - `.liquid-input-press`: Common tactile container responding as a single unit to focus events.
  - `.liquid-input-group-row`: Flex layout arranging segments separated by hairline dividers.

## Custom Properties

- `--liquid-input-group-height`: Unified height of group container (defaults to `44px`).
- `--liquid-input-group-radius`: Outer corner radius (defaults to `12px`).
- `--liquid-input-group-separator`: Color of dividing line between segments (defaults to `var(--gray-200)`).
- `--liquid-input-group-separator-height`: Height of inner separator line (defaults to `20px`).

