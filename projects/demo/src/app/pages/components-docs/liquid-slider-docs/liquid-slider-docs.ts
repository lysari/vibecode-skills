import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LiquidSlider,
  LiquidSliderHandle,
} from '@app/shared/components/liquid-slider/liquid-slider';
import {
  SLIDER_API,
  SLIDER_CSS,
  SLIDER_FORMS,
  SLIDER_MEMBERS,
  SLIDER_SETUP,
} from '@app/shared/constants/liquid-slider-docs';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LiquidPressable, LiquidSlider, NgTemplateOutlet, ReactiveFormsModule],
  selector: 'app-liquid-slider-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-slider-docs.scss'],
  templateUrl: './liquid-slider-docs.html',
})
export class LiquidSliderDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly setup = SLIDER_SETUP;
  protected readonly formsSetup = SLIDER_FORMS;
  protected readonly api = SLIDER_API;
  protected readonly members = SLIDER_MEMBERS;
  protected readonly cssApi = SLIDER_CSS;

  protected readonly width = signal<number | null>(3);
  protected readonly radius = signal<number | null>(347);
  protected readonly opacity = signal<number | null>(0.8);

  protected readonly copies = new FormControl(0, Validators.min(1));
  protected volume = 40;

  protected readonly play = {
    label: signal('Width'),
    min: signal(0),
    max: signal(10),
    step: signal(1),
    ticks: signal(true),
    handle: signal<LiquidSliderHandle>('auto'),
    disabled: signal(false),
    invalid: signal(false),
    hint: signal(''),
    error: signal(''),
    style: signal<Record<string, string>>({}),
  };
  protected readonly playValue = signal<number | null>(3);
  protected readonly playChanges = signal(0);

  protected readonly playMarkup = computed(() => {
    const play = this.play;
    const style = Object.entries(play.style())
      .map(([name, value]) => `${name}: ${value}`)
      .join('; ');
    return [
      '<x-liquid-slider',
      `  label="${play.label()}"`,
      play.min() !== 0 ? `  [min]="${play.min()}"` : '',
      play.max() !== 100 ? `  [max]="${play.max()}"` : '',
      play.step() !== 1 ? `  [step]="${play.step()}"` : '',
      play.ticks() ? '  ticks' : '',
      play.handle() !== 'auto' ? `  handle="${play.handle()}"` : '',
      play.disabled() ? '  disabled' : '',
      play.invalid() ? '  invalid' : '',
      play.hint() ? `  hint="${play.hint()}"` : '',
      play.error() ? `  error="${play.error()}"` : '',
      style ? `  style="${style}"` : '',
      '  [(value)]="value"',
      '/>',
    ]
      .filter(Boolean)
      .join('\n');
  });

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'sizes', title: 'Sizes' },
    { id: 'handle', title: 'Handle' },
    { id: 'states', title: 'States' },
    { id: 'forms', title: 'Forms' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected setText(control: 'label' | 'hint' | 'error', event: Event): void {
    this.play[control].set((event.target as HTMLInputElement).value);
  }

  protected setNumber(control: 'min' | 'max' | 'step', event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    if (Number.isFinite(value)) this.play[control].set(value);
  }

  protected setHandle(event: Event): void {
    this.play.handle.set((event.target as HTMLSelectElement).value as LiquidSliderHandle);
  }

  protected setFlag(control: 'ticks' | 'disabled' | 'invalid', event: Event): void {
    this.play[control].set((event.target as HTMLInputElement).checked);
  }

  protected setStyle(name: string, unit: string, event: Event): void {
    const value = `${(event.target as HTMLInputElement).value}${unit}`;
    this.play.style.update((style) => ({ ...style, [name]: value }));
  }

  protected resetStyle(): void {
    this.play.style.set({});
  }

  protected onPlayChange(value: number | null): void {
    this.playValue.set(value);
    this.playChanges.update((count) => count + 1);
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}
