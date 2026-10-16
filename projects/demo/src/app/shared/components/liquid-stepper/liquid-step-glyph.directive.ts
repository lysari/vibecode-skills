import { Directive } from '@angular/core';

/**
 * Replaces a step's number with any element — an icon, an emoji, an image:
 *
 * ```html
 * <button type="button" liquidStep="details"><ng-icon liquidStepIcon name="ionPersonOutline" />Details</button>
 * ```
 *
 * It shows until the step is complete, and takes the marker's colour.
 */
@Directive({
  host: { class: 'liquid-step-glyph' },
  selector: '[liquidStepIcon]',
})
export class LiquidStepIcon {}

/**
 * Replaces the check a complete step shows, for this step only. To change it
 * for every step, set `--liquid-stepper-check-image` instead.
 */
@Directive({
  host: { class: 'liquid-step-glyph' },
  selector: '[liquidStepDone]',
})
export class LiquidStepDone {}
