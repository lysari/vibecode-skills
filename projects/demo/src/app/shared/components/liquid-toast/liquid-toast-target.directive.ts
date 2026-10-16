import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { registerToastTarget } from './toast';

/**
 * Names the element a toast can come out of, the twin of the demo's
 * `Liquid.registerToastTarget(name, element)`:
 *
 * ```html
 * <button liquidToastTarget="notifications">Notifications</button>
 * ```
 *
 * ```ts
 * toast('Two new messages', { position: { target: 'notifications' } });
 * ```
 *
 * The registration follows the name, and is given back when the element leaves.
 * A target that is not on screen is not a target: the toaster checks, and falls
 * back to the edge the caller named (`top-center` by default) rather than
 * placing a stack against something with no box.
 */
@Directive({
  selector: '[liquidToastTarget]',
})
export class LiquidToastTarget {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly liquidToastTarget = input.required<string>();

  constructor() {
    effect((onCleanup) => {
      const unregister = registerToastTarget(this.liquidToastTarget(), this.host.nativeElement);
      onCleanup(unregister);
    });
  }
}
