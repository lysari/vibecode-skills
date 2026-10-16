/* ── Liquid slide ───────────────────────────────────────────────────────────
   Content swapped inside a frame, in the two shapes `liquid-tab-content` uses.
   Requires `liquid-util.js`, `liquid-slide.css`.

   **slide** — the panels sit on a track that travels, and the ones either side
   stay on screen at `scale(0.94)`, half dimmed and 3px blurred. It reads as one
   surface moving past a window, which is what makes a tab bar feel like a place
   rather than a set of pages.

   **swap** — the two panels cross over in the same spot: one curve and one
   duration both ways, so the old one's opacity is the new one's subtracted from
   1 at every frame and the two always cover the frame between them. Fading the
   old out over a shorter window lets the page through in the middle, and across
   a whole section that dip reads as a flash.

   The numbers are small on purpose. Both halves are on screen together, so the
   blur is paid twice and a panel the size of a section goes to mush long before
   the number looks bold; and the further apart the two are mid-cross, the more
   the old one reads as a ghost stuck beside the new rather than as the same
   content leaving.
*/
window.Liquid = (function (Liquid) {
  'use strict';

  /** How far content blurs as it crosses over, in px. */
  var BLUR = 3;
  /** How far content drifts along the bar as it crosses over, in px. */
  var DRIFT = 6;
  /** What the panels either side of the current one are left at. */
  var SCALE = 0.94;
  var DIM = 0.5;

  var SLIDE = { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' };
  var SWAP = { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };
  /** The frame's own height, on its own clock: shorter than the travel, so the
      frame has stopped resizing by the time the content arrives in it. */
  var RESIZE = { duration: 280, easing: 'cubic-bezier(0.2, 0, 0, 1)' };

  /**
   * @param frame The clipping frame. Its first child is the track.
   * @param options.mode `'slide'` (default) or `'swap'`.
   */
  function Slider(frame, options) {
    options = options || {};
    this.frame = frame;
    this.mode = options.mode === 'swap' ? 'swap' : 'slide';
    this.track = frame.querySelector('.liquid-slide-track');
    this.panels = Array.prototype.slice.call(this.track.children);
    this.index = 0;
    this.travel = null;
    this.resize = null;
    this.view = frame.ownerDocument.defaultView;

    frame.classList.add('is-' + this.mode);
    this.panels.forEach(function (panel, i) {
      panel.classList.toggle('is-current', i === 0);
      panel.toggleAttribute('inert', i !== 0);
    });
    this.frame.style.height = this.panels[0].offsetHeight + 'px';
  }

  /**
   * Where the track is right now, in px, so an interrupted travel carries on
   * from what the eye can see rather than from the resting value.
   *
   * The resting `translate` is written as a percentage — it has to be, or the
   * track would be wrong the moment the frame is resized — but a Web Animation
   * in flight reports px. Reading `parseFloat` off either and trusting it is
   * how a switch ends up starting from 100px instead of 620: the numbers look
   * plausible and the travel jumps most of a panel in one frame.
   */
  Slider.prototype.liveOffset = function (previous) {
    var raw = this.view.getComputedStyle(this.track).translate;
    if (!raw || raw === 'none') return -previous * this.frame.offsetWidth;
    var value = parseFloat(raw);
    if (Number.isNaN(value)) return -previous * this.frame.offsetWidth;
    return raw.trim().indexOf('%') !== -1 ? (value / 100) * this.frame.offsetWidth : value;
  };

  Slider.prototype.show = function (next) {
    if (next === this.index || next < 0 || next >= this.panels.length) return;
    var previous = this.index;
    this.index = next;

    var leaving = this.panels[previous];
    var arriving = this.panels[next];
    var forward = next > previous;

    this.panels.forEach(function (panel, i) {
      panel.classList.toggle('is-current', i === next);
      panel.toggleAttribute('inert', i !== next);
    });

    if (!this.view || Liquid.prefersReducedMotion(this.view)) {
      this.track.style.translate = -next * 100 + '% 0';
      this.frame.style.height = 'auto';
      return;
    }

    this.resizeFrame(arriving);
    if (this.mode === 'slide') this.slide(next, previous);
    else this.swap(leaving, arriving, forward);
  };

  /**
   * The frame follows the taller or shorter panel on its own clock. Measured off
   * the arriving panel's scroll height rather than its box, because the box is
   * the frame's current height while it is still being animated.
   */
  Slider.prototype.resizeFrame = function (arriving) {
    var from = this.frame.offsetHeight;
    var to = arriving.scrollHeight;
    if (from === to) return;
    if (this.resize) this.resize.cancel();
    this.frame.style.height = to + 'px';
    this.resize = this.frame.animate(
      [{ height: from + 'px' }, { height: to + 'px' }],
      RESIZE,
    );
  };

  Slider.prototype.slide = function (next, previous) {
    var width = this.frame.offsetWidth;
    /* Read the live position before starting the new travel: a second click
       mid-flight must carry on from where the eye sees the track, never from
       the resting value and never from a new animation's own 0%. */
    var from = this.liveOffset(previous);
    var to = -next * width;
    if (this.travel) this.travel.cancel();

    this.track.style.translate = -next * 100 + '% 0';
    this.travel = this.track.animate(
      [{ translate: from + 'px 0' }, { translate: to + 'px 0' }],
      SLIDE,
    );
  };

  Slider.prototype.swap = function (leaving, arriving, forward) {
    var away = (forward ? -1 : 1) * DRIFT;
    var toward = -away;

    leaving.animate([
      { opacity: 1, translate: '0 0', filter: 'blur(0px)' },
      { opacity: 0, translate: away + 'px 0', filter: 'blur(' + BLUR + 'px)' },
    ], SWAP);

    arriving.animate([
      { opacity: 0, translate: toward + 'px 0', filter: 'blur(' + BLUR + 'px)' },
      { opacity: 1, translate: '0 0', filter: 'blur(0px)' },
    ], SWAP);
  };

  Liquid.Slider = Slider;
  Liquid.SLIDE_SCALE = SCALE;
  Liquid.SLIDE_DIM = DIM;
  return Liquid;
})(window.Liquid || {});
