import { ApiRow } from '../liquid-input-docs/liquid-input-docs.reference';

export const STEPPER_SETUP = `<x-liquid-stepper #stepper="liquidStepper" aria-label="Application" [(value)]="step">
  <button type="button" liquidStep="details">Details</button>
  <button type="button" liquidStep="documents">Documents</button>
  <button type="button" liquidStep="review">Review</button>
</x-liquid-stepper>

<section liquidStepPanel="details" [liquidStepPanelFor]="stepper">…</section>
<section liquidStepPanel="documents" [liquidStepPanelFor]="stepper">…</section>
<section liquidStepPanel="review" [liquidStepPanelFor]="stepper">…</section>

<button type="button" (click)="stepper.previous()" [disabled]="!stepper.canPrevious()">Back</button>
<button type="button" (click)="stepper.next()" [disabled]="!stepper.canNext()">Next</button>`;

export const STEPPER_CUSTOM = `<!-- an icon for the number, and a done element for the check -->
<button type="button" liquidStep="details">
  <ng-icon liquidStepIcon name="ionPersonOutline" />
  <ng-icon liquidStepDone name="ionCheckmarkDone" />
  Details
</button>

<!-- every check at once, and a theme, from CSS -->
.my-stepper {
  --liquid-stepper-check-image: url(/assets/tick.svg);
  --liquid-stepper-color: #12805c;
  --liquid-stepper-marker-radius: 10px;
}

<!-- one step on its own -->
<button type="button" liquidStep="review" style="--liquid-stepper-color: #c62828">Review</button>`;

export const STEPPER_CONTENT = `<x-liquid-stepper #stepper="liquidStepper" [(value)]="step">…</x-liquid-stepper>

<div liquidStepPanel [liquidStepPanelFor]="stepper" panelMode="slider">
  <ng-template liquidStepContent="details"><div>…</div></ng-template>
  <ng-template liquidStepContent="documents"><div>…</div></ng-template>
  <ng-template liquidStepContent="review"><div>…</div></ng-template>
</div>`;

export const STEPPER_RULES = `<x-liquid-stepper #stepper="liquidStepper" linear (blocked)="showErrors()" [(value)]="step">
  @for (s of steps; track s.key) {
    <button type="button" [liquidStep]="s.key" [valid]="validity()[s.key]">{{ s.title }}</button>
  }
</x-liquid-stepper>

@if (!stepper.isFirst()) { <button (click)="stepper.previous()">Back</button> }
@if (stepper.isLast()) { <button (click)="submit()">Submit</button> }
@else { <button (click)="stepper.next()">Continue</button> }`;

export const STEPPER_FORMS = `<!-- Reactive: one FormGroup per step -->
<form [formGroup]="form">
  <x-liquid-stepper #stepper="liquidStepper" linear [(value)]="step">
    <button type="button" liquidStep="details" [control]="form.controls.details">Details</button>
    <button type="button" liquidStep="contact" [control]="form.controls.contact">Contact</button>
    <button type="button" liquidStep="review">Review</button>
  </x-liquid-stepper>

  <div liquidStepPanel [liquidStepPanelFor]="stepper">
    <ng-template liquidStepContent="details">
      <div formGroupName="details"><x-liquid-input label="Full name" formControlName="name" /></div>
    </ng-template>
    …
  </div>

  <button type="button" (click)="stepper.next()">Continue</button>
</form>

<!-- Split forms: a form of its own per step, on the step's content -->
<x-liquid-stepper #stepper="liquidStepper" linear [(value)]="step">…</x-liquid-stepper>

<div liquidStepPanel [liquidStepPanelFor]="stepper">
  <ng-template liquidStepContent="details" [formGroup]="detailsForm">
    <div><x-liquid-input label="Full name" formControlName="name" /></div>
  </ng-template>
  <ng-template liquidStepContent="contact" [formGroup]="contactForm">
    <div>…</div>
  </ng-template>
</div>

<!-- Template-driven: the form holds only the step on screen -->
<form #td="ngForm">
  <x-liquid-stepper #stepper="liquidStepper" linear [(value)]="step">
    @for (s of steps; track s.key) {
      <button type="button" [liquidStep]="s.key" [control]="td.form">{{ s.title }}</button>
    }
  </x-liquid-stepper>

  <div liquidStepPanel [liquidStepPanelFor]="stepper">
    <ng-template liquidStepContent="details">
      <div><x-liquid-input label="Full name" name="name" required [(ngModel)]="name" /></div>
    </ng-template>
    …
  </div>
</form>`;

export const STEPPER_API: ApiRow[] = [
  {
    name: 'value',
    type: 'T | null',
    value: 'null',
    does: 'The selected step’s value. Two-way: [(value)]. While it is null the stepper starts on the first enabled step.',
  },
  {
    name: 'orientation',
    type: `'horizontal' | 'vertical'`,
    value: `'horizontal'`,
    does: 'Which way the steps run, and the axis the fill pours along.',
  },
  {
    name: 'variant',
    type: `'line' | 'pill'`,
    value: `'line'`,
    does: 'line joins the markers with a filling line; pill is a segmented bar with a pill that pours under the step, like the tabs.',
  },
  {
    name: 'stretch',
    type: 'boolean',
    value: 'false',
    does: 'In the pill, the steps share the width equally and the bar fills its container.',
  },
  {
    name: 'progress',
    type: 'boolean',
    value: 'false',
    does: 'In the pill, the highlight runs from the first step to the selected one and grows or shrinks to it, instead of moving from step to step.',
  },
  {
    name: 'flush',
    type: 'boolean',
    value: 'false',
    does: 'In the horizontal line, puts the first and last markers on the stepper’s edges, labels aligned to them, with no space outside.',
  },
  {
    name: 'blocked',
    type: 'output<LiquidStep>',
    does: 'Fires with the step that held the stepper back, when a move on was refused because it is not valid or its control is invalid. Show what is missing here.',
  },
  {
    name: 'linear',
    type: 'boolean',
    value: 'false',
    does: 'Leaves a step further on than the next one out of reach of click and keys.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    value: 'false',
    does: 'Disables every step at once.',
  },
];

export const STEPPER_MEMBERS: ApiRow[] = [
  {
    name: 'next() / previous()',
    type: 'boolean',
    does: 'Move to the nearest enabled step on that side. False when there is none.',
  },
  {
    name: 'select(value)',
    type: 'boolean',
    does: 'Select the step holding the value. False for an unknown or disabled one.',
  },
  {
    name: 'canNext / canPrevious',
    type: 'Signal<boolean>',
    does: 'Whether next() or previous() has a step to go to.',
  },
  {
    name: 'selectedIndex',
    type: 'Signal<number>',
    does: 'Where the selected step sits, from 0; -1 for none.',
  },
  { name: 'focus()', type: 'void', does: 'Moves focus onto the tab stop.' },
];

export const STEP_API: ApiRow[] = [
  {
    name: 'liquidStep',
    type: 'T',
    does: 'Makes the element a step and sets the value it selects. Its content is the label; the marker is drawn for it.',
  },
  { name: 'disabled', type: 'boolean', value: 'false', does: 'Takes the step out of reach.' },
  {
    name: 'valid',
    type: 'boolean | undefined',
    value: 'undefined',
    does: 'false holds the stepper on this step: next(), a click or a key will not move on past it, and blocked fires. Going back is never held.',
  },
  {
    name: 'control',
    type: 'AbstractControl | null',
    value: 'undefined',
    does: 'The step’s part of a form. Holds the stepper like valid=false while it is invalid or pending, and is marked all touched when it does, so its fields show their errors. A disabled control holds nothing.',
  },
  {
    name: 'id',
    type: 'string',
    value: 'generated',
    does: 'What the panel’s aria-labelledby points at.',
  },
];

export const STEP_SLOTS: ApiRow[] = [
  {
    name: 'liquidStepIcon',
    type: 'any element',
    does: 'Shown in the marker in place of the number, until the step is complete.',
  },
  {
    name: 'liquidStepDone',
    type: 'any element',
    does: 'Shown in the marker in place of the check, once the step is complete.',
  },
];

export const CONTENT_API: ApiRow[] = [
  {
    name: 'liquidStepContent',
    type: 'T',
    does: 'On an ng-template: the value of the step that builds this content. Left empty inside a panel that has a value, it takes the panel’s.',
  },
  {
    name: 'liquidStepContentFor',
    type: 'LiquidStepper',
    does: 'The stepper to follow when the content is not inside a liquidStepPanel.',
  },
  {
    name: '[formGroup] / formGroupName / ngModelGroup',
    type: 'on the same ng-template',
    does: 'The group the fields inside bind to, and what holds the stepper on this step, as control on the step does. A reactive group is checked even while the content is not built.',
  },
  {
    name: 'liquidStepContentAnimate',
    type: 'boolean',
    value: 'true',
    does: 'False turns the dissolve and the slide off.',
  },
];

export const PANEL_API: ApiRow[] = [
  {
    name: 'liquidStepPanel',
    type: 'T',
    does: 'The value of the step that shows this panel, which is hidden while it is not selected. Left empty it is shared: never hidden, and the home of liquidStepContent.',
  },
  {
    name: 'liquidStepPanelFor',
    type: 'LiquidStepper',
    does: 'The stepper it belongs to. Required: a panel can sit anywhere.',
  },
];

export const STEPPER_CLASSES: ApiRow[] = [
  { name: '.is-selected', type: 'on a step', does: 'The step being shown.' },
  {
    name: '.is-complete',
    type: 'on a step',
    does: 'Behind the selected step: its number is a check.',
  },
  { name: '.is-disabled', type: 'on a step', does: 'Disabled, or out of reach while linear.' },
  { name: '.is-vertical', type: 'on the stepper', does: 'orientation is vertical.' },
  { name: '.is-flush', type: 'on the stepper', does: 'flush is set.' },
  { name: '.is-progress', type: 'on the stepper', does: 'progress is set on a pill.' },
];

export const STEPPER_CSS: ApiRow[] = [
  {
    name: '--liquid-stepper-color',
    type: 'var(--color-primary)',
    does: 'The fill, and the selected and complete markers.',
  },
  {
    name: '--liquid-stepper-fill-color',
    type: '--liquid-stepper-color',
    does: 'The line’s fill alone. Takes a gradient, laid along the whole line, so the fill shows more of it as it grows.',
  },
  {
    name: '--liquid-stepper-check-color',
    type: '#fff',
    does: 'The check on a complete marker; set it when the colour is light.',
  },
  {
    name: '--liquid-stepper-background',
    type: '#fff',
    does: 'What the markers cover the line with; match the surface behind the stepper.',
  },
  {
    name: '--liquid-stepper-track-color',
    type: 'rgba(0, 0, 0, 0.1)',
    does: 'The line before the fill, and an upcoming marker’s ring.',
  },
  {
    name: '--liquid-stepper-label-color',
    type: 'rgba(29, 29, 31, 0.55)',
    does: 'An upcoming step’s label and number.',
  },
  {
    name: '--liquid-stepper-selected-label-color',
    type: '#1d1d1f',
    does: 'The selected step’s label.',
  },
  {
    name: '--liquid-stepper-hover-label-color',
    type: 'rgba(29, 29, 31, 0.8)',
    does: 'A hovered step’s label.',
  },
  { name: '--liquid-stepper-font-size', type: '13px', does: 'Label size.' },
  {
    name: '--liquid-stepper-gap',
    type: '0px',
    does: 'Space between steps; the line still runs marker to marker.',
  },
  { name: '--liquid-stepper-line-size', type: '3px', does: 'How thick the line is (read in px).' },
  {
    name: '--liquid-stepper-marker-size',
    type: '32px',
    does: 'The marker’s diameter; 22px in the pill.',
  },
  { name: '--liquid-stepper-marker-radius', type: '50%', does: 'The marker’s corners.' },
  {
    name: '--liquid-stepper-check-image',
    type: 'a tick',
    does: 'Any url(...) to draw in place of the check; it takes the marker’s colour.',
  },
  {
    name: '--liquid-stepper-duration',
    type: '340ms',
    does: 'A move of the fill, in ms; markers take their colour as it arrives.',
  },
  {
    name: '--liquid-stepper-pull',
    type: '10px',
    does: 'How far the fill reaches toward the next marker before it sets off.',
  },
  {
    name: '--liquid-stepper-press-duration',
    type: '110ms',
    does: 'How long a pressed step holds its squash.',
  },
];

export const STEPPER_PILL_CSS: ApiRow[] = [
  {
    name: '--liquid-stepper-pill-background',
    type: 'rgba(0, 0, 0, 0.05)',
    does: 'The bar behind the steps.',
  },
  {
    name: '--liquid-stepper-indicator-color',
    type: '#fff',
    does: 'The pill under the selected step.',
  },
  {
    name: '--liquid-stepper-indicator-shadow',
    type: '0 1px 4px rgba(0, 0, 0, 0.12)',
    does: 'The pill’s shadow.',
  },
  {
    name: '--liquid-stepper-marker-background',
    type: 'rgba(0, 0, 0, 0.07)',
    does: 'An upcoming step’s marker.',
  },
  { name: '--liquid-stepper-padding', type: '4px', does: 'Between the bar’s edge and the steps.' },
  {
    name: '--liquid-stepper-radius',
    type: '999px',
    does: 'The bar’s corners; 16px when vertical.',
  },
];

export interface Tune {
  name: string;
  unit: string;
  min: number;
  max: number;
  start: number;
  pill?: boolean;
}

export const STEPPER_TUNES: Tune[] = [
  { name: '--liquid-stepper-gap', unit: 'px', min: 0, max: 64, start: 0 },
  { name: '--liquid-stepper-marker-size', unit: 'px', min: 16, max: 48, start: 32 },
  { name: '--liquid-stepper-marker-radius', unit: '%', min: 0, max: 50, start: 50 },
  { name: '--liquid-stepper-line-size', unit: 'px', min: 1, max: 10, start: 3 },
  { name: '--liquid-stepper-font-size', unit: 'px', min: 11, max: 18, start: 13 },
  { name: '--liquid-stepper-duration', unit: 'ms', min: 0, max: 1200, start: 340 },
  { name: '--liquid-stepper-pull', unit: 'px', min: 0, max: 30, start: 10 },
  { name: '--liquid-stepper-press-duration', unit: 'ms', min: 0, max: 400, start: 110 },
  { name: '--liquid-stepper-padding', unit: 'px', min: 0, max: 12, start: 4, pill: true },
  { name: '--liquid-stepper-radius', unit: 'px', min: 0, max: 24, start: 24, pill: true },
];

export interface Paint {
  name: string;
  kind: 'color' | 'text';
  start: string;
  only?: 'line' | 'pill';
}

export const STEPPER_PAINTS: Paint[] = [
  { name: '--liquid-stepper-color', kind: 'color', start: '#1a73e8' },
  {
    name: '--liquid-stepper-fill-color',
    kind: 'text',
    start: 'linear-gradient(90deg, #1a73e8, #12805c)',
    only: 'line',
  },
  { name: '--liquid-stepper-track-color', kind: 'color', start: '#e6e6e6', only: 'line' },
  { name: '--liquid-stepper-background', kind: 'color', start: '#ffffff', only: 'line' },
  { name: '--liquid-stepper-check-color', kind: 'color', start: '#ffffff' },
  { name: '--liquid-stepper-label-color', kind: 'color', start: '#8e8e90' },
  { name: '--liquid-stepper-hover-label-color', kind: 'color', start: '#5d5d60' },
  { name: '--liquid-stepper-selected-label-color', kind: 'color', start: '#1d1d1f' },
  { name: '--liquid-stepper-check-image', kind: 'text', start: 'url(/assets/tick.svg)' },
  { name: '--liquid-stepper-pill-background', kind: 'color', start: '#f2f2f2', only: 'pill' },
  { name: '--liquid-stepper-indicator-color', kind: 'color', start: '#ffffff', only: 'pill' },
  {
    name: '--liquid-stepper-indicator-shadow',
    kind: 'text',
    start: '0 2px 10px rgba(0, 0, 0, 0.2)',
    only: 'pill',
  },
  { name: '--liquid-stepper-marker-background', kind: 'color', start: '#ededed', only: 'pill' },
];
