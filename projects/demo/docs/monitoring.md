# Monitoring page & Shared Components

`src/app/pages/monitoring/` — the app's primary route (`/` and `/monitoring`), composing reusable shell and dashboard components under `src/app/shared/components/`.

## Component Architecture

- **Shell Components**:
  - `src/app/shared/components/layout/` (`Layout` / `<app-layout>`) — Frosted glass window container composing `<app-header>`, `<app-sidebar>`, and `.content-panel` (`<ng-content />`).
  - `src/app/shared/components/header/` (`Header` / `<app-header>`) — Top workspace bar with Neon logo, account/plan pill, project selector pill, and `Docs` / `Connect` actions.
  - `src/app/shared/components/sidebar/` (`Sidebar` / `<app-sidebar>`) — Left navigation panel with search input (`/`), section groups (`Project`, `Branch` with `production` selector, `Platform Services`), and bottom `Scale your infrastructure` upgrade card.
- **Page & Content Components**:
  - `src/app/shared/components/page-header/` (`PageHeader` / `<app-page-header>`) — Page title, subtitle, time-range pill selector (`1h`, `6h`, `24h`, `7d`), `Refresh` button, compute status pill (`Primary` · `Active`), and endpoint metadata chips.
  - `src/app/shared/components/resource-card/` (`ResourceCard` / `<app-resource-card>`) — Resource Configuration card with nested `.resource-items` well (`Base Capacity`, `Scaling Limit`, `Idle Timeout`) and `Manage...` footer.
  - `src/app/shared/components/metric-card/` (`MetricCard` / `<app-metric-card>`) — Reusable chart card supporting optional KPI summary strips (`Compute Utilization`) and both solid/peak utilization bars and stacked segmented bars (`Transaction Conflicts`, `Database Connections`).

## Data & Interfaces

- Constants live in `src/app/shared/constants/dashboard.ts`.
- Domain interfaces live in `src/app/shared/interfaces/dashboard.interface.ts`.
