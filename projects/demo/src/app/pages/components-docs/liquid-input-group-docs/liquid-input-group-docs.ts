import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LiquidInput } from '@app/shared/components/liquid-input/liquid-input';
import {
  LiquidInputGroup,
  type LiquidInputGroupValue,
} from '@app/shared/components/liquid-input-group/liquid-input-group';
import {
  type Section,
  INPUT_GROUP_API,
  INPUT_GROUP_CSS,
  INPUT_GROUP_SETUP,
} from './liquid-input-group-docs.reference';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidInput, LiquidInputGroup],
  selector: 'app-liquid-input-group-docs',
  styleUrls: ['../shared/docs-shared.scss', './liquid-input-group-docs.scss'],
  templateUrl: './liquid-input-group-docs.html',
})
export class LiquidInputGroupDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly setup = INPUT_GROUP_SETUP;
  protected readonly api = INPUT_GROUP_API;
  protected readonly cssApi = INPUT_GROUP_CSS;

  protected readonly groupValue = signal<LiquidInputGroupValue>({
    protocol: 'https://',
    domain: 'api.auxswot.internal',
    port: '8443',
  });

  protected readonly protocolOptions = [
    { value: 'https://', label: 'https://' },
    { value: 'http://', label: 'http://' },
    { value: 'grpc://', label: 'grpc://' },
  ];

  protected readonly label = signal('Endpoint Destination');
  protected readonly hint = signal('Fully resolved ingress route for API requests');
  protected readonly disabled = signal(false);
  protected readonly hasError = signal(false);
  protected readonly height = signal('44px');

  protected readonly compactVal = signal<LiquidInputGroupValue>({ code: '+1', num: '5550199' });
  protected readonly defaultVal = signal<LiquidInputGroupValue>({ code: '+855', num: '12345678' });
  protected readonly largeVal = signal<LiquidInputGroupValue>({ code: '+44', num: '20794609' });

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'sizes', title: 'Sizes' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected readonly playMarkup = computed(() => {
    const attrs = [
      ` label="${this.label()}"`,
      this.hint() ? ` hint="${this.hint()}"` : '',
      this.disabled() ? ' [disabled]="true"' : '',
      this.hasError() ? ' error="Route is unreachable or misconfigured"' : '',
    ].join('');

    const styleAttr =
      this.height() !== '44px' ? ` style="--liquid-input-group-height: ${this.height()};"` : '';

    return `<x-liquid-input-group${attrs}${styleAttr} [(value)]="endpoint">
  <x-liquid-input bare name="protocol" width="10ch" [options]="protocolList" />
  <x-liquid-input bare name="domain" placeholder="domain.internal" />
  <x-liquid-input bare name="port" width="7ch" placeholder="port" />
</x-liquid-input-group>`;
  });

  protected setHeight(val: string): void {
    this.height.set(val);
  }

  protected toggleDisabled(event: Event): void {
    this.disabled.set((event.target as HTMLInputElement).checked);
  }

  protected toggleError(event: Event): void {
    this.hasError.set((event.target as HTMLInputElement).checked);
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}

