/**
 * Optics for Apple's "Liquid Glass" material (WWDC 2025 / iOS 26).
 *
 * Two per-element images drive the whole effect:
 *
 *  1. a **displacement map** — R = Δx, G = Δy, neutral = 128 — produced by
 *     tracing a vertical view ray through a convex bezel with the *vector*
 *     form of Snell's law, and
 *  2. a **specular map** — greyscale rim highlight from the same physical
 *     surface normal, screen-blended over the refracted backdrop.
 *
 * Both are pure functions of the options below: no DOM beyond a detached
 * `<canvas>`, no Angular. Derivation follows kube.io, "Liquid Glass in the
 * Browser: Refraction with CSS and SVG".
 */

export type LiquidGlassProfile =
  | 'convex-circle'
  | 'convex-squircle'
  | 'concave'
  | 'lip';

export interface LiquidGlassMapOptions {
  /** Element width in CSS px. */
  width: number;
  /** Element height in CSS px. */
  height: number;
  /** Corner radius in CSS px. */
  radius: number;
  /** Bezel (rim) width in CSS px — the band that actually refracts. */
  bezel: number;
  /** Thickness profile of the bezel dome. */
  profile: LiquidGlassProfile;
  /** Height of the dome in CSS px. */
  thickness: number;
  /** Distance from the flat underside to the backdrop plane, in CSS px. */
  depth: number;
  /** Index of refraction. Real glass is about 1.5. */
  ior: number;
  /** Peak brightness of the rim highlight, 0..1. */
  specIntensity: number;
  /** Highlight tightness — 2 = broad wash, 32 = mirror pinprick. */
  specPower: number;
  /**
   * Pixel budget for the generated maps. Surfaces above it render scaled down.
   * A budget, not an edge cap: a 1600x60 toolbar is cheap and stays full size,
   * where an edge cap would have squashed it to a useless 19px-tall map.
   */
  maxMapPixels?: number;
}

export interface LiquidGlassMaps {
  /** `data:` URL of the RGBA displacement map. */
  displacement: string;
  /** `data:` URL of the greyscale specular map. */
  specular: string;
  /** Peak radial shift in CSS px — feeds the filter's `scale`. */
  maxShift: number;
}

/** Samples in the 1-D radial-shift lookup table rebuilt per map. */
const LUT_SIZE = 256;

/** The dome slope is unbounded at t=0 for every convex profile. */
const SLOPE_LIMIT = 16;

/** Anti-alias the outer edge over this many px so the rim has no jaggies. */
const EDGE_FEATHER = 1.25;

/** 384x384 worth of samples — roughly 12ms, so a resize drag stays smooth. */
const DEFAULT_MAX_MAP_PIXELS = 384 * 384;

/** Upper-left, in front of the screen. Screen y points down. */
const LIGHT = normalise3(-0.55, -0.65, 0.8);

/**
 * Bezel thickness profile. `t = 0` is the outer edge, `t = 1` the inner edge
 * where the dome flattens into the body of the element.
 *
 * All four satisfy `h(0) = 0`, `h(1) = 1` and rise across the band — verify
 * that algebraically before adding another, or the lens bulges in the wrong
 * place. `convex-squircle` is Apple's: a flatter top with a sharper rim
 * rolloff than a circle.
 */
function profileHeight(profile: LiquidGlassProfile, t: number): number {
  const u = 1 - clamp(t, 0, 1);
  switch (profile) {
    case 'convex-circle':
      return Math.sqrt(Math.max(0, 1 - u * u));
    case 'concave':
      return 1 - Math.sqrt(Math.max(0, 1 - u * u));
    case 'lip': {
      const convex = Math.sqrt(Math.max(0, 1 - u * u));
      const concave = 1 - convex;
      return concave + (convex - concave) * smoothstep(0, 1, t);
    }
    case 'convex-squircle':
    default:
      return Math.pow(Math.max(0, 1 - u * u * u * u), 0.25);
  }
}

function profileSlope(profile: LiquidGlassProfile, t: number): number {
  const step = 1e-3;
  const hi = Math.min(1, t + step);
  const lo = Math.max(0, t - step);
  const slope =
    (profileHeight(profile, hi) - profileHeight(profile, lo)) / (hi - lo);
  return clamp(slope, -SLOPE_LIMIT, SLOPE_LIMIT);
}

/** Signed distance to a rounded rectangle centred on the origin. */
function sdRoundedRect(
  px: number,
  py: number,
  halfW: number,
  halfH: number,
  r: number,
): number {
  const qx = Math.abs(px) - halfW + r;
  const qy = Math.abs(py) - halfH + r;
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * Vector Snell's law at the curved top of the bezel, then a straight ray-trace
 * down to the backdrop plane. Only the top refracts — the flat underside is
 * parallel to the backdrop, so it adds no further bend. That asymmetry *is*
 * the effect.
 *
 * Returns the radial shift in px, positive pointing inward.
 */
function refractedShift(
  slope: number,
  domeHeight: number,
  depth: number,
  ior: number,
): number {
  // Outward normal of the dome in the (radial, height) plane, for a view ray
  // I = (0, -1) travelling straight into the screen.
  const len = Math.hypot(slope, 1);
  const nx = -slope / len;
  const ny = 1 / len;

  const eta = 1 / ior; // air -> glass
  const cosI = ny; // = -(I . N)
  const sin2T = eta * eta * (1 - cosI * cosI);
  if (sin2T >= 1) return 0; // total internal reflection — unreachable here
  const cosT = Math.sqrt(1 - sin2T);
  const k = eta * cosI - cosT;

  const tx = k * nx;
  const ty = -eta + k * ny;
  if (ty >= 0) return 0; // refracted ray must still travel toward the backdrop

  return tx * ((-depth - domeHeight) / ty);
}

/**
 * Render both maps in one pass over the element's pixels.
 *
 * Returns `null` when a 2-D canvas context is unavailable (the caller should
 * then fall back to a plain CSS blur).
 */
export function buildLiquidGlassMaps(
  opts: LiquidGlassMapOptions,
): LiquidGlassMaps | null {
  const elW = Math.max(1, Math.round(opts.width));
  const elH = Math.max(1, Math.round(opts.height));

  // Large surfaces render a scaled-down map: displacement fields are smooth,
  // so feImage can stretch one back up without visible artefacts.
  const budget = Math.max(256, opts.maxMapPixels ?? DEFAULT_MAX_MAP_PIXELS);
  const k = Math.min(1, Math.sqrt(budget / (elW * elH)));
  const w = Math.max(1, Math.round(elW * k));
  const h = Math.max(1, Math.round(elH * k));

  const dispCtx = createContext(w, h);
  const specCtx = createContext(w, h);
  if (!dispCtx || !specCtx) return null;

  const halfW = w / 2;
  const halfH = h / 2;
  const radius = clamp(opts.radius * k, 0, Math.min(halfW, halfH));
  const bezel = clamp(opts.bezel * k, 0.5, Math.min(halfW, halfH));
  const thickness = Math.max(0, opts.thickness * k);
  const depth = Math.max(0.01, opts.depth * k);
  const ior = Math.max(1.0001, opts.ior);

  // One SDF eval + one LUT lookup per pixel: the 1-D optics only depend on how
  // deep into the bezel the pixel sits.
  const shiftLut = new Float64Array(LUT_SIZE);
  const slopeLut = new Float64Array(LUT_SIZE);
  let peakShift = 0;
  for (let i = 0; i < LUT_SIZE; i++) {
    const t = i / (LUT_SIZE - 1);
    const slope = (thickness / bezel) * profileSlope(opts.profile, t);
    slopeLut[i] = slope;
    shiftLut[i] = refractedShift(
      slope,
      thickness * profileHeight(opts.profile, t),
      depth,
      ior,
    );
    peakShift = Math.max(peakShift, Math.abs(shiftLut[i]));
  }

  const disp = dispCtx.createImageData(w, h);
  const spec = specCtx.createImageData(w, h);
  const dispPx = disp.data;
  const specPx = spec.data;

  // Neutral for feDisplacementMap is 128, not 0 — an all-zero map would shove
  // the whole backdrop by -scale/2.
  for (let i = 0, o = 0; i < w * h; i++, o += 4) {
    dispPx[o] = 128;
    dispPx[o + 1] = 128;
    dispPx[o + 2] = 128;
    dispPx[o + 3] = 255;
    specPx[o + 3] = 255;
  }

  const shiftX = new Float32Array(w * h);
  const shiftY = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    const py = y + 0.5 - halfH;
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - halfW;
      const inside = -sdRoundedRect(px, py, halfW, halfH, radius);

      // Outside the shape, or past the bezel into the flat body: no refraction,
      // no highlight.
      if (inside <= 0 || inside >= bezel) continue;

      const t = inside / bezel;
      const at = t * (LUT_SIZE - 1);
      const i0 = Math.floor(at);
      const i1 = Math.min(LUT_SIZE - 1, i0 + 1);
      const f = at - i0;
      const shift = shiftLut[i0] + (shiftLut[i1] - shiftLut[i0]) * f;
      const slope = slopeLut[i0] + (slopeLut[i1] - slopeLut[i0]) * f;

      // Outward unit normal in the plane = central difference of the SDF.
      const gx =
        sdRoundedRect(px + 1, py, halfW, halfH, radius) -
        sdRoundedRect(px - 1, py, halfW, halfH, radius);
      const gy =
        sdRoundedRect(px, py + 1, halfW, halfH, radius) -
        sdRoundedRect(px, py - 1, halfW, halfH, radius);
      const gl = Math.hypot(gx, gy) || 1;
      const ox = gx / gl;
      const oy = gy / gl;

      const aa = smoothstep(0, EDGE_FEATHER, inside);
      const i = y * w + x;

      // Displacement points inward, i.e. against the outward gradient.
      const s = shift * aa;
      const dx = -s * ox;
      const dy = -s * oy;
      shiftX[i] = dx;
      shiftY[i] = dy;

      // Specular: the surface rises inward, so the 3-D normal tilts outward by
      // `slope`. Same normal as the refraction — change the profile and the
      // highlight changes shape, exactly like curved glass under a studio light.
      const nx = slope * ox;
      const ny = slope * oy;
      const nl = Math.hypot(nx, ny, 1);
      const ndl = (nx * LIGHT[0] + ny * LIGHT[1] + LIGHT[2]) / nl;
      if (ndl > 0) {
        const v = clamp(
          Math.pow(ndl, opts.specPower) * opts.specIntensity * aa,
          0,
          1,
        );
        const level = Math.round(v * 255);
        const o = i * 4;
        specPx[o] = level;
        specPx[o + 1] = level;
        specPx[o + 2] = level;
      }
    }
  }

  // Normalise against the LUT's *analytic* peak, not the largest value that
  // happened to be rasterised. Coarse maps undersample the outer sliver where
  // the shift is steepest, so normalising per-raster would make an identically
  // configured surface refract measurably less once it grew past the pixel
  // budget. Against the analytic peak, every pixel encodes its own traced shift
  // and `maxShift` is the same number at any resolution — it just costs a
  // little of the encoding range, since nothing reaches +/-127.
  if (peakShift > 0) {
    for (let i = 0, o = 0; i < w * h; i++, o += 4) {
      const dx = shiftX[i];
      const dy = shiftY[i];
      if (dx === 0 && dy === 0) continue;
      dispPx[o] = clamp(Math.round(128 + (dx / peakShift) * 127), 0, 255);
      dispPx[o + 1] = clamp(Math.round(128 + (dy / peakShift) * 127), 0, 255);
    }
  }

  dispCtx.putImageData(disp, 0, 0);
  specCtx.putImageData(spec, 0, 0);

  return {
    displacement: dispCtx.canvas.toDataURL(),
    specular: specCtx.canvas.toDataURL(),
    // Back into element px — the map may have been rendered scaled down.
    maxShift: peakShift / k,
  };
}

function createContext(w: number, h: number): CanvasRenderingContext2D | null {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas.getContext('2d', { willReadFrequently: true });
}

function normalise3(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}
