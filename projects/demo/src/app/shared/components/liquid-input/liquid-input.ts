import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  AfterViewInit,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl,
  Validators,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  ionAlertCircleOutline,
  ionCalendarOutline,
  ionCloseCircle,
  ionEyeOffOutline,
  ionEyeOutline,
  ionTimeOutline,
} from '@ng-icons/ionicons';
import { LIQUID_SEGMENT, LiquidSegment } from '@app/shared/components/liquid-input/liquid-segment';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import {
  backspaceRange,
  caretAfter,
  deleteRange,
  maskCapacity,
  maskText,
  rawBefore,
  unmaskText,
} from '@app/shared/utils/input-mask';
import { cssNumber, cssTime } from '@app/shared/utils/liquid-pour';
import { DEFAULT_PRESS_DURATION, LiquidPress } from '@app/shared/utils/liquid-press';

/**
 * What the field takes. `textarea` draws the same box around a `<textarea>`
 * rather than an `<input>`; everything else is the native `type` of one.
 */
export type LiquidInputType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'search'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'textarea';

/**
 * A message per validator key — `{ required: 'Name is required' }`. A function
 * is handed the validator's own detail, which is where `maxlength` keeps the
 * length that was exceeded.
 */
export type LiquidInputErrorMessages = Record<string, string | ((detail: never) => string)>;

/** One character on its way into the field, and where it is going. */
export interface LiquidInputTyped {
  /** The character as it was typed, pasted or dropped. */
  character: string;
  /** What the field holds at that moment — before this character lands in it. */
  value: string;
  /** Where it is going, as an index into that text. */
  index: number;
}

/**
 * What a character becomes on its way in. Return the text to put there — which
 * may be more than one character, or `''` to swallow it — or `null` to refuse
 * it outright, as though the key had not been pressed.
 */
export type LiquidInputTransform = (typed: LiquidInputTyped) => string | null;

/** One choice in a field that offers a list rather than taking typing. */
export interface LiquidInputOption {
  value: string;
  label: string;
}

/** Whatever the field turned out to be: typed into, written in, or chosen from. */
export type LiquidInputControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * How much of the press's deformation the field uses. A press's full `1.08 0.9`
 * is meant for something the size of a button: 8% of a field 260px wide is 21px
 * of spread, which on a box holding text reads as a wobble rather than a touch.
 * The toast card presses at 0.4 for the same reason; a field is calmer still.
 */
const PRESS_DEPTH = 0.3;

/** The field keeps its own name for the squash duration, as every presser does. */
const PRESS_DURATION_PROPERTY = '--liquid-input-press-duration';

/** The types whose value is chosen from a picker rather than typed out. */
const PICKER_TYPES: ReadonlySet<LiquidInputType> = new Set([
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
]);

let inputUid = 0;

/**
 * The portal's text field: the page tone set into the card, no border, the
 * service's hue for focus — the box `x-liquid-autocomplete` and `x-liquid-upload`
 * already draw, around a real `<input>` or `<textarea>`.
 *
 * ```html
 * <x-liquid-input
 *   label="Full name"
 *   placeholder="Sok Dara"
 *   hint="As printed on your ID"
 *   prefixIcon="ionPersonOutline"
 *   clearable
 *   formControlName="name"
 *   [errorMessages]="{ required: 'Name is required' }"
 * />
 * ```
 *
 * The API is Angular Material's `matInput`, gathered into one element: `label`,
 * `placeholder`, `hint` and the error line belong to the field rather than to a
 * wrapper around it. The native attributes worth setting are inputs of their own
 * — `type`, `autocomplete`, `inputmode`, `maxlength`, `min`, `max`, `step`,
 * `readonly`, `spellcheck` — and anything rarer is reached through
 * {@link element}, which hands back the control itself.
 *
 * It is a form control: `[formControl]`, `formControlName` and `ngModel` all
 * work, and so does `[(value)]` on its own with no form around it. The control
 * is marked touched on blur.
 *
 * **Errors.** Give `errorMessages` and the field says the first one that matches
 * once the control has been touched — the Material behaviour, without a
 * `<mat-error>` to write per field. `error` overrides that with a message of
 * your own, for a page that already works out its own text (as the application
 * form does). A control that is invalid with no message for what it failed on
 * still draws the invalid ring; `invalid` forces that ring on by itself.
 *
 * `required` is read off the control's own `Validators.required` where there is
 * one, so the mark under the label needs no second declaration.
 *
 * **Icons.** `prefixIcon` and `suffixIcon` name an `ng-icon`, registered by
 * whoever uses the field. `[liquidInputPrefix]` and `[liquidInputSuffix]` project
 * anything else into the same two places.
 *
 * Tuning, all read with a fallback so a `--liquid-input-*` set on any ancestor
 * reaches the fields under it: `hue` (an OKLCH hue in degrees, defaulting to
 * whatever `--svc-accent` the section carries), `height`, `radius`,
 * **Transforms.** `transformWith` is handed each character as it arrives and
 * says what it becomes — a letter into a digit, a Latin digit into a Khmer one,
 * `null` to refuse it. It runs before the mask, so what it returns is what the
 * slot is offered.
 *
 * **Masks.** `mask` gives the field a fixed-width pattern it types itself into
 * — `'000 000 000'`, `'A0000000'` — and the form is handed the characters
 * typed rather than the field's own text, unless `maskStores` says otherwise.
 * A separator is never something to delete: backspace takes the character in
 * front of it instead.
 *
 * `press-duration` and `press-depth`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'liquidInput',
  host: {
    class: 'liquid-input',
    '[class.is-focused]': 'hasFocus()',
    '[class.is-disabled]': 'isDisabled()',
    '[class.is-readonly]': 'readonly()',
    '[class.is-invalid]': 'hasError()',
    '[class.is-textarea]': "type() === 'textarea'",
    '[class.is-bare]': 'bare()',
    // What a group lays out: a class every segment carries, whatever it is.
    '[class.liquid-segment]': 'bare()',
    '[class.is-select]': 'options() !== null',
    '[style.--_width]': 'width()',
    '[class.has-value]': 'hasValue()',
  },
  imports: [LiquidPressable, NgIcon],
  providers: [
    provideIcons({
      ionAlertCircleOutline,
      ionCalendarOutline,
      ionCloseCircle,
      ionEyeOffOutline,
      ionEyeOutline,
      ionTimeOutline,
    }),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LiquidInput),
      multi: true,
    },
    // So an `x-liquid-input-group` can find this whatever kind of field it is.
    { provide: LIQUID_SEGMENT, useExisting: forwardRef(() => LiquidInput) },
  ],
  selector: 'x-liquid-input',
  styleUrl: './liquid-input.scss',
  templateUrl: './liquid-input.html',
})
export class LiquidInput implements AfterViewInit, ControlValueAccessor, LiquidSegment {
  /** What the field holds. Two-way: `[(value)]`. A `number` field gives a number. */
  readonly value = model<string | number | null>(null);

  readonly type = input<LiquidInputType>('text');
  /** The label above the field; also names the control where there is no text. */
  readonly label = input<string | null>(null);
  readonly placeholder = input('');
  /** A quiet line under the field, said whether or not there is an error. */
  readonly hint = input<string | null>(null);

  /** A message of the page's own, shown instead of anything `errorMessages` would say. */
  readonly error = input<string | null>(null);
  /** A message per validator key, said once the control has been touched. */
  readonly errorMessages = input<LiquidInputErrorMessages>({});

  /** An `ng-icon` name, inside the field at its start. Registered by the caller. */
  readonly prefixIcon = input<string | null>(null);
  readonly suffixIcon = input<string | null>(null);

  /** Offers a button that empties the field. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Offers the eye that shows what was typed. Only ever on a `password` field. */
  readonly revealable = input(false, { transform: booleanAttribute });
  /** Prints `length / maxlength` under the field. Needs a `maxlength`. */
  readonly showCount = input(false, { transform: booleanAttribute });
  /** Marks the field as one that may be left empty, the way the forms already do. */
  readonly optional = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Forces the invalid ring on, for a page validating outside the control. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Forces the required mark on; a `Validators.required` on the control is found on its own. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Draws what was typed in capitals without touching the value itself. */
  readonly uppercase = input(false, { transform: booleanAttribute });

  /**
   * A fixed-width pattern the field types itself into: `0` a digit, `A` a
   * letter, `*` either, and everything else a literal. `'000 000 000'` is a
   * phone number, `'A0000000'` a passport number.
   */
  readonly mask = input<string | null>(null);
  /**
   * What a masked field hands the form: `'raw'` the characters typed
   * (`'012345678'`), `'formatted'` the field's own text (`'012 345 678'`).
   */
  readonly maskStores = input<'raw' | 'formatted'>('raw');

  /**
   * What each character becomes as it is typed: `'a'` into `'0'`, a Latin digit
   * into a Khmer one, a letter into its capital — whatever the function says.
   * It runs before the mask, so what it returns is what the slot is offered.
   */
  readonly transformWith = input<LiquidInputTransform | null>(null);

  /**
   * Turns the field into a list to choose from rather than one to type in — a
   * country code, a title. Where there are options, `mask` and `transformWith`
   * have nothing to act on and are ignored.
   */
  readonly options = input<readonly LiquidInputOption[] | null>(null);

  /**
   * How wide the field is, as any CSS length: `'7ch'` for a country code. It
   * stops the field stretching to fill the row, which is what a segment of an
   * `x-liquid-input-group` usually wants.
   */
  readonly width = input<string | null>(null);

  /**
   * Draws no box, no label and no line under it — the field is a segment of
   * something that draws those itself. Its value still works the same way.
   */
  readonly bare = input(false, { transform: booleanAttribute });

  /**
   * The language what is typed is in — `'km'` for a field a Khmer name goes in.
   * The browser hands it to the keyboard and to the spell checker, and the font
   * stack picks it up.
   */
  readonly lang = input<string | null>(null);

  readonly autocomplete = input<string | null>(null);
  readonly inputmode = input<string | null>(null);
  readonly spellcheck = input<boolean | null, boolean | '' | null>(null, {
    transform: (value) => (value === null ? null : booleanAttribute(value)),
  });
  readonly maxlength = input<number | null, unknown>(null, {
    transform: (value) => (value === null || value === undefined ? null : numberAttribute(value)),
  });
  readonly minlength = input<number | null, unknown>(null, {
    transform: (value) => (value === null || value === undefined ? null : numberAttribute(value)),
  });
  /** `min`, `max` and `step` are the native ones: a number, or a date for a date field. */
  readonly min = input<string | number | null>(null);
  readonly max = input<string | number | null>(null);
  readonly step = input<string | number | null>(null);
  /** How many lines a `textarea` opens at. Ignored by every other type. */
  readonly rows = input(3, { transform: numberAttribute });

  /** The `id` of the control itself — what the label points at, and where `focus()` lands. */
  readonly inputId = input(`liquid-input-${++inputUid}`);
  /** The `name` the control is submitted under, for a form posted the old way. */
  readonly name = input<string | null>(null);
  /** Ids of anything else that describes the field. */
  readonly describedBy = input<string | null>(null);

  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly cleared = output<void>();

  private readonly field = viewChild<ElementRef<LiquidInputControl>>('field');
  private readonly press = viewChild.required<ElementRef<HTMLElement>>('press');
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly hasFocus = signal(false);
  protected readonly revealed = signal(false);
  /** Set by a form through `setDisabledState`, alongside the `disabled` input. */
  private readonly formDisabled = signal(false);

  /**
   * The press on the field's contents, built on the first focus — the field it
   * presses is a view child, and there is none of that while fields initialise.
   */
  private pressed: LiquidPress | null = null;
  /** The tap letting go on its own; cleared if the field is reached again first. */
  private letGo: ReturnType<typeof setTimeout> | undefined;

  /** The control this is the accessor for, once there is one. */
  private readonly control = signal<AbstractControl | null>(null);
  /** Bumped on anything the control reports, so the computeds below re-read it. */
  private readonly revision = signal(0);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly hasValue = computed(() => {
    const value = this.value();
    return value !== null && value !== undefined && value !== '';
  });

  /** What the control is actually drawn as — `password` only until the eye is used. */
  protected readonly fieldType = computed(() => {
    const type = this.type();
    if (type === 'textarea') return 'text';
    return type === 'password' && this.revealed() ? 'text' : type;
  });

  /**
   * The pattern, where it means anything. A number field cannot hold a
   * separator, and a picker and a text area own their own shape — so a mask on
   * one of those is ignored rather than left to fight it.
   */
  protected readonly activeMask = computed(() => {
    const mask = this.mask();
    if (!mask || this.options()) return null;
    const type = this.type();
    return type === 'number' || type === 'textarea' || PICKER_TYPES.has(type) ? null : mask;
  });

  protected readonly text = computed(() => {
    const value = this.value();
    const plain = value === null || value === undefined ? '' : String(value);
    const mask = this.activeMask();
    // Laid into the pattern whichever way it was handed over — a raw value from
    // a form, or a formatted one from a saved draft.
    return mask ? maskText(unmaskText(plain, mask), mask) : plain;
  });

  /** What the counter counts: the characters typed, not the separators. */
  protected readonly count = computed(() => {
    const mask = this.activeMask();
    return mask ? unmaskText(this.text(), mask).length : this.text().length;
  });

  /**
   * How much the field can hold: the limit it was given, else what its pattern
   * can take, else nothing in particular. A group reads it to know when a
   * segment is full and the next one should have the focus.
   */
  readonly capacity = computed(() => {
    const limit = this.maxlength();
    if (limit !== null) return limit;
    const mask = this.activeMask();
    return mask ? maskCapacity(mask) : null;
  });

  /** What the counter counts against. */
  protected readonly countLimit = this.capacity;

  protected readonly isRequired = computed(() => {
    this.revision();
    return this.required() || (this.control()?.hasValidator(Validators.required) ?? false);
  });

  /** The control's errors, but only once it is worth saying anything about them. */
  private readonly liveErrors = computed<Record<string, unknown> | null>(() => {
    this.revision();
    const control = this.control();
    if (!control || !control.touched) return null;
    return control.errors;
  });

  /** The message under the field: the page's own, else the first validator that matched. */
  protected readonly errorText = computed<string | null>(() => {
    const explicit = this.error();
    if (explicit) return explicit;

    const errors = this.liveErrors();
    if (!errors) return null;

    const messages = this.errorMessages();
    for (const key of Object.keys(errors)) {
      const message = messages[key];
      // The detail is the validator's own — `never` here so any shape a caller
      // names for it is assignable, which is the point of the function form.
      if (typeof message === 'function') return message(errors[key] as never);
      if (message) return message;
    }
    return null;
  });

  /**
   * The ring, which is not the message: a control can fail a validator nothing
   * has words for, and going unmarked would be worse than going unexplained.
   */
  protected readonly hasError = computed(
    () => this.invalid() || this.error() !== null || this.liveErrors() !== null,
  );

  protected readonly showClear = computed(
    () => this.clearable() && this.hasValue() && !this.isDisabled() && !this.readonly(),
  );

  protected readonly showReveal = computed(
    () => this.revealable() && this.type() === 'password' && !this.isDisabled(),
  );

  /**
   * A date or a time field is offered a way into its picker, because the glyph
   * the browser would have put there is taken out with the rest of its chrome.
   */
  protected readonly showPickerButton = computed(
    () => PICKER_TYPES.has(this.type()) && !this.isDisabled() && !this.readonly(),
  );

  protected readonly pickerIcon = computed(() =>
    this.type() === 'time' ? 'ionTimeOutline' : 'ionCalendarOutline',
  );

  protected readonly pickerLabel = computed(() =>
    this.type() === 'time'
      ? $localize`:@@form.input.chooseTime:Choose a time`
      : $localize`:@@form.input.chooseDate:Choose a date`,
  );

  protected readonly hintId = computed(() => `${this.inputId()}-hint`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly countId = computed(() => `${this.inputId()}-count`);

  protected readonly describedByIds = computed(() => {
    // Only what is actually on the page: the error takes the hint's place, and
    // a `describedby` pointing at an id that is not there says nothing at all.
    const ids = [
      this.errorText() ? this.errorId() : this.hint() ? this.hintId() : null,
      this.showCount() && this.countLimit() !== null ? this.countId() : null,
      this.describedBy(),
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  protected readonly clearLabel = $localize`:@@form.input.clear:Clear`;

  protected readonly revealLabel = computed(() =>
    this.revealed()
      ? $localize`:@@form.input.hidePassword:Hide password`
      : $localize`:@@form.input.showPassword:Show password`,
  );

  // Handed over by a form; no-ops until one registers.
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * The control is found here rather than injected, because injecting `NgControl`
   * from a component that is itself the `NG_VALUE_ACCESSOR` is a cycle: the
   * directive cannot be built until its accessor is, and the accessor is this.
   * By the time this runs both exist and the lookup is only a read.
   */
  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.letGo));

    // A list shows its first choice whether or not anything chose it — a
    // `<select>` with a value of `''` and no option to match has nothing
    // selected and draws blank. So the value is made to say what the field is
    // showing, unless a placeholder was given for standing empty.
    effect(() => {
      const options = this.options();
      if (!options?.length || this.placeholder() || this.text() !== '') return;
      untracked(() => this.commit(options[0].value));
    });
  }

  /**
   * Found here rather than in `ngOnInit`: `formControlName` only takes hold of
   * its control in its own `ngOnChanges`, which runs after a component's
   * `ngOnInit`. Looking any earlier finds the directive with nothing in it yet.
   */
  ngAfterViewInit(): void {
    const ngControl = this.injector.get(NgControl, null, { optional: true, self: true });
    const control = ngControl?.control ?? null;
    if (!control) return;

    this.control.set(control);
    // `events` carries touched and pristine as well as status, so a form that
    // marks everything touched on submit lights its fields up without being told.
    control.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.revision.update((revision) => revision + 1));
  }

  /** Puts the focus on the control, the way a failed validation wants to. */
  focus(options?: FocusOptions): void {
    this.element()?.focus(options);
  }

  blur(): void {
    this.element()?.blur();
  }

  /** What this holds, for a group that is holding it. See {@link LiquidSegment}. */
  segmentValue(): unknown {
    return this.value();
  }

  /** Selects what is in the field, for a value offered to be typed over. */
  select(): void {
    const control = this.element();
    // A list has nothing to select: it is chosen from, not typed over.
    if (control && !(control instanceof HTMLSelectElement)) control.select();
  }

  /** The `<input>` or `<textarea>` itself, for whatever this does not wrap. */
  element(): LiquidInputControl | null {
    return this.field()?.nativeElement ?? null;
  }

  protected onInput(element: LiquidInputControl): void {
    const mask = this.activeMask();
    if (mask && !(element instanceof HTMLSelectElement)) {
      this.onMaskedInput(element, mask);
      return;
    }

    const text = element.value;
    // A number field gives a number, and an empty one gives nothing rather than
    // the `NaN` that parsing an empty string would hand a form.
    const value = this.type() === 'number' ? (text === '' ? null : Number(text)) : text;
    this.commit(value);
  }

  /**
   * The field is written back directly rather than left to the binding: what was
   * typed may be refused outright — a letter in a digit's slot — and the value
   * the component holds would then be the one it already had, with nothing for
   * Angular to put right. The caret is put back by counting characters rather
   * than positions, so the separators the pattern adds never drag it around.
   */
  private onMaskedInput(element: HTMLInputElement | HTMLTextAreaElement, mask: string): void {
    const caret = element.selectionStart ?? element.value.length;
    const typed = rawBefore(element.value, mask, caret);

    const raw = unmaskText(element.value, mask);
    const text = maskText(raw, mask);
    element.value = text;

    const at = caretAfter(mask, typed, text.length);
    element.setSelectionRange(at, at);

    this.commit(this.maskStores() === 'formatted' ? text : raw);
  }

  /**
   * A separator types itself, so deleting one would only put it back. The
   * selection is widened over it to take the character it separates instead,
   * and the browser's own deletion then does the right thing.
   */
  protected onBeforeInput(
    event: InputEvent,
    element: HTMLInputElement | HTMLTextAreaElement,
  ): void {
    if (this.widenOverSeparator(event, element)) return;
    this.transformTyped(event, element);
  }

  /**
   * A separator types itself, so deleting one would only put it back. The
   * selection is widened over it to take the character it separates instead,
   * and the browser's own deletion then does the right thing.
   */
  private widenOverSeparator(
    event: InputEvent,
    element: HTMLInputElement | HTMLTextAreaElement,
  ): boolean {
    const mask = this.activeMask();
    if (!mask || element.selectionStart !== element.selectionEnd) return false;

    const caret = element.selectionStart ?? 0;
    const range =
      event.inputType === 'deleteContentBackward'
        ? backspaceRange(mask, caret)
        : event.inputType === 'deleteContentForward'
          ? deleteRange(mask, caret, element.value.length)
          : null;

    if (range) element.setSelectionRange(range[0], range[1]);
    return range !== null;
  }

  /**
   * Hands each character on its way in to {@link transformWith} and puts back
   * what it returns. Nothing is transformed on the way out: this is about what
   * someone typed, not about what a form handed the field.
   *
   * It runs on the way in rather than over the value afterwards, so the function
   * sees one character at a time and the caret never has to be guessed at. A
   * composition — a Khmer keyboard mid-syllable — is left alone: an IME owns
   * what it is building until it hands it over.
   */
  private transformTyped(event: InputEvent, element: HTMLInputElement | HTMLTextAreaElement): void {
    const transform = this.transformWith();
    if (!transform || event.isComposing) return;

    const typed = event.data ?? event.dataTransfer?.getData('text') ?? null;
    if (typed === null || typed === '') return;

    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    const value = element.value;

    let text = '';
    let index = start;
    for (const character of typed) {
      const replacement = transform({ character, value, index });
      if (replacement === null) continue;
      text += replacement;
      index += replacement.length;
    }
    // Unchanged: let the browser type it, which keeps its own undo and caret.
    if (text === typed) return;

    event.preventDefault();
    element.setRangeText(text, start, end, 'end');
    // `setRangeText` fires nothing, so the field is put through the same path
    // typing would have taken it through — the mask, the value, the form.
    this.onInput(element);
  }

  protected onFocus(): void {
    this.hasFocus.set(true);
    this.settle();
    this.focused.emit();
  }

  protected onBlur(): void {
    this.hasFocus.set(false);
    this.onTouched();
    this.revision.update((revision) => revision + 1);
    this.blurred.emit();
  }

  protected clear(): void {
    this.commit(this.type() === 'number' ? null : '');
    this.cleared.emit();
    // The button that was clicked may now be gone; the field keeps the focus.
    this.focus();
  }

  /**
   * Opens the native picker the field's own button stands in for. `showPicker`
   * wants a gesture and is not everywhere yet; where it is missing or declined,
   * the field is left focused and the keyboard can still fill it in.
   */
  protected openPicker(): void {
    const control = this.element();
    if (!control) return;
    control.focus();
    try {
      (control as HTMLInputElement).showPicker?.();
    } catch {
      // The browser declined it — nothing else to do, and nothing to report.
    }
  }

  protected toggleReveal(): void {
    this.revealed.update((revealed) => !revealed);
    this.focus();
  }

  /**
   * The field answers being reached: what it holds flattens and spreads, then
   * springs back through the other shape — the press every other liquid surface
   * uses, at a fraction of its depth.
   *
   * It is the press *shape*, but a tap rather than a hold. A held press would
   * keep the box deformed for as long as the pointer is down, which is exactly
   * when someone is dragging to select the text inside it. Letting go once the
   * squash has landed also means the keyboard gets the same answer as the
   * pointer: this runs on focus, however the focus arrived.
   *
   * The press squashes an element's children, and `#press` holds exactly one —
   * the field — so the whole box gives as a single surface with everything on it
   * travelling along. Pressing the field's own children instead would scale each
   * of them about its own centre, which spreads the box 6px while the icon at
   * its edge moves half a pixel: the paint slides out from under its contents.
   *
   * A scale is not a layout, so the row keeps exactly the size the grid gave it
   * however far the field squashes past it.
   */
  private settle(): void {
    // A segment's box is the group's, and the group presses it: two presses on
    // one surface would each start from the other's scale.
    if (this.bare()) return;

    const element = this.press().nativeElement;
    const view = element.ownerDocument.defaultView;
    if (!view) return;

    // The press checks `prefers-reduced-motion` and skips a child that cannot be
    // animated, so nothing more is needed for a reduced-motion browser or a test
    // environment with no Web Animations API.
    this.pressed ??= new LiquidPress(
      element,
      element.ownerDocument,
      PRESS_DURATION_PROPERTY,
      cssNumber(view, element, '--liquid-input-press-depth', PRESS_DEPTH),
    );

    // A tap still being held when the field is reached again has to be let go of
    // first: its own release was cancelled with the timer, and `press` does
    // nothing while something is already down — which would leave the squash on
    // the field for good. Released, it bounces from where it is, and the press
    // that follows picks up the resting shape rather than the bounce.
    clearTimeout(this.letGo);
    this.pressed.release();
    this.pressed.press();
    this.letGo = setTimeout(
      () => this.pressed?.release(),
      cssTime(view, element, PRESS_DURATION_PROPERTY, DEFAULT_PRESS_DURATION),
    );
  }

  private commit(value: string | number | null): void {
    this.value.set(value);
    this.onChange(value);
  }

  // ── ControlValueAccessor ───────────────────────────────────────────────────

  writeValue(value: string | number | null | undefined): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
