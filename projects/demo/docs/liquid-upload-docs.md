# Liquid Upload Workshop Page Documentation

Documentation for `src/app/pages/components-docs/liquid-upload-docs/`.

## Structure

1. **Page Header**:
   - Breadcrumb navigation (`Components / Form Controls`).
   - Headline and summary lead description.
   - Quick scroll jump chips (`Overview`, `Playground`, `Sizes & Variants`, `Setup`, `API`).
2. **Overview**:
   - Component concept introduction and live basic document preview.
3. **Playground**:
   - Interactive control panel toggling `variant` ('document' vs 'photo'), `disabled`, `invalid`, `hint`, custom property height (38px, 46px, 56px), and custom property radius (8px, 14px, 24px).
   - Live stage container with test upload element and verbal action triggers (`Load Sample Document`, `Load Sample Photo`, `Clear Upload File`).
   - Dynamic status line reporting last emitted event or rejection reason.
   - Live `<pre class="docs-code">{{ playMarkup() }}</pre>` block rendering template code according to active playground inputs.
4. **Sizes & Variants**:
   - Showcase cards demonstrating Compact (38px), Photo Avatar mode (46px), and Large (56px) presets with verbal action buttons.
5. **Setup & Usage**:
   - TypeScript and template snippet for component consumption.
6. **API Reference**:
   - Exhaustive table of inputs, models, outputs, types, and default values.

