# Liquid Tabs Component

`src/app/shared/components/liquid-tabs/` — segmented tab bar and switcher suite with fluid indicator sliding.

## Overview

The `LiquidTabs` component (`<x-liquid-tabs>`) provides tab selection with an animated highlight pill that pours between active items. It supports accompanying panels (`liquidTabPanel`) and lazy content templates (`liquidTabContent`).

## Architecture

- **`LiquidTabs` (`<x-liquid-tabs>`)**:
  - Hosts the tablist container and `#indicator` pill.
  - Computes `selectedTab`, `selectedIndex`, and `direction` (`switchDirection`).
  - Implements keyboard navigation with roving focus (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Home`, `End`, `Enter`, `Space`).
  - Supports `persist` into `sessionStorage` or `localStorage`.
- **`LiquidTab` (`[liquidTab]`)**:
  - Attached to each tab button or link.
  - Carries WAI-ARIA `role="tab"`, `aria-selected`, and `aria-controls`.
  - Coordinates touch/click squash via `LiquidPressable`.
- **`LiquidTabPanel` (`[liquidTabPanel]`)**:
  - Displays panel content associated with a tab or shared across tabs.
  - Supports `dissolve` and `slider` transitions.
- **`LiquidTabContent` (`[liquidTabContent]`)**:
  - Instantiates embedded views conditionally and performs blur/drift crossfades.

## Custom Properties

- `--liquid-tabs-background`: Container background fill.
- `--liquid-tabs-indicator-color`: Indicator highlight fill.
- `--liquid-tabs-indicator-shadow`: Indicator elevation shadow.
- `--liquid-tabs-padding`: Outer container padding.
- `--liquid-tabs-radius`: Outer container radius.
- `--liquid-tabs-tab-padding`: Individual tab button padding.
- `--liquid-tabs-duration`: Transition duration of indicator travel.
- `--liquid-tabs-pull`: Leading edge reach distance before surge.

