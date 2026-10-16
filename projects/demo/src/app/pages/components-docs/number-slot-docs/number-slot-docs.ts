import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  SLOT_API,
  SLOT_CSS,
  SLOT_MEMBERS,
  SLOT_SETUP,
} from '@app/shared/constants/number-slot-docs';
import {
  NumberPopInDirective,
  NumberSlotDirective,
  NumberSlotDirection,
} from '@app/shared/directives/animations.directive';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidPressable, NgTemplateOutlet, NumberPopInDirective, NumberSlotDirective],
  selector: 'app-number-slot-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './number-slot-docs.scss'],
  templateUrl: './number-slot-docs.html',
})
export class NumberSlotDocs {
  private readonly document = inject(DOCUMENT);
  private readonly playSlot = viewChild<NumberSlotDirective>('playSlot');

  protected readonly setup = SLOT_SETUP;
  protected readonly api = SLOT_API;
  protected readonly members = SLOT_MEMBERS;
  protected readonly cssApi = SLOT_CSS;

  protected readonly jackpot = signal(1280);
  protected readonly compare = signal(48);
  protected readonly jackpotText = computed(() => this.jackpot().toLocaleString('en-US'));
  protected readonly jackpotKhmer = computed(() =>
    this.jackpotText().replace(/\d/g, (digit) => String.fromCharCode(0x17e0 + Number(digit))),
  );
  protected readonly price = signal('$1,280.50');
  protected readonly motion = signal(20);
  protected readonly sized = signal('128');
  protected readonly playKey = signal(0);
  protected readonly playValue = signal('1,280');

  protected readonly play = {
    direction: signal<NumberSlotDirection>('auto'),
    spins: signal(1),
    staggerFrom: signal<'start' | 'end'>('start'),
    duration: signal<number | null>(null),
    stagger: signal<number | null>(null),
    blur: signal<number | null>(null),
    overshoot: signal<number | null>(null),
    pad: signal<number | null>(null),
    init: signal(true),
    changedOnly: signal(true),
    disabled: signal(false),
  };

  protected readonly playMarkup = computed(() => {
    const play = this.play;
    const lines = ['<span', `  numberSlot="${this.playValue()}"`];
    if (play.direction() !== 'auto') lines.push(`  slotDirection="${play.direction()}"`);
    if (play.spins() !== 1) lines.push(`  [slotSpins]="${play.spins()}"`);
    if (play.staggerFrom() !== 'start') lines.push(`  slotStaggerFrom="${play.staggerFrom()}"`);
    if (play.duration() !== null) lines.push(`  [slotDuration]="${play.duration()}"`);
    if (play.stagger() !== null) lines.push(`  [slotStagger]="${play.stagger()}"`);
    if (play.blur() !== null) lines.push(`  [slotBlur]="${play.blur()}"`);
    if (play.overshoot() !== null) lines.push(`  [slotOvershoot]="${play.overshoot()}"`);
    if (!play.init()) lines.push('  slotAnimateOnInit="false"');
    if (!play.changedOnly()) lines.push('  slotAnimateChangedOnly="false"');
    if (play.disabled()) lines.push('  slotDisabled');
    if (play.pad() !== null) lines.push(`  style="--slot-pad: ${play.pad()}em"`);
    lines.push('></span>');
    return lines.join('\n');
  });

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'sizes', title: 'Sizes' },
    { id: 'motion', title: 'Motion' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  private readonly motionSteps = [20, 864, 19, 5000];

  protected readonly compareText = computed(() => this.compare().toLocaleString('en-US'));

  protected addJackpot(amount: number): void {
    this.jackpot.update((value) => value + amount);
  }

  protected setJackpot(value: number): void {
    this.jackpot.set(value);
  }

  protected addCompare(amount: number): void {
    this.compare.update((value) => value + amount);
  }

  protected setCompare(value: number): void {
    this.compare.set(value);
  }

  protected swapPrice(): void {
    this.price.set(this.price() === '$1,280.50' ? '$1,349.00' : '$1,280.50');
  }

  protected spinMotion(): void {
    const steps = this.motionSteps;
    const index = steps.indexOf(this.motion());
    this.motion.set(steps[(index + 1) % steps.length]);
  }

  protected resizeSamples(): void {
    this.sized.set(this.sized() === '128' ? '86,420' : '128');
  }

  protected setPlayValue(event: Event): void {
    this.playValue.set((event.target as HTMLInputElement).value);
  }

  protected setPlayPreset(value: string): void {
    this.playValue.set(value);
  }

  protected setDirection(event: Event): void {
    this.play.direction.set((event.target as HTMLSelectElement).value as NumberSlotDirection);
  }

  protected setStaggerFrom(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.play.staggerFrom.set(value === 'end' ? 'end' : 'start');
  }

  protected setSpins(event: Event): void {
    this.play.spins.set(Number((event.target as HTMLInputElement).value));
  }

  protected setOptional(control: 'duration' | 'stagger' | 'blur' | 'overshoot', event: Event): void {
    this.play[control].set(Number((event.target as HTMLInputElement).value));
  }

  protected setPad(event: Event): void {
    this.play.pad.set(Number((event.target as HTMLInputElement).value));
  }

  protected setFlag(control: 'init' | 'changedOnly' | 'disabled', event: Event): void {
    this.play[control].set((event.target as HTMLInputElement).checked);
  }

  protected resetMotion(): void {
    this.play.duration.set(null);
    this.play.stagger.set(null);
    this.play.blur.set(null);
    this.play.overshoot.set(null);
    this.play.pad.set(null);
  }

  protected replayPlay(): void {
    this.playSlot()?.replay();
  }

  protected playEntrance(): void {
    this.playKey.update((key) => key + 1);
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}
