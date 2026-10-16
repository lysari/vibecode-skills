import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  viewChildren,
} from '@angular/core';

/** Only digits survive; everything else (spaces, dashes, letters) is dropped. */
const DIGITS_ONLY = /\D+/g;

/**
 * A fixed-length numeric code entry — one box per digit.
 *
 * The single source of truth is the `value` model: the boxes render from it and
 * every interaction writes back to it, so a programmatic `value.set('')` clears
 * the UI without any per-input bookkeeping.
 */
@Component({
  imports: [],
  selector: 'x-pincode-box',
  styleUrl: './pincode-box.scss',
  templateUrl: './pincode-box.html',
})
export class PincodeBox {
  /** How many digits the code has. */
  readonly length = input(6);
  readonly disabled = input(false);
  /** Renders the digits as dots instead of numbers. */
  readonly masked = input(false);
  /** Focus the first empty box once the component is on screen. */
  readonly autoFocus = input(true);
  /** Paints every box as invalid — for a rejected code. */
  readonly invalid = input(false);
  /**
   * The code is being checked. Paired with `disabled` it keeps the typed digits
   * legible and running, rather than greying out as if the field had broken.
   */
  readonly loading = input(false);

  /** The code so far, digits only, never longer than `length`. */
  readonly value = model('');

  /** Fires once the last box is filled, with the complete code. */
  readonly completed = output<string>();

  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');
  private readonly focusedIndex = signal(-1);

  /** `length` slots, each holding its digit or `''` — what the template loops over. */
  protected readonly slots = computed(() => {
    const digits = this.value().split('');
    return Array.from({ length: this.length() }, (_, i) => ({
      index: i,
      digit: digits[i] ?? '',
    }));
  });

  /**
   * The box that accepts the next keystroke: the first empty one, or the last
   * box when the code is full. Caret placement follows it so a click anywhere
   * in a half-filled code lands where typing would actually continue.
   */
  protected readonly activeIndex = computed(() =>
    Math.min(this.value().length, this.length() - 1),
  );

  protected readonly ariaLabel = computed(() => `Enter the ${this.length()}-digit code`);

  constructor() {
    // Trim in place if `length` shrinks below what has already been typed.
    effect(() => {
      const max = this.length();
      if (this.value().length > max) this.value.set(this.value().slice(0, max));
    });

    // The boxes are driven from the model rather than from a `[value]` binding:
    // a keystroke Angular considers a no-op (a letter, a repeated digit) still
    // leaves text in the DOM, and only an explicit write puts it back in step.
    effect(() => {
      const digits = this.value().split('');
      this.boxes().forEach((box, i) => this.paint(box.nativeElement, digits[i] ?? ''));
    });

    afterNextRender(() => {
      if (this.autoFocus() && !this.disabled()) this.focusActive();
    });
  }

  /** Moves focus to the box that would accept the next digit. */
  focusActive() {
    this.focusAt(this.activeIndex());
  }

  /** Clears the code and returns the caret to the first box. */
  clear() {
    this.value.set('');
    this.focusAt(0);
  }

  protected isFocused(index: number) {
    return this.focusedIndex() === index;
  }

  protected onFocus(index: number) {
    this.focusedIndex.set(index);
    // Clicking past the gap would otherwise leave holes in the code.
    if (index > this.activeIndex()) this.focusActive();
  }

  protected onBlur(index: number) {
    if (this.focusedIndex() === index) this.focusedIndex.set(-1);
  }

  /**
   * Handles typed digits. Reading the raw input rather than the key event keeps
   * mobile keyboards and autofill working, where `keydown` carries no key.
   */
  protected onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const typed = input.value.replace(DIGITS_ONLY, '');
    if (!typed) return this.paint(input, this.value()[index] ?? '');
    this.insertAt(index, typed);
  }

  protected onKeydown(event: KeyboardEvent, index: number) {
    switch (event.key) {
      case 'Backspace': {
        event.preventDefault();
        const target = this.value()[index] ? index : index - 1;
        if (target < 0) return;
        this.value.set(this.removeAt(target));
        this.focusAt(target);
        return;
      }
      case 'Delete':
        event.preventDefault();
        this.value.set(this.removeAt(index));
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.focusAt(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.focusAt(index + 1);
        return;
      case 'Home':
        event.preventDefault();
        this.focusAt(0);
        return;
      case 'End':
        event.preventDefault();
        this.focusActive();
        return;
    }
  }

  /** A pasted code fills the boxes from wherever the caret sits. */
  protected onPaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(DIGITS_ONLY, '');
    if (pasted) this.insertAt(index, pasted);
  }

  /** Writes `digits` starting at `index`, then moves on and reports completion. */
  private insertAt(index: number, digits: string) {
    const max = this.length();
    const next = (this.value().slice(0, index) + digits).slice(0, max);
    this.value.set(next);
    this.focusAt(next.length);
    if (next.length === max) this.completed.emit(next);
  }

  /** The code with the digit at `index` taken out, without shifting the rest. */
  private removeAt(index: number) {
    const digits = this.value().split('');
    if (index >= digits.length) return this.value();
    digits.splice(index, 1);
    return digits.join('');
  }

  private paint(box: HTMLInputElement, digit: string) {
    if (box.value !== digit) box.value = digit;
  }

  private focusAt(index: number) {
    const box = this.boxes()[Math.max(0, Math.min(index, this.length() - 1))];
    box?.nativeElement.focus();
    box?.nativeElement.select();
  }
}
