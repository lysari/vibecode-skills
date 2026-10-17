import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  model,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ionChevronDownOutline } from '@ng-icons/ionicons';
import { LiquidAccordionItem } from './liquid-expand.interface';

let accordionUid = 0;

/**
 * An accordion container that manages single or multiple expanded states with
 * spring overshoot and settling animations, based on the Khmer eID FAQ expand.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'liquidAccordion',
  host: {
    class: 'liquid-accordion',
    role: 'presentation',
  },
  imports: [NgIcon],
  providers: [provideIcons({ ionChevronDownOutline })],
  selector: 'x-liquid-accordion',
  styleUrls: ['./liquid-expand.scss', './liquid-accordion.scss'],
  templateUrl: './liquid-accordion.html',
})
export class LiquidAccordion {
  readonly id = `liquid-accordion-${++accordionUid}`;

  /** Items to render directly in the accordion list. */
  readonly items = input<LiquidAccordionItem[]>([]);

  /** Currently open key in single mode. Two-way bindable: `[(value)]`. */
  readonly value = model<string | null>(null);

  /** Currently open keys in multiple mode. Two-way bindable: `[(values)]`. */
  readonly values = model<string[]>([]);

  /** Allows multiple items to be open at once. */
  readonly multiple = input(false, { transform: booleanAttribute });

  /** Allows collapsing the currently open item in single mode. Defaults to true. */
  readonly collapsible = input(true, { transform: booleanAttribute });

  /**
   * The row playing its settle — the overshoot animation added as an answer lands.
   * Cleared on animationend.
   */
  readonly settling = signal<string | null>(null);

  /**
   * The row playing its squash — the compression animation on collapse.
   * Cleared on animationend.
   */
  readonly squashing = signal<string | null>(null);

  isOpen(key: string): boolean {
    if (this.multiple()) {
      return this.values().includes(key);
    }
    return this.value() === key;
  }

  toggle(key: string): void {
    if (this.multiple()) {
      const current = this.values();
      const exists = current.includes(key);
      if (exists) {
        this.squashing.set(key);
        this.values.set(current.filter((k) => k !== key));
      } else {
        this.settling.set(key);
        this.values.set([...current, key]);
      }
      return;
    }

    const previous = this.value();
    const opening = previous !== key;

    if (!opening && !this.collapsible()) {
      return;
    }

    this.value.set(opening ? key : null);

    if (opening) {
      this.settling.set(key);
    }

    const closing = opening ? previous : key;
    if (closing) {
      this.squashing.set(closing);
    }
  }

  onSettled(key: string, event: Event): void {
    if (event.target !== event.currentTarget) return;
    if (this.settling() === key) {
      this.settling.set(null);
    }
  }

  onSquashed(key: string, event: Event): void {
    if (event.target !== event.currentTarget) return;
    if (this.squashing() === key) {
      this.squashing.set(null);
    }
  }
}

