import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { LiquidAutocomplete } from '@app/shared/components/liquid-autocomplete/liquid-autocomplete';
import { LiquidInput, LiquidInputOption } from '@app/shared/components/liquid-input/liquid-input';
import { LiquidInputGroup, LiquidInputGroupValue } from '@app/shared/components/liquid-input-group/liquid-input-group';

const CODES: LiquidInputOption[] = [
  { value: '+855', label: '🇰🇭 +855' },
  { value: '+66', label: '🇹🇭 +66' },
];

@Component({
  imports: [LiquidAutocomplete, LiquidInput, LiquidInputGroup, ReactiveFormsModule],
  template: `
    <x-liquid-input-group label="Phone" hint="A number we can reach you on" [(value)]="phone">
      <x-liquid-input
        bare
        name="code"
        inputId="code"
        label="Country code"
        [options]="codes"
        width="7ch"
      />
      <x-liquid-input bare name="number" inputId="number" label="Number" mask="000 000 000" />
    </x-liquid-input-group>

    <x-liquid-input-group
      label="Date of birth"
      [formControl]="born"
      [errorMessages]="{ incomplete: 'A date of birth is required' }"
    >
      <x-liquid-input bare name="day" inputId="day" label="Day" mask="00" width="4ch" />
      <x-liquid-input bare name="month" inputId="month" label="Month" mask="00" width="4ch" />
      <x-liquid-input bare name="year" inputId="year" label="Year" mask="0000" width="6ch" />
    </x-liquid-input-group>

    <!-- The same box, with a picker for the part that has two hundred answers. -->
    <x-liquid-input-group label="Dial" [(value)]="dial">
      <x-liquid-autocomplete
        bare
        name="country"
        inputId="country"
        label="Country"
        width="9ch"
        [options]="countries"
        [displayWith]="dialOf"
      />
      <x-liquid-input bare name="number" inputId="dialled" label="Number" mask="000 000 000" />
    </x-liquid-input-group>
  `,
})
class Host {
  readonly codes = CODES;
  readonly phone = signal<LiquidInputGroupValue>({ code: '+855', number: '' });
  /**
   * A group holds an object, and `Validators.required` passes an empty one —
   * it only ever checks for `null` or an empty `length`. A group is validated
   * by looking at its parts.
   */
  static readonly complete = (control: AbstractControl): ValidationErrors | null =>
    ['day', 'month', 'year'].every((part) => control.value?.[part]) ? null : { incomplete: true };

  readonly born = new FormControl<LiquidInputGroupValue>({}, Host.complete);

  readonly countries = [
    { key: 'kh', dial: '+855', name: 'Cambodia' },
    { key: 'th', dial: '+66', name: 'Thailand' },
  ];
  readonly dialOf = (country: { dial: string }) => country.dial;
  readonly dial = signal<LiquidInputGroupValue>({});
}

describe('LiquidInputGroup', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let element: HTMLElement;

  const control = (id: string) => element.querySelector<HTMLInputElement>(`#${id}`)!;
  const group = (label: string) =>
    Array.from(element.querySelectorAll('x-liquid-input-group')).find((node) =>
      node.querySelector('.liquid-input-label')?.textContent?.includes(label),
    )!;

  const type = async (id: string, text: string) => {
    const input = control(id);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('draws one box, one label and one line for all of its segments', () => {
    const phone = group('Phone');
    // One row is painted; the segments' own are stripped down to nothing.
    expect(phone.querySelectorAll('.liquid-input-group-row').length).toBe(1);
    expect(phone.querySelectorAll('.liquid-segment').length).toBe(2);
    expect(phone.querySelectorAll('.liquid-input-label').length).toBe(1);
    expect(phone.querySelector('.liquid-input-hint')?.textContent?.trim()).toBe(
      'A number we can reach you on',
    );
    // The segments keep their controls and give up their chrome.
    expect(phone.querySelectorAll('.liquid-input-control').length).toBe(2);
    expect(phone.querySelector('.liquid-input-below')).not.toBeNull();
  });

  it('names the group for a screen reader, and each segment inside it', () => {
    const phone = group('Phone');
    expect(phone.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Phone');
    expect(control('code').getAttribute('aria-label')).toBe('Country code');
    expect(control('number').getAttribute('aria-label')).toBe('Number');
    // The group's label points at the first segment.
    expect(phone.querySelector('label')?.getAttribute('for')).toBe('code');
  });

  it("holds one value per segment, under the segment's own name", async () => {
    await type('number', '012345678');
    expect(host.phone()).toEqual({ code: '+855', number: '012345678' });
  });

  it('gives each segment its share of a value the form writes', async () => {
    host.born.setValue({ day: '01', month: '02', year: '2026' });
    await fixture.whenStable();
    expect(control('day').value).toBe('01');
    expect(control('month').value).toBe('02');
    expect(control('year').value).toBe('2026');
  });

  it('makes a list say what it is showing, rather than standing blank', async () => {
    const code = element.querySelector<HTMLSelectElement>('#code')!;
    // Nothing chose it, but a `<select>` shows its first option regardless — so
    // the value has to agree, or the form holds `''` while the field reads +855.
    expect(code.selectedIndex).toBe(0);
    expect(code.value).toBe('+855');
    expect(host.phone()['code']).toBe('+855');
  });

  it('lets a segment keep its own mask', async () => {
    await type('number', '0123');
    expect(control('number').value).toBe('012 3');
    expect(host.phone()['number']).toBe('0123');
  });

  it('hands the focus on when a segment has taken all it can', async () => {
    control('day').focus();
    await type('day', '01');
    expect(document.activeElement).toBe(control('month'));

    await type('month', '02');
    expect(document.activeElement).toBe(control('year'));
  });

  it('stays where it is while a segment is only part full', async () => {
    control('year').focus();
    await type('year', '20');
    expect(document.activeElement).toBe(control('year'));
  });

  it('takes an autocomplete as a segment, holding whichever option it picked', async () => {
    const picker = fixture.debugElement
      .queryAll(By.directive(LiquidAutocomplete))
      .map((debug) => debug.componentInstance as LiquidAutocomplete<{ dial: string }>)[0];

    // One box around both, and the group's label points at the picker's trigger.
    const dial = group('Dial');
    expect(dial.querySelectorAll('.liquid-input-group-row').length).toBe(1);
    expect(dial.querySelector('label')?.getAttribute('for')).toBe('country');

    picker.value.set(host.countries[1]);
    await fixture.whenStable();

    // A picker holds an option, not text — so that is what the group holds too.
    expect(host.dial()['country']).toEqual(host.countries[1]);

    await type('dialled', '012345678');
    expect(host.dial()).toEqual({ country: host.countries[1], number: '012345678' });
  });

  it('lays out a picker and a masked field the same way', () => {
    // Addressed by what they registered as, not by what they are — the class is
    // what the group's own stylesheet reaches for.
    const dial = group('Dial');
    const segments = [...dial.querySelectorAll('.liquid-segment')];
    expect(segments.length).toBe(2);
    expect(segments[0].tagName).toBe('X-LIQUID-AUTOCOMPLETE');
    expect(segments[1].tagName).toBe('X-LIQUID-INPUT');
  });

  it('rings itself while a picker inside it has the focus', async () => {
    const trigger = element.querySelector<HTMLButtonElement>('#country')!;
    trigger.dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    expect(group('Dial').classList).toContain('is-focused');

    trigger.dispatchEvent(new Event('blur'));
    await new Promise((settle) => setTimeout(settle));
    await fixture.whenStable();
    expect(group('Dial').classList).not.toContain('is-focused');
  });

  it('is a form control: writes, reads, touches and disables', async () => {
    await type('day', '09');
    expect(host.born.value).toEqual({ day: '09', month: '', year: '' });

    host.born.disable();
    await fixture.whenStable();
    expect(control('day').disabled).toBe(true);
    expect(group('Date of birth').classList).toContain('is-disabled');
  });

  it('is touched when the focus leaves the group, not as it moves inside it', async () => {
    control('day').dispatchEvent(new Event('focus'));
    await fixture.whenStable();

    // Between segments: the blur is followed by a focus, and nothing is touched.
    control('day').dispatchEvent(new Event('blur'));
    control('month').dispatchEvent(new Event('focus'));
    await new Promise((settle) => setTimeout(settle));
    expect(host.born.touched).toBe(false);
    expect(group('Date of birth').classList).toContain('is-focused');

    // Out of the group altogether: nothing arrives after it.
    control('month').dispatchEvent(new Event('blur'));
    await new Promise((settle) => setTimeout(settle));
    await fixture.whenStable();
    expect(host.born.touched).toBe(true);
    expect(group('Date of birth').classList).not.toContain('is-focused');
  });

  it('says the first validator that matched, once the group has been touched', async () => {
    expect(group('Date of birth').querySelector('.liquid-input-error')).toBeNull();

    host.born.markAllAsTouched();
    await fixture.whenStable();
    expect(group('Date of birth').querySelector('.liquid-input-error')?.textContent).toContain(
      'A date of birth is required',
    );
    expect(group('Date of birth').classList).toContain('is-invalid');
  });
});
