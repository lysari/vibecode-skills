# Liquid Slider Component

`src/app/shared/components/liquid-slider/` — accessible slider with numerical spring physics, rubberband drag overshoot, and integrated label display.

## Overview

The `LiquidSlider` (`<x-liquid-slider>`) component renders a numeric slider with the label and value integrated into the field surface. Pointer dragging computes real-time spring acceleration and rubberband resistance past either boundary.

## Architecture

- **Selector**: `x-liquid-slider`
- **ControlValueAccessor**: First-class Angular Reactive Forms (`[formControl]`) and template-driven (`[(value)]`) bindings.
- **Layers**:
  - `.liquid-slider-field`: Interactive touch/mouse track with `ResizeObserver` coordinate tracking.
  - `.liquid-slider-fill`: Progress surface driven by real-time spring numerical integration.
  - `.liquid-slider-handle`: Tactile thumb indicator that steps aside under text in `auto` mode.
  - `.liquid-slider-tick`: Discrete step dots placed along the track.
- **Physics**:
  - `settlingSpring`: Under-damped spring providing subtle overshoots on value steps.
  - `rubberBand`: Non-linear resistance function for overdrag past boundaries.

## Custom Properties

- `--liquid-slider-height`: Total slider field height (defaults to `46px`).
- `--liquid-slider-radius`: Corner radius (defaults to `12px`).
- `--liquid-slider-fill`: Progress fill color (defaults to `#e8e9ed`).
- `--liquid-slider-tint`: Accent focus ring and active indicator (defaults to `var(--color-primary)`).
- `--liquid-slider-settle-duration`: Duration of settling spring motion (defaults to `340ms`).

