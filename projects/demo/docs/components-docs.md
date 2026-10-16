# Components Workshop & Documentation Shell

`src/app/pages/components-docs/` — interactive workshop shell hosting documentation, live playgrounds, and API references for reusable design system components.

## Overview

The `ComponentsDocs` component provides the outer layout for the design system documentation suite:
- A sticky left navigation rail listing component groups (`Primitives`: `Liquid Button`, `Liquid Tabs`).
- Brand header linking back to the primary dashboard.
- A main content area hosting child routes via `<router-outlet>`.

## Routing

Routes are defined in `src/app/pages/components-docs/docs.routes.ts` and lazily loaded under the `/components-docs` path in `src/app/app.routes.ts`:
- `/components-docs/liquid-button`: `LiquidButtonDocs`
- `/components-docs/liquid-tabs`: `LiquidTabsDocs`

