import { Directive, effect, inject } from '@angular/core';
import { type AbstractControl, ControlContainer } from '@angular/forms';
import {
  LiquidTabContent,
  type LiquidTabContentContext,
} from '../liquid-tabs/liquid-tab-content.directive';
import { LiquidStepper } from './liquid-stepper';

/**
 * Step content built only while its step is selected, and destroyed once another
 * is — the tab content, under the stepper's names:
 *
 * ```html
 * <div liquidStepPanel [liquidStepPanelFor]="stepper" panelMode="slider">
 *   <ng-template liquidStepContent="details" [formGroup]="detailsForm"><div>…</div></ng-template>
 *   <ng-template liquidStepContent="documents"><div>…</div></ng-template>
 * </div>
 * ```
 *
 * Switching dissolves, or slides as a carousel in a `slider` panel, while the
 * panel eases to the new height. A content's root has to be an element, not an
 * `@if`. See {@link LiquidTabContent} for the motion and its custom properties.
 *
 * A `[formGroup]`, `formGroupName` or `ngModelGroup` on the template is the
 * fields' group inside it, and holds the stepper on this content's step as
 * `[control]` on the step does. The directive outlives the template it builds,
 * so with a reactive group a step not yet on screen is still checked.
 */
@Directive({
  hostDirectives: [
    {
      directive: LiquidTabContent,
      inputs: [
        'liquidTabContent: liquidStepContent',
        'liquidTabContentFor: liquidStepContentFor',
        'liquidTabContentAnimate: liquidStepContentAnimate',
      ],
    },
  ],
  selector: 'ng-template[liquidStepContent]',
})
export class LiquidStepContent<T = any> {
  private readonly content = inject<LiquidTabContent<T>>(LiquidTabContent);
  private readonly container = inject(ControlContainer, { optional: true, self: true });
  /** Which step it belongs to: its own value, or else its panel's. */
  readonly value = this.content.resolvedValue;

  /** The group on the template, read when asked: `formGroupName` only has it once initialised. */
  control(): AbstractControl | null {
    return this.container?.control ?? null;
  }

  constructor() {
    effect((onCleanup) => {
      const stepper = this.content.tabs();
      if (stepper instanceof LiquidStepper) {
        onCleanup(stepper.registerContent(this));
      }
    });
  }

  static ngTemplateContextGuard<T>(
    _directive: LiquidStepContent<T>,
    context: unknown,
  ): context is LiquidTabContentContext<T> {
    return true;
  }
}
