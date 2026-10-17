import { ApiRow } from '@app/pages/components-docs/liquid-input-docs/liquid-input-docs.reference';

export const TOGGLE_SETUP = `import { LiquidToggle } from '@app/shared/components/liquid-toggle/liquid-toggle';

@Component({ imports: [LiquidToggle] })

<x-liquid-toggle label="Wi-Fi" [(value)]="wifi" />`;

export const TOGGLE_FORMS = `<!-- Reactive -->
<x-liquid-toggle
  label="Sync"
  [formControl]="sync"
  [error]="sync.touched && sync.invalid ? 'Turn sync on' : null"
/>
sync = new FormControl(false, Validators.requiredTrue);

<!-- Template-driven -->
<x-liquid-toggle label="Alerts" name="alerts" [(ngModel)]="alerts" />`;

export const TOGGLE_API: ApiRow[] = [
  { name: 'value', type: 'boolean', value: 'false', does: 'On or off. Two-way: [(value)].' },
  {
    name: 'label',
    type: 'string | null',
    value: 'null',
    does: 'Text on the left of the switch, and its accessible name when set.',
  },
  {
    name: 'ariaLabel',
    type: 'string | null',
    value: 'null',
    does: 'Accessible name when label is null. Ignored while a label is set.',
  },
  { name: 'hint', type: 'string | null', value: 'null', does: 'Muted text under the switch.' },
  {
    name: 'error',
    type: 'string | null',
    value: 'null',
    does: 'Replaces the hint, and draws the switch in its error state.',
  },
  { name: 'invalid', type: 'boolean', value: 'false', does: 'The error state without a message.' },
  { name: 'disabled', type: 'boolean', value: 'false', does: 'Also set by a form control’s disable().' },
  {
    name: 'inputId',
    type: 'string',
    value: 'generated',
    does: 'The id of the checkbox inside — what a <label for> points at.',
  },
  { name: 'name', type: 'string | null', value: 'null', does: 'The checkbox’s name.' },
  {
    name: 'fill',
    type: "'track' | 'thumb'",
    value: 'track',
    does: 'track grows the on-color from the left edge. thumb grows it out from behind the thumb.',
  },
  {
    name: 'io',
    type: 'boolean',
    value: 'false',
    does: 'An I in the on-color, and an O in the empty track. The thumb covers the other one.',
  },
  {
    name: 'icons',
    type: 'boolean',
    value: 'false',
    does: 'A check in the on-color on the thumb while on, a muted dash while off.',
  },
];

export const TOGGLE_MEMBERS: ApiRow[] = [
  { name: 'valueChange', type: 'boolean', does: 'The model’s output, each time the switch flips.' },
  { name: 'focus(options?)', type: 'void', does: 'Focuses the checkbox.' },
];

export const TOGGLE_CSS: ApiRow[] = [
  {
    name: '--liquid-toggle-hue',
    type: 'OKLCH hue',
    value: 'var(--svc-accent, 262)',
    does: 'The accent of the focus ring.',
  },
  { name: '--liquid-toggle-tint', type: 'color', value: 'oklch(48% 0.16 hue)', does: 'The accent itself.' },
  {
    name: '--liquid-toggle-height',
    type: 'length',
    value: '32px',
    does: 'The track’s height. The thumb, inset, and default font are fractions of it.',
  },
  {
    name: '--liquid-toggle-width',
    type: 'length',
    value: '1.75 × height',
    does: 'The track’s width. The thumb travels whatever is left after its own size and the inset.',
  },
  { name: '--liquid-toggle-radius', type: 'length', value: 'half the height', does: 'The track’s corner radius. The default is a pill.' },
  { name: '--liquid-toggle-font-size', type: 'length', value: 'about 0.44 × height', does: 'The label.' },
  { name: '--liquid-toggle-duration', type: 'time', value: '340ms', does: 'How long the thumb and the fill take to pour.' },
  { name: '--liquid-toggle-reach', type: 'length', value: '10px', does: 'How far the thumb reaches before it crosses.' },
  {
    name: '--liquid-toggle-press-duration',
    type: 'time',
    value: '110ms',
    does: 'How long the track takes to flatten. The bounce back takes 3.4× this.',
  },
  {
    name: '--liquid-toggle-press-depth',
    type: 'number',
    value: '0.45',
    does: 'How much of the full press the track uses. 1 is the full 1.08 × 0.9.',
  },
  { name: '--liquid-toggle-track', type: 'color', value: '#e1e1e6', does: 'The track while off.' },
  { name: '--liquid-toggle-fill', type: 'color', value: '#4cc417', does: 'The color that covers the track while on.' },
  { name: '--liquid-toggle-thumb', type: 'color', value: '#fff', does: 'The thumb.' },
  { name: '--liquid-toggle-label-color', type: 'color', value: 'muted ink', does: 'The label.' },
];
