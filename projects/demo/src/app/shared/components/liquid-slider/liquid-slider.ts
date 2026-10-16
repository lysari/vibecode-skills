import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ionAlertCircleOutline } from '@ng-icons/ionicons';
import { NumberSlotDirective } from '@app/shared/directives/animations.directive';
import { cssNumber, cssTime, prefersReducedMotion } from '@app/shared/utils/liquid-pour';
import { LiquidPress } from '@app/shared/utils/liquid-press';
import {
  Spring,
  SpringState,
  settlingSpring,
  springAtRest,
  springTo,
} from '@app/shared/utils/liquid-spring';

/** Settling into a value overshoots by ~3% of the distance, so a long jump swings and a key step barely does. */
const SETTLE_DAMPING = 0.75;
const SETTLE_DURATION = 340;
/** Critically damped and ~7ms behind the finger: reads as held, yet a flick still decelerates into place. */
const TRACK: Spring = { stiffness: 20000, damping: 1 };
/** Under-damped, so a stretched field gives back past its own length before it settles. */
const UNSTRETCH: Spring = { stiffness: 520, damping: 0.42 };
/** The most the field stretches past either end, in px, however far the finger goes. */
const REACH = 14;
const THINNING = 1.6;
const DRAG_SLOP = 3;
/** Room left around the label and the number: the handle may come close (px), a dot keeps a third of the field's height. */
const HANDLE_CLEARANCE = 6;
const TICK_CLEARANCE_SHARE = 1 / 3;
const PRESS_DEPTH = 0.2;
const PRESS_DURATION_PROPERTY = '--liquid-slider-press-duration';
const LONGEST_FRAME = 0.064;

interface Drag {
  startX: number;
  startValue: number;
  moved: boolean;
}

interface Layout {
  start: number;
  travel: number;
  height: number;
  label: readonly [number, number];
  value: readonly [number, number];
}

/** When the handle shows: `auto` steps aside while it is under the label or the number, `on` always, `off` never. */
export type LiquidSliderHandle = 'auto' | 'on' | 'off';

let sliderUid = 0;

function decimalsOf(step: number): number {
  const text = String(step);
  const dot = text.indexOf('.');
  return dot < 0 ? 0 : text.length - dot - 1;
}

function isNear(x: number, [from, to]: readonly [number, number], clearance: number): boolean {
  return x > from - clearance && x < to + clearance;
}

function rubberBand(over: number): number {
  return REACH * (1 - 1 / ((over * 0.55) / REACH + 1));
}

/**
 * A number chosen by dragging across a field, with the label and the value
 * written inside it. The fill is driven by a spring rather than a keyframe run
 * because its target keeps moving while a finger is down: a spring takes a new
 * target with the position and speed it already has, so a drag, a click and a
 * key can interrupt each other without a step.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'liquidSlider',
  host: {
    class: 'liquid-slider',
    '[class.is-focused]': 'hasFocus()',
    '[class.is-dragging]': 'isDragging()',
    '[class.is-disabled]': 'isDisabled()',
    '[class.is-invalid]': 'hasError()',
    '[class.is-handle-off]': "handle() === 'off'",
    '[style.--_ratio]': 'ratio()',
  },
  imports: [NgIcon, NumberSlotDirective],
  providers: [
    provideIcons({ ionAlertCircleOutline }),
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LiquidSlider), multi: true },
  ],
  selector: 'x-liquid-slider',
  styleUrl: './liquid-slider.scss',
  templateUrl: './liquid-slider.html',
})
export class LiquidSlider implements ControlValueAccessor {
  readonly value = model<number | null>(null);

  readonly label = input.required<string>();
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });
  readonly ticks = input(false, { transform: booleanAttribute });
  readonly handle = input<LiquidSliderHandle>('auto');

  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly inputId = input(`liquid-slider-${++sliderUid}`);
  readonly name = input<string | null>(null);

  private readonly press = viewChild.required<ElementRef<HTMLElement>>('press');
  private readonly field = viewChild.required<ElementRef<HTMLElement>>('field');
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly labelText = viewChild.required<ElementRef<HTMLElement>>('labelText');
  private readonly output = viewChild.required<ElementRef<HTMLElement>>('output');
  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly view = this.host.ownerDocument.defaultView;

  protected readonly hasFocus = signal(false);
  protected readonly isDragging = signal(false);
  private readonly formDisabled = signal(false);
  private readonly layout = signal<Layout>({ start: 0, travel: 0, height: 0, label: [0, 0], value: [0, 0] });

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly hasError = computed(() => this.invalid() || this.error() !== null);

  private readonly decimals = computed(() => decimalsOf(this.step()));

  protected readonly current = computed(() => this.snap(this.value() ?? this.min()));

  protected readonly ratio = computed(() => this.ratioOf(this.current()));

  protected readonly text = computed(() => this.current().toFixed(this.decimals()));

  /** A dot only shows where nothing is written: those under the label or the number are left out. */
  protected readonly tickList = computed(() => {
    if (!this.ticks()) return [];
    const count = Math.round((this.max() - this.min()) / this.step());
    const { start, travel, height, label, value } = this.layout();
    const clearance = height * TICK_CLEARANCE_SHARE;
    return Array.from({ length: Math.max(0, count - 1) }, (_, index) => {
      const at = (index + 1) / count;
      const x = start + travel * at;
      return { at, hidden: isNear(x, label, clearance) || isNear(x, value, clearance) };
    });
  });

  protected readonly hintId = computed(() => `${this.inputId()}-hint`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly describedBy = computed(() =>
    this.error() ? this.errorId() : this.hint() ? this.hintId() : null,
  );

  private fill: SpringState = { position: 0, velocity: 0 };
  private stretch: SpringState = { position: 0, velocity: 0 };
  private target = 0;
  private stretchTarget = 0;
  private side = 1;
  private tracking = false;
  private drag: Drag | null = null;
  private frame = 0;
  private lastFrame = 0;
  private hasPainted = false;
  private pressed: LiquidPress | null = null;

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      if (this.frame) this.view?.cancelAnimationFrame(this.frame);
      this.pressed?.cancel();
    });

    effect(() => {
      const ratio = this.ratio();
      untracked(() => this.moveTo(ratio));
    });

    effect(() => {
      this.handle();
      untracked(() => this.clearHandle(this.frame ? this.fill.position : this.ratio()));
    });

    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const resize = new ResizeObserver(() => this.measure());
      resize.observe(this.field().nativeElement);
      resize.observe(this.track().nativeElement);
      resize.observe(this.labelText().nativeElement);
      resize.observe(this.output().nativeElement);
      destroyRef.onDestroy(() => resize.disconnect());
    });
  }

  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  protected onKey(control: HTMLInputElement): void {
    this.commit(control.valueAsNumber);
  }

  protected onFocus(): void {
    this.hasFocus.set(this.control().nativeElement.matches(':focus-visible'));
  }

  protected onBlur(): void {
    this.hasFocus.set(false);
    this.onTouched();
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.isDisabled() || event.button !== 0) return;
    event.preventDefault();
    this.focus({ preventScroll: true });
    this.field().nativeElement.setPointerCapture?.(event.pointerId);
    this.drag = { startX: event.clientX, startValue: this.current(), moved: false };
    this.isDragging.set(true);
    this.presser()?.press();
    this.tracking = false;
    this.follow(event.clientX);
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag) return;
    if (!drag.moved && Math.abs(event.clientX - drag.startX) < DRAG_SLOP) return;
    drag.moved = true;
    this.tracking = true;
    this.follow(event.clientX);
  }

  protected letGo(cancelled: boolean): void {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    this.isDragging.set(false);
    this.pressed?.release();
    if (cancelled) this.commit(drag.startValue);
    this.onTouched();
    this.stretchTarget = 0;
    this.tracking = false;
    this.target = this.ratio();
    this.run();
  }

  /**
   * Measured off the host, which nothing scales — the field is wearing the press
   * and the stretch — plus the track's layout offsets, which a scale leaves alone.
   */
  private follow(clientX: number): void {
    const box = this.host.getBoundingClientRect();
    const track = this.track().nativeElement;
    const travel = track.offsetWidth;
    const raw = travel > 0 ? (clientX - box.left - track.offsetLeft) / travel : 0;
    const over = raw < 0 ? -raw * travel : raw > 1 ? (raw - 1) * travel : 0;
    if (over > 0) this.side = raw < 0 ? -1 : 1;
    this.stretchTarget = this.drag?.moved ? rubberBand(over) : 0;
    this.commit(this.min() + raw * (this.max() - this.min()));
    this.target = Math.min(1, Math.max(0, raw));
    this.run();
  }

  private moveTo(ratio: number): void {
    if (this.drag) return;
    this.target = ratio;
    if (!this.hasPainted) {
      this.fill = { position: ratio, velocity: 0 };
      return;
    }
    this.tracking = false;
    this.run();
  }

  private run(): void {
    const view = this.view;
    if (!view || prefersReducedMotion(view)) {
      this.paint(true);
      return;
    }
    if (this.frame) return;
    // The resting `--_ratio` already holds the new value; without this the
    // fill shows there for a frame before the spring takes it back.
    this.paint(false);
    this.lastFrame = view.performance.now();
    const tick = (now: number) => {
      const seconds = Math.min(LONGEST_FRAME, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      springTo(this.fill, this.target, this.tracking ? TRACK : this.settleSpring(view), seconds);
      springTo(this.stretch, this.stretchTarget, this.drag ? TRACK : UNSTRETCH, seconds);
      const settled =
        !this.drag &&
        springAtRest(this.fill, this.target) &&
        springAtRest(this.stretch, this.stretchTarget);
      this.paint(settled);
      this.frame = settled ? 0 : view.requestAnimationFrame(tick);
    };
    this.frame = view.requestAnimationFrame(tick);
  }

  /** At rest every inline value comes off, and the CSS holds the state again. */
  private paint(settled: boolean): void {
    const field = this.field().nativeElement;
    const press = this.press().nativeElement;
    this.clearHandle(settled ? this.target : this.fill.position);
    if (settled) {
      this.fill = { position: this.target, velocity: 0 };
      this.stretch = { position: 0, velocity: 0 };
      field.style.removeProperty('--_shown');
      press.style.removeProperty('scale');
      press.style.removeProperty('transform-origin');
      return;
    }
    field.style.setProperty('--_shown', this.fill.position.toFixed(5));
    const grow = this.stretch.position / (press.offsetWidth || 1);
    press.style.transformOrigin = this.side > 0 ? 'left center' : 'right center';
    press.style.scale = `${(1 + grow).toFixed(5)} ${(1 - grow * THINNING).toFixed(5)}`;
  }

  /** In `auto`, the handle stands aside for the text it would otherwise be drawn through. */
  private clearHandle(ratio: number): void {
    const { start, travel, label, value } = this.layout();
    const x = start + travel * ratio;
    const overText = isNear(x, label, HANDLE_CLEARANCE) || isNear(x, value, HANDLE_CLEARANCE);
    this.host.classList.toggle('is-handle-hidden', this.handle() === 'auto' && travel > 0 && overText);
  }

  private measure(): void {
    const field = this.field().nativeElement;
    const track = this.track().nativeElement;
    const label = this.labelText().nativeElement;
    const output = this.output().nativeElement;
    this.layout.set({
      start: track.offsetLeft,
      travel: track.offsetWidth,
      height: field.clientHeight,
      label: [label.offsetLeft, label.offsetLeft + label.offsetWidth],
      value: [output.offsetLeft, output.offsetLeft + output.offsetWidth],
    });
    this.hasPainted = true;
    if (!this.frame) this.clearHandle(this.ratio());
  }

  private settleSpring(view: Window): Spring {
    const duration = cssTime(view, this.host, '--liquid-slider-settle-duration', SETTLE_DURATION);
    return settlingSpring(duration, SETTLE_DAMPING);
  }

  private presser(): LiquidPress | null {
    const element = this.press().nativeElement;
    if (!this.view) return null;
    this.pressed ??= new LiquidPress(
      element,
      element.ownerDocument,
      PRESS_DURATION_PROPERTY,
      cssNumber(this.view, element, '--liquid-slider-press-depth', PRESS_DEPTH),
    );
    return this.pressed;
  }

  private ratioOf(value: number): number {
    const span = this.max() - this.min();
    return span > 0 ? (value - this.min()) / span : 0;
  }

  private snap(value: number): number {
    const step = this.step() > 0 ? this.step() : 1;
    const steps = Math.round((value - this.min()) / step);
    const snapped = Math.min(this.max(), Math.max(this.min(), this.min() + steps * step));
    return +snapped.toFixed(this.decimals());
  }

  private commit(value: number): void {
    const next = this.snap(value);
    if (next === this.value()) return;
    this.value.set(next);
    this.onChange(next);
  }

  writeValue(value: number | null | undefined): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
