import { Directive } from '@angular/core';
import { LiquidTabPanel } from '../liquid-tabs/liquid-tab-panel.directive';

/**
 * The content one step of an `<x-liquid-stepper>` shows — the tab panel, under
 * the stepper's names. It can sit anywhere, so it names its stepper explicitly,
 * and is `hidden` while its step is not selected:
 *
 * ```html
 * <section liquidStepPanel="details" [liquidStepPanelFor]="stepper">…</section>
 * ```
 *
 * Without a value it is the shared panel: never hidden, and the home of
 * `liquidStepContent` templates, which are built as their step is picked and
 * change over with `panelMode` `dissolve` or `slider`. See {@link LiquidTabPanel}
 * for how both behave; the panel is the same one.
 */
@Directive({
  exportAs: 'liquidStepPanel',
  hostDirectives: [
    {
      directive: LiquidTabPanel,
      inputs: [
        'liquidTabPanel: liquidStepPanel',
        'liquidTabPanelFor: liquidStepPanelFor',
        'id',
        'panelMode',
      ],
    },
  ],
  selector: '[liquidStepPanel]',
})
export class LiquidStepPanel<T = any> {}
