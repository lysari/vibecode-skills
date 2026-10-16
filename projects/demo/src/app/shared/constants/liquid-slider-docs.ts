import { ApiRow } from '@app/pages/components-docs/liquid-input-docs/liquid-input-docs.reference';

export const SLIDER_SETUP = `import { LiquidSlider } from '@app/shared/components/liquid-slider/liquid-slider';

@Component({ imports: [LiquidSlider] })

<x-liquid-slider label="Width" [min]="0" [max]="10" ticks [(value)]="width" />`;

export const SLIDER_FORMS = `<!-- Reactive -->
<x-liquid-slider
  label="Copies"
  [max]="5"
  ticks
  [formControl]="copies"
  [error]="copies.touched && copies.invalid ? 'Choose at least one copy' : null"
/>
copies = new FormControl(0, Validators.min(1));

<!-- Template-driven -->
<x-liquid-slider label="Volume" name="volume" [(ngModel)]="volume" />`;

export const SLIDER_API: ApiRow[] = [
  {
    name: 'value',
    type: 'number | null',
    value: 'null',
    does: 'The value, snapped to step. null shows as min. Two-way: [(value)].',
  },
  { name: 'label', type: 'string', value: 'required', does: 'Written inside the field, on the left.' },
  { name: 'min', type: 'number', value: '0', does: 'The lowest value.' },
  { name: 'max', type: 'number', value: '100', does: 'The highest value.' },
  {
    name: 'step',
    type: 'number',
    value: '1',
    does: 'The value snaps to it, and its decimals set how the number is written: 0.05 → 0.80.',
  },
  {
    name: 'ticks',
    type: 'boolean',
    value: 'false',
    does: 'A dot for every step ahead of the fill. Dots under the label or the number are left out.',
  },
  {
    name: 'handle',
    type: `'auto' | 'on' | 'off'`,
    value: `'auto'`,
    does: 'auto: the handle hides while it is under the label or the number. on: always shown. off: never shown.',
  },
  { name: 'hint', type: 'string | null', value: 'null', does: 'Muted text under the field.' },
  {
    name: 'error',
    type: 'string | null',
    value: 'null',
    does: 'Replaces the hint, and draws the field in its error state.',
  },
  { name: 'invalid', type: 'boolean', value: 'false', does: 'The error state without a message.' },
  { name: 'disabled', type: 'boolean', value: 'false', does: 'Also set by a form control’s disable().' },
  {
    name: 'inputId',
    type: 'string',
    value: 'generated',
    does: 'The id of the range input inside — what a <label for> points at.',
  },
  { name: 'name', type: 'string | null', value: 'null', does: 'The range input’s name.' },
];

export const SLIDER_MEMBERS: ApiRow[] = [
  { name: 'valueChange', type: 'number | null', does: 'The model’s output, on every step a drag or key crosses.' },
  { name: 'focus(options?)', type: 'void', does: 'Focuses the range input.' },
];

export const SLIDER_CSS: ApiRow[] = [
  {
    name: '--liquid-slider-hue',
    type: 'OKLCH hue',
    value: 'var(--svc-accent, 262)',
    does: 'The accent of the focus ring and the handle while held.',
  },
  { name: '--liquid-slider-tint', type: 'color', value: 'oklch(48% 0.16 hue)', does: 'The accent itself.' },
  { name: '--liquid-slider-height', type: 'length', value: '48px', does: 'The field’s height. The fill never gets narrower than half of it.' },
  {
    name: '--liquid-slider-gap',
    type: 'length',
    value: '0px',
    does: 'Insets the fill from the field on every side. The fill’s corners stay concentric with the field’s.',
  },
  { name: '--liquid-slider-radius', type: 'length', value: '12px', does: 'The corner radius of the field and the fill.' },
  { name: '--liquid-slider-font-size', type: 'length', value: '16px', does: 'The label and the number.' },
  {
    name: '--liquid-slider-background / -background-hover / -background-focus',
    type: 'color',
    value: 'app background / #ededf0 / #fff',
    does: 'The field’s fill at rest, under the pointer, and focused from the keyboard.',
  },
  { name: '--liquid-slider-fill', type: 'color', value: '#e1e1e6', does: 'The part of the field up to the value.' },
  {
    name: '--liquid-slider-fill-shadow',
    type: 'box-shadow',
    value: 'none',
    does: 'Lifts the fill off the field — with a gap and a white fill it reads as a raised thumb.',
  },
  { name: '--liquid-slider-handle-color', type: 'color', value: 'rgba(29,29,31,.45)', does: 'The handle at rest.' },
  { name: '--liquid-slider-tick-color', type: 'color', value: 'rgba(29,29,31,.28)', does: 'The dots.' },
  { name: '--liquid-slider-label-color', type: 'color', value: 'rgba(29,29,31,.5)', does: 'The label at rest.' },
  { name: '--liquid-slider-value-color', type: 'color', value: 'rgba(29,29,31,.85)', does: 'The number.' },
  { name: '--liquid-slider-rim-color', type: 'color', value: 'rgba(29,29,31,.05)', does: 'The 1px outline around the field.' },
  {
    name: '--liquid-slider-settle-duration',
    type: 'time',
    value: '340ms',
    does: 'How long the fill takes to settle on a value, and the focus ring to arrive.',
  },
  {
    name: '--liquid-slider-press-depth',
    type: 'number',
    value: '0.2',
    does: 'How far the field squashes under a finger. 1 is a button’s full press.',
  },
  { name: '--liquid-slider-press-duration', type: 'time', value: '110ms', does: 'The squash; the spring back takes 3.4× longer.' },
];
