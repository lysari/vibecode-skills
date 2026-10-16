import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';

/**
 * How the button is painted. All three take their colour from the same hue, so
 * a button dropped inside a service's section answers in that service's accent
 * without being told which one it is in.
 */
export type LiquidButtonVariant = 'filled' | 'tinted' | 'plain';

/**
 * A button that answers a tap the way everything else liquid does: what it
 * holds — its fill and its label together — flattens and spreads under the
 * finger, then springs back through the other shape before it settles.
 *
 * ```html
 * <button type="button" liquidButton (click)="save()">Save</button>
 * <button type="button" liquidButton variant="plain" [disabled]="busy()">Cancel</button>
 * <a liquidButton variant="tinted" routerLink="/help">Get help</a>
 * ```
 *
 * It goes on the element it is: a `<button>` stays a button and an `<a>` stays a
 * link. No role is added either way, so an anchor that navigates is still
 * announced as a link and still answers Enter alone — a button is what should
 * carry an action that is not a destination. Give a `<button>` inside a form its
 * `type`, since a bare one submits.
 *
 * Unlike a tab, a button has no highlight travelling to it, so the press is the
 * whole of its motion — and it is the press, not the travel, that reads as the
 * click. `--liquid-button-press-duration` (ms) times the squash; the bounce back
 * out takes 3.4× longer.
 *
 * Tuning, all read with a fallback so a `--liquid-button-*` set on any ancestor
 * reaches the buttons under it: `hue` (an OKLCH hue in degrees, defaulting to
 * whatever `--svc-accent` the section carries), `radius`, `padding`, `gap`,
 * `font-size`, `color`, `border`, and `press-duration`. The border goes through
 * `--liquid-button-border` rather than `border` on the host, because the host does
 * not squash — a border set there stays still while the fill moves past it.
 *
 * A button that has to match a surface already on the page can pin `fill`,
 * `fill-hover`, `shadow` or `shadow-hover` outright and keep the rest of its
 * variant. Set them on the host rather than reaching for `.liquid-button-fill`:
 * that element belongs to this component, so it carries no `_ngcontent`
 * attribute, and a rule naming it from an encapsulated stylesheet is rewritten
 * to match nothing.
 *
 * Something that already has a look and only needs to answer a tap wants
 * {@link LiquidPressable} — `liquidPress` — rather than this. That is the press
 * on its own, with no template and no paint; this component is that press plus
 * the portal's button around it.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'liquidButton',
  host: {
    class: 'liquid-button',
    '[class.is-filled]': "variant() === 'filled'",
    '[class.is-tinted]': "variant() === 'tinted'",
    '[class.is-plain]': "variant() === 'plain'",
    '[class.is-block]': 'block()',
    '[class.is-disabled]': 'disabled()',
    // Written back onto the element, because an input named `disabled` takes the
    // binding the native property would otherwise have had: `[disabled]="busy()"`
    // on a `<button>` reaches this component and would stop there.
    '[attr.disabled]': 'isButton && disabled() ? "" : null',
    // An anchor has no `disabled` of its own, so it says so and leaves the tab order.
    '[attr.aria-disabled]': '!isButton && disabled() ? "true" : null',
    '[attr.tabindex]': '!isButton && disabled() ? -1 : null',
    '(click)': 'onClick($event)',
  },
  // The press itself, shared with everything else liquid that answers a tap. It
  // reads `disabled` and `aria-disabled` off the host, which this writes back
  // there anyway, so nothing has to tell it when the button is unavailable.
  hostDirectives: [LiquidPressable],
  selector: 'button[liquidButton], a[liquidButton]',
  styleUrl: './liquid-button.scss',
  templateUrl: './liquid-button.html',
})
export class LiquidButton {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Which element this actually is, since the two are disabled differently. */
  protected readonly isButton = this.element.tagName === 'BUTTON';

  readonly variant = input<LiquidButtonVariant>('filled');
  /** Fills the width it is given instead of hugging its label. */
  readonly block = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  constructor() {
    // The button keeps publishing its own name for the squash duration.
    inject(LiquidPressable).useDuration('--liquid-button-press-duration');
  }

  /**
   * A disabled anchor still navigates if anything manages to click it — the
   * `pointer-events` that normally stops it is only a stylesheet away from being
   * overridden, and the keyboard never went through it in the first place.
   */
  protected onClick(event: Event): void {
    if (!this.disabled()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
