# Monitoring page & Shared Components

`src/app/pages/monitoring/` — the app's primary route (`/` and `/monitoring`), composing reusable shell and dashboard components under `src/app/shared/components/`.

## Component Architecture

- **Shell Components**:
  - `src/app/shared/components/layout/` (`Layout` / `<app-layout>`) — Frosted glass window container composing `<app-header>`, `<app-sidebar>`, and `.content-panel` (`<ng-content />`).
  - `src/app/shared/components/header/` (`Header` / `<app-header>`) — Top workspace bar with Neon logo, interactive Account popup menu (`Profile`, `Plan & Usage`, `User Settings`, `Sign Out`), Project switcher popup menu (`Monalisa`, `Production DB`, `Staging Branch`, `Analytics DB`), Notification bell with unread badge triggering `<app-notification />` in `<x-liquid-menu-popup>`, Chatbot assistant trigger button opening `<app-chatbot />`, `Docs` route link, and `Connect` action with instant toast confirmation.
  - `src/app/shared/components/sidebar/` (`Sidebar` / `<app-sidebar>`) — Left navigation panel with global command palette search trigger (`/` hotkey and click) opening `<app-search>` inside `<x-liquid-menu-popup>`, interactive Branch switcher popup (`production`, `staging`, `preview-feature-auth`, `dev`), tactile `liquidPress` navigation links, and bottom `Scale your infrastructure` upgrade card.
- **Page & Content Components**:
  - `src/app/shared/components/page-header/` (`PageHeader` / `<app-page-header>`) — Page title, subtitle, time-range pill selector (`1h`, `6h`, `24h`, `7d`) using `<x-liquid-tabs>`, `Refresh` button using `liquidButton` with toast feedback, compute status pill (`Primary` · `Active`), and endpoint metadata chips.
  - `src/app/shared/components/resource-card/` (`ResourceCard` / `<app-resource-card>`) — Resource Configuration card with dynamic `.resource-items` well (`Base Capacity`, `Scaling Limit`, `Idle Timeout`) and interactive `Manage...` button opening `<x-liquid-menu-popup>` with `<x-liquid-toggle>` (Autoscaling active) and `<x-liquid-slider>` (Scaling Limit & Idle Timeout) controls that apply real-time updates.
  - `src/app/shared/components/metric-card/` (`MetricCard` / `<app-metric-card>`) — Reusable chart card supporting optional KPI summary strips (`Compute Utilization`) and both solid/peak utilization bars and stacked segmented bars (`Transaction Conflicts`, `Database Connections`).

## Data & Interfaces

- Constants and search index live in `src/app/shared/constants/dashboard.ts` (including `SIDEBAR_SEARCH_ITEMS`).
- Domain interfaces live in `src/app/shared/interfaces/dashboard.interface.ts`.

