import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PincodeBox } from '@app/shared/components/pincode-box/pincode-box';

@Component({
  imports: [PincodeBox],
  template: `
    <x-pincode-box
      [length]="length()"
      [disabled]="disabled()"
      [masked]="masked()"
      [autoFocus]="autoFocus()"
      [invalid]="invalid()"
      [loading]="loading()"
      [(value)]="value"
      (completed)="lastCompleted.set($event)"
    />
  `,
})
class TestPincodeHost {
  readonly length = signal(6);
  readonly disabled = signal(false);
  readonly masked = signal(false);
  readonly autoFocus = signal(false);
  readonly invalid = signal(false);
  readonly loading = signal(false);
  readonly value = signal('');
  readonly lastCompleted = signal<string | null>(null);
}

describe('PincodeBox', () => {
  let fixture: ComponentFixture<TestPincodeHost>;
  let host: TestPincodeHost;
  let element: HTMLElement;

  const boxes = (): HTMLInputElement[] =>
    Array.from(element.querySelectorAll('input.pincode-digit'));

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestPincodeHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestPincodeHost);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    await settle();
  });

  it('renders default 6 input boxes', () => {
    expect(boxes().length).toBe(6);
    expect(boxes()[0].getAttribute('aria-label')).toBe('Digit 1 of 6');
    expect(boxes()[5].getAttribute('aria-label')).toBe('Digit 6 of 6');
  });

  it('adjusts rendered box count when length input changes', async () => {
    host.length.set(4);
    await settle();
    expect(boxes().length).toBe(4);
  });

  it('renders masked inputs when masked is true', async () => {
    expect(boxes()[0].type).toBe('text');
    host.masked.set(true);
    await settle();
    expect(boxes()[0].type).toBe('password');
  });

  it('paints existing value across boxes', async () => {
    host.value.set('123');
    await settle();
    const inputs = boxes();
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');
    expect(inputs[2].value).toBe('3');
    expect(inputs[3].value).toBe('');
    expect(inputs[0].classList.contains('is-filled')).toBe(true);
    expect(inputs[3].classList.contains('is-filled')).toBe(false);
  });

  it('handles typing digits and advances focus', async () => {
    const inputs = boxes();
    const focusSpy = vi.spyOn(inputs[1], 'focus');

    inputs[0].value = '8';
    inputs[0].dispatchEvent(new Event('input'));
    await settle();

    expect(host.value()).toBe('8');
    expect(focusSpy).toHaveBeenCalled();
  });

  it('strips non-numeric characters on input', async () => {
    const inputs = boxes();
    inputs[0].value = 'a';
    inputs[0].dispatchEvent(new Event('input'));
    await settle();

    expect(host.value()).toBe('');
    expect(inputs[0].value).toBe('');
  });

  it('handles paste event with digits and emits completed', async () => {
    const inputs = boxes();
    const clipboardData = {
      getData: (format: string) => (format === 'text' ? '987654' : ''),
    };

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });

    inputs[0].dispatchEvent(pasteEvent);
    await settle();

    expect(host.value()).toBe('987654');
    expect(host.lastCompleted()).toBe('987654');
    inputs.forEach((input, i) => {
      expect(input.value).toBe(String('987654'[i]));
    });
  });

  it('handles Backspace when current slot is filled', async () => {
    host.value.set('123');
    await settle();
    const inputs = boxes();

    const backspace = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    inputs[2].dispatchEvent(backspace);
    await settle();

    expect(host.value()).toBe('12');
  });

  it('handles Backspace when current slot is empty to delete previous slot', async () => {
    host.value.set('12');
    await settle();
    const inputs = boxes();
    const prevFocusSpy = vi.spyOn(inputs[1], 'focus');

    const backspace = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    inputs[2].dispatchEvent(backspace);
    await settle();

    expect(host.value()).toBe('1');
    expect(prevFocusSpy).toHaveBeenCalled();
  });

  it('applies loading and invalid classes', async () => {
    host.invalid.set(true);
    host.loading.set(true);
    await settle();

    const container = element.querySelector('.pincode');
    expect(container?.classList.contains('is-invalid')).toBe(true);
    expect(container?.classList.contains('is-loading')).toBe(true);
  });

  it('disables all inputs when disabled is true', async () => {
    host.disabled.set(true);
    await settle();

    const inputs = boxes();
    inputs.forEach((input) => {
      expect(input.disabled).toBe(true);
    });
  });
});
