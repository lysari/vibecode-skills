import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Content an `<x-liquid-menu-popup>` creates only while it is open.
 *
 * Projected content is built with the parent that declares it, open or not: a
 * component inside the popup is constructed at page load and lives as long as
 * the page. Wrapped in this template it is constructed on each open and
 * destroyed once the close animation has played out.
 *
 * ```html
 * <x-liquid-menu-popup #notifyMenu="liquidMenu" role="dialog">
 *   <ng-template liquidMenuContent>
 *     <app-notification />
 *   </ng-template>
 * </x-liquid-menu-popup>
 * ```
 *
 * `liquidMenuItem`s inside it are not picked up by the arrow keys — the popup's
 * item query only sees projected content — so use it for `dialog` popups.
 */
@Directive({
  selector: 'ng-template[liquidMenuContent]',
})
export class LiquidMenuContent {
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}
