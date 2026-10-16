import { DOCUMENT, Directive, ElementRef, inject } from '@angular/core';
import { LiquidPress } from '@app/shared/utils/liquid-press';

/**
 * Makes anything answer a tap: what the element holds flattens and spreads under
 * the finger, then springs back through the other shape before it settles.
 *
 * ```html
 * <a class="hero-store" [href]="store.url" liquidPress>…</a>
 * <div class="tile" tabindex="0" liquidPress (click)="open()">…</div>
 * ```
 *
 * It paints nothing and lays nothing out — it is the press on its own, for an
 * element that already has a look. That is the difference between this and
 * `liquidButton`, which is the portal's button: a template, a set of variants
 * and this press together. Reach for the button when making a new button, and
 * for this when something already styled needs to answer a tap.
 *
 * It squashes the element's **children**, so the box itself is left free for
 * whatever sizes or highlights it. An element holding nothing but text stands in
 * for its own content. One consequence worth knowing: an element that paints its
 * own background keeps that background rigid while its contents squash — which
 * is what an item of an `<x-liquid-morph-menu>` does and it reads as clicked. To
 * squash the paint as well, the paint has to move onto a child of its own.
 *
 * The press does nothing while the element is disabled — the native `disabled`
 * of a form control, or `aria-disabled="true"` for anything else — so a host
 * that marks itself unavailable needs no extra wiring here.
 *
 * `--liquid-press-duration` (ms) times the squash; the bounce back out takes
 * 3.4× longer. A component that owns its own name for that reads it instead, by
 * injecting this and calling {@link useDuration}.
 */
@Directive({
  exportAs: 'liquidPress',
  host: {
    '(pointerdown)': 'press()',
    '(pointerup)': 'release()',
    '(pointerleave)': 'release()',
    '(pointercancel)': 'release()',
    // The keyboard presses too: Enter is this element's click, whatever it is.
    '(keydown.enter)': 'press()',
    '(keyup.enter)': 'release()',
    '(keydown.space)': 'onSpace()',
    '(keyup.space)': 'release()',
  },
  selector: '[liquidPress]',
})
export class LiquidPressable {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);

  /** Which custom property times the squash; {@link useDuration} renames it. */
  private durationProperty = '--liquid-press-duration';

  /**
   * Built on the first press rather than here, so {@link useDuration} can still
   * change the name it reads — an owner sets that from its own constructor,
   * which runs after this directive has been created.
   */
  private pressed: LiquidPress | null = null;

  /**
   * Names the custom property this reads its duration from, for a component
   * that already publishes one under its own name — `--liquid-tabs-press-duration`
   * and the like. Called once, as the owner is constructed.
   */
  useDuration(property: string): void {
    this.durationProperty = property;
    this.pressed = null;
  }

  /** Takes the press, and holds it until {@link release}. */
  press(): void {
    if (this.isDisabled()) return;
    this.motion().press();
  }

  /** Lets it go, and the squash springs back out through the other shape. */
  release(): void {
    this.pressed?.release();
  }

  /**
   * Drops the press where it stands without springing anything back — for an
   * owner about to animate the same content itself. Read the live scale first:
   * cancelling reverts it in a single frame.
   */
  cancel(): void {
    this.pressed?.cancel();
  }

  /**
   * Space is a button's click and a link's scroll, so a link does not squash for
   * it: it would be answering a keystroke that is about to scroll the page out
   * from under it. Everything else does — a `<span>` given `role="tab"`, a
   * `<div>` a menu has made focusable — since whatever made it focusable is what
   * decides Space means activate.
   */
  protected onSpace(): void {
    if (this.element.tagName === 'A') return;
    this.press();
  }

  /**
   * Whether the host says it is unavailable, by either of the two ways an
   * element can: the native property a form control carries, or `aria-disabled`
   * for everything that has no such property to set.
   */
  private isDisabled(): boolean {
    if ((this.element as Partial<HTMLButtonElement>).disabled) return true;
    return this.element.getAttribute('aria-disabled') === 'true';
  }

  private motion(): LiquidPress {
    return (this.pressed ??= new LiquidPress(
      this.element,
      this.document,
      this.durationProperty,
    ));
  }
}
