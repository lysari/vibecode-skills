# Vue Rules

Apply these on top of the generic rules when the project root has a `package.json` with `"vue"` or a `nuxt.config.*`.

## Directory structure
- Organize domain logic under `src/features/<feature>/` (or `modules/<feature>/` in Nuxt) containing components, composables, stores, and types, e.g. `src/features/profile/components/user-avatar.vue`.
- Put reusable UI primitives in `src/shared/components/` or `src/components/ui/`, e.g. `src/shared/components/base-button.vue`.
- Keep page components in `src/views/` or `src/pages/` minimal: mount feature components and coordinate route parameters; never place domain business logic directly in a view component.

## Components and composables
- Write all new components using `<script setup lang="ts">`; do not use the Options API for new code.
- Extract multi-step reactive state, watchers, and API requests into composables named `use<Name>` in `src/features/<feature>/composables/` or `src/shared/composables/`, e.g. `src/features/search/composables/use-filter.ts`.
- Declare component props with `defineProps<{ ... }>()` and component events with `defineEmits<{ ... }>()`; never use untyped array syntax for props or emits.

## Reactivity
- Use `ref()` for primitive values and object replacements; use `computed()` for derived values.
- Never mutate a `computed()` value or reassign a prop inside a child component; emit an event to the parent instead.
- Clear external timers and listeners inside `onUnmounted()`.

