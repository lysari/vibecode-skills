import { DestroyRef, Directive, TemplateRef, inject } from '@angular/core';
import { LiquidMenuPopup } from './liquid-menu-popup';
import { LiquidMenuHeaderContext } from './liquid-menu-header.directive';

/** The same as the header's: the trigger data and a way to close. */
export type LiquidMenuFooterContext<TData = unknown> = LiquidMenuHeaderContext<TData>;

/**
 * A strip under an `<x-liquid-menu-popup>`'s body — keyboard hints, a "View
 * all" link, a secondary action.
 *
 * ```html
 * <x-liquid-menu-popup #searchMenu="liquidMenu" role="dialog">
 *   <ng-template liquidMenuContent>…</ng-template>
 *   <ng-template liquidMenuFooter let-data let-close="close">
 *     <div class="search-hints">…</div>
 *   </ng-template>
 * </x-liquid-menu-popup>
 * ```
 *
 * It sits outside the body's scroll, so it stays put however long the content
 * runs, and is rendered only while the popup is open. The popup adds no padding
 * around it: the template decides its own spacing, and can hide itself outright
 * (on touch screens, say) without leaving a gap behind.
 *
 * It can be declared in a component rendered inside the popup as well — search
 * keeps its key hints in its own template this way. The latest one wins.
 */
@Directive({
  selector: 'ng-template[liquidMenuFooter]',
})
export class LiquidMenuFooter {
  readonly template = inject<TemplateRef<LiquidMenuFooterContext>>(TemplateRef);

  constructor() {
    const menu = inject(LiquidMenuPopup, { optional: true });
    if (menu) inject(DestroyRef).onDestroy(menu.registerSlot(this));
  }

  static ngTemplateContextGuard(
    _directive: LiquidMenuFooter,
    context: unknown,
  ): context is LiquidMenuFooterContext {
    return true;
  }
}
