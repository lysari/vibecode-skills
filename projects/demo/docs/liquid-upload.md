# Liquid Upload

Accessible file upload and drag-and-drop zone with instant image preview extraction, MIME type verification, size and pixel dimension enforcement, avatar photo circles, and reactive forms integration.

## Architecture

- **Host & Layout**: Renders as `x-liquid-upload`. Supports two layout modes:
  - `document`: Horizontal strip featuring a thumbnail preview (image, PDF label, or generic file icon), file name and size metadata, remove button, and an action button (`Browse` / `Replace`).
  - `photo`: Inline avatar circle displaying the cropped portrait or default user silhouette, with a checkmark badge on successful upload.
- **Client-side Image Inspection**: Automatically detects `image/*` file types and executes `readImagePreview` to extract width, height, and display URL without server roundtrips.
- **Validation**:
  - `accept`: Validates MIME types (e.g. `image/jpeg,image/png,application/pdf`).
  - `maxSize`: Enforces maximum file byte capacity.
  - `minWidth` & `minHeight`: Checks image dimensions when images are dropped or selected.
  - When rejected, sets a localized message and fires the `(rejected)` output event.
- **ControlValueAccessor**: Fully implements Angular `ControlValueAccessor` to bind to `[(value)]`, `[formControl]`, or `formControlName`.

## CSS Custom Properties

| Custom Property | Default | Description |
|---|---|---|
| `--liquid-upload-height` | `46px` | Total field height |
| `--liquid-upload-radius` | `14px` | Outer border radius of the field |
| `--liquid-upload-color` | `var(--brand, #0066d6)` | Accent tint for focus rings, thumb background, and action states |
| `--liquid-upload-background` | `var(--gray-50, #f9f9fb)` | Default field surface fill |
| `--liquid-upload-border` | `var(--gray-200, #e8e9ed)` | Neutral border tone |

## Accessibility

- Hides raw `<input type="file">` from the tab order.
- Links the visible action button to the input via `aria-describedby` targeting file name, hint, and error alert elements.
- When busy, announces processing status with `role="status"` and visually hidden text.
- Rejection alerts render with `role="alert"` for immediate screen-reader notification.

