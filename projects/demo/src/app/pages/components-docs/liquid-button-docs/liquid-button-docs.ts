import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ionAddOutline, ionArrowForwardOutline, ionCheckmarkOutline } from '@ng-icons/ionicons';
import {
  LiquidButton,
  LiquidButtonVariant,
} from '@app/shared/components/liquid-button/liquid-button';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';
import {
  BUTTON_API,
  BUTTON_COLOUR,
  BUTTON_CSS,
  BUTTON_ELEMENTS,
  BUTTON_SETUP,
} from './liquid-button-docs.reference';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidButton, LiquidPressable, NgIcon, RouterLink],
  providers: [provideIcons({ ionAddOutline, ionArrowForwardOutline, ionCheckmarkOutline })],
  selector: 'app-liquid-button-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-button-docs.scss'],
  templateUrl: './liquid-button-docs.html',
})
export class LiquidButtonDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly setup = BUTTON_SETUP;
  protected readonly elements = BUTTON_ELEMENTS;
  protected readonly colour = BUTTON_COLOUR;
  protected readonly api = BUTTON_API;
  protected readonly cssApi = BUTTON_CSS;

  protected readonly variants: LiquidButtonVariant[] = ['filled', 'tinted', 'plain'];
  protected readonly hues = [262, 150, 25, 300];

  protected readonly variant = signal<LiquidButtonVariant>('filled');
  protected readonly block = signal(false);
  protected readonly iconOnly = signal(false);
  protected readonly disabled = signal(false);
  protected readonly hue = signal(262);
  protected readonly clicks = signal(0);

  protected readonly markup = computed(() => {
    const attrs = [
      this.variant() === 'filled' ? '' : ` variant="${this.variant()}"`,
      this.block() ? ' block' : '',
      this.iconOnly() ? ' iconOnly' : '',
      this.disabled() ? ' disabled' : '',
    ].join('');
    const content = this.iconOnly()
      ? '\n  <ng-icon name="ionArrowForwardOutline" aria-hidden="true" />\n'
      : '\n  Continue\n  <ng-icon name="ionArrowForwardOutline" aria-hidden="true" />\n';
    return `<button type="button" liquidButton${attrs}${this.iconOnly() ? ' aria-label="Continue"' : ''} style="--liquid-button-hue: ${this.hue()}">${content}</button>`;
  });

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'elements', title: 'Buttons and links' },
    { id: 'colour', title: 'Colour' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected pick(event: Event): void {
    this.variant.set((event.target as HTMLSelectElement).value as LiquidButtonVariant);
  }

  protected toggle(flag: 'block' | 'disabled' | 'iconOnly', event: Event): void {
    this[flag].set((event.target as HTMLInputElement).checked);
  }

  protected setHue(event: Event): void {
    this.hue.set(Number((event.target as HTMLInputElement).value));
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}
