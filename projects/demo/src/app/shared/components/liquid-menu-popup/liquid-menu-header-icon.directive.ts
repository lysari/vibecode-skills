import { DestroyRef, Directive, TemplateRef, inject } from '@angular/core';
import { LiquidMenuPopup } from './liquid-menu-popup';

/**
 * An icon in front of an `<x-liquid-menu-popup>`'s `title`, when the default
 * heading is all you need and a whole `liquidMenuHeader` would be too much.
 *
 * ```html
 * <x-liquid-menu-popup #localeMenu="liquidMenu" title="Languages">
 *   <ng-template liquidMenuHeaderIcon>
 *     <ng-icon name="ionGlobeOutline" />
 *   </ng-template>
 *   …
 * </x-liquid-menu-popup>
 * ```
 *
 * Decoration only: it is hidden from screen readers, so the panel is still
 * labelled by the title text alone. It needs a `title` to sit beside, and is
 * ignored when a `liquidMenuHeader` replaces the heading.
 *
 * It can be declared in a component rendered inside the popup as well, which
 * keeps a component's icon with the component. The latest one wins.
 */
@Directive({
  selector: 'ng-template[liquidMenuHeaderIcon]',
})
export class LiquidMenuHeaderIcon {
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  constructor() {
    const menu = inject(LiquidMenuPopup, { optional: true });
    if (menu) inject(DestroyRef).onDestroy(menu.registerSlot(this));
  }
}
