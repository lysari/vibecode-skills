/**
 * Accents are authored as a colour and kept as a hue.
 *
 * The service stylesheets pin lightness and chroma themselves — `oklch(48% 0.16
 * h)` for the tint, `oklch(96% 0.035 h)` for the wash, three more stops for the
 * featured card's gradient — so the hue is the only part of an accent that
 * varies between services, and the only part worth storing. Writing it as a
 * swatch means it can be picked in any colour tool; keeping only its hue means
 * no service can ship a tint that fails contrast against white.
 *
 * The painted colour is not the swatch, and the gap is wide on the warm side: a
 * mid-tone gold lands as a dark ochre once 48% lightness is applied, and every
 * hue between about 20° and 110° clips in sRGB on top of that, since 0.16 chroma
 * is past the gamut there. Each accent carries its painted values in a comment
 * beside it, because the swatch alone will not tell you.
 */

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * The OKLCH hue of `swatch`, in degrees, to one decimal place — its lightness
 * and chroma are dropped, since the stylesheet sets its own.
 *
 * `swatch` is a hex colour, `#rgb` or `#rrggbb`. Anything else throws: accents
 * are written by hand into static data, so a typo should stop the build rather
 * than paint a service grey.
 */
export function accentHue(swatch: string): number {
  if (!HEX.test(swatch)) {
    throw new Error(`accentHue: expected a hex colour like '#d4a017', got '${swatch}'`);
  }

  const hex =
    swatch.length === 4
      ? swatch
          .slice(1)
          .split('')
          .map((c) => c + c)
          .join('')
      : swatch.slice(1);
  const [r, g, b] = [0, 2, 4].map((at) => toLinear(parseInt(hex.slice(at, at + 2), 16) / 255));

  // sRGB to OKLab, of which only the a/b pair — the hue plane — is used.
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const hue = (Math.atan2(bb, a) * 180) / Math.PI;
  return Math.round((((hue % 360) + 360) % 360) * 10) / 10;
}

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}
