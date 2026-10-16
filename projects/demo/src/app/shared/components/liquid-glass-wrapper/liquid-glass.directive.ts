import {
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  Renderer2,
  Signal,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import {
  LiquidGlassRenderAs,
  LiquidGlassRenderMode,
} from './liquid-glass-wrapper.component';
import { buildLiquidGlassFilter } from './liquid-glass.filter';
import {
  LiquidGlassProfile,
  buildLiquidGlassMaps,
  clamp,
} from './liquid-glass.maps';

const SVG_NS = 'http://www.w3.org/2000/svg';

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
 * Applies the Liquid Glass material *to* an element instead of wrapping it.
 *
 * Same optics as {@link LiquidGlassWrapperComponent} — it shares the map and
 * filter builders — but it adds no box to the DOM, so it can be dropped onto an
 * element that already sits in a flex row, a grid cell or a Tailwind spacing
 * chain without disturbing the layout. The four layers it injects are absolutely
 * positioned, which keeps them out of flow: they never become flex or grid items.
 *
 * ```html
 * <div class="card grid grid-cols-2 gap-4" appLiquidGlass [lgRadius]="35">…</div>
 * ```
 *
 * Two things about the host matter:
 *
 * - **Its background is taken over.** The layers paint at negative z-index —
 *   above the host's own background, below its content — so an opaque
 *   `bg-white` would sit in front of the refraction. The directive clears the
 *   host's `background` for as long as the material is on; colour the surface
 *   with `lgTint` / `lgTintOpacity` instead.
 * - **Don't clip it.** `overflow: hidden` on the host cuts off the filter
 *   region and kills the refraction.
 *
 * Every input is `lg`-prefixed so it cannot collide with the inputs of whatever
 * component the directive is placed on. `lgRadius` is the one that cuts both
 * ways: leave it unset and the bezel follows the element's own
 * `border-radius`; set it and it rounds the element as well as the optics, so
 * the corner you see and the corner that refracts can never drift apart.
 *
 * Verify it against a *hostile* backdrop — a grid, text, or a photo. Over a
 * flat colour, correct refraction and no refraction look identical.
 */
@Directive({
  selector: '[appLiquidGlass]',
  standalone: true,
  host: {
    class: 'lg-glass',
    '[class.lg-glass--interactive]': 'interactive() && !disabled()',
    '[class.lg-glass--elevated]': 'elevation() && !disabled()',
    '[class.lg-glass--bypassed]': 'disabled()',
    '[style.border-radius]': 'radiusStyle()',
    '[style.background]': 'backgroundStyle()',
    '[style.will-change]': 'willChangeStyle()',
    '[style.backdrop-filter]': 'backdropFilterStyle()',
    '[style.--lg-tint]': 'tint()',
    '[style.--lg-tint-opacity]': 'tintOpacity()',
  },
})
export class LiquidGlassDirective {
  // ── Shape ────────────────────────────────────────────────────────────────
  /**
   * Corner radius in px. Left unset, the host's computed `border-radius` is
   * used instead, so the bezel tracks whatever the element already had rather
   * than needing the value repeated here.
   */
  readonly radius = input<number | null>(null, { alias: 'lgRadius' });

  /**
   * `lgRadius` as a host `border-radius`, so setting it rounds the element for
   * real instead of only telling the optics to trace a corner that isn't there
   * — the layers pick it up through `border-radius: inherit`. `null` when the
   * input was left alone, which drops the binding entirely and lets whatever
   * the element already had stand.
   */
  protected readonly radiusStyle = computed(() => {
    const value = this.radius();
    return value === null ? null : `${Math.max(0, value)}px`;
  });
  /** Width of the refracting rim in px. */
  readonly bezel = input<number>(60, { alias: 'lgBezel' });

  /**
   * Clears the host's own background while the material is on.
   *
   * The glass layers paint above the host's background and below its content,
   * so an opaque `bg-white` / `background-color` sits in front of the
   * refraction and hides it completely — the commonest way for the directive to
   * look like it did nothing. Rather than leave that to the call site, the
   * background is cleared here: an inline style outranks any class, so it wins
   * over Tailwind and component SCSS alike without either having to be edited.
   * The tint wash (`lgTint` / `lgTintOpacity`) is where the surface's own colour
   * belongs.
   *
   * `unset` on the shorthand resets every background longhand — colour, image,
   * gradient — since `background-color` is not the only way to end up opaque.
   * `lgDisabled` returns `null` instead, dropping the binding so a bypassed
   * element keeps the background it was authored with.
   */
  protected readonly backgroundStyle = computed(() =>
    this.disabled() ? null : 'unset',
  );

  protected readonly willChangeStyle = computed(() =>
    this.disabled() ? null : 'unset',
  );

  protected readonly backdropFilterStyle = computed(() =>
    this.disabled() ? null : 'unset',
  );

  // ── Optics ───────────────────────────────────────────────────────────────
  /** Cross-section of the bezel dome. `convex-squircle` is Apple's. */
  readonly profile = input<LiquidGlassProfile>('convex-squircle', {
    alias: 'lgProfile',
  });
  /** Height of the dome in px — how thick the glass reads. */
  readonly thickness = input<number>(28, { alias: 'lgThickness' });
  /** Gap between the glass underside and the backdrop, in px. */
  readonly depth = input<number>(10, { alias: 'lgDepth' });
  /** Index of refraction. 1.5 is window glass; push past 1.8 for a heavy lens. */
  readonly ior = input<number>(1.5, { alias: 'lgIor' });
  /** Multiplier on the physically derived displacement. 1 = as traced. */
  readonly strength = input<number>(1, { alias: 'lgStrength' });
  /** Chromatic aberration as a fraction of the displacement, 0..1. */
  readonly aberration = input<number>(0.2, { alias: 'lgAberration' });
  /** Backdrop blur in px, applied before refraction. */
  readonly blur = input<number>(1.5, { alias: 'lgBlur' });
  /** Backdrop saturation applied before refraction. */
  readonly saturate = input<number>(1.6, { alias: 'lgSaturate' });

  // ── Surface ──────────────────────────────────────────────────────────────
  /** Tint wash laid over the refracted backdrop. */
  readonly tint = input<string>('#ffffff', { alias: 'lgTint' });
  /** Opacity of the tint wash, 0..1. */
  readonly tintOpacity = input<number>(0.8, { alias: 'lgTintOpacity' });
  /** Peak brightness of the rim highlight, 0..1. */
  readonly specIntensity = input<number>(0, { alias: 'lgSpecIntensity' });
  /**
   * Highlight tightness — 2 is a broad wash, 32 a mirror pinprick. Around 8 the
   * rim reads as directionally lit (bright upper-left, fading away); much
   * higher and it collapses to a hairline.
   */
  readonly specPower = input<number>(8, { alias: 'lgSpecPower' });

  // ── Behaviour ────────────────────────────────────────────────────────────
  /**
   * Pin the surface to a path instead of letting it pick.
   *
   * `'auto'` refracts where the engine allows it and falls back to blur where
   * it does not. `'blur'` forces the fallback — useful for previewing what
   * Safari and Firefox get, or for skipping the map cost on a busy screen.
   * `'off'` drops to the tint wash alone — no blur, no refraction. For nothing
   * at all, including the tint, use `lgDisabled`.
   */
  readonly renderAs = input<LiquidGlassRenderAs>('auto', {
    alias: 'lgRenderAs',
  });
  /** Pointer-tracked glow across the surface. */
  readonly interactive = input<boolean>(true, { alias: 'lgInteractive' });
  /** Drop shadow that lifts the surface off the page. */
  readonly elevation = input<boolean>(true, { alias: 'lgElevation' });
  /** Bypass the material entirely and leave the element as it was. */
  readonly disabled = input<boolean>(false, { alias: 'lgDisabled' });
  /** Pixel budget for the generated maps; larger surfaces render scaled down. */
  readonly maxMapPixels = input<number>(512 * 512, { alias: 'lgMaxMapPixels' });

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
   * only `lgDisabled` does.
   */
  private readonly noBackdrop = computed(
    () => this.disabled() || this.renderAs() === 'off',
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router, { optional: true });

  private readonly mode = signal<LiquidGlassRenderMode>('off');
  private readonly filterId = `lg-filter-${filterUid++}`;
  private readonly supportsSvg = supportsSvgBackdropFilter();

  /**
   * Layer order, back to front — the same stack the wrapper's template builds,
   * except these are injected ahead of the host's own children rather than
   * around them:
   *   defs   zero-sized host for the generated <filter> (never overflow:hidden)
   *   layer  carries backdrop-filter — the refraction itself
   *   tint   colour wash + flat-mode rim, when refraction is unavailable
   *   glow   pointer-tracked specular sheen
   */
  private readonly defs: SVGSVGElement;
  private readonly layer: HTMLElement;

  private readonly optics = computed(() => ({
    radius: this.radius() === null ? null : Math.max(0, this.radius()!),
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

    const element = this.host.nativeElement;
    this.defs = this.doc.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    this.defs.setAttribute('class', 'lg-defs');
    this.defs.setAttribute('aria-hidden', 'true');
    this.defs.setAttribute('focusable', 'false');
    this.layer = this.buildLayer('lg-layer');
    const tint = this.buildLayer('lg-tint');
    // const glow = this.buildLayer('lg-glow');

    // Insert back-to-front ahead of the host's own content, so the injected
    // nodes keep the wrapper's layer order without becoming its first *visible*
    // children. They are absolutely positioned, so a flex or grid host never
    // sees them as items.
    const first = element.firstChild;
    for (const node of [this.defs, this.layer, tint]) {
      this.renderer.insertBefore(element, node, first);
    }
    this.destroyRef.onDestroy(() => {
      for (const node of [this.defs, this.layer, tint]) {
        this.renderer.removeChild(element, node);
      }
    });

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

  private buildLayer(className: string): HTMLElement {
    const node: HTMLElement = this.renderer.createElement('div');
    this.renderer.addClass(node, className);
    this.renderer.setAttribute(node, 'aria-hidden', 'true');
    return node;
  }

  private scheduleRebuild(): void {
    if (typeof requestAnimationFrame !== 'function') return;
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.rebuild();
    });
  }

  /**
   * The corner the optics should trace: `lgRadius` when it was given, otherwise
   * whatever the element already renders with.
   *
   * Reading the computed style at rebuild time rather than at construction
   * picks up class changes and responsive breakpoints for free. The value can
   * be a percentage (`rounded-full` resolves to a large px instead, but an
   * authored `50%` does not), and can carry a second, vertical radius — only
   * the horizontal one is traced, since the maps model a single circular
   * corner. Everything is clamped to half the box, matching what the browser
   * paints for an oversized radius.
   */
  private resolveRadius(
    explicit: number | null,
    width: number,
    height: number,
  ): number {
    const limit = Math.min(width, height) / 2;
    if (explicit !== null) return Math.min(explicit, limit);

    const corner = getComputedStyle(this.host.nativeElement).borderTopLeftRadius;
    const parsed = Number.parseFloat(corner);
    if (!Number.isFinite(parsed)) return 0;
    const px = corner.trimStart().includes('%') ? (parsed / 100) * width : parsed;
    return clamp(px, 0, limit);
  }

  private rebuild(): void {
    if (!this.viewReady) return;

    const element = this.host.nativeElement;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (width < 2 || height < 2) return;

    const optics = this.optics();
    const radius = this.resolveRadius(optics.radius, width, height);
    const key = JSON.stringify([width, height, radius, optics]);
    if (key === this.lastKey) return;
    this.lastKey = key;

    while (this.defs.firstChild) this.defs.removeChild(this.defs.firstChild);

    // Tint-only. `lgDisabled` additionally hides the tint via
    // `lg-glass--bypassed`, but the backdrop handling is the same: nothing to
    // apply.
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
      radius,
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

    this.defs.appendChild(
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
    const style = this.layer.style;
    style.setProperty('backdrop-filter', value);
    style.setProperty('-webkit-backdrop-filter', value);
  }

  private setMode(mode: LiquidGlassRenderMode): void {
    // The static inset rim stands in for the specular map, so it belongs to the
    // blur fallback alone. Tint-only isn't imitating glass and shouldn't wear a
    // fake highlight.
    this.host.nativeElement.classList.toggle('lg-glass--flat', mode === 'blur');
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
      element.classList.add('lg-glass--hover');
    };
    const leave = () => element.classList.remove('lg-glass--hover');

    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', leave, { passive: true });
    this.destroyRef.onDestroy(() => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
    });
  }
}
