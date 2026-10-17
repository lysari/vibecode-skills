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
- **Architecture**:
  - `variant`: `'filled' | 'tinted' | 'plain'` surface appearance.
  - `block`: Fills container width.
  - `iconOnly`: Sized to frame an icon alone with equal width and height.
  - `disabled`: Handles native `<button>` and accessible `<a>` disabled states.
- **Layers**:
  - `.liquid-button-fill`: Absolute background surface that squashes with the press while leaving layout geometry intact.
  - `.liquid-button-content`: Foreground label and icon container.

## Custom Properties

- `--liquid-button-fill` / `--liquid-button-fill-hover`: Surface background fill colors.
- `--liquid-button-shadow` / `--liquid-button-shadow-hover`: Elevation shadow styling.
- `--liquid-button-color`: Label and icon text color.
- `--liquid-button-radius`: Corner radius (defaults to `--pill-radius`).
- `--liquid-button-padding`: Inner button padding (defaults to `0` when `iconOnly` is active).
- `--liquid-button-size`: Width and height of an icon-only button (defaults to `36px`).
- `--liquid-button-icon-size`: Icon size within an icon-only button (defaults to `calc(size * 0.5)`).
- `--liquid-button-gap`: Gap between icons and text.
- `--liquid-button-font-size`: Button font size.
- `--liquid-button-press-duration`: Duration of squash transition in milliseconds.

