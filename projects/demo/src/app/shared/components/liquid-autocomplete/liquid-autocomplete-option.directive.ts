import { Directive, TemplateRef, inject } from '@angular/core';

/** What an option template is handed: the option, and how the list sees it right now. */
export interface LiquidAutocompleteOptionContext<T> {
  $implicit: T;
  selected: boolean;
  active: boolean;
}

/**
 * Replaces how `<x-liquid-autocomplete>` draws the text of each option. The row
 * around it — the highlight, the check mark, the icon tile — stays the list's.
 *
 * ```html
 * <x-liquid-autocomplete [options]="countries" [(value)]="country">
 *   <ng-template liquidAutocompleteOption let-country let-selected="selected">
 *     <img [src]="country.flag" alt="" /> {{ country.name }}
 *   </ng-template>
 * </x-liquid-autocomplete>
 * ```
 */
@Directive({
  selector: 'ng-template[liquidAutocompleteOption]',
})
export class LiquidAutocompleteOption<T = unknown> {
  readonly template = inject<TemplateRef<LiquidAutocompleteOptionContext<T>>>(TemplateRef);

  /** Lets the template's `let-` variables be typed from the component's options. */
  static ngTemplateContextGuard<T>(
    _directive: LiquidAutocompleteOption<T>,
    context: unknown,
  ): context is LiquidAutocompleteOptionContext<T> {
    return true;
  }
}
