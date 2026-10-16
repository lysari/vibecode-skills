import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NumberSlotDirective, NumberSlotDirection } from '@app/shared/directives/animations.directive';

@Component({
  imports: [NumberSlotDirective],
  template: `
    <span
      id="n"
      [numberSlot]="value()"
      [slotAnimateOnInit]="init()"
      [slotSpins]="spins()"
      [slotDirection]="direction()"
      [slotDisabled]="off()"
      [slotAnimateChangedOnly]="changedOnly()"
      [slotStaggerFrom]="staggerFrom()"
    ></span>
    <span id="lit" numberSlot>{{ literal() }}</span>
  `,
})
class Host {
  readonly value = signal<string | number | null>('1,204');
  readonly literal = signal('9');
  readonly init = signal(false);
  readonly spins = signal(1);
  readonly direction = signal<NumberSlotDirection>('auto');
  readonly off = signal(false);
  readonly changedOnly = signal(true);
  readonly staggerFrom = signal<'start' | 'end'>('start');
}

describe('NumberSlotDirective', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const root = () => fixture.nativeElement.querySelector('#n') as HTMLElement;
  const columns = () =>
    [...root().querySelectorAll<HTMLElement>('.t-slot-static, .t-slot-reel')];
  const textOf = (element: HTMLElement) =>
    element.classList.contains('t-slot-static')
      ? element.textContent
      : element.getAttribute('data-rest');
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const pastRetargetGap = async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await settle();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('paints separators still and keeps one readable copy of the whole value', async () => {
    await settle();
    expect(columns().map(textOf)).toEqual(['1', ',', '2', '0', '4']);
    expect(root().querySelectorAll('.t-slot-reel').length).toBe(0);
    expect(root().querySelector('.t-digit-sr')?.textContent).toBe('1,204');
    expect(root().querySelector('.t-slot-static')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('spins only the digit that changed, from that digit toward the new one', async () => {
    await settle();
    host.value.set('1,205');
    await settle();

    const cells = columns();
    expect(cells.slice(0, 4).map(textOf)).toEqual(['1', ',', '2', '0']);
    expect(cells[4].classList.contains('t-slot-reel')).toBe(true);
    expect(cells[4].getAttribute('data-steps')).toBe('11');
    expect(cells[4].querySelector('.t-slot-strip')?.getAttribute('data-seq')).toBe('456789012345');
    expect(cells[4].classList.contains('is-spinning')).toBe(true);
  });

  it('lines a new place up from the right', async () => {
    host.spins.set(0);
    host.value.set('9');
    await settle();

    host.value.set('10');
    await settle();

    const reels = columns();
    expect(reels.map((reel) => reel.querySelector('.t-slot-strip')?.getAttribute('data-seq'))).toEqual([
      '01',
      '90',
    ]);
  });

  it('rolls the short way when slotSpins is 0, and the long way at the default', async () => {
    host.spins.set(0);
    host.init.set(true);
    host.value.set('7');
    await settle();

    const short = root().querySelector('.t-slot-reel');
    expect(short?.getAttribute('data-steps')).toBe('7');
    expect(short?.querySelector('.t-slot-strip')?.getAttribute('data-seq')).toBe('01234567');
  });

  it('spins Khmer digits through Khmer digits and keeps the separator still', async () => {
    host.spins.set(0);
    host.value.set('១,២៨០');
    await settle();

    host.value.set('១,២៨៣');
    await settle();

    const cells = columns();
    expect(cells.slice(0, 4).map(textOf)).toEqual(['១', ',', '២', '៨']);
    expect(cells[4].querySelector('.t-slot-strip')?.getAttribute('data-seq')).toBe('០១២៣');
    expect(cells[4].querySelector('.t-slot-sizer')?.textContent).toBe('៣');
  });

  it('rolls a Latin digit into a Khmer one from the same value', async () => {
    host.spins.set(0);
    host.value.set('7');
    await settle();

    host.value.set('៩');
    await settle();

    expect(root().querySelector('.t-slot-strip')?.getAttribute('data-seq')).toBe('៧៨៩');
  });

  it('brings a downward reel in from above', async () => {
    host.spins.set(0);
    host.direction.set('down');
    host.init.set(true);
    host.value.set('3');
    await settle();

    const reel = root().querySelector<HTMLElement>('.t-slot-reel');
    expect(reel?.querySelector('.t-slot-strip')?.getAttribute('data-seq')).toBe('34567890');
    expect(reel?.style.getPropertyValue('--slot-end-y').trim()).toBe('0px');
    expect(reel?.style.getPropertyValue('--slot-from-y')).toContain('-1 * var(--slot-cell)');
  });

  it('rolls every reel down when the whole value falls', async () => {
    host.spins.set(0);
    host.value.set('987');
    await settle();

    host.value.set('459');
    await settle();

    const reels = columns();
    expect(reels.map((reel) => reel.querySelector('.t-slot-strip')?.getAttribute('data-seq'))).toEqual([
      '456789',
      '5678',
      '901234567',
    ]);
    expect(reels.map((reel) => reel.style.getPropertyValue('--slot-end-y').trim())).toEqual([
      '0px',
      '0px',
      '0px',
    ]);
  });

  it('rolls every reel up when the whole value rises, past 0 if it has to', async () => {
    host.spins.set(0);
    host.value.set('13');
    await settle();

    host.value.set('21');
    await settle();

    const reels = columns();
    expect(reels.map((reel) => reel.querySelector('.t-slot-strip')?.getAttribute('data-seq'))).toEqual([
      '12',
      '345678901',
    ]);
    expect(reels.map((reel) => reel.style.getPropertyValue('--slot-from-y').trim())).toEqual(['0px', '0px']);
  });

  it('reads grouping marks and currency as part of one number', async () => {
    host.spins.set(0);
    host.value.set('$1,280.50');
    await settle();

    host.value.set('$1,279.00');
    await settle();

    const reels = [...root().querySelectorAll<HTMLElement>('.t-slot-reel')];
    expect(reels.map((reel) => reel.querySelector('.t-slot-strip')?.getAttribute('data-seq'))).toEqual([
      '78',
      '90',
      '012345',
    ]);
    expect(reels.every((reel) => reel.style.getPropertyValue('--slot-end-y').trim() === '0px')).toBe(true);
  });

  it('stops the right reel first when the stagger starts at the end', async () => {
    host.staggerFrom.set('end');
    host.spins.set(0);
    host.init.set(true);
    host.value.set('12');
    await settle();

    const reels = [...root().querySelectorAll<HTMLElement>('.t-slot-reel')];
    expect(reels[0].style.getPropertyValue('--slot-delay')).toContain('* 1');
    expect(reels[1].style.getPropertyValue('--slot-delay')).toContain('* 0');
  });

  it('spins every digit again when asked, including one that did not change', async () => {
    await settle();
    const directive = fixture.debugElement.query(By.css('#n')).injector.get(NumberSlotDirective);
    directive.replay();
    await settle();

    const sequences = columns().map(
      (column) => column.querySelector('.t-slot-strip')?.getAttribute('data-seq') ?? column.textContent,
    );
    expect(sequences[0]?.startsWith('1')).toBe(true);
    expect(sequences[0]?.endsWith('1')).toBe(true);
    expect(sequences[1]).toBe(',');
    expect(sequences[4]?.startsWith('4')).toBe(true);
    expect(sequences[4]?.endsWith('4')).toBe(true);
  });

  it('drops the spinning class when the reel lands', async () => {
    host.spins.set(0);
    host.init.set(true);
    host.value.set('4');
    await settle();

    const strip = root().querySelector('.t-slot-strip');
    const end = (animationName: string) => {
      const event = new Event('animationend', { bubbles: true });
      Object.defineProperty(event, 'animationName', { value: animationName });
      strip?.dispatchEvent(event);
    };
    end('t-slot-blur');
    expect(root().querySelector('.is-spinning')).not.toBeNull();

    end('t-slot-spin');
    expect(root().querySelector('.is-spinning')).toBeNull();
    expect(strip?.getAttribute('style')).toContain('var(--slot-end-y)');
  });

  it('lands the reel when its spin is cancelled, so showing it again does not replay it', async () => {
    host.spins.set(0);
    host.init.set(true);
    host.value.set('4');
    await settle();

    const event = new Event('animationcancel', { bubbles: true });
    Object.defineProperty(event, 'animationName', { value: 't-slot-spin' });
    root().querySelector('.t-slot-strip')?.dispatchEvent(event);
    expect(root().querySelector('.is-spinning')).toBeNull();
  });

  it('keeps a reel mid-spin that is asked for the same digit again', async () => {
    host.init.set(true);
    host.value.set('5');
    await settle();
    const reel = root().querySelector('.t-slot-reel');
    expect(reel?.getAttribute('data-steps')).toBe('15');

    host.staggerFrom.set('end');
    await pastRetargetGap();

    expect(root().querySelector('.t-slot-reel')).toBe(reel);
    expect(reel?.getAttribute('data-steps')).toBe('15');
  });

  it('holds a retarget until the gap is up, then spins from the digit in the window', async () => {
    host.init.set(true);
    host.value.set('5');
    await settle();

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ height: 10 } as DOMRect);
    vi.stubGlobal('getComputedStyle', () => ({ transform: 'matrix(1, 0, 0, 1, 0, -30)' }));
    vi.stubGlobal(
      'DOMMatrix',
      class {
        readonly m42 = -30;
      },
    );
    host.value.set('27');
    await settle();
    expect(columns().map(textOf)).toEqual(['5']);

    await pastRetargetGap();
    const reels = columns();
    expect(reels.map(textOf)).toEqual(['2', '7']);
    expect(reels[1].querySelector('.t-slot-strip')?.getAttribute('data-seq')).toBe('345678901234567');
    expect(reels.map((reel) => reel.style.getPropertyValue('--slot-delay'))).toEqual([
      'calc(var(--slot-stagger) * 0)',
      'calc(var(--slot-stagger) * 0)',
    ]);
  });

  it('paints the final digit when spinning is turned off or motion is reduced', async () => {
    host.init.set(true);
    host.off.set(true);
    host.value.set('8');
    await settle();
    expect(root().querySelector('.t-slot-reel')).toBeNull();
    expect(root().querySelector('.t-slot-static')?.textContent).toBe('8');

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
      onchange: null,
    }));
    host.off.set(false);
    host.value.set('6');
    await settle();
    expect(root().querySelector('.t-slot-reel')).toBeNull();
    expect(columns().map(textOf)).toEqual(['6']);
  });

  it('adopts interpolated text and spins the next value', async () => {
    await settle();
    const literal = fixture.nativeElement.querySelector('#lit') as HTMLElement;
    expect(literal.querySelector('.t-digit-sr')?.textContent).toBe('9');

    host.literal.set('10');
    await pastRetargetGap();

    const shown = [...literal.querySelectorAll<HTMLElement>('.t-slot-static, .t-slot-reel')];
    expect(shown.map(textOf)).toEqual(['1', '0']);
    expect(literal.querySelector('.t-digit-sr')?.textContent).toBe('10');
  });

  it('clears the columns when the value is null', async () => {
    await settle();
    host.value.set(null);
    await settle();
    expect(columns().length).toBe(0);
    expect(root().querySelector('.t-digit-sr')?.textContent).toBe('');
  });
});
