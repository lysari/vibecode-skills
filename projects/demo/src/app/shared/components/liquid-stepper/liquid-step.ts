import { FocusOrigin, FocusableOption } from '@angular/cdk/a11y';
import {
  Component,
  ElementRef,
  type OnInit,
  Signal,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { LiquidStepDone, LiquidStepIcon } from './liquid-step-glyph.directive';
import { LiquidStepper } from './liquid-stepper';

/** Per instance, so the default ids never collide. */
let stepUid = 0;

/**
 * One step of an `<x-liquid-stepper>`, holding the value it selects. The marker
 * — its number, or a check once it is behind the selected step — is drawn here;
 * whatever is put inside is the label. An element marked `liquidStepIcon` takes
 * the number's place, and one marked `liquidStepDone` the check's.
 *
 * ```html
 * <x-liquid-stepper [(value)]="step">
 *   <button type="button" liquidStep="details">Details</button>
 *   <button type="button" [liquidStep]="docs" [disabled]="!canUpload">Documents</button>
 * </x-liquid-stepper>
 * ```
 *
 * Put it on a `<button>` where possible. Pressing a step squashes its marker and
 * label and bounces them back, like a tab of `<x-liquid-tabs>`;
 * `--liquid-stepper-press-duration` (ms) times the squash. Setting
 * `--liquid-stepper-color` on a step colours that step's marker alone.
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  exportAs: 'liquidStep',
  host: {
    class: 'liquid-step',
    role: 'tab',
    '[id]': 'id()',
    '[attr.aria-selected]': 'isSelected()',
    '[attr.aria-current]': "isSelected() ? 'step' : null",
    '[attr.aria-disabled]': 'disabled || null',
    '[attr.aria-controls]': 'stepper.panelIdFor(this)',
    '[attr.tabindex]': 'stepper.tabStop() === this ? 0 : -1',
    '[class.is-selected]': 'isSelected()',
    '[class.is-complete]': 'isComplete()',
    '[class.is-disabled]': 'disabled',
    '(click)': 'stepper.selectStep(this)',
    '(focus)': 'stepper.syncActiveStep(this)',
  },
  hostDirectives: [LiquidPressable],
  selector: '[liquidStep]',
  templateUrl: './liquid-step.html',
})
export class LiquidStep<T = any> implements FocusableOption, OnInit {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly stepper = inject<LiquidStepper<T>>(LiquidStepper);

  /** What `[(value)]` on the stepper becomes when this step is selected. */
  readonly value = input.required<T>({ alias: 'liquidStep' });
  /**
   * `false` holds the stepper on this step: it will not move on past it until it
   * is not `false`. Left unset, the step never holds anything back. This is about
   * leaving the step, not about the check, which is shown for any step behind
   * the selected one.
   */
  readonly valid = input<boolean | undefined>(undefined);
  /**
   * The step's part of a form: the stepper will not move on past this step while
   * it is invalid or still checking, and marks it all touched when it refuses,
   * so its fields say what is missing. A disabled control holds nothing back.
   */
  readonly control = input<AbstractControl | null | undefined>(undefined);
  readonly isDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
  /** Defaults to a generated one; panels point `aria-labelledby` at it. */
  readonly id = input(`liquid-step-${++stepUid}`);

  private readonly marker = viewChild.required<ElementRef<HTMLElement>>('marker');
  /** What the marker shows instead of the number, and instead of the check. */
  protected readonly icon = contentChild(LiquidStepIcon);
  protected readonly done = contentChild(LiquidStepDone);

  /** Where this step sits among the stepper's steps, from 0. */
  readonly index: Signal<number> = computed(() => this.stepper.steps().indexOf(this));
  readonly isSelected: Signal<boolean> = computed(() => this.stepper.selectedStep() === this);
  /** Behind the selected step. */
  readonly isComplete: Signal<boolean> = computed(
    () => this.index() < this.stepper.selectedIndex(),
  );

  /** Flipped in {@link ngOnInit}, the first point Angular has set {@link value}. */
  private readonly bound = signal(false);

  /**
   * {@link value}, or `undefined` until Angular has set it: a step joins the
   * stepper's query a pass before its inputs are bound, when reading `value`
   * would still throw.
   */
  readonly boundValue: Signal<T | undefined> = computed(() =>
    this.bound() ? this.value() : undefined,
  );

  constructor() {
    inject(LiquidPressable).useDuration('--liquid-stepper-press-duration');
  }

  /** A plain property, as the key manager reads it to skip the step. */
  get disabled(): boolean {
    return this.isDisabled() || this.stepper.disabled() || !this.stepper.isReachable(this);
  }

  ngOnInit(): void {
    this.bound.set(true);
  }

  /** Where the middle of the marker sits, in the stepper's coordinates — the steps are `position: relative`. */
  center(): { x: number; y: number } {
    const marker = this.marker().nativeElement;
    return {
      x: this.element.offsetLeft + marker.offsetLeft + marker.offsetWidth / 2,
      y: this.element.offsetTop + marker.offsetTop + marker.offsetHeight / 2,
    };
  }

  focus(_origin?: FocusOrigin, options?: FocusOptions): void {
    this.element.focus(options);
  }

  getLabel(): string {
    return this.element.querySelector('.liquid-step-label')?.textContent?.trim() ?? '';
  }
}
