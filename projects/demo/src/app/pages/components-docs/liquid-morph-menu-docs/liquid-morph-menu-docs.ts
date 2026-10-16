import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LiquidMenuItem } from '@app/shared/components/liquid-menu-popup/liquid-menu-item.directive';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';
import { LiquidMorphItem } from '@app/shared/components/liquid-morph-menu/liquid-morph-item.directive';
import { LiquidMorphMenu } from '@app/shared/components/liquid-morph-menu/liquid-morph-menu';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  ionGlobeOutline,
  ionLogOutOutline,
  ionNotificationsOutline,
  ionSearchOutline,
  ionSettingsOutline,
} from '@ng-icons/ionicons';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';
import {
  ITEM_API,
  MENU_API,
  MENU_MEMBERS,
  MORPH_BEHAVIOUR,
  MORPH_CLASSES,
  MORPH_CSS,
  MORPH_CUSTOM_CODE,
  MORPH_DEMO_ITEMS,
  MORPH_DISABLED_CODE,
  MORPH_FIGURES,
  MORPH_FILES,
  MORPH_GAPS,
  MORPH_MOTION,
  MORPH_POPUP_CODE,
  MORPH_SELECTION_CODE,
  MORPH_SETUP,
} from './liquid-morph-menu-docs.reference';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LiquidMenuItem,
    LiquidMenuPopup,
    LiquidMenuTrigger,
    LiquidMorphItem,
    LiquidMorphMenu,
    LiquidPressable,
    NgIcon,
  ],
  providers: [
    provideIcons({
      ionGlobeOutline,
      ionLogOutOutline,
      ionNotificationsOutline,
      ionSearchOutline,
      ionSettingsOutline,
    }),
  ],
  selector: 'app-liquid-morph-menu-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-morph-menu-docs.scss'],
  templateUrl: './liquid-morph-menu-docs.html',
})
export class LiquidMorphMenuDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly demoItems = MORPH_DEMO_ITEMS;
  protected readonly menuApi = MENU_API;
  protected readonly menuMembers = MENU_MEMBERS;
  protected readonly itemApi = ITEM_API;
  protected readonly classes = MORPH_CLASSES;
  protected readonly cssApi = MORPH_CSS;
  protected readonly motion = MORPH_MOTION;
  protected readonly figures = MORPH_FIGURES;
  protected readonly behaviour = MORPH_BEHAVIOUR;
  protected readonly gaps = MORPH_GAPS;
  protected readonly files = MORPH_FILES;
  protected readonly code = {
    setup: MORPH_SETUP,
    popup: MORPH_POPUP_CODE,
    selection: MORPH_SELECTION_CODE,
    disabled: MORPH_DISABLED_CODE,
    custom: MORPH_CUSTOM_CODE,
  };

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'setup', title: 'Setup' },
    { id: 'playground', title: 'Playground' },
    { id: 'examples', title: 'Examples' },
    { id: 'pill', title: 'Pill', nested: true },
    { id: 'popup', title: 'Pinned by a popup', nested: true },
    { id: 'selection', title: 'Selection', nested: true },
    { id: 'disabled', title: 'Disabled', nested: true },
    { id: 'vertical', title: 'Vertical', nested: true },
    { id: 'custom', title: 'Custom look', nested: true },
    { id: 'api-menu', title: 'Menu' },
    { id: 'api-item', title: 'Item' },
    { id: 'api-classes', title: 'Classes' },
    { id: 'api-css', title: 'CSS properties' },
    { id: 'motion', title: 'Motion' },
    { id: 'behaviour', title: 'Behaviour & a11y' },
    { id: 'files', title: 'Files' },
  ];

  protected readonly play = {
    pill: signal(true),
    vertical: signal(false),
    disabledHighlight: signal(false),
    disabledHover: signal(false),
    pinned: signal(''),
    disabledItem: signal(''),
  };

  protected readonly markup = computed(() => {
    const attrs = [
      this.play.pill() ? ' pill' : '',
      this.play.vertical() ? ' orientation="vertical"' : '',
      this.play.disabledHighlight() ? ' disabledHighlight' : '',
      this.play.disabledHover() ? ' disabledHover' : '',
    ].join('');
    const items = this.demoItems.map((item) => {
      const pin = this.play.pinned() === item.id ? ' liquidMorphActive' : '';
      const off = this.play.disabledItem() === item.id ? ' liquidMorphDisabled' : '';
      return `  <button type="button" aria-label="${item.label}" liquidMorphItem${pin}${off}>
    <ng-icon name="${item.icon}" />
  </button>`;
    });
    return [`<x-liquid-morph-menu${attrs}>`, ...items, '</x-liquid-morph-menu>'].join('\n');
  });

  protected readonly unread = signal(3);
  protected readonly showSettings = signal(false);
  protected readonly pinned = signal(false);
  protected readonly selected = signal('search');
  protected readonly signOutDisabled = signal(true);
  protected readonly highlightOff = signal(false);

  protected toggle(control: 'pill' | 'vertical' | 'disabledHighlight' | 'disabledHover', event: Event): void {
    this.play[control].set((event.target as HTMLInputElement).checked);
  }

  protected choose(control: 'pinned' | 'disabledItem', event: Event): void {
    this.play[control].set((event.target as HTMLSelectElement).value);
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}
