import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiquidButton, type LiquidButtonVariant } from '@app/shared/components/liquid-button/liquid-button';

@Component({
  imports: [LiquidButton],
  template: `
    <button id="save" type="button" liquidButton [variant]="variant()" [disabled]="disabled()">
      <span id="icon">★</span>
      Save
    </button>
    <a id="help" liquidButton variant="tinted" href="/help" [disabled]="disabled()">Get help</a>
    <button
      id="icon-only"
      type="button"
      liquidButton
      [iconOnly]="iconOnly()"
      [variant]="variant()"
      [disabled]="disabled()"
      aria-label="Star"
    >
      <span id="star">★</span>
    </button>
  `,
})
class Host {
  // Signals: components are OnPush by default, so a plain field change would never render.
  readonly variant = signal<LiquidButtonVariant>('filled');
  readonly disabled = signal(false);
  readonly iconOnly = signal(true);
}

describe('LiquidButton', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('keeps the element it was put on, and paints it through its own layers', () => {
    const button = q('#save');
    expect(button.tagName).toBe('BUTTON');
    // No role of its own: a button is already a button and a link is still a link.
    expect(button.getAttribute('role')).toBeNull();
    expect(q('#help').getAttribute('role')).toBeNull();

    // The fill and the content, in that order and nothing else: those two
    // children are what the press squashes.
    expect([...button.children].map((child) => child.className)).toEqual([
      'liquid-button-fill',
      'liquid-button-content',
    ]);
    expect(button.querySelector('.liquid-button-content')?.textContent?.trim()).toContain('Save');
    expect(button.querySelector('#icon')).not.toBeNull();
  });

  it('carries the variant as a class', async () => {
    expect(q('#save').classList).toContain('is-filled');

    host.variant.set('plain');
    await settle();
    expect(q('#save').classList).not.toContain('is-filled');
    expect(q('#save').classList).toContain('is-plain');
  });

  it('carries the icon-only class when iconOnly is true', async () => {
    expect(q('#icon-only').classList).toContain('is-icon-only');

    host.iconOnly.set(false);
    await settle();
    expect(q('#icon-only').classList).not.toContain('is-icon-only');
  });

  it('disables each element the way that element is disabled', async () => {
    expect(q('#save').hasAttribute('disabled')).toBe(false);
    expect(q('#help').hasAttribute('aria-disabled')).toBe(false);

    host.disabled.set(true);
    await settle();

    // The binding reaches the input first, so the component writes it back out.
    expect(q('#save').hasAttribute('disabled')).toBe(true);
    expect(q('#save').classList).toContain('is-disabled');
    // An anchor has no `disabled`: it says so, and leaves the tab order.
    expect(q('#help').hasAttribute('disabled')).toBe(false);
    expect(q('#help').getAttribute('aria-disabled')).toBe('true');
    expect(q('#help').getAttribute('tabindex')).toBe('-1');
  });

  it('stops a disabled anchor navigating even once something has clicked it', async () => {
    host.disabled.set(true);
    await settle();

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    q('#help').dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  describe('the press', () => {
    /** Records what each element was asked to animate, keyed by the element. */
    let animations: Array<{ element: Element; frames: Keyframe[] }>;

    const point = (selector: string, type: string) =>
      q(selector).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true }));
    const framesFor = (selector: string) =>
      animations.filter((call) => call.element.matches(selector)).map((call) => call.frames);

    beforeEach(() => {
      animations = [];
      Object.defineProperty(Element.prototype, 'animate', {
        configurable: true,
        value: function (this: Element, frames: Keyframe[]) {
          animations.push({ element: this, frames });
          return { cancel: vi.fn(), finished: Promise.resolve(), playState: 'running' };
        },
      });
    });

    afterEach(() => {
      delete (Element.prototype as { animate?: unknown }).animate;
    });

    it('squashes the fill and the label together, on one clock', async () => {
      point('#save', 'pointerdown');
      await settle();

      // Flattened and spread: the shape anything soft takes under a finger. Both
      // layers get it, so the colour and the text answer the tap as one thing.
      expect(framesFor('#save .liquid-button-fill')).toEqual([[{ scale: '1.08 0.9' }]]);
      expect(framesFor('#save .liquid-button-content')).toEqual([[{ scale: '1.08 0.9' }]]);
    });

    it('squashes an icon-only button under a tap', async () => {
      point('#icon-only', 'pointerdown');
      await settle();

      expect(framesFor('#icon-only .liquid-button-fill')).toEqual([[{ scale: '1.08 0.9' }]]);
      expect(framesFor('#icon-only .liquid-button-content')).toEqual([[{ scale: '1.08 0.9' }]]);
    });

    it('springs back through the other shape on release', async () => {
      point('#save', 'pointerdown');
      point('#save', 'pointerup');
      await settle();

      const [, bounce] = framesFor('#save .liquid-button-content');
      expect(bounce?.map((frame) => frame['scale'])).toEqual([
        '1 1',
        '0.95 1.07',
        '1.02 0.985',
        // Implicit: lands wherever the element rests by then.
        undefined,
      ]);
    });

    it('lets the press go when the finger leaves without lifting', async () => {
      point('#save', 'pointerdown');
      point('#save', 'pointerleave');
      await settle();

      expect(framesFor('#save .liquid-button-content')).toHaveLength(2);
    });

    it('takes no press while disabled', async () => {
      host.disabled.set(true);
      await settle();

      point('#save', 'pointerdown');
      await settle();

      expect(framesFor('#save .liquid-button-fill')).toEqual([]);
    });

    it('presses for Space on a button, and leaves Space to the page on a link', async () => {
      q('#save').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
      q('#help').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
      await settle();

      expect(framesFor('#save .liquid-button-content')).toHaveLength(1);
      expect(framesFor('#help .liquid-button-content')).toEqual([]);
    });

    it('presses for Enter on both', async () => {
      q('#help').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
      await settle();

      expect(framesFor('#help .liquid-button-content')).toEqual([[{ scale: '1.08 0.9' }]]);
    });
  });
});
