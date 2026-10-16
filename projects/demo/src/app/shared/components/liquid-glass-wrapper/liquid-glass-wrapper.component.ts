import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  NgZone,
  Signal,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { buildLiquidGlassFilter } from './liquid-glass.filter';
import {
  LiquidGlassProfile,
  buildLiquidGlassMaps,
  clamp,
} from './liquid-glass.maps';

/**
 * What the surface actually resolved to.
 *
 * `pending` is the pre-measurement state and means nothing has been decided
 * yet — it exists so the initial value can't be mistaken for a real outcome.
 * The first `rebuild()` only runs from `afterNextRender`, so anything reading
 * during construction or `ngOnInit` sees this rather than a plausible lie.
 */
export type LiquidGlassRenderMode =
  | 'pending'
  | 'refraction'
  | 'blur'
  | 'off';

/**
 * How far up the material ladder the surface is asked to go. Each rung keeps
 * everything below it:
 *
 * | | tint | backdrop blur | refraction + specular |
 * |---|---|---|---|
 * | `'off'`   | yes | no  | no  |
 * | `'blur'`  | yes | yes | no  |
 * | `'auto'`  | yes | yes | yes, where the engine allows it |
 *
 * There is no `'refraction'` rung on purpose: refraction can be declined by the
 * engine, so asking for it would be a request rather than a setting. `'auto'`
 * already takes it wherever it is available.
 *
 * To render no material at all — not even the tint — use `disabled`.
 */
export type LiquidGlassRenderAs = 'auto' | 'blur' | 'off';

let filterUid = 0;

/**
 * Chromium is the only engine that accepts an SVG filter reference in
 * `backdrop-filter`; everyone else gets the CSS blur fallback.
 */
function supportsSvgBackdropFilter(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return false;
  }
  return (
    CSS.supports('backdrop-filter', 'url(#x)') ||
    CSS.supports('-webkit-backdrop-filter', 'url(#x)')
  );
}

/**
 * Wraps projected content in Apple's Liquid Glass material (WWDC 2025).
 *
 * The surface is not a frosted blur: content passing under the bezel is pulled
 * inward by a physically traced refraction, split into R/G/B fringes, and lit
 * by a specular rim highlight that follows the same surface normal. Two canvas
 * maps are regenerated whenever the size or any optical input changes, then
 * wired into an SVG filter applied through `backdrop-filter`.
 *
 * ```html
 * <app-liquid-glass-wrapper [radius]="28" [bezel]="18" display="block">
 *   <div class="p-4">Anything at all</div>
 * </app-liquid-glass-wrapper>
 * ```
 *
 * Verify it against a *hostile* backdrop — a grid, text, or a photo. Over a
 * flat colour, correct refraction and no refraction look identical.
 */
@Component({
  selector: 'app-liquid-glass-wrapper',
  standalone: true,
  imports: [],
  templateUrl: './liquid-glass-wrapper.component.html',
  styleUrl: './liquid-glass-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lg-host',
    '[class.lg-host--interactive]': 'interactive() && !disabled()',
    '[class.lg-host--elevated]': 'elevation() && !disabled()',
    '[class.lg-host--bypassed]': 'disabled()',
    '[style.display]': 'display()',
    '[style.border-radius.px]': 'radius()',
    '[style.--lg-tint]': 'tint()',
    '[style.--lg-tint-opacity]': 'tintOpacity()',
  },
})
export class LiquidGlassWrapperComponent {
  // ── Shape ────────────────────────────────────────────────────────────────
  /** Corner radius in px. Use half the height for a pill. */
  readonly radius = input<number>(24);
  /** Width of the refracting rim in px. */
  readonly bezel = input<number>(60);

  // ── Optics ───────────────────────────────────────────────────────────────
  /** Cross-section of the bezel dome. `convex-squircle` is Apple's. */
  readonly profile = input<LiquidGlassProfile>('convex-squircle');
  /** Height of the dome in px — how thick the glass reads. */
  readonly thickness = input<number>(28);
  /** Gap between the glass underside and the backdrop, in px. */
  readonly depth = input<number>(10);
  /** Index of refraction. 1.5 is window glass; push past 1.8 for a heavy lens. */
  readonly ior = input<number>(1.5);
  /** Multiplier on the physically derived displacement. 1 = as traced. */
  readonly strength = input<number>(1);
  /** Chromatic aberration as a fraction of the displacement, 0..1. */
  readonly aberration = input<number>(0.2);
  /** Backdrop blur in px, applied before refraction. */
  readonly blur = input<number>(1.5);
  /** Backdrop saturation applied before refraction. */
  readonly saturate = input<number>(1.6);

  // ── Surface ──────────────────────────────────────────────────────────────
  /** Tint wash laid over the refracted backdrop. */
  readonly tint = input<string>('#ffffff');
  /** Opacity of the tint wash, 0..1. */
  readonly tintOpacity = input<number>(0.8);
  /** Peak brightness of the rim highlight, 0..1. */
  readonly specIntensity = input<number>(0.85);
  /**
   * Highlight tightness — 2 is a broad wash, 32 a mirror pinprick. Around 8 the
   * rim reads as directionally lit (bright upper-left, fading away); much
   * higher and it collapses to a hairline.
   */
  readonly specPower = input<number>(8);

  // ── Behaviour ────────────────────────────────────────────────────────────
  /**
   * Pin the surface to a path instead of letting it pick.
   *
   * `'auto'` refracts where the engine allows it and falls back to blur where
   * it does not. `'blur'` forces the fallback — useful for previewing what
   * Safari and Firefox get, or for skipping the map cost on a busy screen.
   * `'off'` drops to the tint wash alone — no blur, no refraction. For nothing
   * at all, including the tint, use `disabled`.
   */
  readonly renderAs = input<LiquidGlassRenderAs>('auto');
  /** Pointer-tracked glow across the surface. */
  readonly interactive = input<boolean>(true);
  /** Drop shadow that lifts the surface off the page. */
  readonly elevation = input<boolean>(true);
  /** Bypass the material entirely and render plain projected content. */
  readonly disabled = input<boolean>(false);
  /** Host `display`. Use `block` to stretch to the container. */
  readonly display = input<string>('inline-block');
  /** Pixel budget for the generated maps; larger surfaces render scaled down. */
  readonly maxMapPixels = input<number>(512 * 512);

  /**
   * What the surface is actually rendering. `'blur'` still paints frosted
   * glass — tint, backdrop blur and a static rim — it just skips the
   * refraction and the specular highlight, so it is easy to mistake for a
   * working surface unless you look at whether edges bend under the bezel.
   */
  readonly renderMode: Signal<LiquidGlassRenderMode>;

  /**
   * No backdrop effect to apply. `'off'` still paints the tint wash, so this is
   * about clearing `backdrop-filter` — it is not the same as bypassing, which
   * only `disabled` does.
   */
  private readonly noBackdrop = computed(
    () => this.disabled() || this.renderAs() === 'off',
  );

  private readonly defsRef =
    viewChild.required<ElementRef<SVGSVGElement>>('defs');
  private readonly layerRef =
    viewChild.required<ElementRef<HTMLElement>>('layer');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router, { optional: true });

  private readonly mode = signal<LiquidGlassRenderMode>('off');
  private readonly filterId = `lg-filter-${filterUid++}`;
  private readonly supportsSvg = supportsSvgBackdropFilter();

  private readonly optics = computed(() => ({
    radius: Math.max(0, this.radius()),
    bezel: Math.max(0.5, this.bezel()),
    profile: this.profile(),
    thickness: Math.max(0, this.thickness()),
    depth: Math.max(0.01, this.depth()),
    ior: Math.max(1.0001, this.ior()),
    strength: Math.max(0, this.strength()),
    aberration: clamp(this.aberration(), 0, 1),
    blur: Math.max(0, this.blur()),
    saturate: Math.max(0, this.saturate()),
    specIntensity: clamp(this.specIntensity(), 0, 1),
    specPower: Math.max(1, this.specPower()),
    maxMapPixels: Math.max(256, this.maxMapPixels()),
    renderAs: this.renderAs(),
    noBackdrop: this.noBackdrop(),
  }));

  private viewReady = false;
  private frame: number | null = null;
  private lastKey = '';
  private observer: ResizeObserver | null = null;

  constructor() {
    this.renderMode = this.mode.asReadonly();

    // Any optical change queues a rebuild on the next frame.
    effect(() => {
      this.optics();
      this.scheduleRebuild();
    });

    afterNextRender(() => {
      this.viewReady = true;
      this.zone.runOutsideAngular(() => {
        this.observeSize();
        this.trackPointer();
      });
      this.rebuild();
    });

    // `<base href="/">` makes a bare `url(#id)` resolve against the base rather
    // than the current route, so the reference is absolute — and has to be
    // refreshed whenever the route changes underneath a long-lived surface.
    this.router?.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.applyFilterReference());

    this.destroyRef.onDestroy(() => {
      if (this.frame !== null) cancelAnimationFrame(this.frame);
      this.observer?.disconnect();
    });
  }

  // ── Rebuild loop ─────────────────────────────────────────────────────────

  private scheduleRebuild(): void {
    if (typeof requestAnimationFrame !== 'function') return;
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.rebuild();
    });
  }

  private rebuild(): void {
    if (!this.viewReady) return;

    const element = this.host.nativeElement;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (width < 2 || height < 2) return;

    const optics = this.optics();
    const key = JSON.stringify([width, height, optics]);
    if (key === this.lastKey) return;
    this.lastKey = key;

    const defs = this.defsRef().nativeElement;
    while (defs.firstChild) defs.removeChild(defs.firstChild);

    // Tint-only. `disabled` additionally hides the tint via `lg-host--bypassed`,
    // but the backdrop handling is the same: nothing to apply.
    if (optics.noBackdrop) {
      this.setBackdrop('');
      this.setMode('off');
      return;
    }

    const cssFallback = `blur(${optics.blur}px) saturate(${optics.saturate})`;
    if (optics.renderAs === 'blur' || !this.supportsSvg) {
      this.setBackdrop(cssFallback);
      this.setMode('blur');
      return;
    }

    const maps = buildLiquidGlassMaps({
      width,
      height,
      radius: optics.radius,
      bezel: optics.bezel,
      profile: optics.profile,
      thickness: optics.thickness,
      depth: optics.depth,
      ior: optics.ior,
      specIntensity: optics.specIntensity,
      specPower: optics.specPower,
      maxMapPixels: optics.maxMapPixels,
    });

    if (!maps || maps.maxShift <= 0) {
      this.setBackdrop(cssFallback);
      this.setMode('blur');
      return;
    }

    defs.appendChild(
      buildLiquidGlassFilter(this.doc, this.filterId, maps, {
        width,
        height,
        strength: optics.strength,
        aberration: optics.aberration,
        blur: optics.blur,
        saturate: optics.saturate,
      }),
    );
    this.setMode('refraction');
    this.applyFilterReference();
  }

  // ── DOM plumbing ─────────────────────────────────────────────────────────

  private applyFilterReference(): void {
    if (!this.viewReady || this.mode() !== 'refraction') return;
    const base = this.doc.location.href.split('#')[0];
    this.setBackdrop(`url("${base}#${this.filterId}")`);
  }

  private setBackdrop(value: string): void {
    const style = this.layerRef().nativeElement.style;
    style.setProperty('backdrop-filter', value);
    style.setProperty('-webkit-backdrop-filter', value);
  }

  private setMode(mode: LiquidGlassRenderMode): void {
    // The static inset rim stands in for the specular map, so it belongs to the
    // blur fallback alone. Tint-only isn't imitating glass and shouldn't wear a
    // fake highlight.
    this.host.nativeElement.classList.toggle('lg-host--flat', mode === 'blur');
    if (this.mode() === mode) return;
    // Outside the zone by the time this runs; re-enter so consumers reading
    // `renderMode` in an OnPush template are refreshed.
    this.zone.run(() => this.mode.set(mode));
  }

  private observeSize(): void {
    if (typeof ResizeObserver !== 'function') return;
    this.observer = new ResizeObserver(() => this.scheduleRebuild());
    this.observer.observe(this.host.nativeElement);
  }

  private trackPointer(): void {
    const element = this.host.nativeElement;

    const move = (event: PointerEvent) => {
      if (!this.interactive()) return;
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      element.style.setProperty('--lg-mx', `${x.toFixed(2)}%`);
      element.style.setProperty('--lg-my', `${y.toFixed(2)}%`);
      element.classList.add('lg-host--hover');
    };
    const leave = () => element.classList.remove('lg-host--hover');

    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', leave, { passive: true });
    this.destroyRef.onDestroy(() => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
    });
  }
}
