import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { LiquidToastTarget } from '@app/shared/components/liquid-toast/liquid-toast-target.directive';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import {
  ToastContext,
  ToastEdge,
  ToastPosition,
  ToastTimer,
  ToastType,
  toast,
} from '@app/shared/components/liquid-toast/toast';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';
import {
  TARGET_API,
  TOASTER_API,
  TOAST_BEHAVIOUR,
  TOAST_CALLS,
  TOAST_FIGURES,
  TOAST_FILES,
  TOAST_GAPS,
  TOAST_MOTION,
  TOAST_CSS,
  TOAST_OPTIONS,
} from './liquid-toast-docs.reference';

const EDGES: ToastEdge[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

/**
 * The documentation for the toast, ported from `.claude/demo/liquid-toast/`.
 *
 * That page runs off disk on a framework-free twin, which is what lets it open
 * with no build and what makes it drift. This one calls `toast()` itself, so
 * every button here is the real thing.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidPressable, LiquidToastTarget],
  selector: 'app-liquid-toast-docs',
  styleUrl: '../liquid-input-docs/liquid-input-docs.scss',
  templateUrl: './liquid-toast-docs.html',
})
export class LiquidToastDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly calls = TOAST_CALLS;
  protected readonly options = TOAST_OPTIONS;
  protected readonly toasterApi = TOASTER_API;
  protected readonly targetApi = TARGET_API;
  protected readonly cssApi = TOAST_CSS;
  protected readonly motion = TOAST_MOTION;
  protected readonly figures = TOAST_FIGURES;
  protected readonly behaviour = TOAST_BEHAVIOUR;
  protected readonly gaps = TOAST_GAPS;
  protected readonly files = TOAST_FILES;

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'setup', title: 'Setup' },
    { id: 'playground', title: 'Playground' },
    { id: 'examples', title: 'Examples' },
    { id: 'types', title: 'Types', nested: true },
    { id: 'description', title: 'Description', nested: true },
    { id: 'buttons', title: 'Action & cancel', nested: true },
    { id: 'update', title: 'Update in place', nested: true },
    { id: 'promise', title: 'Promise', nested: true },
    { id: 'persistent', title: 'No auto dismiss', nested: true },
    { id: 'overflow', title: 'Overflow ghost', nested: true },
    { id: 'countdown', title: 'Countdown pill', nested: true },
    { id: 'positions', title: 'Edge positions', nested: true },
    { id: 'target', title: 'From a target', nested: true },
    { id: 'custom', title: 'Custom content', nested: true },
    { id: 'callbacks', title: 'Callbacks', nested: true },
    { id: 'dismiss', title: 'Dismissing', nested: true },
    { id: 'api-toast', title: 'toast()' },
    { id: 'api-options', title: 'Options' },
    { id: 'api-toaster', title: 'Toaster' },
    { id: 'api-target', title: 'Target directive' },
    { id: 'api-css', title: 'CSS properties' },
    { id: 'motion', title: 'Motion' },
    { id: 'behaviour', title: 'Behaviour & a11y' },
    { id: 'files', title: 'Files' },
  ];

  protected readonly edges = EDGES;

  /** The toaster on this page, which every example lands in. */
  protected readonly play = {
    position: signal<ToastEdge>('top-center'),
    duration: signal(4000),
    visibleToasts: signal(3),
    timer: signal<ToastTimer>('off'),
    closeButton: signal(true),
    autoDismiss: signal(true),
    pauseOnHover: signal(true),
  };

  private readonly customCard = viewChild.required<TemplateRef<ToastContext>>('customCard');

  protected readonly log = signal('Nothing yet');

  /** The call that would make the toast the controls describe. */
  protected readonly markup = computed(() => {
    const lines = ["toast.success('However you have it set', {"];
    const option = (text: string) => lines.push(`  ${text},`);

    if (this.play.position() !== 'top-center') option(`position: '${this.play.position()}'`);
    if (this.play.duration() !== 4000) option(`duration: ${this.play.duration()}`);
    if (this.play.timer() !== 'off') option(`timer: '${this.play.timer()}'`);
    if (this.play.closeButton()) option('closeButton: true');
    if (!this.play.autoDismiss()) option('autoDismiss: false');
    lines.push('});');
    return lines.join('\n');
  });

  /**
   * Fires one the way the controls describe. Every one of these is a per-toast
   * option, so the page needs no toaster of its own — `visibleToasts` and
   * `pauseOnHover` are the toaster's, and are marked as such below.
   */
  protected tryIt(): void {
    toast.success('However you have it set', {
      description: `${this.play.position()} · ${this.play.duration()}ms · timer ${this.play.timer()}`,
      position: this.play.position(),
      duration: this.play.duration(),
      timer: this.play.timer(),
      closeButton: this.play.closeButton(),
      autoDismiss: this.play.autoDismiss(),
    });
  }

  protected readonly code = {
    setup: `import { toast } from '@app/shared/components/liquid-toast/toast';

// One toaster, anywhere the app is always mounted.
// <x-liquid-toaster position="top-center" closeButton />

toast.success('Saved', { description: 'Your draft is safe.' });`,

    promise: `toast.promise(save(), {
  loading: 'Saving…',
  success: (result) => \`Saved as \${result.name}\`,
  error: 'That did not save',
});`,

    target: `<!-- A toast can come out of the thing it is about. -->
<button liquidToastTarget="bell">Notifications</button>

toast('Two new messages', { position: { target: 'bell' } });`,
  };

  // ── The examples ───────────────────────────────────────────────────────────

  /**
   * Named rather than indexed: `toast` is a function with methods hung off it,
   * and the plain one is `toast.message` — there is no `toast.default`.
   */
  protected say(type: ToastType): void {
    switch (type) {
      case 'success':
        toast.success('Application submitted', { description: 'The ministry has it now.' });
        return;
      case 'info':
        toast.info('A new service is available');
        return;
      case 'warning':
        toast.warning('Your session expires in 5 minutes');
        return;
      case 'error':
        toast.error('That did not save', { description: 'Nothing was lost — try again.' });
        return;
      case 'loading':
        toast.loading('Submitting…');
        return;
      default:
        toast.message('Draft saved', { description: 'Every change is kept as you go.' });
    }
  }

  protected withButtons(): void {
    toast('Delete this draft?', {
      description: 'It cannot be brought back.',
      autoDismiss: false,
      action: { label: 'Delete', onClick: () => this.log.set('action: Delete') },
      cancel: { label: 'Keep', onClick: () => this.log.set('cancel: Keep') },
    });
  }

  private updating: string | number | null = null;

  protected update(): void {
    if (this.updating === null) {
      this.updating = toast.loading('Uploading the photo…');
      return;
    }
    toast.success('Photo uploaded', { id: this.updating, description: 'It passed every check.' });
    this.updating = null;
  }

  protected promise(): void {
    const work = new Promise<{ name: string }>((resolve, reject) => {
      setTimeout(() => (Math.random() > 0.35 ? resolve({ name: 'PP-2026-0041' }) : reject()), 1600);
    });
    toast.promise(work, {
      loading: 'Submitting the application…',
      success: (result: { name: string }) => `Submitted as ${result.name}`,
      error: 'The ministry did not accept it',
    });
  }

  /** A second, quieter line. Long text wraps, and the card is sized to it first. */
  protected described(): void {
    toast.success('Application submitted', {
      description:
        'The ministry has it. You will hear back within five working days, and the reference is on your applications list.',
    });
  }

  /**
   * Past `visibleToasts`, a ghost pill counts what is waiting behind the stack.
   *
   * Kept until dismissed, and fired close together, the way the demo does it:
   * the point of this case is the chain of motion — each arrival pushing the
   * oldest into the ghost while the ghost folds in under it — and at four
   * seconds apiece the stack unravels before it can be expanded at all.
   */
  protected overflow(): void {
    const titles = [
      'Draft saved',
      'Photo accepted',
      'Address checked',
      'Family details saved',
      'Documents attached',
      'Ready to submit',
    ];
    titles.forEach((title, at) =>
      setTimeout(() => toast(title, { autoDismiss: false }), at * 120),
    );
  }

  /**
   * The countdown pill, which is off until it is asked for. Long enough to be
   * hovered, left and hovered again — the pill turning around mid-gather is the
   * part worth seeing.
   */
  protected countdown(timer: 'hover' | 'always'): void {
    toast.info(timer === 'hover' ? 'Hover to see the time left' : 'Counting down in the open', {
      timer,
      duration: timer === 'hover' ? 10000 : 15000,
    });
  }

  /** One by id, and everything at once. */
  private announced: string | number | null = null;

  protected dismissOne(): void {
    if (this.announced === null) {
      this.announced = toast('This one has an id', {
        autoDismiss: false,
        description: 'Press again to dismiss just this toast.',
      });
      return;
    }
    toast.dismiss(this.announced);
    this.announced = null;
  }

  /** Interrupts a screen reader, for something that cannot wait. */
  protected important(): void {
    toast.error('Your session has ended', { important: true, autoDismiss: false });
  }

  protected persistent(): void {
    toast.warning('Your session expires in 5 minutes', {
      autoDismiss: false,
      description: 'Save your draft before it does.',
    });
  }

  protected at(position: ToastPosition): void {
    toast(typeof position === 'string' ? position : 'Out of the button below', { position });
  }

  /**
   * The same thing, kept until it is dismissed: a toast that sees itself out in
   * four seconds is hard to look at while reading about it.
   */
  protected fromTarget(): void {
    toast.info('Here, beside the button', {
      position: { target: 'bell' },
      autoDismiss: false,
      description: 'It grew out of the button and will gather back into it.',
    });
  }

  protected custom(): void {
    toast.custom(this.customCard());
  }

  protected callbacks(): void {
    toast('Watch the log below', {
      duration: 2500,
      onAutoClose: () => this.log.set('onAutoClose — its time ran out'),
      onDismiss: () => this.log.set('onDismiss — closed by hand'),
    });
  }

  protected dismissAll(): void {
    toast.dismiss();
  }

  /** The same jump the other page uses: a bare hash resolves against `<base>`. */
  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }

  protected set(key: keyof typeof this.play, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const control = this.play[key] as ReturnType<typeof signal<unknown>>;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      control.set(target.checked);
      return;
    }
    control.set(target.type === 'number' ? Number(target.value) : target.value);
  }
}
