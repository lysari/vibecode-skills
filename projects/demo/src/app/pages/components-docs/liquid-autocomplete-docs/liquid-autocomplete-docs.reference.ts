import { ApiRow } from '../liquid-input-docs/liquid-input-docs.reference';

export const AUTOCOMPLETE_SETUP = `import { LiquidAutocomplete } from '@app/shared/components/liquid-autocomplete/liquid-autocomplete';

@Component({ imports: [LiquidAutocomplete] })

<label for="province">Province</label>
<x-liquid-autocomplete
  inputId="province"
  label="Province"
  [options]="provinces"
  [(value)]="province"
  [displayWith]="optionName"
  [captionWith]="optionCaption"
  [compareWith]="sameKey"
/>

// Plain functions, so they never need \`this\`
optionName = (item: ISelectValue) => item.name ?? '';
optionCaption = (item: ISelectValue) => item.name_en ?? '';
sameKey = (a: ISelectValue, b: ISelectValue) => a.key === b.key;`;

export const AUTOCOMPLETE_GROUPS = `<x-liquid-autocomplete
  label="Service"
  [options]="subServices"
  [displayWith]="optionName"
  [captionWith]="optionCaption"
  [groupWith]="serviceOf"
  [iconWith]="iconOf"
/>

// The icons are the caller's: register every name iconWith can return
providers: [provideIcons(SERVICE_ICONS)]`;

export const AUTOCOMPLETE_TEMPLATE = `<x-liquid-autocomplete [options]="countries" [(value)]="country">
  <ng-template liquidAutocompleteOption let-option let-selected="selected">
    @let country = asOption(option);
    <span class="code">{{ country.key }}</span> {{ country.name_en }}
  </ng-template>
</x-liquid-autocomplete>

// The template's option is unknown to the compiler: cast it once
asOption = (option: unknown) => option as ISelectValue;`;

export const AUTOCOMPLETE_FORMS = `<!-- Reactive -->
<x-liquid-autocomplete [formControl]="province" [options]="provinces" … />
province = new FormControl<ISelectValue | null>(null, Validators.required);

<!-- Template-driven -->
<x-liquid-autocomplete name="occupation" required [(ngModel)]="occupation" [options]="occupations" … />`;

export const AUTOCOMPLETE_API: ApiRow[] = [
  { name: 'options', type: 'readonly T[]', value: 'required', does: 'What the list offers.' },
  {
    name: 'value',
    type: 'T | null',
    value: 'null',
    does: 'The selected option. Two-way: [(value)].',
  },
  {
    name: 'displayWith',
    type: '(option: T) => string',
    value: 'String',
    does: 'The text an option is listed, searched and shown in the field as.',
  },
  {
    name: 'captionWith',
    type: '(option: T) => string',
    value: 'null',
    does: 'A second, quieter line under the label. Also searched.',
  },
  {
    name: 'groupWith',
    type: '(option: T) => string',
    value: 'null',
    does: 'The heading an option is listed under. Groups appear in first-seen order.',
  },
  {
    name: 'iconWith',
    type: '(option: T) => string',
    value: 'null',
    does: 'An ng-icon name for the option’s tile. The owner of the options registers it.',
  },
  {
    name: 'disabledWith',
    type: '(option: T) => boolean',
    value: 'null',
    does: 'Keeps an option on the list but out of reach.',
  },
  {
    name: 'compareWith',
    type: '(a: T, b: T) => boolean',
    value: 'Object.is',
    does: 'When two options are the same one — needed once the value comes from anywhere but the options array, a saved draft for instance.',
  },
  {
    name: 'label',
    type: 'string | null',
    value: 'null',
    does: 'Names the popup, and the field for a screen reader with no <label for>.',
  },
  { name: 'placeholder', type: 'string', value: `'Select…'`, does: 'Shown while nothing is selected.' },
  { name: 'searchPlaceholder', type: 'string', value: `'Search'`, does: 'Shown in the empty search field.' },
  {
    name: 'searchable',
    type: `boolean | 'auto'`,
    value: `'auto'`,
    does: 'Whether the popup has a search field. auto: from 7 options up.',
  },
  { name: 'clearable', type: 'boolean', value: 'false', does: 'Offers a button that empties the field.' },
  { name: 'disabled', type: 'boolean', value: 'false', does: 'Also set by a form control’s disable().' },
  { name: 'invalid', type: 'boolean', value: 'false', does: 'Draws the field in its error state.' },
  {
    name: 'inputId',
    type: 'string',
    value: 'generated',
    does: 'The field’s id — what a <label for> points at, and what focus() lands on.',
  },
  { name: 'describedBy', type: 'string | null', value: 'null', does: 'aria-describedby, for a hint or an error.' },
  {
    name: 'name',
    type: 'string | null',
    value: 'null',
    does: 'The key an x-liquid-input-group holds this segment’s value under.',
  },
  {
    name: 'bare',
    type: 'boolean',
    value: 'false',
    does: 'No box and no chevron well of its own — for a segment of a group that draws those.',
  },
  { name: 'width', type: 'string | null', value: 'null', does: 'A segment’s width, as any CSS length.' },
];

export const AUTOCOMPLETE_OUTPUTS: ApiRow[] = [
  { name: 'opened', type: 'void', does: 'The popup started opening.' },
  {
    name: 'closed',
    type: 'LiquidMenuCloseReason',
    does: 'The popup started closing, and why. The control is marked touched here.',
  },
  { name: 'focused', type: 'void', does: 'The field took the focus.' },
  { name: 'blurred', type: 'void', does: 'The field lost the focus.' },
];

export const AUTOCOMPLETE_MEMBERS: ApiRow[] = [
  { name: 'open()', type: 'void', does: 'Opens the popup.' },
  { name: 'close()', type: 'void', does: 'Closes it.' },
  { name: 'focus(options?)', type: 'void', does: 'Focuses the field.' },
];

export const AUTOCOMPLETE_OPTION_CONTEXT: ApiRow[] = [
  { name: '$implicit', type: 'T', does: 'The option.' },
  { name: 'selected', type: 'boolean', does: 'It is the value.' },
  { name: 'active', type: 'boolean', does: 'The arrow keys are on it.' },
];

export const AUTOCOMPLETE_CSS: ApiRow[] = [
  {
    name: '--liquid-autocomplete-hue',
    type: 'OKLCH hue',
    value: 'var(--svc-accent, 262)',
    does: 'The accent of the focus ring, the active row and the check.',
  },
  { name: '--liquid-autocomplete-height', type: 'length', value: '46px', does: 'The field’s height.' },
  { name: '--liquid-autocomplete-radius', type: 'length', value: '14px', does: 'The field’s corner radius.' },
  {
    name: '--liquid-autocomplete-background / -background-hover',
    type: 'color',
    value: 'app background / #ededf0',
    does: 'The field’s fill, at rest and under the pointer.',
  },
  { name: '--liquid-autocomplete-font-size', type: 'length', value: '14px', does: 'The field’s text size.' },
  { name: '--liquid-autocomplete-panel-width', type: 'length', value: '300px', does: 'The popup’s width; never narrower than the field.' },
];
