import { InjectionToken, OutputRef, Signal } from '@angular/core';

/**
 * What `x-liquid-input-group` needs of the fields it draws one box around, so
 * that any of them can be one: an `x-liquid-input` for a number, an
 * `x-liquid-autocomplete` for a country picked out of two hundred.
 *
 * It is deliberately small. A segment keeps everything about itself — its mask,
 * its options, its popup — and tells the group only what it is called, what it
 * holds, and when it is being used. What it holds is read through a function so
 * the group can track it with a signal; `writeValue` is the accessor's own, so a
 * segment that is already a form control needs nothing new to be given its share.
 */
export interface LiquidSegment {
  /** The key this segment's value is held under. A segment without one is skipped. */
  readonly name: Signal<string | null>;

  /** The id of its own control, so the group's label can point at the first one. */
  readonly inputId: Signal<string>;

  /** Taking and losing the focus, so the group can ring itself while any part is in use. */
  readonly focused: OutputRef<void>;
  readonly blurred: OutputRef<void>;

  /** What it holds, read reactively: the group tracks this. */
  segmentValue(): unknown;

  /** Its share of a value the form wrote — the value accessor's own method. */
  writeValue(value: unknown): void;

  focus(options?: FocusOptions): void;
  setDisabledState(isDisabled: boolean): void;

  /**
   * How much it can hold, where that means anything — a mask's capacity, a
   * maximum length. The group hands the focus on when a segment reaches it.
   * A segment chosen from rather than typed into has no capacity.
   */
  readonly capacity?: Signal<number | null>;

  /**
   * The control itself, where there is one to read a caret from — and to offer
   * what it holds to be typed over. Not `select()`: a field chosen from has one
   * of those already, and it means choosing an option.
   */
  element?(): HTMLElement | null;
}

/** What a segment registers itself as, so a group can find it whatever it is. */
export const LIQUID_SEGMENT = new InjectionToken<LiquidSegment>('LiquidSegment');
