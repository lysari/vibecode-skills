import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiquidStepContent } from '@app/shared/components/liquid-stepper/liquid-step-content.directive';
import { LiquidStepDone, LiquidStepIcon } from '@app/shared/components/liquid-stepper/liquid-step-glyph.directive';
import { LiquidStepPanel } from '@app/shared/components/liquid-stepper/liquid-step-panel.directive';
import { LiquidStep } from '@app/shared/components/liquid-stepper/liquid-step';
import { LiquidStepper, LiquidStepperOrientation, LiquidStepperVariant } from '@app/shared/components/liquid-stepper/liquid-stepper';

const KEY_CODES = {
  ' ': 32,
  ArrowDown: 40,
  ArrowRight: 39,
  End: 35,
  Enter: 13,
  Home: 36,
} as const;

@Component({
  imports: [LiquidStepper, LiquidStep, LiquidStepDone, LiquidStepIcon, LiquidStepPanel],
  template: `
    <x-liquid-stepper
      #stepper="liquidStepper"
      aria-label="Application"
      [linear]="linear()"
      [orientation]="orientation()"
      [variant]="variant()"
      [flush]="flush()"
      [progress]="progress()"
      [(value)]="value"
      (blocked)="refusedBy.set($event.value())"
    >
      @for (key of keys; track key) {
        <button
          [id]="'step-' + key"
          type="button"
          [liquidStep]="key"
          [disabled]="key === blocked()"
          [valid]="key === invalid() ? false : undefined"
        >
          @if (key === 'documents') {
            <span liquidStepIcon>★</span>
          }
          @if (key === 'details') {
            <span liquidStepDone>✔</span>
          }
          {{ key }}
        </button>
      }
    </x-liquid-stepper>

    @for (key of keys; track key) {
      <section [id]="'panel-' + key" [liquidStepPanel]="key" [liquidStepPanelFor]="stepper">
        {{ key }}
      </section>
    }
  `,
})
class Host {
  readonly keys = ['details', 'documents', 'review', 'submit'];
  readonly value = signal<string | null>(null);
  readonly linear = signal(false);
  readonly blocked = signal<string | null>(null);
  /** The step that says it is not valid, and the one that last held the stepper back. */
  readonly invalid = signal<string | null>(null);
  readonly refusedBy = signal<string | null>(null);
  readonly orientation = signal<LiquidStepperOrientation>('horizontal');
  readonly variant = signal<LiquidStepperVariant>('line');
  readonly flush = signal(false);
  readonly progress = signal(false);
  readonly stepperRef = viewChild.required<LiquidStepper<string>>('stepper');
}

/** A shared panel holding a content per step: built as its step is picked, not before. */
@Component({
  imports: [LiquidStepper, LiquidStep, LiquidStepPanel, LiquidStepContent],
  template: `
    <x-liquid-stepper #stepper="liquidStepper" [(value)]="value">
      @for (key of keys; track key) {
        <button [id]="'c-step-' + key" type="button" [liquidStep]="key">{{ key }}</button>
      }
    </x-liquid-stepper>

    <div id="shared" liquidStepPanel [liquidStepPanelFor]="stepper" [panelMode]="mode()">
      @for (key of keys; track key) {
        <ng-template [liquidStepContent]="key" let-value>
          <p [id]="'content-' + key">{{ value }}</p>
        </ng-template>
      }
    </div>
  `,
})
class ContentHost {
  readonly keys = ['a', 'b', 'c', 'd'];
  readonly value = signal<string | null>(null);
  readonly mode = signal<'dissolve' | 'slider'>('dissolve');
}

/** Each step's part of a reactive form, handed to the step as its control. */
@Component({
  imports: [LiquidStepper, LiquidStep, LiquidStepPanel, LiquidStepContent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <x-liquid-stepper #stepper="liquidStepper" linear [(value)]="value">
        <button id="f-step-name" type="button" liquidStep="name" [control]="form.controls.name">
          name
        </button>
        <button id="f-step-email" type="button" liquidStep="email" [control]="form.controls.email">
          email
        </button>
        <button id="f-step-done" type="button" liquidStep="done">done</button>
      </x-liquid-stepper>
      <div liquidStepPanel [liquidStepPanelFor]="stepper">
        <ng-template liquidStepContent="name"><input formControlName="name" /></ng-template>
        <ng-template liquidStepContent="email"><input formControlName="email" /></ng-template>
      </div>
    </form>
  `,
})
class ReactiveHost {
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  readonly value = signal<string | null>(null);
  readonly stepperRef = viewChild.required<LiquidStepper<string>>('stepper');
}

/** One `ngForm` for every step: its fields only join it while their step is built. */
@Component({
  imports: [LiquidStepper, LiquidStep, LiquidStepPanel, LiquidStepContent, FormsModule],
  template: `
    <form #td="ngForm">
      <x-liquid-stepper #stepper="liquidStepper" linear [(value)]="value">
        @for (key of keys; track key) {
          <button type="button" [liquidStep]="key" [control]="td.form">{{ key }}</button>
        }
      </x-liquid-stepper>
      <div liquidStepPanel [liquidStepPanelFor]="stepper">
        <ng-template liquidStepContent="name">
          <input name="name" required [(ngModel)]="name" />
        </ng-template>
        <ng-template liquidStepContent="email">
          <input name="email" required [(ngModel)]="email" />
        </ng-template>
      </div>
    </form>
  `,
})
class DrivenHost {
  readonly keys = ['name', 'email', 'done'];
  readonly name = signal('');
  readonly email = signal('');
  readonly value = signal<string | null>(null);
  readonly stepperRef = viewChild.required<LiquidStepper<string>>('stepper');
}

/** A form of its own per step, as the `[formGroup]` of the step's content. */
@Component({
  imports: [LiquidStepper, LiquidStep, LiquidStepPanel, LiquidStepContent, ReactiveFormsModule],
  template: `
    <x-liquid-stepper #stepper="liquidStepper" linear [(value)]="value">
      @for (key of keys; track key) {
        <button type="button" [liquidStep]="key">{{ key }}</button>
      }
    </x-liquid-stepper>
    <div liquidStepPanel [liquidStepPanelFor]="stepper">
      <ng-template liquidStepContent="name" [formGroup]="nameForm">
        <input id="split-name" formControlName="name" />
      </ng-template>
      <ng-template liquidStepContent="email" [formGroup]="emailForm">
        <input formControlName="email" />
      </ng-template>
    </div>
  `,
})
class SplitHost {
  readonly keys = ['name', 'email', 'done'];
  readonly nameForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  readonly emailForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  readonly value = signal<string | null>(null);
  readonly stepperRef = viewChild.required<LiquidStepper<string>>('stepper');
}

/** Template-driven, a group per step: `ngModelGroup` on the step's content. */
@Component({
  imports: [LiquidStepper, LiquidStep, LiquidStepPanel, LiquidStepContent, FormsModule],
  template: `
    <form>
      <x-liquid-stepper #stepper="liquidStepper" linear [(value)]="value">
        @for (key of keys; track key) {
          <button type="button" [liquidStep]="key">{{ key }}</button>
        }
      </x-liquid-stepper>
      <div liquidStepPanel [liquidStepPanelFor]="stepper">
        <ng-template liquidStepContent="name" ngModelGroup="person">
          <input name="name" required [(ngModel)]="name" />
        </ng-template>
      </div>
    </form>
  `,
})
class GroupHost {
  readonly keys = ['name', 'done'];
  readonly name = signal('');
  readonly value = signal<string | null>(null);
  readonly stepperRef = viewChild.required<LiquidStepper<string>>('stepper');
}

describe('LiquidStepper', () => {
  let fixture: ComponentFixture<Host>;

  const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  const host = () => fixture.componentInstance;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** Pressed on whatever has focus, the way a real key would be. */
  const key = async (name: keyof typeof KEY_CODES) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: name });
    // The CDK key manager still reads `keyCode`, which browsers fill in and jsdom does not.
    Object.defineProperty(event, 'keyCode', { value: KEY_CODES[name] });
    (document.activeElement as HTMLElement).dispatchEvent(event);
    await settle();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  afterEach(() => vi.restoreAllMocks());

  it('is a tablist that starts on the first step, the only tab stop', () => {
    expect(q('x-liquid-stepper').getAttribute('role')).toBe('tablist');
    expect(host().value()).toBe('details');

    expect(q('#step-details').getAttribute('aria-selected')).toBe('true');
    expect(q('#step-details').getAttribute('aria-current')).toBe('step');
    expect(q('#step-details').getAttribute('tabindex')).toBe('0');
    for (const id of ['#step-documents', '#step-review', '#step-submit']) {
      expect(q(id).getAttribute('aria-selected')).toBe('false');
      expect(q(id).getAttribute('aria-current')).toBeNull();
      expect(q(id).getAttribute('tabindex')).toBe('-1');
    }
  });

  it('numbers the markers, and swaps the number for a check once a step is behind', async () => {
    expect(q('#step-submit .liquid-step-marker').textContent?.trim()).toBe('4');

    q('#step-review').click();
    await settle();

    expect(host().value()).toBe('review');
    expect(q('#step-details').classList.contains('is-complete')).toBe(true);
    expect(q('#step-documents').classList.contains('is-complete')).toBe(true);
    expect(q('#step-documents .liquid-step-check')).toBeTruthy();
    expect(q('#step-review').classList.contains('is-complete')).toBe(false);
    expect(q('#step-review .liquid-step-marker').textContent?.trim()).toBe('3');
  });

  it('shows a step’s own icon for its number, and its own done element for the check', async () => {
    const marker = (id: string) => q(`#step-${id} .liquid-step-marker`).textContent?.trim();
    expect(marker('documents')).toBe('★');
    expect(marker('review')).toBe('3');

    q('#step-review').click();
    await settle();

    // `details` brought a done element; `documents` did not, so it gets the default check.
    expect(marker('details')).toBe('✔');
    expect(q('#step-details .liquid-step-check')).toBeNull();
    expect(q('#step-documents .liquid-step-check')).toBeTruthy();
    expect(marker('documents')).toBe('');
  });

  it('draws as a pill when asked, and labels stay the text of the button', async () => {
    host().variant.set('pill');
    await settle();

    expect(q('x-liquid-stepper').classList.contains('is-pill')).toBe(true);
    expect(q('#step-review').textContent).toContain('review');
  });

  it('runs the pill from the first step when progress, and only in the pill', async () => {
    host().progress.set(true);
    await settle();
    expect(q('x-liquid-stepper').classList.contains('is-progress')).toBe(false);

    host().variant.set('pill');
    await settle();
    expect(q('x-liquid-stepper').classList.contains('is-progress')).toBe(true);
  });

  it('pins the end steps to the edges when flush', async () => {
    expect(q('x-liquid-stepper').classList.contains('is-flush')).toBe(false);

    host().flush.set(true);
    await settle();

    expect(q('x-liquid-stepper').classList.contains('is-flush')).toBe(true);
  });

  it('keeps a value the page bound, rather than starting on the first step', async () => {
    const bound = TestBed.createComponent(Host);
    bound.componentInstance.value.set('review');
    bound.detectChanges();
    await bound.whenStable();

    expect(bound.componentInstance.stepperRef().selectedIndex()).toBe(2);
  });

  it('shows only the selected step’s panel, and links the two both ways', async () => {
    expect(q('#panel-details').hidden).toBe(false);
    expect(q('#panel-documents').hidden).toBe(true);
    expect(q('#step-details').getAttribute('aria-controls')).toBe('panel-details');
    expect(q('#panel-details').getAttribute('role')).toBe('tabpanel');
    expect(q('#panel-details').getAttribute('aria-labelledby')).toBe('step-details');

    q('#step-documents').click();
    await settle();
    expect(q('#panel-details').hidden).toBe(true);
    expect(q('#panel-documents').hidden).toBe(false);
  });

  it('moves with next and previous, skipping a disabled step and stopping at the ends', async () => {
    const stepper = host().stepperRef();
    host().blocked.set('documents');
    await settle();

    expect(stepper.canPrevious()).toBe(false);
    expect(stepper.next()).toBe(true);
    await settle();
    expect(host().value()).toBe('review');

    expect(stepper.previous()).toBe(true);
    await settle();
    expect(host().value()).toBe('details');

    stepper.select('submit');
    await settle();
    expect(stepper.canNext()).toBe(false);
    expect(stepper.next()).toBe(false);
  });

  it('holds the stepper on a step that is not valid, and says which one', async () => {
    const stepper = host().stepperRef();
    host().invalid.set('details');
    await settle();

    expect(stepper.next()).toBe(false);
    q('#step-documents').click();
    await settle();
    expect(host().value()).toBe('details');
    expect(host().refusedBy()).toBe('details');

    // A jump over several steps is held by the first of them that is not valid.
    host().invalid.set('documents');
    stepper.select('documents');
    await settle();
    host().refusedBy.set(null);
    expect(stepper.select('submit')).toBe(false);
    expect(host().refusedBy()).toBe('documents');
  });

  it('lets go once the step is valid, and never holds going back', async () => {
    const stepper = host().stepperRef();
    host().invalid.set('details');
    await settle();
    expect(stepper.next()).toBe(false);

    host().invalid.set(null);
    await settle();
    expect(stepper.next()).toBe(true);
    await settle();
    expect(host().value()).toBe('documents');

    host().invalid.set('documents');
    await settle();
    expect(stepper.previous()).toBe(true);
    await settle();
    expect(host().value()).toBe('details');
  });

  it('labels a step by its text alone, not its marker', () => {
    const labelled = host().stepperRef().steps()[1];
    expect(labelled.getLabel()).toBe('documents');
  });

  it('says where it is for a Back or a Submit button', async () => {
    const stepper = host().stepperRef();
    expect([stepper.isFirst(), stepper.isLast()]).toEqual([true, false]);

    stepper.select('submit');
    await settle();
    expect([stepper.isFirst(), stepper.isLast()]).toEqual([false, true]);
  });

  it('refuses a step that is disabled or unknown', async () => {
    host().blocked.set('review');
    await settle();

    q('#step-review').click();
    await settle();
    expect(host().value()).toBe('details');
    expect(host().stepperRef().select('missing')).toBe(false);
  });

  it('when linear, leaves nothing past the next step within reach', async () => {
    host().linear.set(true);
    await settle();

    expect(q('#step-documents').getAttribute('aria-disabled')).toBeNull();
    expect(q('#step-review').getAttribute('aria-disabled')).toBe('true');

    q('#step-submit').click();
    await settle();
    expect(host().value()).toBe('details');

    host().stepperRef().next();
    await settle();
    expect(host().value()).toBe('documents');
    expect(q('#step-review').getAttribute('aria-disabled')).toBeNull();
    expect(q('#step-submit').getAttribute('aria-disabled')).toBe('true');
  });

  it('moves focus with the arrow keys and selects only on Enter or Space', async () => {
    q('#step-details').focus();
    await settle();

    await key('ArrowRight');
    expect(document.activeElement).toBe(q('#step-documents'));
    expect(host().value()).toBe('details');

    await key('Enter');
    expect(host().value()).toBe('documents');

    await key('End');
    await key(' ');
    expect(host().value()).toBe('submit');

    await key('Home');
    expect(document.activeElement).toBe(q('#step-details'));
  });

  it('follows the up and down keys when vertical', async () => {
    host().orientation.set('vertical');
    await settle();
    expect(q('x-liquid-stepper').classList.contains('is-vertical')).toBe(true);

    q('#step-details').focus();
    await settle();
    await key('ArrowDown');
    expect(document.activeElement).toBe(q('#step-documents'));
  });

  describe('the fill', () => {
    let animations: { frames: Keyframe[]; cancel: ReturnType<typeof vi.fn> }[];

    /** Marker centres, since jsdom computes no layout: the steps sit 100px apart. */
    const mockBoxes = () => {
      vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
        this: HTMLElement,
      ) {
        const index = ['step-details', 'step-documents', 'step-review', 'step-submit'].indexOf(
          this.id,
        );
        return Math.max(index, 0) * 100;
      });
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(0);
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(3);
    };

    beforeEach(() => {
      animations = [];
      Object.defineProperty(HTMLElement.prototype, 'animate', {
        configurable: true,
        value: function (frames: Keyframe[]) {
          const motion = { cancel: vi.fn(), finished: Promise.resolve(), playState: 'running' };
          animations.push({ frames, cancel: motion.cancel });
          return motion;
        },
      });
      mockBoxes();
    });

    afterEach(() => {
      delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    });

    it('fills up to the selected marker, and pours there from the one before', async () => {
      q('#step-review').click();
      await settle();

      const style = q('x-liquid-stepper').style;
      expect(style.getPropertyValue('--liquid-stepper-track-width')).toBe('300px');
      expect(style.getPropertyValue('--liquid-stepper-fill-width')).toBe('200px');
      // Centred on the markers' middle (1.5px down, in these boxes), a line's thickness across.
      expect(style.getPropertyValue('--liquid-stepper-fill-height')).toBe('3px');
      expect(style.getPropertyValue('--liquid-stepper-fill-y')).toBe('0px');
      expect(animations.length).toBeGreaterThan(0);
      expect(animations[animations.length - 1].frames.length).toBeGreaterThan(2);
    });

    it('puts the pill under the selected step’s own box', async () => {
      host().variant.set('pill');
      q('#step-review').click();
      await settle();

      const style = q('x-liquid-stepper').style;
      expect(style.getPropertyValue('--liquid-stepper-fill-x')).toBe('200px');
      expect(style.getPropertyValue('--liquid-stepper-fill-height')).toBe('3px');
    });

    it('lands in place, with no pour, when the same step is selected again', async () => {
      q('#step-review').click();
      await settle();
      const poured = animations.length;

      q('#step-review').click();
      await settle();
      expect(animations.length).toBe(poured);
    });
  });
});

describe('LiquidStepContent', () => {
  let fixture: ComponentFixture<ContentHost>;

  const q = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const pick = async (key: string) => {
    q(`#c-step-${key}`)!.click();
    await settle();
  };
  const built = () => ['a', 'b', 'c', 'd'].filter((key) => q(`#content-${key}`));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ContentHost] }).compileComponents();
    fixture = TestBed.createComponent(ContentHost);
    await settle();
  });

  it('builds only the selected step’s content, with its value, and swaps it on a switch', async () => {
    expect(built()).toEqual(['a']);
    expect(q('#content-a')?.textContent).toBe('a');

    await pick('c');
    expect(built()).toEqual(['c']);
  });

  it('is a shared panel, never hidden, labelled by the selected step', async () => {
    const panel = q('#shared')!;
    expect(panel.getAttribute('role')).toBe('tabpanel');
    expect(panel.hidden).toBe(false);
    expect(panel.getAttribute('aria-labelledby')).toBe(q('#c-step-a')!.id);
    expect(q('#c-step-a')!.getAttribute('aria-controls')).toBe('shared');

    await pick('b');
    expect(panel.getAttribute('aria-labelledby')).toBe(q('#c-step-b')!.id);
  });

  it('as a slider, keeps the contents either side of the selected one built', async () => {
    fixture.componentInstance.mode.set('slider');
    await settle();
    expect(q('#shared')!.classList.contains('is-slider')).toBe(true);
    expect(built()).toEqual(['a', 'b']);

    await pick('b');
    expect(built()).toEqual(['a', 'b', 'c']);

    await pick('d');
    expect(built()).toEqual(['c', 'd']);
  });
});

describe('LiquidStep control', () => {
  it('holds on an invalid reactive group, touching it, and lets go once it is valid', async () => {
    await TestBed.configureTestingModule({ imports: [ReactiveHost] }).compileComponents();
    const fixture = TestBed.createComponent(ReactiveHost);
    const host = fixture.componentInstance;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    };
    await settle();
    const blocked = vi.fn();
    host.stepperRef().blocked.subscribe(blocked);

    expect(host.stepperRef().next()).toBe(false);
    expect(host.value()).toBe('name');
    expect(host.form.controls.name.touched).toBe(true);
    expect(blocked).toHaveBeenCalledWith(
      expect.objectContaining({ element: fixture.nativeElement.querySelector('#f-step-name') }),
    );

    host.form.controls.name.setValue('Dara');
    expect(host.stepperRef().next()).toBe(true);
    await settle();
    expect(host.value()).toBe('email');

    // A step never visited is checked too: its group is there off screen.
    host.form.controls.email.disable();
    expect(host.stepperRef().next()).toBe(true);
    await settle();
    expect(host.value()).toBe('done');
  });

  it('holds on the form a step’s content was given, touching only that one', async () => {
    await TestBed.configureTestingModule({ imports: [SplitHost] }).compileComponents();
    const fixture = TestBed.createComponent(SplitHost);
    const host = fixture.componentInstance;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    };
    await settle();

    expect(host.stepperRef().next()).toBe(false);
    expect(host.nameForm.touched).toBe(true);
    expect(host.emailForm.touched).toBe(false);

    // The fields inside are the template's group's own.
    const field = fixture.nativeElement.querySelector('#split-name') as HTMLInputElement;
    field.value = 'Dara';
    field.dispatchEvent(new Event('input'));
    expect(host.nameForm.value).toEqual({ name: 'Dara' });
    expect(host.stepperRef().next()).toBe(true);
    await settle();
    expect(host.value()).toBe('email');

    expect(host.stepperRef().next()).toBe(false);
    host.emailForm.setValue({ email: 'dara@example.com' });
    expect(host.stepperRef().next()).toBe(true);
  });

  it('holds on an ngModelGroup on the step’s content', async () => {
    await TestBed.configureTestingModule({ imports: [GroupHost] }).compileComponents();
    const fixture = TestBed.createComponent(GroupHost);
    const host = fixture.componentInstance;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    await settle();
    const field = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(host.stepperRef().next()).toBe(false);
    await settle();
    expect(field().classList.contains('ng-touched')).toBe(true);

    host.name.set('Dara');
    await settle();
    expect(host.stepperRef().next()).toBe(true);
  });

  it('holds while a reactive group is still checking', async () => {
    await TestBed.configureTestingModule({ imports: [ReactiveHost] }).compileComponents();
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;

    host.form.controls.name.setValue('Dara');
    host.form.controls.name.markAsPending();
    expect(host.stepperRef().next()).toBe(false);
  });

  it('with ngForm, holds on the fields of the step on screen only', async () => {
    await TestBed.configureTestingModule({ imports: [DrivenHost] }).compileComponents();
    const fixture = TestBed.createComponent(DrivenHost);
    const host = fixture.componentInstance;
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    await settle();
    const field = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(host.stepperRef().next()).toBe(false);
    await settle();
    expect(field().classList.contains('ng-touched')).toBe(true);

    field().value = 'Dara';
    field().dispatchEvent(new Event('input'));
    await settle();
    expect(host.stepperRef().next()).toBe(true);
    await settle();
    expect(host.value()).toBe('email');
    expect(field().name).toBe('email');

    expect(host.stepperRef().next()).toBe(false);
    host.email.set('dara@example.com');
    await settle();
    expect(host.stepperRef().next()).toBe(true);
  });
});
