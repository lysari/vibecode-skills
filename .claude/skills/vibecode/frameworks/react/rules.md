# React Rules

Apply these on top of the generic rules when the project root has a `package.json` with `"react"` and no `next.config.*`.

## Directory structure
- Organize domain logic under `src/features/<feature>/` containing components, hooks, services, and types; never place feature-specific components in a flat `src/components/` folder, e.g. `src/features/catalog/components/product-card.tsx`.
- Put reusable UI primitives (buttons, inputs, modals, layout primitives) in `src/shared/components/` or `src/components/ui/`, e.g. `src/shared/components/modal.tsx`.
- Put global layout wrappers, router configuration, and top-level providers in `src/app/` or `src/routes/`, e.g. `src/app/router.tsx`.

## Components and hooks
- Keep component functions focused on rendering UI and dispatching user events; move multi-step state transitions, network requests, and external subscriptions into custom hooks in `src/features/<feature>/hooks/` or `src/shared/hooks/`, e.g. `src/features/catalog/hooks/use-product-filters.ts`.
- Write every custom hook with the `use` prefix, e.g. `useDebounce<T>()`.
- Always return a cleanup function from `useEffect` when setting up subscriptions, timers, or browser event listeners.
- Never write data fetching or side effects directly in the render body; trigger them inside `useEffect`, event handlers, or dedicated query hooks.

## State management
- Keep state as local as possible to the component that reads and updates it; lift to a parent or feature context only when 2 or more sibling components require synchronization.
- Never store derived state in `useState`; compute derived values directly during render or with `useMemo` when calculating over large arrays, e.g. `const filteredItems = useMemo(...)`.

