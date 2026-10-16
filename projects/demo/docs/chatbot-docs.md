# Chatbot Workshop Page Documentation

Documentation for `src/app/pages/components-docs/chatbot-docs/`.

## Structure

1. **Page Header**:
   - Breadcrumb navigation (`Components / Overlays & Menus`).
   - Title and lead summary.
   - Quick jump chips (`Overview`, `Playground`, `Sizes & Popups`, `Setup`, `API`).
2. **Overview**:
   - Concept introduction with a live assistant specimen.
3. **Playground**:
   - Container width controls (340px, 400px, 460px) and height controls (420px, 480px, 560px).
   - Live interactive chat interface with suggestions and text composer.
   - Action trigger button to clear conversation history.
   - Dynamic template preview `<pre class="docs-code">{{ playMarkup() }}</pre>`.
4. **Sizes & Popups**:
   - Demonstration of the chatbot widget embedded inside a top-layer popover menu popup.
5. **Setup & Usage**:
   - TypeScript and template examples for consuming the Chatbot with LiquidMenuPopup.
6. **API Reference**:
   - Full property documentation table with defaults and types.

