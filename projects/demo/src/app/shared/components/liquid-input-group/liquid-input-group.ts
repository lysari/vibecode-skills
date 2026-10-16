import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  AfterViewInit,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
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
import { ionAlertCircleOutline } from '@ng-icons/ionicons';
import { LiquidInputErrorMessages } from '@app/shared/components/liquid-input/liquid-input';
import { LIQUID_SEGMENT, LiquidSegment } from '@app/shared/components/liquid-input/liquid-segment';
import { cssNumber, cssTime } from '@app/shared/utils/liquid-pour';
import { DEFAULT_PRESS_DURATION, LiquidPress } from '@app/shared/utils/liquid-press';

/**
 * What a group holds: one value per segment, under the segment's own name.
 * A segment says what its own value is — a masked field holds text, and an
 * `x-liquid-autocomplete` holds whichever option was picked.
 */
export type LiquidInputGroupValue = Record<string, unknown>;

const PRESS_DEPTH = 0.3;
const PRESS_DURATION_PROPERTY = '--liquid-input-group-press-duration';

/** Two gatherings of the same segments, compared without caring about order. */
function sameValue(a: LiquidInputGroupValue, b: LiquidInputGroupValue): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => a[key] === b[key]);
}

let groupUid = 0;

/**
 * Several fields drawn as one: a country code beside a number, a date in three
 * parts, an identifier split the way it is printed.
 *
 * ```html
 * <x-liquid-input-group label="Phone" formControlName="phone">
 *   <x-liquid-input bare name="code" label="Country code" [options]="codes" width="7ch" />
 *   <x-liquid-input bare name="number" label="Number" mask="000 000 000" />
 * </x-liquid-input-group>
 * ```
 *
 * The segments are `x-liquid-input`s wearing `bare`: they keep their own mask,
 * transform, options and placeholder, and give up the box, the label and the
 * line underneath — which the group draws once, around all of them. Everything
 * else about a field is the group's too: one label, one hint, one error, one
 * focus ring, and one press when any segment is reached.
 *
 * The value is an object keyed by each segment's `name`, so the form is handed
 * `{ code: '+855', number: '012345678' }` rather than a string somebody has to
 * take apart again. `[formControl]`, `formControlName`, `ngModel` and `[(value)]`
 * all work, and the control is marked touched when the focus leaves the group
 * rather than each time it moves between segments.
 *
 * A segment that fills up hands the focus to the next one, and a backspace at
 * the start of an empty one hands it back — the way a date field moves between
 * its own parts.
 *
 * Tuning, read with a fallback: `--liquid-input-group-*` for `hue`, `height`,
 * `radius`, `background`, `settle-duration`, `press-duration` and `press-depth`,
 * plus `--liquid-input-group-separator` and `-separator-height` for the hairline
 * drawn between them — inset, and well short of the field's own height, because
 * it separates two halves of one control rather than one card from the page.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'liquidInputGroup',
  host: {
    class: 'liquid-input-group',
    '[class.is-focused]': 'hasFocus()',
    '[class.is-disabled]': 'isDisabled()',
    '[class.is-invalid]': 'hasError()',
  },
  imports: [NgIcon],
  providers: [
    provideIcons({ ionAlertCircleOutline }),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LiquidInputGroup),
      multi: true,
    },
  ],
  selector: 'x-liquid-input-group',
  styleUrl: './liquid-input-group.scss',
  templateUrl: './liquid-input-group.html',
})
export class LiquidInputGroup implements AfterViewInit, ControlValueAccessor {
  /** One value per segment, under the segment's own `name`. Two-way: `[(value)]`. */
  readonly value = model<LiquidInputGroupValue>({});

  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly errorMessages = input<LiquidInputErrorMessages>({});
  readonly optional = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly describedBy = input<string | null>(null);
  /** What the group's label points at: the first segment, unless told otherwise. */
  readonly inputId = input<string | null>(null);

  readonly focused = output<void>();
  readonly blurred = output<void>();

  /**
   * The segments, in the order they were written — found by what they registered
   * as rather than by what they are, so a picker and a masked field are equally
   * welcome in the same box.
   */
  private readonly segments = contentChildren<LiquidSegment>(LIQUID_SEGMENT);

  private readonly press = viewChild.required<ElementRef<HTMLElement>>('press');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly hasFocus = signal(false);
  private readonly formDisabled = signal(false);
  private readonly control = signal<AbstractControl | null>(null);
  private readonly revision = signal(0);

  /** What each segment held when the group last looked, so it can tell which moved. */
  private readonly lastSeen = new WeakMap<LiquidSegment, unknown>();

  private pressed: LiquidPress | null = null;
  private letGo: ReturnType<typeof setTimeout> | undefined;
  /** The focus moving between segments is not the focus leaving the group. */
  private leaving: ReturnType<typeof setTimeout> | undefined;

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly hintId = computed(() => `${this.uid}-hint`);
  protected readonly errorId = computed(() => `${this.uid}-error`);

  private readonly uid = `liquid-input-group-${++groupUid}`;

  /** The id the label points at: whatever the first segment calls its control. */
  protected readonly labelFor = computed(
    () => this.inputId() ?? this.segments()[0]?.inputId() ?? null,
  );

  protected readonly isRequired = computed(() => {
    this.revision();
    return this.required() || (this.control()?.hasValidator(Validators.required) ?? false);
  });

  private readonly liveErrors = computed<Record<string, unknown> | null>(() => {
    this.revision();
    const control = this.control();
    if (!control || !control.touched) return null;
    return control.errors;
  });

  protected readonly errorText = computed<string | null>(() => {
    const explicit = this.error();
    if (explicit) return explicit;

    const errors = this.liveErrors();
    if (!errors) return null;

    const messages = this.errorMessages();
    for (const key of Object.keys(errors)) {
      const message = messages[key];
      if (typeof message === 'function') return message(errors[key] as never);
      if (message) return message;
    }
    return null;
  });

  protected readonly hasError = computed(
    () => this.invalid() || this.error() !== null || this.liveErrors() !== null,
  );

  protected readonly describedByIds = computed(() => {
    const ids = [
      this.errorText() ? this.errorId() : this.hint() ? this.hintId() : null,
      this.describedBy(),
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  private onChange: (value: LiquidInputGroupValue) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.letGo);
      clearTimeout(this.leaving);
    });

    // Each segment keeps its own value; the group holds what they add up to, and
    // hands each one back its share whenever a form writes to the whole.
    effect(() => {
      const value = this.value();
      for (const segment of this.segments()) {
        const name = segment.name();
        if (!name) continue;
        const held = value[name] ?? '';
        if (untracked(() => segment.segmentValue()) !== held) segment.writeValue(held);
      }
    });

    // One effect watching what every segment holds, rather than a subscription
    // each: a segment reports through a signal, so this re-runs when any moves.
    effect(() => this.gather());

    effect((cleanup) => {
      const segments = this.segments();
      const disabled = this.isDisabled();
      const subscriptions = segments.map((segment) => {
        segment.setDisabledState(disabled);
        return [
          segment.focused.subscribe(() => this.onSegmentFocus()),
          segment.blurred.subscribe(() => this.onSegmentBlur()),
        ];
      });
      cleanup(() => subscriptions.flat().forEach((subscription) => subscription.unsubscribe()));
    });
  }

  /**
   * What the segments hold, gathered. Read through each segment's own signal
   * rather than subscribed to, because a segment says what it holds through a
   * function — which is what lets a picker and a masked field both be one.
   */
  private readonly held = computed<LiquidInputGroupValue>(() => {
    const value: LiquidInputGroupValue = {};
    for (const segment of this.segments()) {
      const name = segment.name();
      if (name) value[name] = segment.segmentValue();
    }
    return value;
  });

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
    control.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.revision.update((revision) => revision + 1));
  }

  /** Puts the focus on the first segment, the way a failed validation wants to. */
  focus(options?: FocusOptions): void {
    this.segments()[0]?.focus(options);
  }

  /** The segment of that name, for whatever the group does not wrap. */
  segment(name: string): LiquidSegment | null {
    return this.segments().find((segment) => segment.name() === name) ?? null;
  }

  /** What the segments now hold, folded into what the group holds. */
  private gather(): void {
    const value = this.held();
    if (
      sameValue(
        value,
        untracked(() => this.value()),
      )
    )
      return;

    // Whichever one changed is the one the focus may be handed on from.
    const changed = this.segments().find(
      (segment) => value[segment.name() ?? ''] !== this.lastSeen.get(segment),
    );
    for (const segment of this.segments()) {
      this.lastSeen.set(segment, value[segment.name() ?? '']);
    }

    untracked(() => {
      this.value.set(value);
      this.onChange(value);
      if (changed) this.advance(changed);
    });
  }

  /**
   * A segment that has taken all it can hands the focus to the next one, the way
   * a date field moves between its own parts. Only ever forwards, and only from
   * a segment that filled up — never from one being edited in the middle.
   */
  private advance(changed: LiquidSegment): void {
    const control = changed.element?.();
    if (!(control instanceof HTMLInputElement)) return;
    if (control.selectionStart !== control.value.length) return;

    const capacity = changed.capacity?.() ?? null;
    if (capacity === null || control.value.length < capacity) return;

    const segments = this.segments();
    const next = segments[segments.indexOf(changed) + 1];
    if (!next) return;
    next.focus();
    // Whatever it holds is offered to be typed over, where there is anything to
    // type: a field chosen from has nothing to select.
    const arriving = next.element?.();
    if (arriving instanceof HTMLInputElement) arriving.select();
  }

  protected onSegmentFocus(): void {
    clearTimeout(this.leaving);
    if (this.hasFocus()) return;

    this.hasFocus.set(true);
    this.settle();
    this.focused.emit();
  }

  /**
   * The focus moving from one segment to the next is not the focus leaving the
   * group, and a blur arrives before the focus that follows it. A turn of the
   * event loop tells them apart: a real departure has nothing arriving after it.
   */
  protected onSegmentBlur(): void {
    clearTimeout(this.leaving);
    this.leaving = setTimeout(() => {
      // Where the focus actually is, rather than which event arrived last: a
      // picker opening its popup reports being focused *before* the segment
      // beside it reports being left, and the order is the other way round for
      // an ordinary move. The document knows either way — and the popup, for
      // all that it draws in the top layer, is still inside this group.
      if (this.host.contains(this.host.ownerDocument.activeElement)) return;

      this.hasFocus.set(false);
      this.onTouched();
      this.revision.update((revision) => revision + 1);
      this.blurred.emit();
    });
  }

  /**
   * The group answers being reached, once — its segments are `bare`, so none of
   * them presses on its own and the whole box gives as one surface.
   */
  private settle(): void {
    const element = this.press().nativeElement;
    const view = element.ownerDocument.defaultView;
    if (!view) return;

    this.pressed ??= new LiquidPress(
      element,
      element.ownerDocument,
      PRESS_DURATION_PROPERTY,
      cssNumber(view, element, '--liquid-input-group-press-depth', PRESS_DEPTH),
    );

    clearTimeout(this.letGo);
    this.pressed.release();
    this.pressed.press();
    this.letGo = setTimeout(
      () => this.pressed?.release(),
      cssTime(view, element, PRESS_DURATION_PROPERTY, DEFAULT_PRESS_DURATION),
    );
  }

  // ── ControlValueAccessor ───────────────────────────────────────────────────

  writeValue(value: LiquidInputGroupValue | null | undefined): void {
    this.value.set(value ?? {});
  }

  registerOnChange(fn: (value: LiquidInputGroupValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
