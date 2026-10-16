# Liquid Input Component

`src/app/shared/components/liquid-input/` — accessible text/form input with fluid spring settle physics, ControlValueAccessor integration, and input masking.

## Overview

The `LiquidInput` (`<x-liquid-input>`) component renders single-line inputs, passwords, textareas, and selection menus. It coordinates tactile touch/focus feedback via the `LiquidPress` utility and supports input masks with unicode character validation.

## Architecture

- **Selector**: `x-liquid-input`
- **ControlValueAccessor**: First-class Angular Reactive Forms (`[formControl]`, `formControlName`) and template-driven (`[(value)]`) bindings.
- **Layers**:
  - `.liquid-input-press`: Wrapper responding to focus squashes.
  - `.liquid-input-field`: Container holding the input control, affixes, and action buttons.
  - `.liquid-input-control`: Native input or textarea element with normalized appearance.
- **Actions**:
  - Clear button: Appears when field has content and is clearable.
  - Reveal button: Toggles password masking state.
  - Picker trigger: Launches browser native date/time dialog.

## Custom Properties

- `--liquid-input-height`: Height of single-line input (defaults to `44px`).
- `--liquid-input-radius`: Corner radius (defaults to `12px`).
- `--liquid-input-tint`: Accent ring and focus outline color (defaults to `var(--color-primary)`).
- `--liquid-input-background`: Resting field background (defaults to `var(--gray-50)`).
- `--liquid-input-press-depth`: Tactile squash factor on focus (defaults to `0.3`).

