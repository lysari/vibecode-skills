# Pincode Box Component

`src/app/shared/components/pincode-box/` — Multi-digit OTP and numeric verification code entry component with automatic caret advancement, backspace regression, paste distribution across cells, security masking, and verification wave shimmers.

## Overview

The `PincodeBox` (`<x-pincode-box>`) component provides dedicated input boxes for fixed-length numeric credentials (such as two-factor authentication SMS codes, email verification tokens, and transaction PINs). Rather than requiring separate control bindings for each digit, the component acts as a unified single source of truth via two-way binding (`[(value)]`) and Angular's `ControlValueAccessor` interface (`[formControl]`).

## Architecture & Features

- **Automatic Focus & Caret Advancement**:
  - Automatically advances focus to the next cell upon entering a digit.
  - Automatically redirects focus to the first unfilled cell if the user clicks past the current typing position.
  - Skips empty inputs when navigating backward with `Backspace`, safely removing the previous digit and placing the caret.
  - Supports `Delete`, `ArrowLeft`, `ArrowRight`, `Home`, and `End` for keyboard navigation.
- **Form & Validation Integration**:
  - Implements Angular's `ControlValueAccessor` interface (`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`).
  - Supports reactive forms (`[formControl]`) and template-driven forms (`[(ngModel)]`).
  - Emits `(completed)="onComplete($event)"` when all slots are populated.
  - Supports `invalid` attribute for error highlighting and red border glows.
- **Clipboard Paste Support**:
  - Intercepts paste events, extracts numbers, strips formatting (dashes, spaces, text), and distributes digits across consecutive cells starting from the active cell.
- **Security & Masking**:
  - Supports `[masked]="true"` to render digits as masked dots (`type="password"`).
- **Loading & State Feedback**:
  - Supports `[loading]="true"`: locks inputs while preserving legible digits and running a sequential wave keyframe animation across cells.
- **Design Token Compliance**:
  - Derived corner radius rule: `--pincode-digit-radius: var(--radius-md, 8px)`.
  - Pure RGB / HSL colors with alpha (`rgba(0, 102, 214, 0.18)`), strictly avoiding unsupported color functions like `oklch()`.
  - Preset dimension sizes: `size="sm"` (38×48px), `size="md"` (48×58px), `size="lg"` (56×68px).

## Inputs & Outputs

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `length` | `number` | `6` | Total count of digit slots. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Dimension preset for the boxes. |
| `value` | `string` | `''` | Model containing the entered numeric code string. |
| `masked` | `boolean` | `false` | Renders dots instead of visible digits. |
| `disabled` | `boolean` | `false` | Disables interaction and dims boxes. |
| `invalid` | `boolean` | `false` | Shows red error state and focus glow. |
| `loading` | `boolean` | `false` | Disables interaction and triggers wave shimmer. |
| `autoFocus` | `boolean` | `false` | Focuses the first slot upon rendering. |
| `completed` | `Output<string>` | `—` | Fires when the last slot is populated. |

## CSS Custom Properties

- `--pincode-digit-width`: Box width (default 48px in md).
- `--pincode-digit-height`: Box height (default 58px in md).
- `--pincode-digit-gap`: Spacing between boxes (default 10px).
- `--pincode-digit-radius`: Corner radius (default 8px).
- `--pincode-digit-font-size`: Font size of digits (default 26px).
- `--pincode-active-border`: Focused box border color (default `#0066d6`).
- `--pincode-active-glow`: Focused box outline box-shadow.
- `--pincode-invalid-color`: Border color during error state (default `#d93025`).

