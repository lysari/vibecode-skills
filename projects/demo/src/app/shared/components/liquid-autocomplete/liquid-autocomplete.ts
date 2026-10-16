import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  ionArrowDownOutline,
  ionArrowUpOutline,
  ionCheckmarkOutline,
  ionChevronDownOutline,
  ionCloseCircle,
  ionReturnDownBackOutline,
  ionSearchOutline,
} from '@ng-icons/ionicons';
import { LiquidMenuContent } from '@app/shared/components/liquid-menu-popup/liquid-menu-content.directive';
import { LiquidMenuFooter } from '@app/shared/components/liquid-menu-popup/liquid-menu-footer.directive';
import { LiquidMenuHeaderIcon } from '@app/shared/components/liquid-menu-popup/liquid-menu-header-icon.directive';
import {
  LiquidMenuCloseReason,
  LiquidMenuPopup,
} from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';
import { TextStatesSwapDirective } from '@app/shared/directives/animations.directive';
import { highlight } from '@app/shared/utils/highlight';
import { LIQUID_SEGMENT, LiquidSegment } from '@app/shared/components/liquid-input/liquid-segment';
import { LiquidAutocompleteOption } from './liquid-autocomplete-option.directive';

/** `'auto'` shows the search field once there are more options than fit at a glance. */
export type LiquidAutocompleteSearchable = boolean | 'auto';

/** Past this many options a list is searched rather than read. */
const SEARCH_THRESHOLD = 7;

/** One option, with everything its row binds to worked out once per keystroke. */
interface OptionView<T> {
  option: T;
  /** Position across every group — what the arrow keys step through. */
  index: number;
  /** The label split around the matched text, so the match can be marked up. */
  before: string;
  match: string;
  after: string;
  caption: string;
  icon: string | null;
  selected: boolean;
  disabled: boolean;
}

interface GroupView<T> {
  /** `@for` track key, and the heading when the options are grouped. */
  title: string;
  options: OptionView<T>[];
}

let autocompleteUid = 0;

/**
 * A select whose list is the header's search: a field that grows a liquid popup
 * out of its own box, with a search field, grouped options, the match marked up,
 * and the arrow keys moving the active row while the focus stays in the field.
 *
 * ```html
 * <label for="province">Province</label>
 * <x-liquid-autocomplete
 *   inputId="province"
 *   label="Province"
 *   [options]="provinces"
 *   [(value)]="province"
 *   [displayWith]="provinceName"
 *   [compareWith]="sameKey"
 * />
 * ```
 *
 * The API is a select's. `options` is any array and `value` is one of its
 * members (or `null`), two-way; `displayWith` words an option, and `compareWith`
 * says when two are the same one — needed as soon as the value comes from
 * somewhere other than the `options` array itself, a saved draft for instance.
 * `captionWith` adds a second line, `groupWith` a heading to list it under,
 * `iconWith` an `ng-icon` name (registered by whoever owns the options), and
 * `disabledWith` takes an option out of reach without taking it off the list. A
 * `<ng-template liquidAutocompleteOption>` replaces the text of a row outright.
 *
 * It is also a form control: `[formControl]`, `formControlName` and `ngModel`
 * all work, and the control is marked touched when the popup closes.
 *
 * The search field is there from {@link SEARCH_THRESHOLD} options up; `searchable`
 * forces it either way. A query matches the label and the caption.
 *
 * Tuning, all read with a fallback so a `--liquid-autocomplete-*` set on any
 * ancestor reaches the field: `hue` (an OKLCH hue in degrees, defaulting to
 * whatever `--svc-accent` the section carries), `height`, `radius`,
 * `background`, `font-size`, and `panel-width`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'liquidAutocomplete',
  host: {
    class: 'liquid-autocomplete',
    '[class.is-open]': 'isOpen()',
    '[class.is-disabled]': 'isDisabled()',
    '[class.is-invalid]': 'invalid()',
    '[class.has-value]': 'selected() !== null',
    '[class.is-bare]': 'bare()',
    // What a group lays out: a class every segment carries, whatever it is.
    '[class.liquid-segment]': 'bare()',
    '[style.--_width]': 'width()',
  },
  imports: [
    LiquidMenuContent,
    LiquidMenuFooter,
    LiquidMenuHeaderIcon,
    LiquidMenuPopup,
    LiquidMenuTrigger,
    NgIcon,
    NgTemplateOutlet,
    TextStatesSwapDirective,
  ],
  providers: [
    provideIcons({
      ionArrowDownOutline,
      ionArrowUpOutline,
      ionCheckmarkOutline,
      ionChevronDownOutline,
      ionCloseCircle,
      ionReturnDownBackOutline,
      ionSearchOutline,
    }),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LiquidAutocomplete),
      multi: true,
    },
    // So an `x-liquid-input-group` can hold this as one of its segments — a
    // country out of two hundred, beside the number it dials.
    { provide: LIQUID_SEGMENT, useExisting: forwardRef(() => LiquidAutocomplete) },
  ],
  selector: 'x-liquid-autocomplete',
  styleUrl: './liquid-autocomplete.scss',
  templateUrl: './liquid-autocomplete.html',
})
export class LiquidAutocomplete<T = unknown> implements ControlValueAccessor, LiquidSegment {
  readonly options = input.required<readonly T[]>();
  /** The selected option, or `null` for none. Two-way: `[(value)]`. */
  readonly value = model<T | null>(null);

  /** The text an option is listed, searched and shown in the field as. */
  readonly displayWith = input<(option: T) => string>(String);
  /** A second, quieter line under the label; also searched. */
  readonly captionWith = input<((option: T) => string | null | undefined) | null>(null);
  /** The heading an option is listed under. Groups appear in first-seen order. */
  readonly groupWith = input<((option: T) => string | null | undefined) | null>(null);
  /** An `ng-icon` name for the option's tile; the owner of the options registers it. */
  readonly iconWith = input<((option: T) => string | null | undefined) | null>(null);
  readonly disabledWith = input<((option: T) => boolean) | null>(null);
  /** When two options are the same one. Identity unless told otherwise. */
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);

  /** Names the popup, and the field for a screen reader that has no `<label for>`. */
  readonly label = input<string | null>(null);
  readonly placeholder = input($localize`:@@form.select.placeholder: Select… `.trim());
  readonly searchPlaceholder = input($localize`:@@autocomplete.search:Search`);
  /** The `id` of the field itself — what a `<label for>` points at, and what `focus()` lands on. */
  readonly inputId = input(`liquid-autocomplete-${++autocompleteUid}`);
  readonly describedBy = input<string | null>(null);

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Offers a button that empties the field. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** `'auto'` by default; a bare `searchable` attribute reads as `true`, like any boolean one. */
  readonly searchable = input<LiquidAutocompleteSearchable, LiquidAutocompleteSearchable | ''>(
    'auto',
    { transform: (value) => (value === 'auto' ? value : booleanAttribute(value)) },
  );

  readonly opened = output<void>();
  readonly closed = output<LiquidMenuCloseReason>();
  /** The field took or lost the focus — what a group rings itself by. */
  readonly focused = output<void>();
  readonly blurred = output<void>();

  /**
   * The key a group holds this segment's value under. See {@link LiquidSegment}.
   * Outside a group it is the `name` the field would be submitted under.
   */
  readonly name = input<string | null>(null);

  /**
   * Draws no box and no chevron well of its own — the field is a segment of
   * something that draws those itself.
   */
  readonly bare = input(false, { transform: booleanAttribute });

  /** How wide the segment is, as any CSS length. */
  readonly width = input<string | null>(null);

  protected readonly menu = viewChild.required<LiquidMenuPopup>('menu');
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly optionTemplate = contentChild(LiquidAutocompleteOption<T>);

  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  // Computed, not read once: an input is not bound yet while fields initialise.
  protected readonly listboxId = computed(() => `${this.inputId()}-listbox`);
  protected readonly valueId = computed(() => `${this.inputId()}-value`);

  /** Mirrors the popup, so the host's classes need not reach for a view child. */
  protected readonly isOpen = signal(false);

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  /** The field's own width when the popup opened: the list is never narrower than it. */
  protected readonly triggerWidth = signal(0);
  /** Set by a form through `setDisabledState`, alongside the `disabled` input. */
  private readonly formDisabled = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  /** The member of `options` the value names — the value itself when it is not among them. */
  protected readonly selected = computed<T | null>(() => {
    const value = this.value();
    if (value === null || value === undefined) return null;
    const same = this.compareWith();
    return this.options().find((option) => same(option, value)) ?? value;
  });

  protected readonly selectedLabel = computed(() => {
    const selected = this.selected();
    return selected === null ? '' : this.displayWith()(selected);
  });

  protected readonly hasSearch = computed(() => {
    const searchable = this.searchable();
    return searchable === 'auto' ? this.options().length > SEARCH_THRESHOLD : searchable;
  });

  protected readonly groups = computed<GroupView<T>[]>(() => {
    const term = this.query().trim().toLocaleLowerCase();
    const display = this.displayWith();
    const caption = this.captionWith();
    const group = this.groupWith();
    const icon = this.iconWith();
    const disabled = this.disabledWith();
    const same = this.compareWith();
    const value = this.value();

    const groups: GroupView<T>[] = [];
    for (const option of this.options()) {
      const text = display(option);
      const note = caption?.(option) ?? '';
      if (
        term &&
        !text.toLocaleLowerCase().includes(term) &&
        !note.toLocaleLowerCase().includes(term)
      ) {
        continue;
      }

      const title = group?.(option) ?? '';
      let target = groups.find((entry) => entry.title === title);
      if (!target) {
        target = { title, options: [] };
        groups.push(target);
      }
      target.options.push({
        option,
        index: 0,
        ...highlight(text, term),
        caption: note,
        icon: icon?.(option) ?? null,
        selected: value !== null && value !== undefined && same(option, value),
        disabled: disabled?.(option) ?? false,
      });
    }

    // Numbered once the groups are settled: a group gathers options from anywhere
    // in the array, so the order on screen is not the order they were met in.
    let index = 0;
    for (const entry of groups) for (const view of entry.options) view.index = index++;
    return groups;
  });

  private readonly views = computed(() => this.groups().flatMap((group) => group.options));

  protected readonly activeView = computed(() => this.views()[this.activeIndex()] ?? null);

  // Handed over by a form; no-ops until one registers.
  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  /** Puts the focus on the field, the way a failed validation wants to. */
  focus(options?: FocusOptions): void {
    this.trigger().nativeElement.focus(options);
  }

  /** What this holds, for a group that is holding it. See {@link LiquidSegment}. */
  segmentValue(): unknown {
    return this.value();
  }

  protected onTriggerFocus(): void {
    this.focused.emit();
  }

  protected onTriggerBlur(): void {
    // The popup takes the focus off the trigger while it is open, and that is
    // not the field being left: the group would otherwise let go mid-choice.
    if (this.isOpen()) return;
    this.blurred.emit();
  }

  open(): void {
    if (!this.isDisabled()) this.menu().openFor(this.trigger().nativeElement);
  }

  close(): void {
    this.menu().close();
  }

  protected optionId(index: number): string {
    return `${this.listboxId()}-option-${index}`;
  }

  protected onOpened(): void {
    this.isOpen.set(true);
    this.query.set('');
    this.triggerWidth.set(this.trigger().nativeElement.offsetWidth);
    // Opens on what is already chosen, so Enter straight away changes nothing.
    const at = this.views().findIndex((view) => view.selected);
    this.activeIndex.set(Math.max(0, at));
    this.revealActive('center');
    this.opened.emit();
    // Open counts as focused, as the stylesheet already has it: the focus is in
    // the popup, but this is still the field being used — and a group holding
    // this segment would otherwise think it had been left mid-choice.
    this.focused.emit();
  }

  protected onClosed(reason: LiquidMenuCloseReason): void {
    this.isOpen.set(false);
    this.onTouched();
    this.closed.emit(reason);

    // Closing usually hands the focus back to the trigger, and that arrives
    // after this. Only when it does not has the field actually been left.
    queueMicrotask(() => {
      const view = this.host.ownerDocument;
      if (!this.host.contains(view.activeElement)) this.blurred.emit();
    });
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.activeIndex.set(this.nextEnabled(-1, 1));
    this.revealActive('nearest');
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.views().length;
    if (!count) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        this.activeIndex.set(
          this.nextEnabled(this.activeIndex(), event.key === 'ArrowDown' ? 1 : -1),
        );
        this.revealActive('nearest');
        return;
      }
      case 'Home':
      case 'End': {
        // In the search field these belong to the caret.
        if (this.hasSearch()) return;
        event.preventDefault();
        this.activeIndex.set(
          event.key === 'Home' ? this.nextEnabled(-1, 1) : this.nextEnabled(count, -1),
        );
        this.revealActive('nearest');
        return;
      }
      case 'Enter': {
        event.preventDefault();
        const view = this.activeView();
        if (view) this.select(view);
      }
    }
  }

  protected select(view: OptionView<T>): void {
    if (view.disabled) return;
    this.commit(view.option);
    this.menu().close('item');
  }

  protected clear(): void {
    this.commit(null);
    this.focus();
  }

  protected clearQuery(field: HTMLInputElement): void {
    this.onInput('');
    field.focus();
  }

  private commit(value: T | null): void {
    this.value.set(value);
    this.onChange(value);
  }

  /** The next option from `from` in `step`'s direction that can be chosen, wrapping. */
  private nextEnabled(from: number, step: 1 | -1): number {
    const views = this.views();
    const count = views.length;
    if (!count) return 0;
    for (let moved = 1; moved <= count; moved++) {
      const index = (((from + step * moved) % count) + count) % count;
      if (!views[index].disabled) return index;
    }
    return Math.max(0, from);
  }

  /**
   * Keeps the active row in view once the list has rendered around it. Scrolls
   * the list itself rather than calling `scrollIntoView`, which would also drag
   * the popup's clipped wrapper while the panel is still growing open.
   */
  private revealActive(block: 'nearest' | 'center'): void {
    afterNextRender(
      () => {
        const row = this.host.ownerDocument.getElementById(this.optionId(this.activeIndex()));
        const list = row?.closest<HTMLElement>('.liquid-autocomplete-list');
        if (!row || !list) return;

        const top = row.offsetTop;
        const bottom = top + row.offsetHeight;
        if (block === 'center') {
          list.scrollTop = top - (list.clientHeight - row.offsetHeight) / 2;
        } else if (top < list.scrollTop) {
          list.scrollTop = top - 6;
        } else if (bottom > list.scrollTop + list.clientHeight) {
          list.scrollTop = bottom - list.clientHeight + 6;
        }
      },
      { injector: this.injector },
    );
  }

  // ── ControlValueAccessor ───────────────────────────────────────────────────

  writeValue(value: T | null | undefined): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
