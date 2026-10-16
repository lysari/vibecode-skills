import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { PincodeBox } from '@app/shared/components/pincode-box/pincode-box';

interface Section {
  id: string;
  title: string;
}

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidButton, PincodeBox],
  selector: 'app-pincode-box-docs',
  styleUrls: ['../shared/docs-shared.scss', './pincode-box-docs.scss'],
  templateUrl: './pincode-box-docs.html',
})
export class PincodeBoxDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly length = signal(6);
  protected readonly masked = signal(false);
  protected readonly disabled = signal(false);
  protected readonly invalid = signal(false);
  protected readonly loading = signal(false);
  protected readonly code = signal('');
  protected readonly lastCompleted = signal<string | null>(null);

  protected readonly smCode = signal('4829');
  protected readonly mdCode = signal('193852');
  protected readonly lgCode = signal('7744');

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'sizes', title: 'Formats' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected readonly apiRows: ApiRow[] = [
    {
      name: 'length',
      type: 'number',
      default: '6',
      description: 'Number of digit input slots rendered by the component.',
    },
    {
      name: 'value',
      type: 'string',
      default: "''",
      description: 'Two-way bound numeric string entered by the user.',
    },
    {
      name: 'masked',
      type: 'boolean',
      default: 'false',
      description: 'Masks entered digits as dots for secure credentials or PINs.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables all input slots and prevents user interactions.',
    },
    {
      name: 'invalid',
      type: 'boolean',
      default: 'false',
      description: 'Applies red error borders and invalid state focus styling.',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Locks input and plays a sequential wave shimmer during verification.',
    },
    {
      name: 'autoFocus',
      type: 'boolean',
      default: 'true',
      description: 'Focuses the first empty slot immediately when rendered.',
    },
    {
      name: 'completed',
      type: 'Output<string>',
      default: '—',
      description: 'Emits the complete code string once all slots are filled.',
    },
  ];

  protected readonly playMarkup = computed(() => {
    const parts = [
      `<x-pincode-box`,
      `  [length]="${this.length()}"`,
      this.masked() ? `  [masked]="true"` : '',
      this.disabled() ? `  [disabled]="true"` : '',
      this.invalid() ? `  [invalid]="true"` : '',
      this.loading() ? `  [loading]="true"` : '',
      `  [(value)]="code"`,
      `  (completed)="onCompleted($event)"`,
      `/>`,
    ].filter(Boolean);

    return parts.join('\n');
  });

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected scrollTo(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected setLength(len: number): void {
    this.length.set(len);
  }

  protected toggleMasked(): void {
    this.masked.update((v) => !v);
  }

  protected toggleDisabled(): void {
    this.disabled.update((v) => !v);
  }

  protected toggleInvalid(): void {
    this.invalid.update((v) => !v);
  }

  protected clearCode(): void {
    this.code.set('');
    this.lastCompleted.set(null);
    this.invalid.set(false);
    this.loading.set(false);
  }

  protected onCompleted(val: string): void {
    this.lastCompleted.set(val);
  }

  protected simulateVerification(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.invalid.set(false);
    setTimeout(() => {
      this.loading.set(false);
      if (this.code() !== '123456' && this.code() !== '1234') {
        this.invalid.set(true);
      }
    }, 1200);
  }
}

