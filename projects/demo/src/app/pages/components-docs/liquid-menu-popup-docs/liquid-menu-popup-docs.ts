import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LiquidMenuItem } from '@app/shared/components/liquid-menu-popup/liquid-menu-item.directive';
import {
  LiquidMenuCloseReason,
  LiquidMenuPopup,
} from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';
import {
  CLOSE_REASONS,
  CLOSING_SETUP,
  POPUP_API,
  POPUP_OUTPUTS,
  POPUP_SETUP,
} from './liquid-menu-popup-docs.reference';

/** The documentation for `<x-liquid-menu-popup>`, on the real component. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidMenuItem, LiquidMenuPopup, LiquidMenuTrigger, LiquidPressable],
  selector: 'app-liquid-menu-popup-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-menu-popup-docs.scss'],
  templateUrl: './liquid-menu-popup-docs.html',
})
export class LiquidMenuPopupDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly setup = POPUP_SETUP;
  protected readonly closingSetup = CLOSING_SETUP;
  protected readonly api = POPUP_API;
  protected readonly outputs = POPUP_OUTPUTS;
  protected readonly reasons = CLOSE_REASONS;

  protected readonly overlay = signal(true);
  protected readonly closeOnOutsideClick = signal(true);
  protected readonly lastReason = signal<LiquidMenuCloseReason | null>(null);
  /** Counts clicks on the page beside the popup: they only land with the overlay off. */
  protected readonly pageClicks = signal(0);

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'closing', title: 'Closing' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected toggle(flag: 'overlay' | 'closeOnOutsideClick', event: Event): void {
    this[flag].set((event.target as HTMLInputElement).checked);
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}
