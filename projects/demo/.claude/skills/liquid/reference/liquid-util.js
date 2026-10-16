/* ── Liquid shared reads ────────────────────────────────────────────────────
   The four things every liquid motion needs before it starts: the tunables off
   the element, the box in layout offsets, what to move, and whether to move at
   all. Nothing here animates anything.

   Classic script, not a module, because these files are meant to be opened
   straight off disk and `file://` blocks module scripts. Everything hangs off
   `window.Liquid`, and every file below adds to it.

   The typed originals are `reference/liquid-pour.ts` (cssTime, cssLength,
   offsetBox, prefersReducedMotion) and `liquid-press.ts` (pressedContent) in
   the app. Keep them in step.
*/
window.Liquid = (function (Liquid) {
  'use strict';

  /** A custom property holding a time (`ms` or `s`), in ms, or `fallback` when unset. */
  Liquid.cssTime = function (view, element, name, fallback) {
    var raw = read(view, element, name);
    var value = parseFloat(raw);
    if (Number.isNaN(value)) return fallback;
    return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : value;
  };

  /** A custom property holding a bare number or a length in px, or `fallback` when unset. */
  Liquid.cssNumber = function (view, element, name, fallback) {
    var value = parseFloat(read(view, element, name));
    return Number.isNaN(value) ? fallback : value;
  };

  /** A custom property holding an easing, a colour — anything unparsed — or `fallback`. */
  Liquid.cssRaw = function (view, element, name, fallback) {
    return read(view, element, name) || fallback;
  };

  function read(view, element, name) {
    return view ? view.getComputedStyle(element).getPropertyValue(name).trim() : '';
  }

  /**
   * An element's box in layout offsets — not `getBoundingClientRect` — so a
   * popup scaling open around it does not skew what is sized to it. This is the
   * whole reason the popup below can measure its own trigger while the panel it
   * belongs to is still growing.
   */
  Liquid.offsetBox = function (element) {
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
  };

  /**
   * What moves when a box is pressed, folded or popped: its own children, so the
   * box is left free to be sized, highlighted or folded by whatever owns it. An
   * element holding nothing but text has no child to move, so it stands in for
   * its own content.
   *
   * Shared rather than written per archetype so a press and a fold on the same
   * item move exactly the same things — which is what lets one hand over to the
   * other without a step.
   */
  Liquid.content = function (element) {
    return element.children.length ? Array.prototype.slice.call(element.children) : [element];
  };

  /**
   * Whether motion should be dropped altogether — the state still lands, it just
   * does not travel. Script-driven motion is not covered by the CSS media query,
   * so every entry point below asks this before it animates.
   */
  Liquid.prefersReducedMotion = function (view) {
    return !!(view && view.matchMedia && view.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  /**
   * The scale an element is wearing right now, as `[x, y]`; `[1, 1]` at rest.
   * A motion that interrupts another has to pick this up, or the element snaps
   * back to full size as the new one sets off.
   */
  Liquid.animatedScale = function (element, view) {
    var raw = view && view.getComputedStyle(element).scale;
    if (!raw || raw === 'none') return [1, 1];
    var parts = raw.split(' ').map(function (part) { return parseFloat(part) || 1; });
    return [parts[0], parts.length > 1 ? parts[1] : parts[0]];
  };

  return Liquid;
})(window.Liquid || {});
