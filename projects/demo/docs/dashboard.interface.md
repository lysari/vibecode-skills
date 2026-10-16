# Dashboard interfaces

`src/app/shared/interfaces/dashboard.interface.ts` — domain contracts for the workspace shell and monitoring dashboard components.

## Types

- `ResourceIcon` — `'capacity' | 'limit' | 'timeout'` icon variant for resource rows.
- `NavIcon` — union of sidebar SVG icon identifiers.
- `WorkspaceHeaderConfig` — account email, plan badge, and project name for `<app-header>`.
- `NavItem` / `NavSection` — sidebar navigation sections, optional branch selector, and items for `<app-sidebar>`.
- `PageHeaderConfig` — title, subtitle, time ranges, compute pill, and endpoint chips for `<app-page-header>`.
- `ResourceConfig` / `ResourceCardConfig` — resource configuration rows and status footer for `<app-resource-card>`.
- `MetricKpi` / `ChartBar` / `MetricCardConfig` — KPI boxes, chart axes, and bar series (solid utilization or segmented conflict bars) for `<app-metric-card>`.
