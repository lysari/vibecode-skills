import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LiquidToggle } from '@app/shared/components/liquid-toggle/liquid-toggle';

@Component({
  imports: [FormsModule, LiquidToggle, ReactiveFormsModule],
  template: `
    <x-liquid-toggle
      inputId="wifi"
      label="Wi-Fi"
      hint="When you are near a network"
      [(value)]="wifi"
    />
    <x-liquid-toggle inputId="sync" label="Sync" [formControl]="sync" />
    <x-liquid-toggle inputId="alerts" label="Alerts" error="Turn alerts on" [(ngModel)]="alerts" />
    <x-liquid-toggle inputId="bare" ariaLabel="Dark mode" />
    <x-liquid-toggle inputId="behind" label="Behind" fill="thumb" />
    <x-liquid-toggle inputId="power" label="Power" io [value]="true" />
  `,
})
class Host {
  readonly wifi = signal(false);
  readonly sync = new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue });
  alerts = false;
}

describe('LiquidToggle', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let element: HTMLElement;

  const box = (id: string) => element.querySelector<HTMLInputElement>(`#${id}`)!;
  const toggle = (id: string) => box(id).closest<HTMLElement>('x-liquid-toggle')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('names the checkbox from its label', () => {
    expect(toggle('wifi').querySelector('label')?.getAttribute('for')).toBe('wifi');
    expect(toggle('wifi').querySelector('label')?.textContent).toBe('Wi-Fi');
    expect(box('wifi').type).toBe('checkbox');
    expect(box('wifi').getAttribute('role')).toBe('switch');
    expect(box('wifi').hasAttribute('aria-label')).toBe(false);
  });

  it('flips the value and the on state when clicked', async () => {
    box('wifi').click();
    await fixture.whenStable();

    expect(host.wifi()).toBe(true);
    expect(box('wifi').checked).toBe(true);
    expect(toggle('wifi').classList).toContain('is-on');
  });

  it('still toggles when the press has started', async () => {
    const input = box('wifi');
    input
      .closest('.liquid-toggle-switch')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 }));
    input.click();
    await fixture.whenStable();

    expect(host.wifi()).toBe(true);
    expect(input.checked).toBe(true);
  });

  it('is a reactive form control', async () => {
    host.sync.setValue(true);
    await fixture.whenStable();
    expect(box('sync').checked).toBe(true);

    box('sync').click();
    box('sync').dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.sync.value).toBe(false);
    expect(host.sync.touched).toBe(true);

    host.sync.disable();
    await fixture.whenStable();
    expect(box('sync').disabled).toBe(true);
    expect(toggle('sync').classList).toContain('is-disabled');
  });

  it('is a template-driven form control', async () => {
    expect(box('alerts').checked).toBe(false);

    box('alerts').click();
    await fixture.whenStable();
    expect(host.alerts).toBe(true);
  });

  it('says the hint, or the error in its place, and points the checkbox at it', () => {
    expect(toggle('wifi').querySelector('.liquid-input-hint')?.textContent?.trim()).toBe(
      'When you are near a network',
    );
    expect(box('wifi').getAttribute('aria-describedby')).toBe('wifi-hint');

    expect(toggle('alerts').classList).toContain('is-invalid');
    expect(toggle('alerts').querySelector('.liquid-input-hint')).toBeNull();
    expect(toggle('alerts').querySelector('[role="alert"]')?.textContent).toContain('Turn alerts on');
    expect(box('alerts').getAttribute('aria-describedby')).toBe('alerts-error');
    expect(box('alerts').getAttribute('aria-invalid')).toBe('true');
  });

  it('fills from the left edge, or from behind the thumb when asked', () => {
    expect(toggle('wifi').classList.contains('is-fill-thumb')).toBe(false);
    expect(toggle('behind').classList).toContain('is-fill-thumb');
    expect(box('behind').getAttribute('role')).toBe('switch');
  });

  it('draws an I and an O only when io is set', () => {
    expect(toggle('wifi').querySelector('.liquid-toggle-i')).toBeNull();
    expect(toggle('wifi').querySelector('.liquid-toggle-o')).toBeNull();
    expect(toggle('power').querySelector('.liquid-toggle-i')).not.toBeNull();
    expect(toggle('power').querySelector('.liquid-toggle-o')).not.toBeNull();
  });

  it('uses ariaLabel only when there is no visible label', () => {
    expect(box('bare').getAttribute('aria-label')).toBe('Dark mode');
    expect(toggle('bare').querySelector('label')).toBeNull();
    expect(box('wifi').hasAttribute('aria-label')).toBe(false);
  });
});
