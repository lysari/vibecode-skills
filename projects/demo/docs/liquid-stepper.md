# Liquid Stepper Component

`src/app/shared/components/liquid-stepper/` — multi-step workflow navigator with liquid pour fill transitions, step validation guards, keyboard roving navigation, and synchronized animated step panels.

## Overview

The `LiquidStepper` (`<x-liquid-stepper>`) component guides users through sequential or non-linear multi-stage workflows. In line mode, a fluid line fills between step markers using numerical spring pour transitions; in pill mode, an indicator morphs beneath the active step.

## Architecture

- **Directives & Components**:
  - `LiquidStepper`: `<x-liquid-stepper>` container implementing `LiquidSwitcher` contract.
  - `LiquidStep`: `[liquidStep]` buttons rendering step markers, checks, and labels.
  - `LiquidStepPanel`: `[liquidStepPanel]` container showing step views, delegating to `LiquidTabPanel`.
  - `LiquidStepContent`: `ng-template[liquidStepContent]` lazy step view templates, integrating with Angular reactive forms (`[formGroup]`) or template-driven forms (`[control]`).
  - `LiquidStepIcon`: `[liquidStepIcon]` custom template replacement for marker number.
  - `LiquidStepDone`: `[liquidStepDone]` custom template replacement for completion checkmark.
- **Roving Focus & Accessibility**:
  - Uses pure TypeScript keyboard navigation without `@angular/cdk`: Arrow keys navigate between enabled steps with wrap-around, Home/End jump to boundary steps, and Enter/Space activate.
  - ARIA attributes `role="tablist"`, `role="tab"`, `aria-selected`, `aria-current="step"`, and `aria-controls` maintain full accessibility compliance.
- **Derived Radii & Geometry**:
  - Outer pill radius: `var(--liquid-stepper-radius, 999px)`.
  - Inner step radius: `calc(var(--liquid-stepper-radius) - var(--liquid-stepper-padding))` matching `inner_radius = outer_radius - padding`.

## Custom Properties

- `--liquid-stepper-color`: Primary theme color for line fill and active markers (defaults to `#0066d6`).
- `--liquid-stepper-marker-size`: Diameter of the circular marker (defaults to `32px` in line mode, `22px` in pill mode).
- `--liquid-stepper-gap`: Spacing between adjacent steps (defaults to `0px`).
- `--liquid-stepper-duration`: Transition speed of fluid pour keyframes (defaults to `340ms`).
- `--liquid-stepper-pull`: Dynamic fluid elongation during pour animation (defaults to `10px`).
- `--liquid-stepper-line-size`: Thickness of the connecting progress line (defaults to `3px`).

