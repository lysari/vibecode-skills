/* ── Liquid grow from origin ────────────────────────────────────────────────
   A panel that comes out of the thing that opened it, rather than appearing over
   it. Framework-free twin of `liquid-menu-popup`. Requires `liquid-util.js`,
   `liquid-popup.css`.

   The shape of it: the panel is measured at its natural size, pinned to that
   size, and then animated *from* a trigger-sized box sitting exactly where the
   trigger is. The keyframes describe only that end — `to` is left implicit, so
   the panel always lands on whatever the layout actually gave it.

   Three things worth keeping:

   - **`fit-content` cannot be animated to.** Measure, then pin `--menu-width`
     and `--menu-height`; the wrapper inside is frozen at its own measured size
     as well, or the text re-wraps as the box grows and the whole panel boils.
   - **The content is a second animation, offset in phase, not in duration.** It
     comes in 40ms behind the box out of `blur(12px)` and `scale(0.96)`, so the
     box reveals it rather than racing it, and both land together.
   - **The close is quicker and tighter than the open (200 against 340), but it
     still decelerates into its stop.** A close that accelerates out reads as the
     panel being sucked away.
*/
window.Liquid = (function (Liquid) {
  'use strict';

  var OPEN_FALLBACK = 340;
  var CLOSE_FALLBACK = 200;

  /**
   * Opens `panel` out of `trigger`. Returns a handle with `close()`.
   *
   * `panel` is expected to be detached (or hidden) markup shaped like
   * `.liquid-popup > .liquid-popup-wrapper > …`; it is appended to the document
   * for the life of the popup and put back where it was on close.
   */
  Liquid.openPopup = function (trigger, panel, options) {
    options = options || {};
    var doc = trigger.ownerDocument;
    var view = doc.defaultView;
    var home = panel.parentNode;
    var next = panel.nextSibling;

    var overlay = doc.createElement('div');
    overlay.className = 'liquid-popup-overlay';

    doc.body.appendChild(overlay);
    doc.body.appendChild(panel);

    /* Measured before anything is pinned, and before `is-open` puts the panel on
       its animation — `fit-content` is what we are reading here. */
    panel.classList.add('is-measuring');
    var wrapper = panel.querySelector('.liquid-popup-wrapper');
    var natural = Liquid.offsetBox(panel);
    var content = wrapper ? Liquid.offsetBox(wrapper) : natural;
    panel.classList.remove('is-measuring');

    /* The exception to "never `getBoundingClientRect`": the panel is
       `position: fixed`, so viewport coordinates are the coordinate space it is
       placed in. The rule is about measuring things *inside* a box that is
       itself scaling — which is the wrapper above, and that one uses offsets. */
    var from = trigger.getBoundingClientRect();
    var gap = options.gap == null ? 8 : options.gap;

    var x = clamp(from.left, 8, Math.max(8, view.innerWidth - natural.width - 8));
    var below = from.bottom + gap;
    var y = below + natural.height + 8 > view.innerHeight
      ? Math.max(8, from.top - gap - natural.height)
      : below;

    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    panel.style.setProperty('--menu-width', natural.width + 'px');
    panel.style.setProperty('--menu-height', natural.height + 'px');
    panel.style.setProperty('--menu-content-width', content.width + 'px');
    panel.style.setProperty('--menu-content-height', content.height + 'px');
    panel.style.setProperty('--menu-origin-x', from.left - x + 'px');
    panel.style.setProperty('--menu-origin-y', from.top - y + 'px');
    panel.style.setProperty('--menu-origin-width', from.width + 'px');
    panel.style.setProperty('--menu-origin-height', from.height + 'px');

    panel.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');

    /* `is-settled` only once the grow has played out. An `opacity`/`scale`
       transition put on any earlier turns every open into a fade-in, because the
       transition and the keyframes would be fighting over the same properties. */
    var settle = function (event) {
      if (event.target !== panel) return;
      panel.classList.add('is-settled');
    };
    panel.addEventListener('animationend', settle);

    var closed = false;
    var close = function () {
      if (closed) return;
      closed = true;
      panel.removeEventListener('animationend', settle);
      panel.classList.remove('is-open');
      panel.classList.add('is-closing');
      trigger.setAttribute('aria-expanded', 'false');

      var gone = function (event) {
        if (event.target !== panel) return;
        panel.removeEventListener('animationend', gone);
        panel.classList.remove('is-closing', 'is-settled');
        panel.removeAttribute('style');
        overlay.remove();
        /* Put back exactly where it came from, so the same panel can be opened
           again from another trigger. */
        if (home) home.insertBefore(panel, next);
        else panel.remove();
        if (options.onClose) options.onClose();
      };
      /* The reduced-motion block keeps these animations at 1ms rather than
         removing them, precisely so this still fires and the panel still leaves
         the DOM. `none` here would strand it. */
      panel.addEventListener('animationend', gone);
      doc.removeEventListener('keydown', onKey);
    };

    var onKey = function (event) {
      if (event.key === 'Escape') { close(); trigger.focus(); }
    };
    doc.addEventListener('keydown', onKey);
    overlay.addEventListener('pointerdown', function () { close(); });

    return { panel: panel, close: close };
  };

  function clamp(value, low, high) {
    return Math.min(Math.max(value, low), high);
  }

  /**
   * Wires a trigger to a panel: click opens, click again closes, and the panel
   * knows which trigger it came out of so it grows from the right place.
   */
  Liquid.popupTrigger = function (trigger, panel, options) {
    var live = null;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', function () {
      if (live) { live.close(); return; }
      live = Liquid.openPopup(trigger, panel, Object.assign({}, options, {
        onClose: function () { live = null; },
      }));
    });
  };

  Liquid.POPUP_OPEN_FALLBACK = OPEN_FALLBACK;
  Liquid.POPUP_CLOSE_FALLBACK = CLOSE_FALLBACK;
  return Liquid;
})(window.Liquid || {});
