# Variables

`src/styles/_variables.scss` — layout, spacing, control, radius, border and shadow values, and the `$compact` (760px) and `$tablet` (1080px) breakpoints.

## Using the breakpoints

Media queries cannot read custom properties, so the breakpoints are Sass variables `$compact` (760px) and `$tablet` (1080px). Load them in a component without re-emitting the `:root` block:

```scss
@use 'styles/variables' as v with (
  $emit-custom-properties: false
);

.thing {
  @media (max-width: v.$tablet) { … }
}
```

## Values and where they come from

All values were measured from the reference screenshot and scaled to a full desktop web-size layout (`1440×1024`).

| Token | Value | Reference measurement |
| ----- | ----- | --------------------- |
| `--window-max-width` | 100% | Fluid full-screen desktop web dashboard container width |
| `--window-radius` | 28px | Outer window rounded corner |
| `--window-padding` | 11px | Margin between window frame and inner panels |
| `--panel-radius` | `calc(var(--window-radius) - var(--window-padding))` (17px) | Inner panel radius (`inner_radius = outer_radius - padding`) |
| `--card-radius` | 18px | Dashboard card corners |
| `--well-padding` | 8px | Padding around nested inner well inside cards |
| `--well-radius` | `calc(var(--card-radius) - var(--well-padding))` (10px) | Nested well radius (`inner_radius = outer_radius - padding`) |
| `--item-icon-radius` | 10px | Resource item icon container corner radius |
| `--item-icon-size` | 38px | Resource item icon container dimensions (38×38px) |
| `--control-radius` | 11px | Search input, nav items, and branch dropdown button radius |
| `--pill-radius` | 999px | Compute status selector pill and manage button radius |
| `--sidebar-width` | 304px | Left navigation sidebar width |
| `--header-height` | 40px | Window top bar height |
| `--search-height` | 40px | Search input height |
| `--nav-item-height` | 38px | Sidebar navigation item height |
| `--branch-btn-height` | 42px | Branch dropdown button height |
| `--manage-btn-height` | 38px | Manage button height |

## Corner radius calculation

Corner radii strictly follow the nested container rule:
`inner_radius = outer_radius - padding`
- Outer window radius = `28px`, window padding = `11px` → Inner panel radius = `28px - 11px = 17px`
- Outer card radius = `18px`, card well padding = `8px` → Inner well radius = `18px - 8px = 10px`
