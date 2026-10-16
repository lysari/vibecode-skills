import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LiquidToggle } from '@app/shared/components/liquid-toggle/liquid-toggle';
import {
  TOGGLE_API,
  TOGGLE_CSS,
  TOGGLE_FORMS,
  TOGGLE_MEMBERS,
  TOGGLE_SETUP,
} from '@app/shared/constants/liquid-toggle-docs';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LiquidPressable, LiquidToggle, NgTemplateOutlet, ReactiveFormsModule],
  selector: 'app-liquid-toggle-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-toggle-docs.scss'],
  templateUrl: './liquid-toggle-docs.html',
})
export class LiquidToggleDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly setup = TOGGLE_SETUP;
  protected readonly formsSetup = TOGGLE_FORMS;
  protected readonly api = TOGGLE_API;
  protected readonly members = TOGGLE_MEMBERS;
  protected readonly cssApi = TOGGLE_CSS;

  protected readonly wifi = signal(true);
  protected readonly alerts = signal(false);
  protected readonly fromThumb = signal(true);
  protected readonly power = signal(true);
  protected alertsOn = false;
  protected readonly sync = new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue });

  protected readonly play = {
    label: signal('Wi-Fi'),
    ariaLabel: signal(''),
    disabled: signal(false),
    invalid: signal(false),
    hint: signal(''),
    error: signal(''),
    fill: signal<'track' | 'thumb'>('track'),
    io: signal(false),
    style: signal<Record<string, string>>({}),
  };
  protected readonly playValue = signal(false);
  protected readonly playChanges = signal(0);

  protected readonly playMarkup = computed(() => {
    const play = this.play;
    const style = Object.entries(play.style())
      .map(([name, value]) => `${name}: ${value}`)
      .join('; ');
    return [
      '<x-liquid-toggle',
      play.label() ? `  label="${play.label()}"` : '',
      !play.label() && play.ariaLabel() ? `  ariaLabel="${play.ariaLabel()}"` : '',
      play.disabled() ? '  disabled' : '',
      play.invalid() ? '  invalid' : '',
      play.hint() ? `  hint="${play.hint()}"` : '',
      play.error() ? `  error="${play.error()}"` : '',
      play.fill() === 'thumb' ? '  fill="thumb"' : '',
      play.io() ? '  io' : '',
      style ? `  style="${style}"` : '',
      '  [(value)]="on"',
      '/>',
    ]
      .filter(Boolean)
      .join('\n');
  });

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'sizes', title: 'Sizes' },
    { id: 'states', title: 'States' },
    { id: 'forms', title: 'Forms' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected setText(control: 'label' | 'ariaLabel' | 'hint' | 'error', event: Event): void {
    this.play[control].set((event.target as HTMLInputElement).value);
  }

  protected setFlag(control: 'disabled' | 'invalid' | 'io', event: Event): void {
    this.play[control].set((event.target as HTMLInputElement).checked);
  }

  protected setFill(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.play.fill.set(value === 'thumb' ? 'thumb' : 'track');
  }

  protected setStyle(name: string, unit: string, event: Event): void {
    const value = `${(event.target as HTMLInputElement).value}${unit}`;
    this.play.style.update((style) => ({ ...style, [name]: value }));
  }

  protected resetStyle(): void {
    this.play.style.set({});
  }

  protected onPlayChange(value: boolean): void {
    this.playValue.set(value);
    this.playChanges.update((count) => count + 1);
  }

  protected turnSync(on: boolean): void {
    this.sync.setValue(on);
  }

  protected toggleSyncDisabled(): void {
    if (this.sync.disabled) this.sync.enable();
    else this.sync.disable();
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}
