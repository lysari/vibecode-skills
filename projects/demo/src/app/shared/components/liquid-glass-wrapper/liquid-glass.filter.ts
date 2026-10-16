import { LiquidGlassMaps } from './liquid-glass.maps';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

/**
 * `feDisplacementMap` shifts by `scale * (channel/255 - 0.5)`, so the encoded
 * peak of 255 only reaches 0.498. Dividing by it turns a map's `maxShift` back
 * into a `scale` that reproduces the traced ray at its true magnitude.
 */
const ENCODED_PEAK = 127 / 255;

export interface LiquidGlassFilterOptions {
  /** Element width in CSS px — the `feImage` subregion. */
  width: number;
  /** Element height in CSS px. */
  height: number;
  /** Multiplier on the physically derived displacement. 1 = as traced. */
  strength: number;
  /** Chromatic aberration as a fraction of the displacement, 0..1. */
  aberration: number;
  /** Backdrop blur in px, applied before refraction. */
  blur: number;
  /** Backdrop saturation applied before refraction. */
  saturate: number;
}

/** Channel isolation matrices for the chromatic-aberration passes. */
const ISOLATE = {
  R: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  G: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  B: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
} as const;

/**
 * Assemble the Liquid Glass filter chain:
 *
 * ```
 * feImage(dmap), feImage(spec)
 * SourceGraphic -> feGaussianBlur -> feColorMatrix(saturate) -> "src"
 *   per channel: feDisplacementMap(scale +/- aberration) -> isolate -> sum
 * feBlend(refracted, spec, screen)
 * ```
 *
 * Deliberately sets no `filterUnits`/`x`/`y`/`width`/`height`. Those default to
 * `objectBoundingBox` with a region of the element's bbox plus 10%. Pinning them
 * to `userSpaceOnUse` at `100%` resolves the region against the zero-sized defs
 * host, collapsing it to 0x0 — the maps stay perfect and nothing renders, which
 * reads as an ordinary frosted blur. `primitiveUnits` keeps its `userSpaceOnUse`
 * default so the `feImage` sizes below are element pixels.
 */
export function buildLiquidGlassFilter(
  doc: Document,
  id: string,
  maps: LiquidGlassMaps,
  options: LiquidGlassFilterOptions,
): SVGFilterElement {
  const create = (tag: string) => doc.createElementNS(SVG_NS, tag) as SVGElement;

  const filter = create('filter') as SVGFilterElement;
  filter.setAttribute('id', id);
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  filter.appendChild(
    feImage(create, maps.displacement, options.width, options.height, 'dmap'),
  );
  filter.appendChild(
    feImage(create, maps.specular, options.width, options.height, 'spec'),
  );

  const blur = create('feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', String(options.blur));
  blur.setAttribute('result', 'blurred');
  filter.appendChild(blur);

  const saturate = create('feColorMatrix');
  saturate.setAttribute('in', 'blurred');
  saturate.setAttribute('type', 'saturate');
  saturate.setAttribute('values', String(options.saturate));
  saturate.setAttribute('result', 'src');
  filter.appendChild(saturate);

  const scale = (maps.maxShift / ENCODED_PEAK) * options.strength;
  const spread = scale * options.aberration;

  if (spread > 0.05) {
    const channels = [
      { key: 'R' as const, scale: scale + spread },
      { key: 'G' as const, scale },
      { key: 'B' as const, scale: scale - spread },
    ];
    for (const channel of channels) {
      filter.appendChild(
        feDisplace(create, channel.scale, `disp${channel.key}`),
      );
      const isolate = create('feColorMatrix');
      isolate.setAttribute('in', `disp${channel.key}`);
      isolate.setAttribute('type', 'matrix');
      isolate.setAttribute('values', ISOLATE[channel.key]);
      isolate.setAttribute('result', `only${channel.key}`);
      filter.appendChild(isolate);
    }
    filter.appendChild(feSum(create, 'onlyR', 'onlyG', 'rg'));
    filter.appendChild(feSum(create, 'rg', 'onlyB', 'refracted'));
  } else {
    filter.appendChild(feDisplace(create, scale, 'refracted'));
  }

  const blend = create('feBlend');
  blend.setAttribute('in', 'refracted');
  blend.setAttribute('in2', 'spec');
  blend.setAttribute('mode', 'screen');
  filter.appendChild(blend);

  return filter;
}

type Create = (tag: string) => SVGElement;

function feImage(
  create: Create,
  href: string,
  width: number,
  height: number,
  result: string,
): SVGElement {
  const node = create('feImage');
  node.setAttribute('href', href);
  node.setAttributeNS(XLINK_NS, 'xlink:href', href);
  node.setAttribute('x', '0');
  node.setAttribute('y', '0');
  node.setAttribute('width', String(width));
  node.setAttribute('height', String(height));
  node.setAttribute('preserveAspectRatio', 'none');
  node.setAttribute('result', result);
  return node;
}

function feDisplace(
  create: Create,
  scale: number,
  result: string,
): SVGElement {
  const node = create('feDisplacementMap');
  node.setAttribute('in', 'src');
  node.setAttribute('in2', 'dmap');
  node.setAttribute('scale', scale.toFixed(3));
  node.setAttribute('xChannelSelector', 'R');
  node.setAttribute('yChannelSelector', 'G');
  node.setAttribute('result', result);
  return node;
}

function feSum(
  create: Create,
  a: string,
  b: string,
  result: string,
): SVGElement {
  const node = create('feComposite');
  node.setAttribute('in', a);
  node.setAttribute('in2', b);
  node.setAttribute('operator', 'arithmetic');
  node.setAttribute('k1', '0');
  node.setAttribute('k2', '1');
  node.setAttribute('k3', '1');
  node.setAttribute('k4', '0');
  node.setAttribute('result', result);
  return node;
}
