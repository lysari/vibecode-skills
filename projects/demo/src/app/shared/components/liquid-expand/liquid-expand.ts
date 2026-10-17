import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ionChevronDownOutline } from '@ng-icons/ionicons';
import { LiquidAccordion } from './liquid-accordion';

let expandUid = 0;

/**
 * An individual expandable card / accordion row with tactile spring overshoot,
 * squash physics, and blurred content reveals.
 *
 * Can be used standalone or inside a parent `<x-liquid-accordion>`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'liquidExpand',
  host: {
    class: 'liquid-expand',
  },
  imports: [NgIcon],
  providers: [provideIcons({ ionChevronDownOutline })],
  selector: 'x-liquid-expand',
  styleUrl: './liquid-expand.scss',
  templateUrl: './liquid-expand.html',
})
export class LiquidExpand {
  private readonly uniqueId = ++expandUid;
  protected readonly accordion = inject(forwardRef(() => LiquidAccordion), { optional: true });

  readonly key = input<string>(`liquid-expand-${this.uniqueId}`);
  readonly title = input<string>('');
  readonly icon = input<string | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Standalone expanded state. Two-way bindable: `[(expanded)]`. */
  readonly expanded = model(false);

  protected readonly headerId = computed(() => `expand-q-${this.key()}`);
  protected readonly panelId = computed(() => `expand-a-${this.key()}`);

  private readonly localSettling = signal(false);
  private readonly localSquashing = signal(false);

  readonly isOpen = computed(() => {
    if (this.accordion) {
      return this.accordion.isOpen(this.key());
    }
    return this.expanded();
  });

  readonly isSettling = computed(() => {
    if (this.accordion) {
      return this.accordion.settling() === this.key();
    }
    return this.localSettling();
  });

  readonly isSquashing = computed(() => {
    if (this.accordion) {
      return this.accordion.squashing() === this.key();
    }
    return this.localSquashing();
  });

  toggle(): void {
    if (this.disabled()) return;

    if (this.accordion) {
      this.accordion.toggle(this.key());
      return;
    }

    const next = !this.expanded();
    this.expanded.set(next);
    if (next) {
      this.localSettling.set(true);
    } else {
      this.localSquashing.set(true);
    }
  }

  expand(): void {
    if (this.disabled() || this.isOpen()) return;
    this.toggle();
  }

  collapse(): void {
    if (this.disabled() || !this.isOpen()) return;
    this.toggle();
  }

  protected onSettled(event: Event): void {
    if (event.target !== event.currentTarget) return;
    if (this.accordion) {
      this.accordion.onSettled(this.key(), event);
    } else {
      this.localSettling.set(false);
    }
  }

  protected onSquashed(event: Event): void {
    if (event.target !== event.currentTarget) return;
    if (this.accordion) {
      this.accordion.onSquashed(this.key(), event);
    } else {
      this.localSquashing.set(false);
    }
  }
}

