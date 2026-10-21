# Next.js Rules

Apply these on top of the generic rules when the project root has a `next.config.js`, `next.config.mjs`, or `next.config.ts`.

## Directory structure
- Organize the application into `core/` (or `lib/`), `shared/`, and `features/`; never put feature-specific components or domain logic loose in `components/` or directly inside route folders.
- Put shared utilities, database clients, and singleton infrastructure in `src/lib/` or `src/core/`, e.g. `src/lib/db.ts`.
- Put reusable UI primitives (buttons, dialogs, inputs) in `src/shared/components/` or `src/components/ui/`, e.g. `src/shared/components/button.tsx`.
- Put domain features in `src/features/<feature>/` containing components, hooks, actions, and types, e.g. `src/features/billing/components/invoice-table.tsx`.
- Keep route entry files (`app/**/page.tsx`, `layout.tsx`, `route.ts`) minimal: parse route params, fetch initial data, and mount feature components; never write raw UI widgets or form handlers directly in `page.tsx`.

## Server and client components
- Default every component to a Server Component; add `'use client'` only at the top of leaf files that use React hooks (`useState`, `useEffect`), browser APIs, or event handlers (`onClick`, `onChange`).
- Never add `'use client'` at the route entry level (`page.tsx`) to make a nested child interactive; wrap the interactive element in its own client component and import it into the server page.
- Pass server-fetched data down to client components as serializable props; never import server-only modules (database clients, secrets) into a file marked `'use client'`.

## Data fetching and server actions
- Fetch data directly in Server Components using `async/await`; never use `useEffect` or client-side fetch for initial page data loading.
- Put Server Actions in dedicated files with `'use server'` at the top or inside `src/features/<feature>/actions/`, e.g. `src/features/auth/actions/login.action.ts`.
- Validate all incoming arguments to Server Actions with a schema validator before executing database or third-party operations, e.g. `loginSchema.parse(input)`.

