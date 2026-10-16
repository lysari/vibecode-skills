import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LiquidInput } from '@app/shared/components/liquid-input/liquid-input';
import { LiquidStepContent } from '@app/shared/components/liquid-stepper/liquid-step-content.directive';
import { LiquidStep } from '@app/shared/components/liquid-stepper/liquid-step';
import { LiquidStepPanel } from '@app/shared/components/liquid-stepper/liquid-step-panel.directive';
import { LiquidStepper } from '@app/shared/components/liquid-stepper/liquid-stepper';
import {
  LiquidStepDone,
  LiquidStepIcon,
} from '@app/shared/components/liquid-stepper/liquid-step-glyph.directive';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  ionCheckmarkDone,
  ionDocumentTextOutline,
  ionPeopleOutline,
  ionPersonOutline,
  ionSendOutline,
} from '@ng-icons/ionicons';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';
import {
  CONTENT_API,
  PANEL_API,
  STEPPER_API,
  STEPPER_CLASSES,
  STEPPER_CSS,
  STEPPER_MEMBERS,
  STEPPER_PAINTS,
  STEPPER_PILL_CSS,
  STEPPER_TUNES,
  STEPPER_CONTENT,
  STEPPER_CUSTOM,
  STEPPER_FORMS,
  STEPPER_RULES,
  STEPPER_SETUP,
  STEP_API,
  STEP_SLOTS,
} from './liquid-stepper-docs.reference';

/** The documentation for `<x-liquid-stepper>`, on the real component. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    LiquidInput,
    LiquidPressable,
    LiquidStep,
    LiquidStepDone,
    LiquidStepContent,
    LiquidStepIcon,
    LiquidStepPanel,
    LiquidStepper,
    NgIcon,
    ReactiveFormsModule,
  ],
  providers: [
    provideIcons({
      ionCheckmarkDone,
      ionDocumentTextOutline,
      ionPeopleOutline,
      ionPersonOutline,
      ionSendOutline,
    }),
  ],
  selector: 'app-liquid-stepper-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-stepper-docs.scss'],
  templateUrl: './liquid-stepper-docs.html',
})
export class LiquidStepperDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly setup = STEPPER_SETUP;
  protected readonly custom = STEPPER_CUSTOM;
  protected readonly rules = STEPPER_RULES;
  protected readonly forms = STEPPER_FORMS;
  protected readonly stepperApi = STEPPER_API;
  protected readonly members = STEPPER_MEMBERS;
  protected readonly stepApi = STEP_API;
  protected readonly stepSlots = STEP_SLOTS;
  protected readonly panelApi = PANEL_API;
  protected readonly contentApi = CONTENT_API;
  protected readonly contentSetup = STEPPER_CONTENT;
  protected readonly classes = STEPPER_CLASSES;
  protected readonly cssApi = STEPPER_CSS;
  protected readonly pillCssApi = STEPPER_PILL_CSS;
  protected readonly tunes = STEPPER_TUNES;
  protected readonly paints = STEPPER_PAINTS;

  protected readonly steps = [
    { value: 'details', label: 'Details' },
    { value: 'documents', label: 'Documents' },
    { value: 'review', label: 'Review' },
    { value: 'submit', label: 'Submit' },
  ];
  protected readonly step = signal<string | null>(null);
  protected readonly linearStep = signal<string | null>(null);
  protected readonly blocked = signal(false);
  protected readonly ruledStep = signal<string | null>(null);
  protected readonly detailsDone = signal(false);
  protected readonly refusal = signal('');
  protected readonly dissolveStep = signal<string | null>(null);
  protected readonly sliderStep = signal<string | null>(null);
  protected readonly pillStep = signal<string | null>(null);
  protected readonly progressStep = signal<string | null>('review');
  protected readonly iconStep = signal<string | null>(null);
  protected readonly colourStep = signal<string | null>('review');

  protected readonly formSteps = [
    { value: 'details', label: 'Details' },
    { value: 'contact', label: 'Contact' },
    { value: 'review', label: 'Review' },
  ];
  protected readonly application = new FormGroup({
    details: new FormGroup({
      name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    }),
    contact: new FormGroup({
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
    }),
  });
  protected readonly reactiveStep = signal<string | null>(null);
  protected readonly detailsForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  protected readonly contactForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  protected readonly splitStep = signal<string | null>(null);
  protected readonly person = { name: signal(''), email: signal('') };
  protected readonly drivenStep = signal<string | null>(null);

  protected readonly play = {
    orientation: signal<'horizontal' | 'vertical'>('horizontal'),
    variant: signal<'line' | 'pill'>('line'),
    stretch: signal(false),
    flush: signal(false),
    progress: signal(false),
    linear: signal(false),
    disabled: signal(false),
    disabledStep: signal(''),
    heldStep: signal(''),
    painted: signal<Record<string, string>>({}),
    tuned: signal<Record<string, number>>({}),
  };
  protected readonly playStep = signal<string | null>(null);
  protected readonly playLog = signal('');
  protected readonly playLine = computed(() => [
    this.play.tuned()['--liquid-stepper-line-size'] ?? 3,
  ]);

  protected readonly playStyle = computed(() => {
    const style: Record<string, string> = {};
    for (const tune of this.tunes) {
      const value = this.play.tuned()[tune.name];
      if (value !== undefined) style[tune.name] = `${value}${tune.unit}`;
    }
    for (const [name, value] of Object.entries(this.play.painted())) {
      if (value.trim()) style[name] = value.trim();
    }
    return style;
  });

  protected readonly playMarkup = computed(() => {
    const play = this.play;
    const attrs = [
      play.orientation() === 'vertical' ? ' orientation="vertical"' : '',
      play.variant() === 'pill' ? ' variant="pill"' : '',
      play.stretch() ? ' stretch' : '',
      play.progress() ? ' progress' : '',
      play.flush() ? ' flush' : '',
      play.linear() ? ' linear' : '',
      play.disabled() ? ' disabled' : '',
    ].join('');
    const style = Object.entries(this.playStyle())
      .map(([name, value]) => `${name}: ${value}`)
      .join('; ');
    const steps = this.steps.map((item) => {
      const off = play.disabledStep() === item.value ? ' disabled' : '';
      const held = play.heldStep() === item.value ? ' [valid]="false"' : '';
      return `  <button type="button" liquidStep="${item.value}"${off}${held}>${item.label}</button>`;
    });
    return [
      `<x-liquid-stepper${attrs}`,
      ...(style ? [`  style="${style}"`] : []),
      `  [(value)]="step"`,
      `  (blocked)="onBlocked($event)"`,
      '>',
      ...steps,
      '</x-liquid-stepper>',
    ].join('\n');
  });

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'horizontal', title: 'Horizontal' },
    { id: 'linear', title: 'Linear' },
    { id: 'vertical', title: 'Vertical' },
    { id: 'rules', title: 'Rules' },
    { id: 'forms', title: 'Forms' },
    { id: 'content', title: 'Content' },
    { id: 'pill', title: 'Pill' },
    { id: 'icons', title: 'Icons' },
    { id: 'colour', title: 'Colour' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected setFlag(
    control: 'stretch' | 'progress' | 'flush' | 'linear' | 'disabled',
    event: Event,
  ): void {
    this.play[control].set((event.target as HTMLInputElement).checked);
  }

  protected setStep(control: 'disabledStep' | 'heldStep', event: Event): void {
    this.play[control].set((event.target as HTMLSelectElement).value);
  }

  protected setOrientation(event: Event): void {
    this.play.orientation.set(
      (event.target as HTMLSelectElement).value as 'horizontal' | 'vertical',
    );
  }

  protected setVariant(event: Event): void {
    this.play.variant.set((event.target as HTMLSelectElement).value as 'line' | 'pill');
  }

  protected setTune(name: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.play.tuned.update((tuned) => ({ ...tuned, [name]: value }));
  }

  protected setPaint(name: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.play.painted.update((painted) => ({ ...painted, [name]: value }));
  }

  protected resetStyle(): void {
    this.play.tuned.set({});
    this.play.painted.set({});
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}
