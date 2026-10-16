import { DestroyRef, Directive, TemplateRef, inject } from '@angular/core';
import { LiquidMenuPopup } from './liquid-menu-popup';

export interface LiquidMenuHeaderContext<TData = unknown> {
  /** What the opening trigger passed as `liquidMenuTriggerData`. */
  $implicit: TData | undefined;
  /** Closes the popup, handing the focus back to its trigger. */
  close: () => void;
}

/**
 * Replaces an `<x-liquid-menu-popup>`'s `title` heading with markup of your own:
 * an avatar and a name, a title with an action beside it.
 *
 * ```html
 * <x-liquid-menu-popup #profileMenu="liquidMenu" title="Account">
 *   <ng-template liquidMenuHeader let-data let-close="close">
 *     <div class="profile-header">…</div>
 *   </ng-template>
 *   …
 * </x-liquid-menu-popup>
 * ```
 *
 * It sits above the body and outside its scroll, and is rendered only while the
 * popup is open. It still labels the panel for screen readers, so keep some text
 * in it; `title` can stay on the popup too, it simply isn't drawn.
 *
 * It can be declared in a component rendered inside the popup as well, which
 * keeps a component's header with the component. The latest one wins.
 */
@Directive({
  selector: 'ng-template[liquidMenuHeader]',
})
export class LiquidMenuHeader {
  readonly template = inject<TemplateRef<LiquidMenuHeaderContext>>(TemplateRef);

  constructor() {
    const menu = inject(LiquidMenuPopup, { optional: true });
    if (menu) inject(DestroyRef).onDestroy(menu.registerSlot(this));
  }

  static ngTemplateContextGuard(
    _directive: LiquidMenuHeader,
    context: unknown,
  ): context is LiquidMenuHeaderContext {
    return true;
  }
}
