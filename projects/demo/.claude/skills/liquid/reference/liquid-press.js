/* ── Liquid press ───────────────────────────────────────────────────────────
   Something soft under a finger: what the box holds squashes — wider as it
   flattens, the way anything soft does — and springs back through the other
   shape before it settles.

   A plain-JS twin of `src/app/shared/utils/liquid-press.ts`. Requires
   `liquid-util.js`.

   Two things about it are load-bearing and easy to lose in a rewrite:

   - It presses the element's *children*, never the element. The box is usually
     busy being sized or highlighted by something else — a tab has a pill
     pouring under it — and a scale on the box would fight that or be swallowed
     by it.
   - It holds (`fill: forwards`) until released, so a long press stays pressed
     rather than springing back on its own.
   - It squashes relative to where each child *rests*, and the bounce ends on an
     implicit keyframe. A child with a hover scale of its own would otherwise be
     squashed from 1 and snapped back to its hover size in one frame when the
     bounce is removed — measured at 2.28px on a 38px icon.
*/
window.Liquid = (function (Liquid) {
  'use strict';

  /* Shapes are multiples of wherever the child rests, as [x, y]. */

  /** Flattened and spread, held there for as long as the finger is down. */
  var PRESSED = [1.08, 0.9];

  /* Easing timed on the individual keyframes, not across the run: an easing over
     the lot rushes the overshoot past before the eye catches it. The last
     keyframe is left implicit — see `release`. */
  var BOUNCE = [
    { offset: 0.34, shape: [0.95, 1.07], easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
    { offset: 0.68, shape: [1.02, 0.985], easing: 'cubic-bezier(0.4, 0, 0.4, 1)' },
  ];
  var PRESS_EASING = 'cubic-bezier(0.3, 0, 0.2, 1)';

  /** The bounce back out takes longer than the squash, having more to settle. */
  var BOUNCE_SHARE = 3.4;

  /** Fallback for whichever `--liquid-*-press-duration` the owner names (ms). */
  var DEFAULT_PRESS_DURATION = 110;

  /** A computed `scale` as its two axes; `none`, or nothing, is 1 on both. */
  function readScale(view, element) {
    var raw = view.getComputedStyle(element).scale;
    if (!raw || raw === 'none') return [1, 1];
    var parts = raw.trim().split(/\s+/).map(Number);
    var x = parts[0], y = parts.length > 1 ? parts[1] : parts[0];
    return isFinite(x) && isFinite(y) ? [x, y] : [1, 1];
  }

  /** `shape` applied on top of `base`, written the way `scale` reads it back. */
  function scaleOf(base, shape) {
    var round = function (n) { return +n.toFixed(4); };
    return round(base[0] * shape[0]) + ' ' + round(base[1] * shape[1]);
  }

  /**
   * Holds one element's press between the finger going down and coming back up.
   * `depth` is how much of the deformation to use, `1` being the full `1.08 0.9`;
   * a large surface wants less, since how far something gives scales with size.
   */
  function Press(element, document, durationProperty, depth) {
    this.element = element;
    this.depth = depth == null ? 1 : depth;
    this.document = document;
    this.durationProperty = durationProperty || '--liquid-press-duration';
    /** What the press is holding down, so the release knows where to bounce from. */
    this.pressing = null;
    /** The springs back out, kept so an owner can take the content off them. */
    this.bouncing = [];
    /** Where each child rests, read as a press starts and kept through its bounce. */
    this.resting = new WeakMap();
  }

  /** `shape` at this press's depth. */
  Press.prototype.shape = function (shape) {
    return [1 + (shape[0] - 1) * this.depth, 1 + (shape[1] - 1) * this.depth];
  };

  Press.prototype.duration = function (view) {
    return Liquid.cssTime(view, this.element, this.durationProperty, DEFAULT_PRESS_DURATION);
  };

  /** Takes the press: what the element holds flattens and spreads, and stays there. */
  Press.prototype.press = function () {
    if (this.pressing) return;
    var view = this.document.defaultView;
    if (!view || Liquid.prefersReducedMotion(view)) return;

    var duration = this.duration(view);
    var resting = this.resting;
    var pressed = this.shape(PRESSED);
    /* A child still springing back shows the bounce, not where it rests, so it
       keeps the resting value the last press read. */
    var springing = this.bouncing.some(function (motion) { return motion.playState === 'running'; });
    this.bouncing = [];
    this.pressing = Liquid.content(this.element)
      .filter(function (child) { return typeof child.animate === 'function'; })
      .map(function (child) {
        var base = (springing && resting.get(child)) || readScale(view, child);
        resting.set(child, base);
        return {
          child: child,
          motion: child.animate([{ scale: scaleOf(base, pressed) }], {
            duration: duration,
            easing: PRESS_EASING,
            fill: 'forwards',
          }),
        };
      });
  };

  /**
   * Lets the press go. The bounce starts from wherever the squash had got to, so
   * a tap too quick to flatten anything still springs from what the eye saw
   * rather than jumping to a full squash and back.
   *
   * It ends on no scale of its own, so it eases into whatever the child rests at
   * by then. Leaving the pointer releases the press and ends a hover in the same
   * moment; a hover scale easing back to 1 underneath is caught rather than
   * snapped to when the bounce is removed.
   */
  Press.prototype.release = function () {
    var pressing = this.pressing;
    if (!pressing) return;
    this.pressing = null;

    var view = this.document.defaultView;
    if (!view) return;
    var duration = this.duration(view) * BOUNCE_SHARE;

    var resting = this.resting;
    var self = this;
    this.bouncing = pressing.map(function (held) {
      var base = resting.get(held.child) || [1, 1];
      var live = view.getComputedStyle(held.child).scale;
      held.motion.cancel();
      var from = {
        scale: live && live !== 'none' ? live : scaleOf(base, [1, 1]),
        easing: BOUNCE[0].easing,
      };
      var frames = BOUNCE.map(function (step) {
        return { offset: step.offset, scale: scaleOf(base, self.shape(step.shape)), easing: step.easing };
      });
      return held.child.animate([from].concat(frames, [{ offset: 1 }]), { duration: duration });
    });
  };

  /**
   * Drops the press where it stands, squash or bounce, without springing
   * anything back — for an owner about to animate the same content itself.
   *
   * Cancelling reverts the scale in a single frame, so whatever takes over has
   * to have read the live scale *before* calling this and start from it. Leaving
   * both running instead hands the element to whichever animated `scale` last.
   */
  Press.prototype.cancel = function () {
    (this.pressing || []).forEach(function (held) { held.motion.cancel(); });
    this.bouncing.forEach(function (motion) { motion.cancel(); });
    this.pressing = null;
    this.bouncing = [];
  };

  Liquid.Press = Press;
  Liquid.DEFAULT_PRESS_DURATION = DEFAULT_PRESS_DURATION;

  /**
   * Wires one element up to press under pointer and keyboard both: Enter and
   * Space are this element's click, and a tap that has nothing answer it reads
   * as a dead control however good the thing it triggers looks.
   *
   * `pointerleave` and `pointercancel` release too — a finger dragged off a
   * button must not leave it flattened.
   */
  Liquid.pressable = function (element, durationProperty) {
    var press = new Press(element, element.ownerDocument, durationProperty);
    var down = function () { press.press(); };
    var up = function () { press.release(); };

    element.addEventListener('pointerdown', down);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (name) {
      element.addEventListener(name, up);
    });
    element.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') down();
    });
    element.addEventListener('keyup', function (event) {
      if (event.key === 'Enter' || event.key === ' ') up();
    });
    return press;
  };

  return Liquid;
})(window.Liquid || {});
