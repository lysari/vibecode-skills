# Liquid Button Component

`src/app/shared/components/liquid-button/` — adaptive interactive button and anchor directive with liquid press feedback.

## Overview

The `LiquidButton` component attaches to native `<button>` and `<a>` elements using the `liquidButton` selector attribute. It coordinates tap squashing and spring recoil via the `LiquidPressable` directive and `LiquidPress` utility.

## Architecture

- **Selector**: `button[liquidButton], a[liquidButton]`
- **Variants**:
  - `filled`: Solid primary surface (`--color-primary`, white label) with subtle elevation shadow.
  - `tinted`: Soft contrasting wash surface (`--slate-100`, dark label) for secondary actions.
  - `plain`: Transparent fill that washes on hover for quiet and tertiary actions.
- **Layers**:
  - `.liquid-button-fill`: Absolute background surface that squashes with the press while leaving layout geometry intact.
  - `.liquid-button-content`: Foreground label and icon container.

## Custom Properties

- `--liquid-button-fill` / `--liquid-button-fill-hover`: Surface background fill colors.
- `--liquid-button-shadow` / `--liquid-button-shadow-hover`: Elevation shadow styling.
- `--liquid-button-color`: Label and icon text color.
- `--liquid-button-radius`: Corner radius (defaults to `--pill-radius`).
- `--liquid-button-padding`: Inner button padding.
- `--liquid-button-gap`: Gap between icons and text.
- `--liquid-button-font-size`: Button font size.
- `--liquid-button-press-duration`: Duration of squash transition in milliseconds.

