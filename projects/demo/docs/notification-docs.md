# Notification Drawer Workshop Page Documentation

Documentation for `src/app/pages/components-docs/notification-docs/`.

## Structure

1. **Page Header**:
   - Breadcrumb navigation (`Components / Overlays & Menus`).
   - Title and lead description.
   - Jump chips (`Overview`, `Playground`, `Sizes & Popups`, `Setup`, `API`).
2. **Overview**:
   - Component introduction with a live notification feed instance.
3. **Playground**:
   - Sizing controls for container width (320px, 360px, 420px) and container height (400px, 460px, 540px).
   - Live stage container with interactive notification list and live action buttons (`Push Sample Notification`, `Mark All Notifications Read`).
   - Unread status pill.
   - Dynamic template markup snippet `<pre class="docs-code">{{ playMarkup() }}</pre>`.
4. **Sizes & Popups**:
   - Demonstration of the notification component anchored inside a native top-layer `<x-liquid-menu-popup>`.
5. **Setup & Usage**:
   - TypeScript and template examples for consuming Notification with LiquidMenuPopup.
6. **API Reference**:
   - API table documenting signals, inputs, and store methods.

