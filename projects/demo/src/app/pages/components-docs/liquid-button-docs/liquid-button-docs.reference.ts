import { ApiRow } from '../liquid-input-docs/liquid-input-docs.reference';

export const BUTTON_SETUP = `import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';

@Component({ imports: [LiquidButton] })

<button type="button" liquidButton (click)="save()">Save</button>
<button type="button" liquidButton variant="tinted">Preview</button>
<button type="button" liquidButton variant="plain" [disabled]="busy()">Cancel</button>`;

export const BUTTON_ELEMENTS = `<!-- An action: a <button>, with its type -->
<button type="submit" liquidButton>Submit</button>

<!-- An icon-only button: square or circular, with an accessible name -->
<button type="button" liquidButton iconOnly aria-label="Add item">
  <ng-icon name="ionAddOutline" />
</button>

<!-- A destination: an <a>, still announced as a link -->
<a liquidButton variant="tinted" routerLink="/help">Get help</a>

<!-- A disabled link leaves the tab order and ignores clicks -->
<a liquidButton variant="plain" routerLink="/help" disabled>Get help</a>`;

export const BUTTON_COLOUR = `<!-- One hue paints all three variants -->
<div style="--liquid-button-hue: 150">
  <button type="button" liquidButton>Approve</button>
  <button type="button" liquidButton variant="tinted">Approve</button>
</div>

<!-- Or follow the section's accent, as the home page's services do -->
<section [style.--svc-accent]="service.accent">
  <button type="button" liquidButton>Apply</button>
</section>

<!-- Pin a surface outright, keeping the rest of the variant -->
<button type="button" liquidButton style="--liquid-button-fill: #1d1d1f">Dark</button>`;

export const BUTTON_API: ApiRow[] = [
  {
    name: 'variant',
    type: 'LiquidButtonVariant',
    value: `'filled'`,
    does: `'filled', 'tinted' or 'plain' — all three drawn from the same hue.`,
  },
  {
    name: 'block',
    type: 'boolean',
    value: 'false',
    does: 'Fills the width it is given instead of hugging its label.',
  },
  {
    name: 'iconOnly',
    type: 'boolean',
    value: 'false',
    does: 'Square or circular button sized to frame an icon alone, with equal width and height.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    value: 'false',
    does: 'Written back as the native disabled on a <button>; on an <a>, aria-disabled and tabindex="-1", and clicks are swallowed.',
  },
];

export const BUTTON_CSS: ApiRow[] = [
  {
    name: '--liquid-button-hue',
    type: 'OKLCH hue',
    value: 'var(--svc-accent, 262)',
    does: 'The hue every variant is drawn from.',
  },
  { name: '--liquid-button-radius', type: 'length', value: '999px', does: 'Corner radius.' },
  { name: '--liquid-button-padding', type: 'length', value: '9px 18px', does: 'Inner padding.' },
  { name: '--liquid-button-size', type: 'length', value: '36px', does: 'Width and height of an icon-only button.' },
  {
    name: '--liquid-button-icon-size',
    type: 'length',
    value: 'calc(size * 0.5)',
    does: 'Icon font size or SVG dimensions within an icon-only button.',
  },
  { name: '--liquid-button-gap', type: 'length', value: '8px', does: 'Space between an icon and the label.' },
  { name: '--liquid-button-font-size', type: 'length', value: '14px', does: 'Label size.' },
  { name: '--liquid-button-color', type: 'color', value: 'per variant', does: 'Label colour.' },
  {
    name: '--liquid-button-border',
    type: 'border',
    value: 'none',
    does: 'Drawn on the fill, so it squashes with it. A border on the host would stay still.',
  },
  {
    name: '--liquid-button-fill / -fill-hover',
    type: 'background',
    value: 'per variant',
    does: 'Pins the surface, at rest and under the pointer.',
  },
  {
    name: '--liquid-button-shadow / -shadow-hover',
    type: 'box-shadow',
    value: 'per variant',
    does: 'Pins the shadow, at rest and under the pointer.',
  },
  {
    name: '--liquid-button-press-duration',
    type: 'ms',
    value: '110',
    does: 'How long the squash takes; the bounce back takes 3.4× longer.',
  },
];
