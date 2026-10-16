/* ── Liquid fold ────────────────────────────────────────────────────────────
   An item entering or leaving a row. Its size, padding and margin all fold
   together, so the row closes the gap as it goes and everything beside it slides
   instead of jumping.

   A plain-JS twin of the fold in
   `src/app/shared/components/liquid-morph-menu/liquid-morph-item.directive.ts`.
   Requires `liquid-util.js`.

   The rule this one exists to demonstrate is **one clock for a box and what it
   holds**. The box folds and the content beads up on the same duration and the
   same curve, offset only in phase — so the item gathers itself as the row
   closes rather than emptying first and then closing an empty gap. Two clocks
   here is the single most common way a fold goes wrong.
*/
window.Liquid = (function (Liquid) {
  'use strict';

  /** Fallback for `--liquid-fold-duration` (ms). */
  var DEFAULT_FOLD_DURATION = 320;

  var FOLD_OPEN = 'cubic-bezier(0.25, 0, 0.25, 1)';
  var FOLD_SHUT = 'cubic-bezier(0.4, 0, 0.3, 1)';

  /**
   * The content's shape along the fold, from folded shut to fully open. It stays
   * a little smaller than the room the box has — which is what keeps the closing
   * box from ever cutting across it — and swells past its own size near the open
   * end: the bulge a drop makes as it gathers, and again as it lets go.
   */
  var BEAD_SCALE = 0.12;
  var SEEN_SCALE = 0.2;
  var SEEN_OFFSET = 0.15;
  var SWELL_SCALE = 1.14;
  var SWELL_OFFSET = 0.84;

  /** The properties a fold collapses, per axis: the item's own size and the space it keeps. */
  var FOLD_AXIS = {
    horizontal: ['width', 'paddingLeft', 'paddingRight', 'marginLeft', 'marginRight'],
    vertical: ['height', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom'],
  };

  /**
   * Folds `element` in or out along `orientation`, and resolves when it is done.
   *
   * A leaving item must stay in the DOM until this resolves — removing it first
   * is the same mistake as pulling a class that carries an animation, and the
   * row snaps shut in one frame. The caller removes it in the `.then`.
   */
  Liquid.fold = function (element, options) {
    options = options || {};
    var leaving = !!options.leaving;
    var vertical = options.orientation !== 'horizontal';
    var view = element.ownerDocument.defaultView;

    if (!view || typeof element.animate !== 'function' || Liquid.prefersReducedMotion(view)) {
      return Promise.resolve();
    }

    var axis = FOLD_AXIS[vertical ? 'vertical' : 'horizontal'];
    var size = axis[0];
    var spacing = axis.slice(1);
    var style = view.getComputedStyle(element);

    var open = {};
    var shut = {};
    /* The border box, so the padding folds away with the rest of it; the
       `boxSizing` below is what makes the two agree. */
    open[size] = (vertical ? element.offsetHeight : element.offsetWidth) + 'px';
    shut[size] = '0px';
    spacing.forEach(function (property) {
      open[property] = style[property];
      shut[property] = '0px';
    });

    /* Inline, not in a class: these have to beat whatever the page gives the
       item, and a class would lose to a more specific page rule. */
    var held = element.style.cssText;
    element.style.boxSizing = 'border-box';
    element.style.overflow = 'hidden';
    element.style.setProperty(vertical ? 'min-height' : 'min-width', '0');
    /* The class holds the rest: what the item contains has to stay centred and
       keep its own size while the box closes, or the fold squashes it. */
    element.classList.add('is-folding');
    if (leaving) element.classList.add('is-leaving');

    var duration = Liquid.cssTime(view, element, '--liquid-fold-duration', DEFAULT_FOLD_DURATION);
    var easing = leaving ? FOLD_SHUT : FOLD_OPEN;

    var motions = [element.animate(leaving ? [open, shut] : [shut, open], {
      duration: duration,
      easing: easing,
    })].concat(pop(element, leaving, duration, easing));

    var done = function () {
      /* A leaving item is on its way out; an arriving one has to be handed back
         exactly the box the page gave it, inline styles and all. */
      if (!leaving) {
        element.classList.remove('is-folding');
        element.style.cssText = held;
      }
    };
    /* `finished` rejects when an animation is cancelled — by a second fold, or
       by the element going away mid-fold. Either way the fold is over. */
    return Promise.all(motions.map(function (motion) { return motion.finished; })).then(done, done);
  };

  /**
   * The pop: what the item holds beads up out of nothing as the box opens, and
   * gathers back into a bead as it closes — a drop forming and a drop letting
   * go, not a picture faded in and out.
   *
   * Same duration and same curve as the box, so the two read as one thing
   * growing rather than one waiting on the other.
   */
  function pop(element, leaving, duration, easing) {
    /* Written open-ward and reversed for the way out: the two directions are the
       same shape, which is why an item looks the same coming and going. */
    var opening = [
      { offset: 0, scale: String(BEAD_SCALE), opacity: 0 },
      { offset: SEEN_OFFSET, scale: String(SEEN_SCALE), opacity: 0 },
      { offset: SWELL_OFFSET, scale: String(SWELL_SCALE), opacity: 1 },
      { offset: 1, scale: '1', opacity: 1 },
    ];
    var keyframes = leaving
      ? opening.map(function (frame) {
          return Object.assign({}, frame, { offset: 1 - frame.offset });
        }).reverse()
      : opening;

    return Liquid.content(element).map(function (child) {
      return child.animate(keyframes, { duration: duration, easing: easing });
    });
  }

  /** Folds an item in on arrival. The caller has already put it in the DOM. */
  Liquid.foldIn = function (element, orientation) {
    return Liquid.fold(element, { leaving: false, orientation: orientation });
  };

  /** Folds an item out and removes it once the row has closed over it. */
  Liquid.foldOut = function (element, orientation) {
    return Liquid.fold(element, { leaving: true, orientation: orientation }).then(function () {
      element.remove();
    });
  };

  return Liquid;
})(window.Liquid || {});
