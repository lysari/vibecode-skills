# Liquid Autocomplete Component

`src/app/shared/components/liquid-autocomplete/` — Searchable dropdown select component with top-layer fluid morphing panels, category headers, Unicode-safe substring highlighting, roving focus, and multi-segment input group integration.

## Overview

The `LiquidAutocomplete` (`<x-liquid-autocomplete>`) component functions as a select control that opens a fluid menu popup. It supports large datasets by providing an automatic or manual search input, grouping options under category headers, highlighting matching text across titles and captions, and offering full keyboard accessibility (arrows, Enter, Escape).

## Architecture & Features

- **ControlValueAccessor & Forms**:
  - Implements Angular's `ControlValueAccessor` interface (`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`).
  - Supports reactive forms (`[formControl]`) and two-way template binding (`[(value)]`).
- **Segment Grouping Integration**:
  - Implements `LiquidSegment` interface, allowing it to function as a seamless unbordered segment (`bare`) inside continuous container components like `<x-liquid-input-group>`.
- **Keyboard Roving & Accessibility**:
  - Uses `aria-autocomplete="list"`, `aria-activedescendant`, and `role="listbox"` with `role="option"`.
  - Arrow keys cycle through selectable options while keeping focus inside the search field or listbox.
  - Automatically scrolls active options into view with smooth scroll centering.
- **Category Grouping & Highlights**:
  - Categorizes options with `[groupWith]` into sections with title badges.
  - Highlights search matches using the Unicode-cluster-safe `highlight` utility without breaking diacritics.
- **Custom Option Templating**:
  - Supports structural directives `*liquidAutocompleteOption` / `ng-template[liquidAutocompleteOption]` to provide custom row rendering.

## Inputs & Outputs

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options` | `readonly T[]` | `required` | Array of data items available for selection. |
| `value` | `T \| null` | `null` | Two-way model of the selected item. |
| `displayWith` | `(option: T) => string` | `String` | Function mapping item to primary display label. |
| `captionWith` | `(option: T) => string \| null` | `null` | Function mapping item to secondary description. |
| `groupWith` | `(option: T) => string \| null` | `null` | Function mapping item to category group name. |
| `disabledWith` | `(option: T) => boolean` | `null` | Disables specific options from selection. |
| `compareWith` | `(a: T, b: T) => boolean` | `Object.is` | Function testing equality between two items. |
| `clearable` | `boolean` | `false` | Displays quick clear cross icon when value is selected. |
| `searchable` | `boolean \| 'auto'` | `'auto'` | Enables search field inside popup (threshold > 7). |
| `bare` | `boolean` | `false` | Removes border and background for input groups. |
| `width` | `string \| null` | `null` | Custom CSS width for the control. |
| `opened` | `Output<void>` | `—` | Fires when popup panel expands. |
| `closed` | `Output<LiquidMenuCloseReason>` | `—` | Fires when popup panel closes. |

