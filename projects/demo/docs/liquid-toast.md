# Liquid Toast Component

`src/app/shared/components/liquid-toast/` — fluid, stacked notification queue powered by spring physics, real-time timer countdowns, and non-blocking promise tracking.

## Overview

The `LiquidToaster` (`<x-liquid-toaster>`) component and companion `toast` store manage an interactive notifications queue. Notifications animate smoothly out of their origins (screen edges or specific registered on-screen target elements) and gather back into them upon dismissal.

## Architecture

- **Store & Target Registration (`toast.ts`)**:
  - Module-level signal store allowing notifications to be created anywhere in the app without Angular dependency injection.
  - Supports types: `default`, `success`, `info`, `warning`, `error`, `loading`, and custom `TemplateRef` cards.
  - `toast.promise(promise, data)` seamlessly tracks asynchronous states.
  - `LiquidToastTarget` (`[liquidToastTarget]`): Directive registering on-screen elements as contextual toast origins.
- **Physics & Motion (`liquid-toast.ts`)**:
  - Two-pass arrival: Slots fold open with easing curves, followed by card growth keyframes from calculated origin coordinates.
  - Overflow queue collapses into an interactive ghost button pill (`+N more` / `Show less`).
  - Active timer countdowns adjust in real-time, pausing on hover or tab visibility change.
- **Color & Glassmorphism (`liquid-toast.scss`)**:
  - Uses HSL hues and alpha rgba backdrops with `backdrop-filter: blur(20px)` and no `oklch()`.
  - Disc plate styling dynamically scales based on notification hue (`info`, `success`, `warning`, `error`).

## Custom Properties

- `--liquid-toast-open-duration`: Duration of toast arrival animation (defaults to `340ms`).
- `--liquid-toast-close-duration`: Duration of toast exit animation (defaults to `240ms`).
- `--liquid-toast-resize-duration`: Duration of dynamic content resizing (defaults to `280ms`).
- `--liquid-toast-width`: Maximum card width (defaults to `min(400px, calc(100vw - 32px))`).
- `--liquid-toast-radius`: Corner radius of the toast card (defaults to `22px`).

