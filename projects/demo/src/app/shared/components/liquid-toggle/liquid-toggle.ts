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
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ionAlertCircleOutline, ionCheckmark, ionRemove } from '@ng-icons/ionicons';
import {
  Box,
  animatedBox,
  animatedScale,
  cssLength,
  cssNumber,
  cssTime,
  pourKeyframes,
  prefersReducedMotion,
} from '@app/shared/utils/liquid-pour';
import { LiquidPress } from '@app/shared/utils/liquid-press';

const DURATION = 340;
const REACH = 10;
const PRESS_DEPTH = 0.45;
const PRESS_DURATION = '--liquid-toggle-press-duration';
/** The pour's reach and settle, for the track fill. A fill resting at width 0 cannot use `pourKeyframes`. */
const REACH_EASE = 'cubic-bezier(0.2, 0, 0.4, 1)';
const SURGE_EASE = 'cubic-bezier(0.55, 0, 0.25, 1)';
const SETTLE_EASE = 'cubic-bezier(0.25, 0, 0.3, 1.2)';
/** A close that crossed through 0 would be clamped and stop dead, so it decelerates into the edge instead. */
const CLOSE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

let toggleUid = 0;

interface Ends {
  thumbOff: Box;
  thumbOn: Box;
  /** Left-edge fill: collapsed, then the full track. Width only — height is the track. */
  trackOff: Box;
  trackOn: Box;
  /** Thumb fill while off: the thumb's box, shrunk by `--bias` so it stays hidden behind the thumb. */
  behindOff: Box;
}

/**
 * The on-color growing from the track's left edge. `pourKeyframes` sizes its
 * reach from the box it leaves, and a fill that rests at 0 has nothing to reach
 * from: the open snaps, and the close overshoots through a negative width.
 */
function fillFrames(from: number, to: number, pull: number): Keyframe[] {
  if (to <= from) {
    return [
      { width: `${from}px`, easing: CLOSE_EASE },
      { width: `${to}px` },
    ];
  }
  const reach = Math.min(pull, (to - from) * 0.35);
  return [
    { offset: 0, width: `${from}px`, easing: REACH_EASE },
    { offset: 0.14, width: `${from + reach}px`, easing: SURGE_EASE },
    { offset: 0.5, width: `${to + reach * 0.35}px`, easing: SETTLE_EASE },
    { offset: 1, width: `${to}px`, easing: 'linear' },
  ];
}

/**
 * A boolean chosen by sliding a thumb across a pill. The thumb pours; the
 * on-color fills the track from its left edge. `fill="thumb"` pours that color
 * out of the thumb's own box instead, from behind the thumb. The track under
 * the finger presses. The thumb stays a sibling of that press so the two never
 * share `scale`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'liquidToggle',
  host: {
    class: 'liquid-toggle',
    '[class.is-on]': 'value()',
    '[class.is-fill-thumb]': 'fill() === "thumb"',
    '[class.is-focused]': 'hasFocus()',
    '[class.is-disabled]': 'isDisabled()',
    '[class.is-invalid]': 'hasError()',
  },
  imports: [NgIcon],
  providers: [
    provideIcons({ ionAlertCircleOutline, ionCheckmark, ionRemove }),
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LiquidToggle), multi: true },
  ],
  selector: 'x-liquid-toggle',
  styleUrl: './liquid-toggle.scss',
  templateUrl: './liquid-toggle.html',
})
export class LiquidToggle implements ControlValueAccessor {
  readonly value = model(false);

  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input(`liquid-toggle-${++toggleUid}`);
  readonly name = input<string | null>(null);
  /** `track` grows from the left edge. `thumb` grows out from behind the thumb. */
  readonly fill = input<'track' | 'thumb'>('track');
  readonly io = input(false, { transform: booleanAttribute });
  /** A check on the thumb while on, a dash while off. */
  readonly icons = input(false, { transform: booleanAttribute });

  private readonly press = viewChild.required<ElementRef<HTMLElement>>('press');
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly ink = viewChild.required<ElementRef<HTMLElement>>('fill');
  private readonly thumb = viewChild.required<ElementRef<HTMLElement>>('thumb');
  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly view = this.host.ownerDocument.defaultView;

  protected readonly hasFocus = signal(false);
  private readonly formDisabled = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly hasError = computed(() => this.invalid() || this.error() !== null);
  protected readonly hintId = computed(() => `${this.inputId()}-hint`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly describedBy = computed(() =>
    this.error() ? this.errorId() : this.hint() ? this.hintId() : null,
  );

  private thumbAt: Box | null = null;
  private fillAt: Box | null = null;
  private placed = false;
  private thumbMotion: Animation | null = null;
  private fillMotion: Animation | null = null;
  private pressed: LiquidPress | null = null;

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      untracked(() => this.travel(this.value(), this.fill() === 'thumb'));
    });

    effect(() => {
      const on = this.value();
      const behind = this.fill() === 'thumb';
      if (!this.track()) return;
      untracked(() => this.travel(on, behind));
    });

    destroyRef.onDestroy(() => {
      this.thumbMotion?.cancel();
      this.fillMotion?.cancel();
      this.pressed?.cancel();
    });
  }

  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  protected onSwitchClick(event: MouseEvent): void {
    if (this.isDisabled() || event.button !== 0) return;
    event.preventDefault();
    const next = !this.value();
    this.control().nativeElement.checked = next;
    this.value.set(next);
    this.onChange(next);
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
    // Capturing the pointer retargets the click onto this box, and the checkbox
    // never receives it, so the switch would focus and stay where it was.
    this.presser()?.press();
  }

  protected onPointerUp(): void {
    this.pressed?.release();
  }

  private travel(on: boolean, behind: boolean): void {
    const ends = this.measure();
    if (!ends) return;

    const thumbTo = on ? ends.thumbOn : ends.thumbOff;
    // Thumb fill rests on the thumb only while off. On, it is the whole track,
    // same as the left-edge fill — sending it to the thumb's box snaps it there.
    const fillTo = on ? ends.trackOn : behind ? ends.behindOff : ends.trackOff;
    const thumbFrom = this.liveThumb(this.thumbAt ?? thumbTo);
    const fillFrom = this.liveFill(this.fillAt ?? fillTo);
    const animate = this.placed;

    this.thumbAt = thumbTo;
    this.fillAt = fillTo;
    this.placed = true;
    if (!animate) return;

    this.playThumb(thumbFrom, thumbTo);
    this.playFill(fillFrom, fillTo, behind);
  }

  private measure(): Ends | null {
    const track = this.track()?.nativeElement;
    if (!track) return null;
    const width = track.offsetWidth;
    const height = track.offsetHeight;
    if (width === 0 || height === 0) return null;

    const inset = height * 0.125;
    const size = height - inset * 2;
    const off = inset;
    const on = width - inset - size;
    const thumb = (x: number): Box => ({ x, y: inset, width: size, height: size });
    const edge = (span: number): Box => ({ x: 0, y: 0, width: span, height });
    // `--bias: 20%` is the track's own size on width and height, then the fill's
    // own size on translate. The pour has to land on that same box.
    const bias = 0.2;
    const fillWidth = Math.max(0, size - width * bias);
    const fillHeight = Math.max(0, size - height * bias);
    return {
      thumbOff: thumb(off),
      thumbOn: thumb(on),
      trackOff: edge(0),
      trackOn: edge(width),
      behindOff: {
        x: inset + fillWidth * bias,
        y: inset + fillHeight * bias,
        width: fillWidth,
        height: fillHeight,
      },
    };
  }

  private liveThumb(resting: Box): Box {
    if (this.thumbMotion?.playState !== 'running') return resting;
    return animatedBox(this.thumb().nativeElement, resting, this.view);
  }

  private liveFill(resting: Box): Box {
    if (this.fillMotion?.playState !== 'running') return resting;
    return animatedBox(this.ink().nativeElement, resting, this.view);
  }

  private playThumb(from: Box, to: Box): void {
    const element = this.thumb().nativeElement;
    const view = this.view;
    const live = animatedScale(element, view);
    const fromScale = live[0] !== 1 || live[1] !== 1 ? live : undefined;
    this.thumbMotion?.cancel();
    this.thumbMotion = null;
    if (!view || prefersReducedMotion(view)) return;

    const keyframes = pourKeyframes(from, to, {
      axis: 'x',
      pull: cssLength(view, this.host, '--liquid-toggle-reach', REACH),
      fromScale,
    });
    if (!keyframes) return;

    this.thumbMotion = element.animate(keyframes, {
      duration: cssTime(view, this.host, '--liquid-toggle-duration', DURATION),
    });
  }

  private playFill(from: Box, to: Box, behind: boolean): void {
    const element = this.ink().nativeElement;
    const view = this.view;
    const live = animatedScale(element, view);
    const fromScale = live[0] !== 1 || live[1] !== 1 ? live : undefined;
    this.fillMotion?.cancel();
    this.fillMotion = null;
    if (!view || prefersReducedMotion(view)) return;

    const pull = cssLength(view, this.host, '--liquid-toggle-reach', REACH);
    const keyframes = behind
      ? pourKeyframes(from, to, { axis: 'x', pull, fromScale })
      : from.width === to.width
        ? null
        : fillFrames(from.width, to.width, pull);
    if (!keyframes) return;

    this.fillMotion = element.animate(keyframes, {
      duration: cssTime(view, this.host, '--liquid-toggle-duration', DURATION),
    });
  }

  private presser(): LiquidPress | null {
    const element = this.press().nativeElement;
    if (!this.view) return null;
    this.pressed ??= new LiquidPress(
      element,
      element.ownerDocument,
      PRESS_DURATION,
      cssNumber(this.view, this.host, '--liquid-toggle-press-depth', PRESS_DEPTH),
    );
    return this.pressed;
  }

  writeValue(value: unknown): void {
    this.value.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
