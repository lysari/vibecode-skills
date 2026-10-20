# Angular Rules

Apply these on top of the generic rules when the project root has an `angular.json`.

## Directory structure
- Organize the application under `src/app/` into `core/`, `shared/`, and `features/`; never place feature components, pages, or domain logic in a flat `src/app/components/` directory or loose in `src/app/`.
- Put singleton infrastructure services, guards, interceptors, and app configuration in `src/app/core/`, e.g. `src/app/core/services/token.service.ts`.
- Put reusable UI primitives (buttons, inputs, dialogs), shared pipes, directives, and cross-feature global stores in `src/app/shared/components/`, `src/app/shared/pipes/`, `src/app/shared/directives/`, or `src/app/shared/stores/`, e.g. `src/app/shared/stores/session.store.ts`; never put domain-specific business components in `shared/`.
- Structure each feature module under `src/app/features/<feature>/` into `pages/`, `components/`, `stores/`, `services/`, and route definitions:
  - `pages/` holds route-level screen components, e.g. `src/app/features/billing/pages/invoice-list.page.ts`.
  - `stores/` holds feature reactive state and signals, e.g. `src/app/features/billing/stores/invoice.store.ts`.
  - `components/` holds private presentational subcomponents, e.g. `src/app/features/billing/components/invoice-row.component.ts`.
  - `services/` holds API clients and data communication, e.g. `src/app/features/billing/services/invoice-api.service.ts`.

## Data flow (pages > stores > services)
- Enforce the unidirectional data flow: `pages > stores > services`.
- Inject and read stores from page and component files; never inject or call API data services directly inside a component or page template.
- Write business logic, reactive state transitions, and asynchronous coordination inside stores; stores call services to perform HTTP requests or storage operations.
- Restrict API services to HTTP calls, payload serialization, and endpoint contracts; never store reactive state or signals in an API service.

## Forms
- Write every fixed form field as its own control in the template and its own entry in the form definition. Do not generate fixed fields from a config array with `@for`.
- Use `@for` only over a `FormArray` whose rows the user adds or removes.
- Give each field its own label, validators, and error text where it is written, so changing one field touches one place.

## Routing and layouts
- Create a distinct layout wrapper component for each route group that has different chrome, structure, or navigation shell, e.g. `AuthLayout` for unauthenticated routes and `Layout` for authenticated app pages.
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

