import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LiquidAutocomplete } from '@app/shared/components/liquid-autocomplete/liquid-autocomplete';

interface Province {
  key: string;
  name: string;
  region: string;
}

const PROVINCES: Province[] = [
  { key: '12', name: 'Phnom Penh', region: 'Plain' },
  { key: '08', name: 'Kandal', region: 'Plain' },
  { key: '17', name: 'Siem Reap', region: 'Tonle Sap' },
  { key: '02', name: 'Battambang', region: 'Tonle Sap' },
  { key: '07', name: 'Kampot', region: 'Coast' },
];

@Component({
  imports: [LiquidAutocomplete, ReactiveFormsModule],
  template: `
    <x-liquid-autocomplete
      #bound
      inputId="bound"
      label="Province"
      searchable
      [options]="options"
      [(value)]="value"
      [displayWith]="name"
      [groupWith]="region"
      [disabledWith]="isCoast"
      [compareWith]="sameKey"
      [clearable]="true"
    />
    <x-liquid-autocomplete
      inputId="form"
      [options]="options"
      [displayWith]="name"
      [formControl]="control"
    />
  `,
})
class Host {
  readonly options = PROVINCES;
  readonly value = signal<Province | null>(null);
  readonly control = new FormControl<Province | null>(null);
  readonly name = (province: Province) => province.name;
  readonly region = (province: Province) => province.region;
  readonly isCoast = (province: Province) => province.region === 'Coast';
  readonly sameKey = (a: Province, b: Province) => a.key === b.key;
}

describe('LiquidAutocomplete', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let element: HTMLElement;

  const trigger = (id: string) => element.querySelector<HTMLButtonElement>(`#${id}`)!;
  const options = () => [...element.querySelectorAll<HTMLElement>('[role="option"]')];
  const search = () => element.querySelector<HTMLInputElement>('input[type="search"]')!;

  async function open(id = 'bound') {
    trigger(id).click();
    await fixture.whenStable();
  }

  async function type(text: string) {
    search().value = text;
    search().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function press(key: string) {
    search().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('shows the placeholder until something is chosen, then the label', async () => {
    expect(trigger('bound').textContent).toContain('Select');
    host.value.set(PROVINCES[2]);
    await fixture.whenStable();
    expect(trigger('bound').textContent?.trim()).toBe('Siem Reap');
  });

  it('builds the list only while it is open, grouped in first-seen order', async () => {
    expect(options().length).toBe(0);
    await open();
    expect(options().length).toBe(PROVINCES.length);
    const titles = [...element.querySelectorAll('.liquid-autocomplete-group-title')];
    expect(titles.map((title) => title.textContent?.trim())).toEqual([
      'Plain',
      'Tonle Sap',
      'Coast',
    ]);
  });

  it('filters as the query changes and marks the match', async () => {
    await open();
    await type('ka');
    expect(options().map((option) => option.textContent?.trim())).toEqual(['Kandal', 'Kampot']);
    expect(element.querySelector('mark')?.textContent).toBe('Ka');
    // No stray whitespace around the mark: it sits in the middle of a word.
    expect(element.querySelector('.liquid-autocomplete-option-title')?.textContent).toBe('Kandal');

    await type('zzz');
    expect(element.querySelector('.liquid-autocomplete-empty')).toBeTruthy();
  });

  it('moves with the arrow keys, skips what is disabled, and selects on Enter', async () => {
    await open();
    await type('ka');
    // Kandal is active; Kampot, the only other match, is disabled — so down wraps to Kandal.
    await press('ArrowDown');
    expect(element.querySelector('.is-active')?.textContent?.trim()).toBe('Kandal');
    await press('Enter');
    expect(host.value()).toBe(PROVINCES[1]);
  });

  it('does not choose a disabled option on click', async () => {
    await open();
    options()[4].click();
    await fixture.whenStable();
    expect(host.value()).toBeNull();
  });

  it('opens on the chosen option — found by `compareWith`, not identity', async () => {
    host.value.set({ ...PROVINCES[3] });
    await fixture.whenStable();
    await open();
    const selected = element.querySelector('.is-selected');
    expect(selected?.textContent?.trim()).toBe('Battambang');
    expect(selected?.classList.contains('is-active')).toBe(true);
    expect(selected?.getAttribute('aria-selected')).toBe('true');
  });

  it('clears through its own button when `clearable`', async () => {
    host.value.set(PROVINCES[0]);
    await fixture.whenStable();
    element
      .querySelector<HTMLButtonElement>('.liquid-autocomplete-field > .liquid-autocomplete-clear')!
      .click();
    await fixture.whenStable();
    expect(host.value()).toBeNull();
  });

  it('is a form control: writes, reads, disables and touches', async () => {
    host.control.setValue(PROVINCES[2]);
    await fixture.whenStable();
    expect(trigger('form').textContent?.trim()).toBe('Siem Reap');

    await open('form');
    options()[0].click();
    await fixture.whenStable();
    expect(host.control.value).toBe(PROVINCES[0]);
    expect(host.control.touched).toBe(true);

    host.control.disable();
    await fixture.whenStable();
    expect(trigger('form').disabled).toBe(true);
  });

  it('leaves the search field out of a short list unless asked for it', async () => {
    await open('form');
    expect(search()).toBeNull();
    expect(element.querySelector('[role="listbox"]')?.getAttribute('tabindex')).toBe('0');
  });
});
