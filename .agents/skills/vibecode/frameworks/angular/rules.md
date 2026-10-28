# Angular Rules

Apply these on top of the generic rules when the project root has an `angular.json`.

## Directory structure
- With one feature, put its pages, components, stores and services in folders by kind directly under `src/app/`, e.g. `src/app/pages/order-list/order-list.page.ts`, beside `environments/` and `specs/`. Move them into `features/<feature>/` when a second feature is added.
- With 2 or more features, organize the application under `src/` into `app/` (`core/`, `features/`, `shared/`), `environments/`, and `specs/`; never place feature components, pages, or domain logic in a flat `src/app/components/` directory or loose in `src/app/`:

```text
src/
├── app/
│   ├── core/                           # App-wide singletons, infrastructure, guards, interceptors
│   │   ├── constants/                  # Global constants, storage keys, API routes
│   │   ├── guards/                     # Route activation and authorization guards
│   │   ├── initializers/               # APP_INITIALIZER startup providers
│   │   ├── interceptors/               # Functional HTTP interceptors
│   │   ├── interfaces/                 # System-wide models, session and user contracts
│   │   ├── services/                   # Root singleton services (API client, Auth, Database)
│   │   ├── stores/                     # App-wide global signal stores (session, auth)
│   │   ├── tokens/                     # InjectionToken definitions
│   │   └── utils/                      # Core cross-cutting utilities (crypto, token decoders)
│   ├── features/                       # Domain feature modules
│   │   └── <feature>/                  # Bounded domain feature (e.g., billing, catalog)
│   │       ├── components/             # Feature-private presentational components
│   │       ├── constants/              # Feature-specific configuration and dropdown options
│   │       ├── interfaces/             # Feature domain models and DTOs
│   │       ├── pages/                  # Routable screen components
│   │       ├── services/               # Stateless data access and API endpoints
│   │       ├── stores/                 # Feature signal stores managing reactive state
│   │       └── <feature>.routes.ts     # Feature route definitions mounted in app.routes.ts
│   ├── shared/                         # Reusable presentation building blocks (no domain state)
│   │   ├── components/                 # Reusable dumb UI primitives (button, dialog, table)
│   │   ├── constants/                  # Shared UI layout presets and animation tokens
│   │   ├── directives/                 # Shared element behavior modifiers
│   │   ├── interfaces/                 # Component options, table column definitions
│   │   ├── layout/                     # Route-group shells, one folder each (main-layout, auth-layout)
│   │   ├── pipes/                      # Pure template transform pipes
│   │   ├── utils/                      # Pure helper functions and calculation utilities
│   │   └── validators/                 # Custom form and control validators
│   ├── app.config.ts                   # Application configuration & root providers
│   └── app.routes.ts                   # Root routing (loadChildren to feature routes)
├── environments/                       # Environment configuration files
│   ├── environment.development.ts      # Local development environment settings
│   └── environment.ts                  # Production environment settings
└── specs/                              # Test suites mirroring src/app/ structure
    ├── core/                           # Unit tests for core guards, interceptors, services
    ├── features/                       # Unit tests for feature pages, components, stores, services
    └── shared/                         # Unit tests for shared components, pipes, directives
```

- Put singleton infrastructure services, guards, interceptors, and app configuration in `src/app/core/`, e.g. `src/app/core/services/token.service.ts`.
- Put app-wide global signal stores in `src/app/core/stores/`, e.g. `src/app/core/stores/auth.store.ts`; never put feature-specific state in `core/`.
- Put reusable UI primitives (buttons, inputs, dialogs), shared pipes, directives, validators, and pure utility helpers in `src/app/shared/components/`, `src/app/shared/pipes/`, `src/app/shared/directives/`, `src/app/shared/validators/`, or `src/app/shared/utils/`; never put domain-specific business components, stateful domain services, or route guards in `shared/`.
- Put each component and each page in its own folder named after it, holding its `.ts`, `.html` and `.scss` files, in `components/`, `pages/` and layout folders alike, e.g. `src/app/shared/components/date-badge/date-badge.component.ts` and `src/app/features/billing/pages/invoice-list/invoice-list.page.html`; never place a component or page file directly in `components/` or `pages/`.
- Put each layout shell component in its own folder at `src/app/shared/layout/<name>-layout/`, e.g. `src/app/shared/layout/main-layout/main-layout.component.ts` and `src/app/shared/layout/auth-layout/auth-layout.component.ts`; never put a layout shell in `core/`, a feature folder, or loose in `src/app/`.
- Keep every part that only one layout uses (its subcomponents, directives and stores) inside that layout's folder, e.g. `src/app/shared/layout/main-layout/sidebar/sidebar.component.ts`.
- Keep the directives and stores that pages use to fill one layout's regions inside that layout's folder too, e.g. `src/app/shared/layout/main-layout/header-actions.directive.ts` and `src/app/shared/layout/main-layout/header-actions.store.ts`.
- Move a layout part to `shared/components/`, `shared/directives/` or `core/stores/` when a second layout uses it, or when a feature renders one of the layout's components on its own.
- Write data transformations, formatters, and value conversions as pure functions in `src/app/shared/utils/` (or `src/app/shared/pipes/` for HTML templates); never create `@Injectable()` services for pure mappings or calculations.
- Structure each feature module under `src/app/features/<feature>/` into `pages/`, `components/`, `stores/`, `services/`, and route definitions, creating each folder with its first file:
  - `pages/` holds route-level screen components, e.g. `src/app/features/billing/pages/invoice-list/invoice-list.page.ts`.
  - `stores/` holds feature reactive state and signals, e.g. `src/app/features/billing/stores/invoice.store.ts`.
  - `components/` holds private presentational subcomponents, e.g. `src/app/features/billing/components/invoice-row/invoice-row.component.ts`.
  - `services/` holds API clients and data communication, e.g. `src/app/features/billing/services/invoice-api.service.ts`.

## Data flow
- Keep data flowing one way: `pages > stores > services` for a page that holds state, `pages > services` for a page that only loads and shows data.
- Add a store only when a page or feature holds state it changes, or coordinates two or more async calls, e.g. a filterable list with paging. A page that loads one record and shows it injects the API service directly.
- Call API services only from a page or a store; never from a component under `components/` or from a template.
- Write business logic, reactive state transitions, and asynchronous coordination inside stores; stores call services to perform HTTP requests or storage operations.
- Restrict API services to HTTP calls, payload serialization, and endpoint contracts; never store reactive state or signals in an API service.

## Forms
- Write every fixed form field as its own control in the template and its own entry in the form definition. Do not generate fixed fields from a config array with `@for`.
- Use `@for` only over a `FormArray` whose rows the user adds or removes.
- Give each field its own label, validators, and error text where it is written, so changing one field touches one place.

## Routing and layouts
- Give each feature its own route definitions file at `src/app/features/<feature>/<feature>.routes.ts`, and mount it in the root `app.routes.ts` with `loadChildren: () => import(...)`.
- Lazy-load screen components with `loadComponent: () => import(...)` on route entries; never use eager `component: ...` in routable page definitions (reserve `component: ...` only for layout shell wrappers).
- Create a distinct layout wrapper component in `src/app/shared/layout/<name>-layout/` for each route group that has different chrome, structure, or navigation shell, e.g. `AuthLayout` in `shared/layout/auth-layout/` for unauthenticated routes and `MainLayout` in `shared/layout/main-layout/` for authenticated app pages.
- Never write route-checking flags or URL conditionals inside a shared layout component to hide or toggle shells with `@if` or `ngClass`; configure dedicated layout wrapper components with `<router-outlet />` as parent routes in the route definition instead.

## Services
- Provide a service in `'root'` only when it holds global application infrastructure or authentication session state needed across guards and independent route trees.
- Provide domain and feature services at the parent layout route or component level when their state is shared only across that feature's components, so unvisited routes never instantiate them, e.g. `providers: [FeatureDataService]` on the feature route branch.

## Components
- Write components, directives, and pipes as standalone; do not create NgModules for new code.

## File names
- Reserve the `.service.ts` suffix for injectable classes, so a constants file never carries it.

## Template text
Apply this section when the project uses `@angular/localize`.
- Write fixed UI text inline in the `.html` with `i18n="@@id"` on the element, or `i18n-<attr>="@@id"` beside a plain `<attr>="Text"` input, such as `i18n-label` with `label="Occupation"`.
- Never give the template a labels map to read from, such as `protected readonly t = LABELS` with `{{ t['key'] }}` or `[label]="t['key']"`.
- Keep `$localize` in TypeScript only for text the code itself builds or passes along: option lists, error messages, labels looked up by key at runtime.
- When template text reuses an ID that also exists in `$localize`, the text must match exactly, whitespace included. If the formatter wraps it across lines, wrap the text in `<ng-container i18n="@@id">Text</ng-container>`. Run `ng extract-i18n` and confirm it reports no duplicate-message warnings.

