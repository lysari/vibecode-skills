# Liquid Sidebar Documentation Page

`src/app/pages/components-docs/liquid-sidebar-docs/` — workshop documentation page demonstrating interactive states, size hierarchy, expand menu patterns, rail collapse behavior, and API reference for `LiquidSidebar`.

## Sections

- **Overview (`#overview`)**: Component description, layout properties, and fluid mechanics.
- **Playground (`#playground`)**: Interactive testing suite with controls for all inputs (`variant`, `position`, `collapsed`, `collapsible`, `bordered`, `showToggle`, `disabledItem`), status event logging, range controls for CSS properties (`width`, `collapsed-width`, `radius`, `padding`, `gap`, `item-height`), size presets, and dynamic code markup.
- **Expand Menu (`#expand-menu`)**: Demonstration of two expand menu paradigms:
  - Collapsible nested accordion navigation branches (`<x-liquid-sidebar-submenu>`).
  - Floating popup dropdown selectors (`[liquidMenuTriggerFor]` with `<x-liquid-menu-popup>`).
- **Sizes (`#sizes`)**: Four comparative instances: Compact (`220px`), Default (`280px`), Large (`320px`), and Narrow Rail (`68px`), showing concentric radius scaling.
- **Variants (`#variants`)**: Demonstration of `docked`, `floating` card island, and `ghost` transparent surface styles.
- **Rail Collapse (`#rail`)**: Compact icon rail mode with centered icons, hidden overflow text, and tooltip feedback on hover.
- **Setup (`#setup`)**: Code snippet for importing and implementing `LiquidSidebar`, `LiquidSidebarGroup`, `LiquidSidebarItem`, `LiquidSidebarSubmenu`, and `LiquidSidebarIcon`.
- **API Reference (`#api`)**: Specification tables for component inputs, outputs, submenu inputs, directive inputs, and CSS custom variables.
