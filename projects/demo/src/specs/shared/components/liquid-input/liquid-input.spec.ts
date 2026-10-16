import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { LiquidInput, LiquidInputTyped } from '@app/shared/components/liquid-input/liquid-input';

@Component({
  imports: [FormsModule, LiquidInput, ReactiveFormsModule],
  template: `
    <x-liquid-input
      inputId="name"
      label="Full name"
      placeholder="Sok Dara"
      hint="As printed on your ID"
      clearable
      [(value)]="name"
    />
    <x-liquid-input
      inputId="email"
      label="Email"
      type="email"
      [formControl]="email"
      [errorMessages]="{ required: 'Email is required', email: 'That is not an email' }"
    />
    <x-liquid-input inputId="age" label="Age" type="number" [(value)]="age" />
    <x-liquid-input inputId="note" label="Note" type="textarea" [(ngModel)]="note" />
    <x-liquid-input
      inputId="pass"
      label="Password"
      type="password"
      revealable
      clearable
      [(value)]="password"
    />
    <x-liquid-input inputId="dob" label="Date of birth" type="date" />
    <x-liquid-input
      inputId="phone"
      label="Phone"
      type="tel"
      mask="000 000 000"
      [formControl]="phone"
    />
    <x-liquid-input inputId="pp" label="Passport no." mask="A0000000" maskStores="formatted" />
    <x-liquid-input inputId="keypad" label="Keypad" [transformWith]="keypad" [(value)]="dialled" />

    <!-- The commonest binding there is, and the one a lookup done too early
         silently misses: formControlName only takes hold of its control in its
         own ngOnChanges, which runs after a component's ngOnInit. -->
    <form [formGroup]="group">
      <x-liquid-input
        inputId="named"
        label="By name"
        formControlName="email"
        [errorMessages]="{ required: 'Email is required' }"
      />
    </form>
    <x-liquid-input
      inputId="khmer"
      label="Khmer number"
      mask="000 000 000"
      [transformWith]="toKhmer"
      [(value)]="khmer"
    />
    <x-liquid-input inputId="free" label="Anything" [transformWith]="toKhmer" [(value)]="free" />
    <x-liquid-input inputId="when" label="Time" type="time" />
  `,
})
class Host {
  readonly name = signal<string | number | null>('');
  readonly age = signal<string | number | null>(null);
  readonly password = signal<string | number | null>('correct-horse');
  note = '';
  readonly email = new FormControl('', [Validators.required, Validators.email]);
  readonly phone = new FormControl('');
  readonly group = new FormBuilder().group({ email: ['', Validators.required] });
  readonly dialled = signal<string | number | null>('');
  readonly khmer = signal<string | number | null>('');
  readonly free = signal<string | number | null>('');

  /** A phone keypad: a letter becomes the digit it shares a key with. */
  readonly keypad = ({ character }: LiquidInputTyped): string | null => {
    const key = 'abc:2 def:3 ghi:4 jkl:5 mno:6 pqrs:7 tuv:8 wxyz:9'
      .split(' ')
      .find(([...letters]) => letters.includes(character.toLowerCase()));
    return key ? key.slice(-1) : /\d/.test(character) ? character : null;
  };

  /**
   * Latin digits typed, Khmer digits held — and everything else left exactly as
   * it was typed. Refusing a character is the mask's job where there is one.
   */
  readonly toKhmer = ({ character }: LiquidInputTyped): string | null => {
    const at = '0123456789'.indexOf(character);
    return at === -1 ? character : '០១២៣៤៥៦៧៨៩'[at];
  };
}

describe('LiquidInput', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let element: HTMLElement;
  let inputs: LiquidInput[];

  const control = (id: string) => element.querySelector<HTMLInputElement>(`#${id}`)!;
  const field = (id: string) => control(id).closest('x-liquid-input')!;
  const type = async (id: string, text: string) => {
    const input = control(id);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  /**
   * One character typed the way a browser types it: the field is told first, and
   * unless something stops it the character lands and `input` follows. jsdom has
   * no default action of its own, and the pass-through case is exactly the one
   * where the component leaves that action to the browser.
   */
  const press = async (id: string, character: string) => {
    const input = control(id);
    const event = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: character,
      cancelable: true,
    });
    input.dispatchEvent(event);
    if (!event.defaultPrevented) {
      const start = input.selectionStart ?? input.value.length;
      input.setRangeText(character, start, input.selectionEnd ?? start, 'end');
      input.dispatchEvent(new Event('input'));
    }
    await fixture.whenStable();
  };

  const blur = async (id: string) => {
    control(id).dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
    inputs = fixture.debugElement
      .queryAll(By.directive(LiquidInput))
      .map((debug) => debug.componentInstance as LiquidInput);
  });

  it('draws a labelled control, described by its hint', () => {
    const label = field('name').querySelector('label')!;
    expect(label.getAttribute('for')).toBe('name');
    expect(label.textContent).toContain('Full name');
    expect(control('name').placeholder).toBe('Sok Dara');
    expect(control('name').getAttribute('aria-describedby')).toBe('name-hint');
    expect(field('name').querySelector('#name-hint')?.textContent?.trim()).toBe(
      'As printed on your ID',
    );
  });

  it('is the type it is told to be, and a textarea is a textarea', () => {
    expect(control('email').type).toBe('email');
    expect(control('age').type).toBe('number');
    expect(element.querySelector('#note')!.tagName).toBe('TEXTAREA');
  });

  it('writes what is typed back through `[(value)]`', async () => {
    await type('name', 'Sok Dara');
    expect(host.name()).toBe('Sok Dara');
    expect(field('name').classList).toContain('has-value');
  });

  it('gives a number field a number, and nothing at all when it is emptied', async () => {
    await type('age', '42');
    expect(host.age()).toBe(42);
    await type('age', '');
    expect(host.age()).toBeNull();
  });

  it('is a reactive form control: writes, reads, touches and disables', async () => {
    host.email.setValue('sok@example.com');
    await fixture.whenStable();
    expect(control('email').value).toBe('sok@example.com');

    await type('email', 'dara@example.com');
    expect(host.email.value).toBe('dara@example.com');

    expect(host.email.touched).toBe(false);
    await blur('email');
    expect(host.email.touched).toBe(true);

    host.email.disable();
    await fixture.whenStable();
    expect(control('email').disabled).toBe(true);
    expect(field('email').classList).toContain('is-disabled');
  });

  it('is a template-driven control too', async () => {
    await type('note', 'Anything worth saying');
    expect(host.note).toBe('Anything worth saying');
  });

  it('says the first validator that matched, but only once the control is touched', async () => {
    expect(field('email').querySelector('.liquid-input-error')).toBeNull();

    await blur('email');
    expect(field('email').querySelector('.liquid-input-error')?.textContent).toContain(
      'Email is required',
    );
    expect(control('email').getAttribute('aria-invalid')).toBe('true');
    expect(control('email').getAttribute('aria-describedby')).toBe('email-error');
    expect(field('email').classList).toContain('is-invalid');

    await type('email', 'not-an-email');
    expect(field('email').querySelector('.liquid-input-error')?.textContent).toContain(
      'That is not an email',
    );

    await type('email', 'dara@example.com');
    expect(field('email').querySelector('.liquid-input-error')).toBeNull();
    expect(control('email').getAttribute('aria-invalid')).toBeNull();
  });

  it('finds its control under `formControlName`, not just `[formControl]`', async () => {
    expect(field('named').querySelector('.liquid-input-error')).toBeNull();

    host.group.markAllAsTouched();
    await fixture.whenStable();
    expect(field('named').querySelector('.liquid-input-error')?.textContent).toContain(
      'Email is required',
    );
  });

  it('lights up as soon as a form marks everything touched on submit', async () => {
    host.email.markAllAsTouched();
    await fixture.whenStable();
    expect(field('email').querySelector('.liquid-input-error')?.textContent).toContain(
      'Email is required',
    );
  });

  it("marks a control required off the control's own validator", () => {
    expect(control('email').required).toBe(true);
    expect(field('email').querySelector('.liquid-input-required')).not.toBeNull();
    expect(control('name').required).toBe(false);
  });

  it('offers the clear button only while there is something to clear', async () => {
    expect(field('name').querySelector('.liquid-input-action')).toBeNull();

    await type('name', 'Sok Dara');
    const clear = field('name').querySelector<HTMLButtonElement>('.liquid-input-action')!;
    expect(clear.getAttribute('aria-label')).toBe('Clear');

    clear.click();
    await fixture.whenStable();
    expect(host.name()).toBe('');
    expect(document.activeElement).toBe(control('name'));
  });

  it('clears on the first click while the field is focused, without ever losing it', async () => {
    await type('name', 'Sok Dara');
    control('name').dispatchEvent(new Event('focus'));
    await fixture.whenStable();

    const clear = field('name').querySelector<HTMLButtonElement>('.liquid-input-action')!;
    const glyph = clear.firstElementChild;

    // The field does not lose the focus to its own button. Without this the
    // blur re-renders what is under the pointer, and a click whose mousedown
    // target has gone is never dispatched — the button then needs a second
    // click to answer the first.
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    clear.dispatchEvent(down);
    await fixture.whenStable();
    expect(down.defaultPrevented).toBe(true);
    expect(field('name').classList).toContain('is-focused');
    expect(clear.firstElementChild).toBe(glyph);
    expect(clear.isConnected).toBe(true);

    clear.click();
    await fixture.whenStable();
    expect(host.name()).toBe('');
  });

  it('keeps the buttons in one order however they come and go', async () => {
    const order = () =>
      Array.from(field('pass').querySelectorAll('.liquid-input-field .liquid-input-action')).map(
        (button) => button.getAttribute('aria-label'),
      );
    expect(order()).toEqual(['Clear', 'Show password']);

    // The clear folds out with the value and comes back with it — and has to
    // come back in front of the eye rather than after whatever is already there.
    await type('pass', '');
    expect(order()).toEqual(['Show password']);

    await type('pass', 'again');
    expect(order()).toEqual(['Clear', 'Show password']);

    await type('pass', '');
    await type('pass', 'and again');
    expect(order()).toEqual(['Clear', 'Show password']);
  });

  it('shows a password only while the eye is on', async () => {
    // By name, not by position: the clear button stands in front of it.
    const eye = field('pass').querySelector<HTMLButtonElement>(
      '.liquid-input-action[aria-label="Show password"]',
    )!;
    expect(control('pass').type).toBe('password');
    expect(eye.getAttribute('aria-label')).toBe('Show password');

    eye.click();
    await fixture.whenStable();
    expect(control('pass').type).toBe('text');
    expect(eye.getAttribute('aria-label')).toBe('Hide password');
  });

  it('answers being reached by moving the whole field as one, at a fraction of the press depth', async () => {
    const wrapper = field('name').querySelector<HTMLElement>('.liquid-input-press')!;
    const box = wrapper.firstElementChild!;
    const played: Keyframe[][] = [];

    // jsdom has no Web Animations API. The press skips a child that cannot be
    // animated, so the field simply takes the focus — nothing to guard here.
    expect(() => control('name').dispatchEvent(new Event('focus'))).not.toThrow();
    await fixture.whenStable();
    expect(field('name').classList).toContain('is-focused');

    (box as unknown as { animate: unknown }).animate = (frames: Keyframe[]) => {
      played.push(frames);
      return { cancel: () => {}, playState: 'running' } as unknown as Animation;
    };
    // Reached again while the first tap is still held: it is let go of rather
    // than left squashed, and the press that follows still happens.
    control('name').dispatchEvent(new Event('blur'));
    control('name').dispatchEvent(new Event('focus'));

    // One box moves, not one per child — so what is printed on the field
    // travels with it instead of each piece scaling about its own centre.
    expect(wrapper.children.length).toBe(1);
    expect(box.classList).toContain('liquid-input-field');
    expect(played.length).toBe(1);
    // `1.08 0.9` at depth 0.3 — flattened and spread, the way anything soft is.
    expect(played[0][0]['scale']).toBe('1.024 0.97');
    // A scale is not a layout: the row the grid sized never moves.
    expect(wrapper.getAttribute('style')).toBeNull();
  });

  it('offers its own way into the picker, since the browser glyph is swept out', () => {
    const date = field('dob').querySelector<HTMLButtonElement>('.liquid-input-action')!;
    const time = field('when').querySelector<HTMLButtonElement>('.liquid-input-action')!;
    expect(date.getAttribute('aria-label')).toBe('Choose a date');
    expect(time.getAttribute('aria-label')).toBe('Choose a time');

    // Only a field whose value is chosen rather than typed gets one.
    expect(field('name').querySelector('.liquid-input-action')).toBeNull();
    expect(field('age').querySelector('.liquid-input-action')).toBeNull();
  });

  it('opens the picker without falling over where the browser will not', async () => {
    const input = control('dob') as HTMLInputElement & { showPicker?: () => void };
    const button = field('dob').querySelector<HTMLButtonElement>('.liquid-input-action')!;

    // jsdom has no `showPicker`; a browser has one that throws without a gesture.
    expect(input.showPicker).toBeUndefined();
    expect(() => button.click()).not.toThrow();

    input.showPicker = () => {
      throw new DOMException('not allowed', 'NotAllowedError');
    };
    expect(() => button.click()).not.toThrow();
    expect(document.activeElement).toBe(input);
  });

  it('types the value into its mask, and hands the form the characters typed', async () => {
    await type('phone', '012345678');
    expect(control('phone').value).toBe('012 345 678');
    expect(host.phone.value).toBe('012345678');
  });

  it('refuses a character the slot will not take', async () => {
    await type('phone', '01a2');
    expect(control('phone').value).toBe('012');
    expect(host.phone.value).toBe('012');
  });

  it('lays a value the form gives it into the mask, raw or already formatted', async () => {
    host.phone.setValue('012345678');
    await fixture.whenStable();
    expect(control('phone').value).toBe('012 345 678');

    host.phone.setValue('012 345 678');
    await fixture.whenStable();
    expect(control('phone').value).toBe('012 345 678');
  });

  it("hands over the field's own text where the form wants the separators", async () => {
    await type('pp', 'N1234567');
    expect(control('pp').value).toBe('N1234567');

    const masked = fixture.debugElement
      .queryAll(By.directive(LiquidInput))
      .map((debug) => debug.componentInstance as LiquidInput)
      .find((input) => input.inputId() === 'pp')!;
    expect(masked.value()).toBe('N1234567');
  });

  it('counts what was typed against what the mask holds, separators aside', async () => {
    await type('phone', '0123');
    // `000 000 000` holds nine, and the space is not one of them.
    expect(control('phone').value).toBe('012 3');
  });

  it('takes the character in front of a separator when one is backspaced', async () => {
    await type('phone', '0123');
    const input = control('phone');
    input.setSelectionRange(4, 4);

    // The caret sits after "012 ": the browser is told to delete the digit too.
    const event = new InputEvent('beforeinput', { inputType: 'deleteContentBackward' });
    input.dispatchEvent(event);
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 4]);
  });

  it('leaves a mask alone where it could only fight the field', async () => {
    // A number cannot hold a separator; a picker and a text area own their shape.
    expect(control('age').value).toBe('');
    await type('age', '42');
    expect(host.age()).toBe(42);
  });

  it('turns each character into what the transform says it is', async () => {
    const input = control('keypad');
    input.focus();
    const typed = (character: string) => {
      input.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: character,
          cancelable: true,
        }),
      );
    };

    typed('a');
    typed('b');
    await fixture.whenStable();
    expect(input.value).toBe('22');
    expect(host.dialled()).toBe('22');
  });

  it('stands aside for a character it would not change', () => {
    const input = control('keypad');
    input.focus();
    const event = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: '7',
      cancelable: true,
    });
    input.dispatchEvent(event);

    // Left to the browser, which keeps the field's own undo and caret rather
    // than having them rebuilt for a character that came through unchanged.
    expect(event.defaultPrevented).toBe(false);
  });

  it('refuses a character the transform returns `null` for', async () => {
    const input = control('keypad');
    input.focus();
    input.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: '-', cancelable: true }),
    );
    await fixture.whenStable();
    expect(input.value).toBe('');
  });

  it('runs before the mask, so the slot is offered what the transform returned', async () => {
    const input = control('khmer');
    input.focus();
    for (const character of '0123') {
      input.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: character,
          cancelable: true,
        }),
      );
    }
    await fixture.whenStable();
    // Latin in, Khmer held, and the mask's own separator around them.
    expect(input.value).toBe('០១២ ៣');
    expect(host.khmer()).toBe('០១២៣');
  });

  it('leaves the refusing to the mask where there is one', async () => {
    const input = control('khmer');
    input.focus();
    // The transform hands the letter straight back, and the digit slot is what
    // turns it away — so the same function serves a masked field and a free one.
    await press('khmer', 'a');
    expect(input.value).toBe('');
    await press('khmer', '7');
    expect(input.value).toBe('៧');
  });

  it('takes every character and transforms only the digits, with no mask to filter', async () => {
    const input = control('free');
    input.focus();
    for (const character of 'A1 b2-3') await press('free', character);

    // The letters, the space and the dash are all still there, exactly as typed;
    // only the digits became Khmer.
    expect(input.value).toBe('A១ b២-៣');
    expect(host.free()).toBe('A១ b២-៣');
  });

  it('leaves a character it does not change to the browser, even unmasked', async () => {
    const input = control('free');
    input.focus();

    const letter = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: 'A',
      cancelable: true,
    });
    input.dispatchEvent(letter);
    expect(letter.defaultPrevented).toBe(false);

    const digit = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: '1',
      cancelable: true,
    });
    input.dispatchEvent(digit);
    expect(digit.defaultPrevented).toBe(true);
  });

  it('transforms what is pasted, character by character', async () => {
    const input = control('keypad');
    input.focus();
    const paste = new InputEvent('beforeinput', { inputType: 'insertFromPaste', cancelable: true });
    Object.defineProperty(paste, 'dataTransfer', {
      value: { getData: () => 'cab' },
    });
    input.dispatchEvent(paste);
    await fixture.whenStable();
    expect(input.value).toBe('222');
  });

  it('leaves a composition alone: an IME owns what it is building', async () => {
    const input = control('keypad');
    input.focus();
    const composing = new InputEvent('beforeinput', {
      inputType: 'insertCompositionText',
      data: 'a',
      cancelable: true,
    });
    Object.defineProperty(composing, 'isComposing', { value: true });
    input.dispatchEvent(composing);
    expect(composing.defaultPrevented).toBe(false);
  });

  it('takes the focus where a failed validation puts it', () => {
    inputs[1].focus();
    expect(document.activeElement).toBe(control('email'));
    expect(inputs[1].element()).toBe(control('email'));
  });
});
