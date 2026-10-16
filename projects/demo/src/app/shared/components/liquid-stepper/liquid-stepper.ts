import { FocusKeyManager } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  Signal,
  ViewEncapsulation,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  type Box,
  animatedBox,
  animatedScale,
  cssLength,
  cssTime,
  offsetBox,
  pourKeyframes,
  prefersReducedMotion,
} from '@app/shared/utils/liquid-pour';
import type { AbstractControl } from '@angular/forms';
import { LiquidStep } from './liquid-step';
import type { LiquidStepContent } from './liquid-step-content.directive';
import { type LiquidSwitcher, switchDirection } from '../liquid-tabs/liquid-switcher';
import type { LiquidTabPanel } from '../liquid-tabs/liquid-tab-panel.directive';

export type LiquidStepperOrientation = 'horizontal' | 'vertical';

/**
 * - `line`: markers joined by a line that fills up to the selected step.
 * - `pill`: a segmented bar like `<x-liquid-tabs>`, a pill pouring under the selected step.
 */
export type LiquidStepperVariant = 'line' | 'pill';

/** Fallbacks for `--liquid-stepper-duration` (ms), `--liquid-stepper-pull` and `--liquid-stepper-line-size` (px). */
const DEFAULT_DURATION = 340;
const DEFAULT_PULL = 10;
const DEFAULT_LINE = 3;

/** A marker's centre, in the stepper's own coordinates. */
interface Point {
  x: number;
  y: number;
}

/**
 * A row of numbered steps joined by a line that fills — and pours, the way the
 * pill of `<x-liquid-tabs>` does — up to the step you are on. `variant="pill"`
 * draws it as a segmented bar instead, with a pill that pours under the step.
 *
 * ```html
 * <x-liquid-stepper #stepper="liquidStepper" aria-label="Application" [(value)]="step">
 *   <button type="button" liquidStep="details">Details</button>
 *   <button type="button" liquidStep="documents">Documents</button>
 *   <button type="button" liquidStep="review">Review</button>
 * </x-liquid-stepper>
 *
 * <section liquidStepPanel="details" [liquidStepPanelFor]="stepper">…</section>
 * <section liquidStepPanel="documents" [liquidStepPanelFor]="stepper">…</section>
 * <section liquidStepPanel="review" [liquidStepPanelFor]="stepper">…</section>
 *
 * <button type="button" (click)="stepper.previous()" [disabled]="!stepper.canPrevious()">Back</button>
 * <button type="button" (click)="stepper.next()" [disabled]="!stepper.canNext()">Next</button>
 * ```
 *
 * It starts on the first step while `value` is `null`. Steps before the selected
 * one read as complete. `next()` and `previous()` stop at the ends, and `isFirst`
 * and `isLast` say where you are for a Back or a Submit button.
 *
 * A step that says `[valid]="false"` holds the stepper where it is: nothing
 * — `next()`, a click, a key — moves on past it, and `(blocked)` fires with that
 * step so the page can show what is missing. `[control]` on a step, or on its
 * `liquidStepContent`, does the same from a form: it holds while invalid, and
 * is marked touched as it does, so its fields show their errors. Going back is never held. With
 * `linear`, a step further on than the next one cannot be reached at all.
 *
 * Arrow keys move focus; Enter or Space selects.
 *
 * Make a step's marker its own: `liquidStepIcon` on a child element replaces the
 * number, `liquidStepDone` the check. `--liquid-stepper-check-image` swaps the
 * check for every step at once, and `--liquid-stepper-color` set on a step
 * colours that step alone.
 *
 * Styles live in `--liquid-stepper-*` custom properties, settable on the element
 * or any ancestor: `color`, `fill-color` (the line's fill alone, a gradient too),
 * `check-color` (the check on a filled marker),
 * `background` (what the markers cover the line with), `track-color`,
 * `label-color`, `hover-label-color`, `selected-label-color`, `font-size`,
 * `gap` (between steps), `line-size`, `marker-size`, `marker-radius`,
 * `check-image`, `duration` (of a move, in ms), `pull` and `press-duration`. The
 * pill takes `pill-background`, `indicator-color`, `indicator-shadow`,
 * `marker-background`, `padding` and `radius` too.
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  exportAs: 'liquidStepper',
  host: {
    class: 'liquid-stepper',
    role: 'tablist',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[class.is-vertical]': "orientation() === 'vertical'",
    '[class.is-pill]': "variant() === 'pill'",
    '[class.is-stretched]': 'stretch()',
    '[class.is-flush]': 'flush()',
    '[class.is-progress]': "variant() === 'pill' && progress()",
    '[class.is-disabled]': 'disabled()',
    '(keydown)': 'onKeydown($event)',
  },
  selector: 'x-liquid-stepper',
  styleUrl: './liquid-stepper.scss',
  templateUrl: './liquid-stepper.html',
})
export class LiquidStepper<T = any> implements LiquidSwitcher<T> {
  /** The selected step's value, or `null` for none. Two-way: `[(value)]`. */
  readonly value = model<T | null>(null);
  readonly orientation = input<LiquidStepperOrientation>('horizontal');
  readonly variant = input<LiquidStepperVariant>('line');
  /** In the pill, the steps share the width equally and the bar fills its container. */
  readonly stretch = input(false, { transform: booleanAttribute });
  /**
   * In the horizontal line, the first and last markers sit on the stepper's edges, their
   * labels aligned to them, instead of centred in their share of the width.
   */
  readonly flush = input(false, { transform: booleanAttribute });
  /**
   * In the pill, the highlight runs from the first step to the selected one and grows or
   * shrinks to it, the way the line fills, instead of moving from step to step.
   */
  readonly progress = input(false, { transform: booleanAttribute });
  /** Steps further on than the next one cannot be reached. */
  readonly linear = input(false, { transform: booleanAttribute });
  /** Disables every step at once. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Fires, with the step that refused, when a move on is blocked because a step
   * it would leave is not `valid` — the moment to show what is missing.
   */
  readonly blocked = output<LiquidStep<T>>();

  /** Every step, in DOM order. */
  readonly steps = contentChildren<LiquidStep<T>>(LiquidStep, { descendants: true });
  /** {@link steps}, under the name the panels and contents follow a bar by. */
  readonly items = this.steps;

  // Typed out: steps read these back through their own signals, which TypeScript cannot infer around.
  readonly selectedStep: Signal<LiquidStep<T> | undefined> = computed(() => {
    const value = this.value();
    if (value === null) return undefined;
    return this.steps().find((step) => Object.is(step.boundValue(), value));
  });

  /** Where the selected step sits among {@link steps}; `-1` when none is selected. */
  readonly selectedIndex: Signal<number> = computed(() => {
    const step = this.selectedStep();
    return step ? this.steps().indexOf(step) : -1;
  });

  /** Which way the last switch went along the stepper. Step content drifts by it. */
  readonly direction: Signal<-1 | 0 | 1> = switchDirection(this.selectedIndex);

  readonly isFirst: Signal<boolean> = computed(() => this.selectedIndex() === 0);
  readonly isLast: Signal<boolean> = computed(
    () => this.selectedIndex() >= 0 && this.selectedIndex() === this.steps().length - 1,
  );

  readonly canNext: Signal<boolean> = computed(() => !!this.neighbour(1));
  readonly canPrevious: Signal<boolean> = computed(() => !!this.neighbour(-1));

  /** `ltr` or `rtl`: which way "later" points on a horizontal stepper. */
  readonly textDirection = inject(Directionality).value;

  /** The one step that Tab lands on: the selected step, or the first enabled one while none is. */
  readonly tabStop: Signal<LiquidStep<T> | null> = computed(
    () => this.selectedStep() ?? this.steps().find((step) => !step.disabled) ?? null,
  );

  /** Panels register themselves: they sit outside the stepper, wherever the page puts them. */
  private readonly panels = signal<readonly LiquidTabPanel<T>[]>([]);
  /** Contents register too, for the controls they hold their step to. */
  private readonly contents = signal<readonly LiquidStepContent<T>[]>([]);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly keyManager = new FocusKeyManager(this.steps, inject(Injector))
    .withWrap()
    .withHomeAndEnd();

  private readonly fill = viewChild.required<ElementRef<HTMLElement>>('fill');
  /** Which step the fill was last poured to, and its box there — where the next move starts. */
  private placed: { step: LiquidStep<T>; box: Box } | null = null;
  private motion: Animation | null = null;

  constructor() {
    effect(() => {
      const vertical = this.orientation() === 'vertical';
      this.keyManager
        .withVerticalOrientation(vertical)
        .withHorizontalOrientation(vertical ? null : this.textDirection);
    });

    // The steps of an `@for` are in the query a pass before Angular binds them,
    // so their values are tracked, not just their count.
    effect(() => {
      const steps = this.steps();
      const settled = steps.length > 0 && steps.every((step) => step.boundValue() !== undefined);
      if (!settled || untracked(this.value) !== null) return;
      untracked(() => {
        const first = steps.find((step) => !step.disabled);
        if (first) this.selectStep(first);
      });
    });

    afterRenderEffect(() => {
      // Tracked so a change of layout, or of the steps, puts the line back through the markers.
      this.orientation();
      this.variant();
      this.progress();
      this.steps();
      this.layout(this.selectedStep());
    });

    afterRenderEffect((onCleanup) => {
      const steps = this.steps();
      const Observer = this.document.defaultView?.ResizeObserver;
      if (!Observer) return;

      const observer = new Observer(() => this.layout(untracked(this.selectedStep)));
      observer.observe(this.host);
      for (const step of steps) observer.observe(step.element);
      onCleanup(() => observer.disconnect());
    });

    inject(DestroyRef).onDestroy(() => {
      this.motion?.cancel();
      this.keyManager.destroy();
    });
  }

  /** Selects the step holding `value`. Returns whether there was an enabled one to select. */
  select(value: T): boolean {
    const step = this.steps().find((candidate) => Object.is(candidate.boundValue(), value));
    return step ? this.selectStep(step) : false;
  }

  /** Moves on to the next enabled step. Returns whether there was one. */
  next(): boolean {
    const step = this.neighbour(1);
    return step ? this.selectStep(step) : false;
  }

  /** Goes back to the previous enabled step. Returns whether there was one. */
  previous(): boolean {
    const step = this.neighbour(-1);
    return step ? this.selectStep(step) : false;
  }

  /**
   * Selects `step`, unless it is disabled or a step on the way to it is not
   * `valid` — going back is always allowed. Returns whether it was selected.
   */
  selectStep(step: LiquidStep<T>): boolean {
    if (step.disabled) return false;

    const blocker = this.blockerBefore(step);
    if (blocker) {
      for (const control of this.controlsOf(blocker)) control.markAllAsTouched();
      this.blocked.emit(blocker);
      return false;
    }

    this.keyManager.updateActiveItem(step);
    if (!Object.is(this.value(), step.value())) this.value.set(step.value());
    return true;
  }

  /** Whether `linear` leaves `step` within reach: at most one past the selected step. */
  isReachable(step: LiquidStep<T>): boolean {
    return !this.linear() || this.steps().indexOf(step) <= this.selectedIndex() + 1;
  }

  /** Moves focus into the stepper, onto its tab stop. */
  focus(options?: FocusOptions): void {
    this.tabStop()?.focus(undefined, options);
  }

  /** Keeps the arrow keys moving on from a step that got focus by click or Tab. */
  syncActiveStep(step: LiquidStep<T>): void {
    if (this.keyManager.activeItem !== step) this.keyManager.updateActiveItem(step);
  }

  /** Adds a panel, and returns what takes it away again. */
  registerPanel(panel: LiquidTabPanel<T>): () => void {
    // Untracked: a panel registers from an effect.
    untracked(() => this.panels.update((list) => [...list, panel]));
    return () =>
      untracked(() => this.panels.update((list) => list.filter((entry) => entry !== panel)));
  }

  /** Adds a content, and returns what takes it away again. */
  registerContent(content: LiquidStepContent<T>): () => void {
    // Untracked: a content registers from an effect.
    untracked(() => this.contents.update((list) => [...list, content]));
    return () =>
      untracked(() => this.contents.update((list) => list.filter((entry) => entry !== content)));
  }

  /** The id of the panel `step` controls: its own, or else the shared one. */
  panelIdFor(step: LiquidStep<T>): string | null {
    const panels = this.panels();
    const own = panels.find(
      (panel) => panel.value() !== undefined && Object.is(panel.value(), step.boundValue()),
    );
    return (own ?? panels.find((panel) => panel.value() === undefined))?.id() ?? null;
  }

  /** The id of the step `panel` is labelled by: its own step, or for a shared panel the selected one. */
  tabIdFor(panel: LiquidTabPanel<T>): string | null {
    const value = panel.value();
    const step =
      value === undefined
        ? this.selectedStep()
        : this.steps().find((candidate) => Object.is(candidate.boundValue(), value));
    return step?.id() ?? null;
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = this.steps().find((candidate) => candidate.element === event.target);
    if (!step) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectStep(step);
      return;
    }
    this.keyManager.onKeydown(event);
  }

  /** The first step, from the selected one up to `target`, that holds the stepper. */
  private blockerBefore(target: LiquidStep<T>): LiquidStep<T> | undefined {
    const from = this.selectedIndex();
    const to = this.steps().indexOf(target);
    if (from < 0 || to <= from) return undefined;
    return this.steps()
      .slice(from, to)
      .find((step) => this.holds(step));
  }

  /**
   * Whether the stepper may not move on past `step`. Controls are read when
   * asked, not tracked: a form's status says nothing to signals.
   */
  private holds(step: LiquidStep<T>): boolean {
    return (
      step.valid() === false ||
      this.controlsOf(step).some(
        (control) => control.status === 'INVALID' || control.status === 'PENDING',
      )
    );
  }

  /** The form controls `step` answers for: its own, and those of the contents it builds. */
  private controlsOf(step: LiquidStep<T>): AbstractControl[] {
    const value = step.boundValue();
    return [
      step.control(),
      ...this.contents()
        .filter((content) => Object.is(content.value(), value))
        .map((content) => content.control()),
    ].filter((control) => !!control);
  }

  /** The nearest enabled step on either side of the selected one. */
  private neighbour(direction: 1 | -1): LiquidStep<T> | undefined {
    const index = this.selectedIndex();
    if (index < 0) return undefined;

    const steps = this.steps();
    for (let i = index + direction; i >= 0 && i < steps.length; i += direction) {
      if (!steps[i].disabled) return steps[i];
    }
    return undefined;
  }

  /**
   * Lays the fill — in the line variant from the first marker's centre to
   * `step`'s, in the pill under `step` itself, or from the first step through
   * `step` when `progress` is on — in layout offsets, so a scaling
   * popup around the stepper does not skew it, and pours it over when it is
   * moving to another step. The custom properties always hold the resting box;
   * the motion plays on top.
   */
  private layout(step: LiquidStep<T> | undefined): void {
    const steps = this.steps();
    const first = steps[0]?.center();
    const last = steps[steps.length - 1]?.center();
    if (!first || !last) return;

    const vertical = this.orientation() === 'vertical';
    const pill = this.variant() === 'pill';
    const thickness = cssLength(
      this.document.defaultView,
      this.host,
      '--liquid-stepper-line-size',
      DEFAULT_LINE,
    );

    const track = line(first, last, thickness, vertical);
    const to = pill
      ? step
        ? this.progress()
          ? span(offsetBox(steps[0].element), offsetBox(step.element))
          : offsetBox(step.element)
        : { x: 0, y: 0, width: 0, height: 0 }
      : line(first, step?.center() ?? first, thickness, vertical);
    // Only a change of step moves the fill; the same step resizing just lands in place.
    const from =
      this.placed && step && this.placed.step !== step ? this.currentBox(this.placed.box) : null;
    this.placed = step ? { step, box: to } : null;

    const style = this.host.style;
    for (const [name, box] of [
      ['track', track],
      ['fill', to],
    ] as const) {
      style.setProperty(`--liquid-stepper-${name}-x`, `${box.x}px`);
      style.setProperty(`--liquid-stepper-${name}-y`, `${box.y}px`);
      style.setProperty(`--liquid-stepper-${name}-width`, `${box.width}px`);
      style.setProperty(`--liquid-stepper-${name}-height`, `${box.height}px`);
    }

    if (from) this.pour(from, to);

    // Markers only transition once the first layout has settled, not in from nothing.
    if (!this.host.classList.contains('is-ready')) {
      this.document.defaultView?.requestAnimationFrame(() => this.host.classList.add('is-ready'));
    }
  }

  private pour(from: Box, to: Box): void {
    const fill = this.fill().nativeElement;
    const view = this.document.defaultView;
    // Read before the cancel, which puts the fill back to its resting scale in a frame.
    const live = animatedScale(fill, view);
    const fromScale = live[0] !== 1 || live[1] !== 1 ? live : undefined;

    this.motion?.cancel();
    this.motion = null;

    if (!view || typeof fill.animate !== 'function') return;
    if (prefersReducedMotion(view)) return;

    const keyframes = pourKeyframes(from, to, {
      axis: this.orientation() === 'vertical' ? 'y' : 'x',
      pull: cssLength(view, this.host, '--liquid-stepper-pull', DEFAULT_PULL),
      fromScale,
    });
    if (!keyframes) return;

    this.motion = fill.animate(keyframes, {
      duration: cssTime(view, this.host, '--liquid-stepper-duration', DEFAULT_DURATION),
    });
  }

  /** The fill's box right now: mid-move, wherever the motion has it, so a quick second switch flows on. */
  private currentBox(resting: Box): Box {
    if (this.motion?.playState !== 'running') return resting;
    return animatedBox(this.fill().nativeElement, resting, this.document.defaultView);
  }
}

/** The smallest box holding both `a` and `b`. */
function span(a: Box, b: Box): Box {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/** The box of a line between two marker centres, `thickness` across and centred on them. */
function line(from: Point, to: Point, thickness: number, vertical: boolean): Box {
  const half = thickness / 2;
  return vertical
    ? {
        x: from.x - half,
        y: Math.min(from.y, to.y),
        width: thickness,
        height: Math.abs(to.y - from.y),
      }
    : {
        x: Math.min(from.x, to.x),
        y: from.y - half,
        width: Math.abs(to.x - from.x),
        height: thickness,
      };
}
