# Search Component

`src/app/shared/components/search/` — Command palette and combobox search component with categorized section grouping, cluster-safe substring highlighting, recent history persistence, keyboard roving navigation, and seamless integration with `LiquidMenuPopup`.

## Overview

The `Search` (`<app-search>` / `<x-search>`) component provides an accessible search interface designed for quick navigation across pages, tools, and actions. It can be used either as an embedded search box or enclosed inside a top-layer modal dropdown using `LiquidMenuPopup`.

## Architecture & Features

- **Combobox Pattern & Keyboard Roving**:
  - Maintains focus in the `<input type="search">` field while arrow keys (`ArrowDown`, `ArrowUp`, `Home`, `End`) navigate through the results list via `aria-activedescendant`.
  - Pressing `Enter` executes the action or navigates to the item's route via Angular's Router.
  - Automatically scrolls the active option into view using `scrollIntoView({ block: 'nearest' })`.
- **Intelligent Result Grouping**:
  - When the query is empty, displays **Recent** history (stored in `localStorage`) and **Suggested** entry points (the primary entry for each section).
  - When a query is typed, groups matching results under their respective `section` headings.
  - Matches across item `title`, `section`, and `description`.
- **Unicode Cluster-Safe Highlighting**:
  - Highlights matched characters with `<mark>` tags using the `highlight` utility, preserving Unicode combining clusters (including Khmer diacritics/subscripts and Latin accents).
- **Liquid Menu Popup Slot Integration**:
  - Implements `ng-template[liquidMenuHeaderIcon]` to supply the magnifying glass header glyph to parent popups.
  - Implements `ng-template[liquidMenuFooter]` to inject keyboard shortcuts (`↑`, `↓`, `↵`, `esc`) into the popup footer.
  - Automatically closes the parent popup with `menu.close('item')` when an item is chosen.
- **Zero External Dependencies**:
  - Inline clean SVGs for search, clear, clock, chevron, and keyboard hints (zero `@ng-icons` bloat).

## Inputs & Outputs

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `SearchItem[]` | `required` | Array of searchable items. |
| `placeholder` | `string` | `'Search pages...'` | Input placeholder text. |
| `enableRecent` | `boolean` | `true` | Enables caching and rendering recent picks. |
| `selected` | `Output<SearchItem>` | `—` | Fires when an option is selected. |

## SearchItem Interface

```typescript
export interface SearchItem {
  title: string;
  path: string;
  section: string;
  icon?: string;
  description?: string;
}
```

