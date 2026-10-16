import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  ionCallOutline,
  ionLockClosedOutline,
  ionMailOutline,
  ionPersonOutline,
  ionSearchOutline,
} from '@ng-icons/ionicons';
import { LiquidAutocomplete } from '@app/shared/components/liquid-autocomplete/liquid-autocomplete';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import {
  LiquidInputGroup,
  LiquidInputGroupValue,
} from '@app/shared/components/liquid-input-group/liquid-input-group';
import {
  LiquidInput,
  LiquidInputType,
  LiquidInputTyped,
} from '@app/shared/components/liquid-input/liquid-input';
import {
  BEHAVIOUR,
  CSS_API,
  FIGURES,
  FILES,
  GAPS,
  GROUP_API,
  INPUT_API,
  INPUT_MEMBERS,
  MOTION,
  Section,
} from './liquid-input-docs.reference';

/** A dialling code, in the shape the app's pickers take. */
const CODES = [
  { key: '+855', name: '+855', name_en: 'Cambodia' },
  { key: '+66', name: '+66', name_en: 'Thailand' },
  { key: '+84', name: '+84', name_en: 'Viet Nam' },
  { key: '+1', name: '+1', name_en: 'United States' },
];

/** A group holds an object, and `Validators.required` passes an empty one. */
const complete =
  (parts: string[]) =>
  (control: AbstractControl): ValidationErrors | null =>
    parts.every((part) => control.value?.[part]) ? null : { incomplete: true };

/**
 * The documentation for `x-liquid-input` and `x-liquid-input-group`: what they
 * take, what they answer with, how they move, and what they do not do — beside
 * the components themselves, running.
 *
 * The pages under `.claude/demo/` run off disk on framework-free twins, which
 * is what lets them open with no build and what makes them drift. This one
 * imports the components, so it cannot: change one and this changes with it, or
 * the build fails first.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LiquidAutocomplete,
    LiquidInput,
    LiquidInputGroup,
    LiquidPressable,
    ReactiveFormsModule,
  ],
  providers: [
    provideIcons({
      ionCallOutline,
      ionLockClosedOutline,
      ionMailOutline,
      ionPersonOutline,
      ionSearchOutline,
    }),
  ],
  selector: 'app-liquid-input-docs',
  styleUrl: './liquid-input-docs.scss',
  templateUrl: './liquid-input-docs.html',
})
export class LiquidInputDocs {
  private readonly builder = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);

  protected readonly inputApi = INPUT_API;
  protected readonly inputMembers = INPUT_MEMBERS;
  protected readonly groupApi = GROUP_API;
  protected readonly cssApi = CSS_API;
  protected readonly motion = MOTION;
  protected readonly figures = FIGURES;
  protected readonly behaviour = BEHAVIOUR;
  protected readonly gaps = GAPS;
  protected readonly files = FILES;

  /** What the rail on the right lists, and what the page is made of. */
  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'setup', title: 'Setup' },
    { id: 'playground', title: 'Playground' },
    { id: 'examples', title: 'Examples' },
    { id: 'basics', title: 'Label, hint, placeholder', nested: true },
    { id: 'masks', title: 'Masks', nested: true },
    { id: 'transforms', title: 'Transforms', nested: true },
    { id: 'actions', title: 'Clear, reveal, count', nested: true },
    { id: 'states', title: 'States', nested: true },
    { id: 'groups', title: 'Groups, in a form', nested: true },
    { id: 'api-input', title: 'Inputs' },
    { id: 'api-members', title: 'Outputs & methods' },
    { id: 'api-group', title: 'Group API' },
    { id: 'api-types', title: 'Types' },
    { id: 'api-css', title: 'CSS properties' },
    { id: 'motion', title: 'Motion' },
    { id: 'behaviour', title: 'Behaviour & a11y' },
    { id: 'files', title: 'Files' },
  ];

  // ── Code, as text ──────────────────────────────────────────────────────────
  // Written here rather than in the template: a template is parsed, and a code
  // sample full of braces and angle brackets would be read as bindings.

  protected readonly code = {
    setup: `import { LiquidInput } from '@app/shared/components/liquid-input/liquid-input';
import { LiquidInputGroup } from '@app/shared/components/liquid-input-group/liquid-input-group';

// In the component that uses them
imports: [LiquidInput, LiquidInputGroup, ReactiveFormsModule],`,

    template: `<x-liquid-input
  label="Full name"
  placeholder="Sok Dara"
  hint="As printed on your ID"
  prefixIcon="ionPersonOutline"
  clearable
  formControlName="name"
  [errorMessages]="{ required: 'Name is required' }"
/>`,

    mask: `<!-- 0 a digit, A a letter in any script, * either. -->
<x-liquid-input label="Phone" type="tel" mask="000 000 000" formControlName="phone" />
<x-liquid-input label="Passport no." mask="A0000000" maskStores="formatted" />`,

    transform: `// Latin digits typed, Khmer digits held — everything else left as it was.
toKhmer = ({ character }: LiquidInputTyped) => {
  const at = '0123456789'.indexOf(character);
  return at === -1 ? character : '០១២៣៤៥៦៧៨៩'[at];
};

// It runs before the mask, so the slot is offered what it returned.
<x-liquid-input mask="000 000 000" [transformWith]="toKhmer" />`,

    group: `<x-liquid-input-group label="Phone" formControlName="phone">
  <x-liquid-autocomplete bare name="code" label="Dialling code" width="9ch"
                         [options]="codes" [displayWith]="codeName" />
  <x-liquid-input bare name="number" label="Number" mask="000 000 000" />
</x-liquid-input-group>

// form.value.phone → { code: { key: '+855', … }, number: '012345678' }

// A group holds an object, so Validators.required passes an empty one:
// it only ever checks for null or an empty length. Validate the parts.
const complete = (control: AbstractControl) =>
  ['day', 'month', 'year'].every((part) => control.value?.[part])
    ? null
    : { incomplete: true };`,

    types: `type LiquidInputType =
  | 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number'
  | 'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'textarea';

// A message per validator key; the function form is handed the validator's detail.
type LiquidInputErrorMessages = Record<string, string | ((detail: never) => string)>;

// One character on its way in, and where it is going.
interface LiquidInputTyped { character: string; value: string; index: number }
type LiquidInputTransform = (typed: LiquidInputTyped) => string | null;

// What a group needs of its segments, so any component can be one.
interface LiquidSegment {
  readonly name: Signal<string | null>;
  segmentValue(): unknown;
  writeValue(value: unknown): void;
  focus(options?: FocusOptions): void;
  capacity?: Signal<number | null>;
}`,
  };

  // ── The playground ─────────────────────────────────────────────────────────

  protected readonly types: LiquidInputType[] = [
    'text',
    'email',
    'password',
    'tel',
    'url',
    'search',
    'number',
    'date',
    'time',
    'textarea',
  ];

  protected readonly play = {
    type: signal<LiquidInputType>('text'),
    label: signal('Full name'),
    placeholder: signal('Sok Dara'),
    hint: signal('As printed on your ID'),
    mask: signal(''),
    maxlength: signal(0),
    prefixIcon: signal(''),
    clearable: signal(true),
    revealable: signal(false),
    showCount: signal(false),
    optional: signal(false),
    required: signal(false),
    uppercase: signal(false),
    disabled: signal(false),
    readonly: signal(false),
    invalid: signal(false),
  };

  /** The flags the playground toggles — typed here, so the template stays typed. */
  protected readonly flags = [
    'clearable',
    'revealable',
    'showCount',
    'optional',
    'required',
    'uppercase',
    'disabled',
    'readonly',
    'invalid',
  ] as const;

  protected readonly played = signal<string | number | null>('');

  /** The markup that would draw what is on screen. */
  protected readonly markup = computed(() => {
    const lines = ['<x-liquid-input'];
    const attr = (text: string) => lines.push(`  ${text}`);

    if (this.play.label()) attr(`label="${this.play.label()}"`);
    if (this.play.type() !== 'text') attr(`type="${this.play.type()}"`);
    if (this.play.placeholder()) attr(`placeholder="${this.play.placeholder()}"`);
    if (this.play.hint()) attr(`hint="${this.play.hint()}"`);
    if (this.play.mask()) attr(`mask="${this.play.mask()}"`);
    if (this.play.maxlength()) attr(`[maxlength]="${this.play.maxlength()}"`);
    if (this.play.prefixIcon()) attr(`prefixIcon="${this.play.prefixIcon()}"`);
    for (const flag of this.flags) {
      if (this.play[flag]()) attr(flag);
    }
    attr('[(value)]="name"');
    lines.push('/>');
    return lines.join('\n');
  });

  protected set(key: keyof typeof this.play, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const control = this.play[key] as ReturnType<typeof signal<unknown>>;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      control.set(target.checked);
      return;
    }
    control.set(target.type === 'number' ? Number(target.value) : target.value);
  }

  // ── The examples ───────────────────────────────────────────────────────────

  protected readonly codes = CODES;
  protected readonly codeName = (item: (typeof CODES)[number]) => item.name;
  protected readonly codeCaption = (item: (typeof CODES)[number]) => item.name_en;
  protected readonly sameKey = (a: { key?: string }, b: { key?: string }) => a?.key === b?.key;

  protected readonly name = signal<string | number | null>('');
  protected readonly note = signal<string | number | null>('');
  protected readonly search = signal<string | number | null>('');
  protected readonly password = signal<string | number | null>('correct-horse');
  protected readonly age = signal<string | number | null>(null);
  protected readonly passport = signal<string | number | null>('');
  protected readonly anything = signal<string | number | null>('');
  protected readonly khmer = signal<string | number | null>('');

  protected readonly form = this.builder.group({
    email: ['', [Validators.required, Validators.email]],
    phone: [{ code: CODES[0], number: '' } as LiquidInputGroupValue, complete(['number'])],
    date: [{} as LiquidInputGroupValue, complete(['day', 'month', 'year'])],
  });

  protected readonly emailErrors = {
    required: 'An email address is required',
    email: 'That is not an email address',
  };
  protected readonly phoneErrors = { incomplete: 'A number is required' };
  protected readonly dateErrors = { incomplete: 'All three parts are needed' };

  /** A phone keypad: a letter becomes the digit it shares a key with. */
  protected readonly keypad = ({ character }: LiquidInputTyped): string | null => {
    const keys: Record<string, string> = {
      abc: '2',
      def: '3',
      ghi: '4',
      jkl: '5',
      mno: '6',
      pqrs: '7',
      tuv: '8',
      wxyz: '9',
    };
    const key = Object.keys(keys).find((letters) => letters.includes(character.toLowerCase()));
    return key ? keys[key] : /\d/.test(character) ? character : null;
  };

  /** Latin digits typed, Khmer digits held — everything else left as it was. */
  protected readonly toKhmer = ({ character }: LiquidInputTyped): string | null => {
    const at = '0123456789'.indexOf(character);
    return at === -1 ? character : '០១២៣៤៥៦៧៨៩'[at];
  };

  protected readonly upper = ({ character }: LiquidInputTyped): string => character.toUpperCase();

  protected readonly formValue = signal('');

  constructor() {
    this.form.valueChanges.subscribe(() =>
      this.formValue.set(JSON.stringify(this.form.value, null, 2)),
    );
    this.formValue.set(JSON.stringify(this.form.value, null, 2));
  }

  /**
   * Jumps to a heading without leaving the page. A bare `#id` in an `href`
   * resolves against `<base href="/">`, not against the page it is written on —
   * so the link alone would land on the site's front door. The href is kept for
   * what a link is for: copying, and opening in a new tab.
   */
  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }

  /** What a submit does: marks everything touched, so every error speaks at once. */
  protected submit(): void {
    this.form.markAllAsTouched();
  }
}
