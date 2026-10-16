import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { LiquidSlider } from '@app/shared/components/liquid-slider/liquid-slider';
import { NumberSlotDirective } from '@app/shared/directives/animations.directive';

@Component({
  imports: [FormsModule, LiquidSlider, ReactiveFormsModule],
  template: `
    <x-liquid-slider
      inputId="width"
      label="Width"
      [max]="10"
      ticks
      hint="Pixels"
      [(value)]="width"
    />
    <x-liquid-slider inputId="opacity" label="Opacity" [max]="1" [step]="0.05" [formControl]="control" />
    <x-liquid-slider inputId="volume" label="Volume" error="Too loud" [(ngModel)]="volume" />
    <x-liquid-slider inputId="bare" label="Bare" [handle]="handle()" />
  `,
})
class Host {
  readonly width = signal<number | null>(3);
  readonly control = new FormControl<number | null>(0.8);
  volume = 40;
  readonly handle = signal<'auto' | 'on' | 'off'>('off');
}

describe('LiquidSlider', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let element: HTMLElement;

  const range = (id: string) => element.querySelector<HTMLInputElement>(`#${id}`)!;
  const slider = (id: string) => range(id).closest<HTMLElement>('x-liquid-slider')!;
  const shown = (id: string) =>
    slider(id).querySelector('.liquid-slider-value .t-digit-sr')?.textContent ??
    slider(id).querySelector('.liquid-slider-value')?.textContent;

  const point = (id: string, type: string, clientX: number) =>
    slider(id)
      .querySelector('.liquid-slider-field')!
      .dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX, button: 0 }));

  const stubBox = (id: string, travel: number, start: number) => {
    const target = slider(id);
    target.getBoundingClientRect = () => ({ left: 0, width: travel + start * 2 }) as DOMRect;
    const track = target.querySelector<HTMLElement>('.liquid-slider-track')!;
    Object.defineProperty(track, 'offsetLeft', { configurable: true, value: start });
    Object.defineProperty(track, 'offsetWidth', { configurable: true, value: travel });
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('writes the label and the value inside the field, over a native range', () => {
    expect(slider('width').querySelector('label')?.getAttribute('for')).toBe('width');
    expect(slider('width').querySelector('label')?.textContent).toBe('Width');
    expect(shown('width')).toBe('3');
    expect(range('width').type).toBe('range');
    expect(range('width').max).toBe('10');
    expect(slider('width').style.getPropertyValue('--_ratio')).toBe('0.3');
  });

  it('writes the value with as many decimals as the step has', () => {
    expect(shown('opacity')).toBe('0.80');
    expect(range('opacity').getAttribute('aria-valuetext')).toBe('0.80');
  });

  it('draws a dot for every step between the ends', () => {
    expect(slider('width').querySelectorAll('.liquid-slider-tick').length).toBe(9);
    expect(slider('opacity').querySelector('.liquid-slider-ticks')).toBeNull();
  });

  it('takes a value from the keyboard, snapped to the step', async () => {
    const input = range('width');
    input.value = '7';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(host.width()).toBe(7);
    expect(shown('width')).toBe('7');
  });

  it('follows a drag across the field and snaps where it lets go', async () => {
    stubBox('width', 400, 12);
    point('width', 'pointerdown', 12 + 400 * 0.62);
    await fixture.whenStable();
    expect(host.width()).toBe(6);
    expect(slider('width').classList).toContain('is-dragging');

    point('width', 'pointermove', 12 + 400 * 0.88);
    point('width', 'pointerup', 12 + 400 * 0.88);
    await fixture.whenStable();

    expect(host.width()).toBe(9);
    expect(slider('width').classList).not.toContain('is-dragging');
  });

  it('clamps a drag past either end to min and max', async () => {
    stubBox('width', 400, 12);
    point('width', 'pointerdown', 200);
    point('width', 'pointermove', 900);
    await fixture.whenStable();
    expect(host.width()).toBe(10);

    point('width', 'pointermove', -300);
    point('width', 'pointerup', -300);
    await fixture.whenStable();
    expect(host.width()).toBe(0);
  });

  it('puts the value back when the browser takes the pointer for a scroll', async () => {
    stubBox('width', 400, 12);
    point('width', 'pointerdown', 12 + 400 * 0.9);
    await fixture.whenStable();
    expect(host.width()).toBe(9);

    point('width', 'pointercancel', 0);
    await fixture.whenStable();
    expect(host.width()).toBe(3);
  });

  it('is a reactive form control', async () => {
    host.control.setValue(0.35);
    await fixture.whenStable();
    expect(shown('opacity')).toBe('0.35');

    const input = range('opacity');
    input.value = '0.5';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.control.value).toBe(0.5);
    expect(host.control.touched).toBe(true);

    host.control.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
    expect(slider('opacity').classList).toContain('is-disabled');
  });

  it('ignores the pointer while disabled', async () => {
    host.control.disable();
    await fixture.whenStable();
    stubBox('opacity', 400, 12);
    point('opacity', 'pointerdown', 12);
    await fixture.whenStable();
    expect(host.control.value).toBe(0.8);
  });

  it('is a template-driven form control', async () => {
    await fixture.whenStable();
    expect(shown('volume')).toBe('40');

    const input = range('volume');
    input.value = '55';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(host.volume).toBe(55);
  });

  it('says the hint, or the error in its place, and points the range at it', () => {
    expect(slider('width').querySelector('.liquid-input-hint')?.textContent?.trim()).toBe('Pixels');
    expect(range('width').getAttribute('aria-describedby')).toBe('width-hint');

    expect(slider('volume').classList).toContain('is-invalid');
    expect(slider('volume').querySelector('[role="alert"]')?.textContent).toContain('Too loud');
    expect(range('volume').getAttribute('aria-describedby')).toBe('volume-error');
    expect(range('volume').getAttribute('aria-invalid')).toBe('true');
  });

  it('never shows the handle when it is off, and gives it back when it is not', async () => {
    expect(slider('bare').classList).toContain('is-handle-off');
    expect(slider('width').classList).not.toContain('is-handle-off');

    host.handle.set('on');
    await fixture.whenStable();
    expect(slider('bare').classList).not.toContain('is-handle-off');
    expect(slider('bare').classList).not.toContain('is-handle-hidden');
  });

  it('renders the value through NumberSlotDirective and rolls the way the value moved', async () => {
    const valueEl = slider('width').querySelector('.liquid-slider-value') as HTMLElement;
    expect(valueEl.classList).toContain('t-slot-group');

    const slotDirective = fixture.debugElement
      .query(By.css('#width'))
      .parent?.query(By.directive(NumberSlotDirective))
      ?.injector.get(NumberSlotDirective);
    expect(slotDirective).toBeTruthy();
    expect(slotDirective?.spins()).toBe(0);
    expect(slotDirective?.animateOnInit()).toBe(false);
    expect(slotDirective?.direction()).toBe('auto');

    host.width.set(1);
    await fixture.whenStable();
    host.width.set(10);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await fixture.whenStable();
    expect(shown('width')).toBe('10');

    const ones = [...valueEl.querySelectorAll<HTMLElement>('.t-slot-reel')].at(-1);
    expect(ones?.getAttribute('data-steps')).toBe('9');
    expect(ones?.style.getPropertyValue('--slot-from-y').trim()).toBe('0px');

    host.width.set(9);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await fixture.whenStable();
    const down = [...valueEl.querySelectorAll<HTMLElement>('.t-slot-reel')].at(-1);
    expect(down?.getAttribute('data-steps')).toBe('1');
    expect(down?.style.getPropertyValue('--slot-end-y').trim()).toBe('0px');
  });
});
