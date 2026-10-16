import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LiquidTabContent } from '@app/shared/components/liquid-tabs/liquid-tab-content.directive';
import { LiquidTabPanel } from '@app/shared/components/liquid-tabs/liquid-tab-panel.directive';
import { LiquidTab } from '@app/shared/components/liquid-tabs/liquid-tab.directive';
import { LiquidTabs } from '@app/shared/components/liquid-tabs/liquid-tabs';
import { fakeServices } from '@app/shared/constants/fake';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';
import {
  TABS_API,
  TABS_COLOUR,
  TABS_CSS,
  TABS_MEMBERS,
  TABS_OPTIONS,
  TABS_PANELS,
  TABS_SETUP,
  TABS_SLIDER,
  TAB_API,
  TAB_CONTENT_API,
  TAB_PANEL_API,
} from './liquid-tabs-docs.reference';

/** The documentation for `<x-liquid-tabs>`, on the real component. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LiquidPressable,
    LiquidTab,
    LiquidTabContent,
    LiquidTabPanel,
    LiquidTabs,
    NgTemplateOutlet,
  ],
  selector: 'app-liquid-tabs-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-tabs-docs.scss'],
  templateUrl: './liquid-tabs-docs.html',
})
export class LiquidTabsDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly setup = TABS_SETUP;
  protected readonly panelsSetup = TABS_PANELS;
  protected readonly sliderSetup = TABS_SLIDER;
  protected readonly optionsSetup = TABS_OPTIONS;
  protected readonly colourSetup = TABS_COLOUR;
  protected readonly api = TABS_API;
  protected readonly members = TABS_MEMBERS;
  protected readonly tabApi = TAB_API;
  protected readonly panelApi = TAB_PANEL_API;
  protected readonly contentApi = TAB_CONTENT_API;
  protected readonly cssApi = TABS_CSS;

  protected readonly services = fakeServices;

  protected readonly filter = signal<string | null>('all');
  protected readonly section = signal<string | null>('profile');
  protected readonly status = signal<string | null>('pending');
  protected readonly service = signal<string | null>(fakeServices[0]?.key ?? null);
  protected readonly range = signal<string | null>(null);
  protected readonly side = signal<string | null>('general');

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'panels', title: 'Panels' },
    { id: 'content', title: 'Content' },
    { id: 'slider', title: 'Slider' },
    { id: 'options', title: 'Options' },
    { id: 'vertical', title: 'Vertical' },
    { id: 'colour', title: 'Colour' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}
