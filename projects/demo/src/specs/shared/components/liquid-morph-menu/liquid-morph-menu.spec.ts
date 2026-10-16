import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiquidMorphItem } from '@app/shared/components/liquid-morph-menu/liquid-morph-item.directive';
import { LiquidMorphMenu } from '@app/shared/components/liquid-morph-menu/liquid-morph-menu';

@Component({
  imports: [LiquidMorphMenu, LiquidMorphItem],
  template: `
    <x-liquid-morph-menu
      #menu="liquidMorphMenu"
      [disabledHighlight]="disabledHighlight()"
      [disabledHover]="disabledHover()"
    >
      <button id="item-a" type="button" liquidMorphItem><i class="icon">A</i></button>
      <button
        id="item-b"
        type="button"
        liquidMorphItem
        [liquidMorphActive]="pinned()"
        [liquidMorphDisabled]="itemDisabled()"
      >
        <i class="icon">B</i>
      </button>
      @if (extra()) {
        <button id="item-c" type="button" liquidMorphItem><i class="icon">C</i></button>
      }
      <!-- Nothing but text: the pop has no child to move, so it moves the item. -->
      <button id="item-bare" type="button" liquidMorphItem>D</button>
    </x-liquid-morph-menu>
    <button id="outside" type="button">Outside</button>
  `,
})
class Host {
  // Signals: components are OnPush by default, so a plain field change would never render.
  readonly disabledHighlight = signal(false);
  readonly pinned = signal(false);
  readonly itemDisabled = signal(false);
  readonly disabledHover = signal(false);
  readonly extra = signal(true);
  readonly menuRef = viewChild.required<LiquidMorphMenu>('menu');
}

describe('LiquidMorphMenu', () => {
  let fixture: ComponentFixture<Host>;

  const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  const menu = () => q('x-liquid-morph-menu');
  const indicator = () => q('.liquid-morph-indicator');
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** The resting box the component has written for the highlight. */
  const box = () => {
    const style = menu().style;
    return (['x', 'y', 'width', 'height'] as const).map((part) =>
      style.getPropertyValue(`--liquid-morph-${part}`),
    );
  };
  const hover = async (selector: string) => {
    q(selector).dispatchEvent(new MouseEvent('mouseenter'));
    await settle();
  };
  const leave = async () => {
    menu().dispatchEvent(new MouseEvent('mouseleave'));
    await settle();
  };
  const focusOut = async (selector: string, relatedTarget: HTMLElement | null) => {
    q(selector).dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget }));
    await settle();
  };
  /** Gives the items layout boxes, which jsdom does not compute: [left, top, width, height]. */
  const mockBoxes = () => {
    const boxes: Record<string, [number, number, number, number]> = {
      'item-a': [2, 2, 36, 24],
      'item-b': [38, 2, 36, 24],
      'item-c': [74, 2, 36, 24],
    };
    const props = ['offsetLeft', 'offsetTop', 'offsetWidth', 'offsetHeight'] as const;
    props.forEach((prop, i) =>
      vi.spyOn(HTMLElement.prototype, prop, 'get').mockImplementation(function (this: HTMLElement) {
        return (boxes[this.id] ?? [0, 0, 0, 0])[i];
      }),
    );
  };
  /** jsdom has no Web Animations: the pour and the fold need an `animate` to call. */
  const mockAnimate = (playState = 'finished') => {
    const cancel = vi.fn();
    const finishes: Array<() => void> = [];
    const animate = vi.fn(() => ({
      cancel,
      playState,
      finished: new Promise<void>((resolve) => finishes.push(resolve)),
    }));
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    return { animate, cancel, finishes };
  };
  const itemAt = (index: number) => fixture.componentInstance.menuRef().items()[index]!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    mockBoxes();
    await settle();
  });

  afterEach(() => {
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
    vi.restoreAllMocks();
  });

  it('grows in on the first item the pointer meets, without a pour', async () => {
    const { animate } = mockAnimate();
    expect(menu().classList.contains('is-active')).toBe(false);

    await hover('#item-a');

    expect(menu().classList.contains('is-active')).toBe(true);
    expect(q('#item-a').classList.contains('is-active')).toBe(true);
    expect(box()).toEqual(['2px', '2px', '36px', '24px']);
    // Arriving from nothing is the CSS transition's job, not the pour's.
    expect(animate).not.toHaveBeenCalled();
    expect(indicator().getAttribute('aria-hidden')).toBe('true');
  });

  it('pours from the item it is on to the next one', async () => {
    const { animate } = mockAnimate();
    await hover('#item-a');
    await hover('#item-b');

    expect(box()).toEqual(['38px', '2px', '36px', '24px']);
    expect(q('#item-a').classList.contains('is-active')).toBe(false);
    expect(q('#item-b').classList.contains('is-active')).toBe(true);

    const [frames] = animate.mock.calls[0] as unknown as [Keyframe[]];
    expect(frames[0]).toMatchObject({ translate: '2px 2px' });
    expect(frames.at(-1)).toMatchObject({ translate: '38px 2px', width: '36px', height: '24px' });
    // Moving on to a later item, the leading edge reaches ahead before it sets off.
    expect(parseFloat(String(frames[1]!['width']))).toBeGreaterThan(36);
  });

  it('leaves the highlight where it stands when the pointer goes', async () => {
    mockAnimate();
    await hover('#item-a');
    await hover('#item-b');
    await leave();

    // Only the fade out: the box stays put, so it shrinks away from the last
    // item rather than blinking out from under the pointer.
    expect(menu().classList.contains('is-active')).toBe(false);
    expect(box()).toEqual(['38px', '2px', '36px', '24px']);
  });

  it('freezes a pour that is still running when the pointer goes', async () => {
    const { cancel } = mockAnimate('running');
    const realStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) =>
      element === indicator()
        ? ({ translate: '20px 2px', width: '30px', height: '24px' } as CSSStyleDeclaration)
        : realStyle(element as Element, pseudo),
    );

    await hover('#item-a');
    await hover('#item-b');
    await leave();

    expect(cancel).toHaveBeenCalled();
    // Mid-pour, not at the end of it: the highlight drains from where the eye left it.
    expect(box()).toEqual(['20px', '2px', '30px', '24px']);
  });

  it('holds the highlight on a pinned item once the pointer leaves', async () => {
    mockAnimate();
    fixture.componentInstance.pinned.set(true);
    await settle();

    expect(menu().classList.contains('is-active')).toBe(true);
    expect(box()).toEqual(['38px', '2px', '36px', '24px']);

    // The pointer still wins while it is over another item.
    await hover('#item-a');
    expect(box()).toEqual(['2px', '2px', '36px', '24px']);

    await leave();
    expect(menu().classList.contains('is-active')).toBe(true);
    expect(box()).toEqual(['38px', '2px', '36px', '24px']);
  });

  it('follows the focus, and lets go when it lands outside', async () => {
    mockAnimate();
    q('#item-b').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await settle();
    expect(q('#item-b').classList.contains('is-active')).toBe(true);

    // Between items the highlight stays — it is still in the menu.
    await focusOut('#item-b', q('#item-a'));
    expect(menu().classList.contains('is-active')).toBe(true);

    await focusOut('#item-a', q('#outside'));
    expect(menu().classList.contains('is-active')).toBe(false);
  });

  it('drops the highlight when the item under it goes away', async () => {
    mockAnimate();
    await hover('#item-c');
    expect(menu().classList.contains('is-active')).toBe(true);

    fixture.componentInstance.extra.set(false);
    await settle();

    expect(menu().classList.contains('is-active')).toBe(false);
  });

  // Angular drives these through `animate.enter` and `animate.leave`, which stand
  // down altogether in jsdom — it has no Web Animations for them to wait on — so
  // the callbacks are called here the way Angular would call them.
  describe('items coming and going', () => {
    const insertion = () => ({ target: itemAt(0).element, animationComplete: vi.fn() });

    /** An item Angular built after the menu had rendered — one that really arrives. */
    const lateItem = async () => {
      fixture.componentInstance.extra.set(false);
      await settle();
      fixture.componentInstance.extra.set(true);
      await settle();
      return itemAt(2);
    };

    it('leaves items that were there from the start alone', () => {
      const { animate } = mockAnimate();
      const event = insertion();

      itemAt(0).onEnter(event);

      // A row that folds itself open on every page load is noise, not motion.
      expect(animate).not.toHaveBeenCalled();
      expect(event.animationComplete).toHaveBeenCalled();
    });

    it('folds the row open as an item arrives, and pops its content in', async () => {
      const item = await lateItem();
      const { animate } = mockAnimate();
      const event = { target: item.element, animationComplete: vi.fn() };

      item.onEnter(event);

      // The box: from nothing at all. The padding folds away with the width, so
      // the row closes the gap rather than leaving a hole where the item will be.
      const [box] = animate.mock.calls[0] as unknown as [Keyframe[]];
      expect(box[0]).toMatchObject({ width: '0px', paddingLeft: '0px' });
      expect(box.at(-1)).toMatchObject({ width: '36px' });

      // The content, on the same clock: a bead that grows with the box and swells
      // past its own size before it settles.
      const [pop] = animate.mock.calls[1] as unknown as [Keyframe[]];
      expect(animate.mock.instances[1]).toBe(item.element.firstElementChild);
      expect(pop[0]).toMatchObject({ offset: 0, opacity: 0, scale: '0.12' });
      expect(pop[2]).toMatchObject({ offset: 0.84, scale: '1.14' });
      expect(pop.at(-1)).toMatchObject({ offset: 1, opacity: 1, scale: '1' });

      expect(event.target.style.overflow).toBe('hidden');
      expect(item.element.classList.contains('is-folding')).toBe(true);
    });

    it('pops the item itself when it holds nothing but text', () => {
      const { animate } = mockAnimate();
      const bare = fixture.componentInstance.menuRef().items()[3]!;

      bare.onLeave({ target: bare.element, animationComplete: vi.fn() });

      expect(animate.mock.instances[1]).toBe(bare.element);
    });

    it('holds a leaving item in place until it has folded shut', async () => {
      const { animate, finishes } = mockAnimate();
      const event = insertion();

      itemAt(0).onLeave(event);

      const [box] = animate.mock.calls[0] as unknown as [Keyframe[]];
      expect(box[0]).toMatchObject({ width: '36px' });
      expect(box.at(-1)).toMatchObject({ width: '0px' });

      // The content goes out on the same clock, contracting with the box rather
      // than vanishing and leaving it to close on nothing — the same shape as the
      // way in, reversed, with the swell at the open end.
      const [pop] = animate.mock.calls[1] as unknown as [Keyframe[]];
      expect(pop[0]).toMatchObject({ offset: 0, opacity: 1, scale: '1' });
      expect(pop[1]).toMatchObject({ offset: 1 - 0.84, scale: '1.14' });
      expect(pop.at(-1)).toMatchObject({ offset: 1, opacity: 0, scale: '0.12' });
      // Both animations share one easing, which is what keeps them in step.
      const [, boxOptions] = animate.mock.calls[0] as unknown as [
        Keyframe[],
        KeyframeAnimationOptions,
      ];
      const [, popOptions] = animate.mock.calls[1] as unknown as [
        Keyframe[],
        KeyframeAnimationOptions,
      ];
      expect(popOptions.easing).toBe(boxOptions.easing);
      expect(popOptions.duration).toBe(boxOptions.duration);

      expect(event.target.classList.contains('is-leaving')).toBe(true);
      // Angular keeps the element in the DOM until this is called.
      expect(event.animationComplete).not.toHaveBeenCalled();

      finishes.forEach((finish) => finish());
      await Promise.resolve();
      await Promise.resolve();
      expect(event.animationComplete).toHaveBeenCalled();
    });

    it('lets a leaving item go at once when there is nothing to animate with', () => {
      const event = insertion();

      itemAt(0).onLeave(event);

      expect(event.animationComplete).toHaveBeenCalled();
    });
  });

  describe('pressing an item', () => {
    const pointer = async (type: string, selector = '#item-a') => {
      q(selector).dispatchEvent(new Event(type, { bubbles: true }));
      await settle();
    };

    it('squashes what the item holds, and holds it there', async () => {
      const { animate } = mockAnimate();

      await pointer('pointerdown');

      const [frames, options] = animate.mock.calls[0] as unknown as [
        Keyframe[],
        KeyframeAnimationOptions,
      ];
      expect(animate.mock.instances[0]).toBe(q('#item-a').firstElementChild);
      // Wider as it flattens, and it stays pressed until it is let go.
      expect(frames[0]).toMatchObject({ scale: '1.08 0.9' });
      expect(options.fill).toBe('forwards');
    });

    it('bounces back out of the squash when it is let go', async () => {
      const { animate, cancel } = mockAnimate();
      await pointer('pointerdown');
      animate.mockClear();

      await pointer('pointerup');

      expect(cancel).toHaveBeenCalled();
      const [frames] = animate.mock.calls[0] as unknown as [Keyframe[]];
      // Out through the other shape — taller and narrower — before it settles.
      expect(frames[1]).toMatchObject({ offset: 0.34, scale: '0.95 1.07' });
      // Lands wherever the item rests by then, rather than on a fixed 1.
      expect(frames.at(-1)).toEqual({ offset: 1 });
    });

    it('lets go when the pointer leaves mid-press, and only bounces once', async () => {
      const { animate } = mockAnimate();
      await pointer('pointerdown');
      animate.mockClear();

      await pointer('pointerleave');
      await pointer('pointerup');

      expect(animate).toHaveBeenCalledTimes(1);
    });
  });

  describe('a disabled item', () => {
    it('is marked disabled for assistive tech and for the press', async () => {
      fixture.componentInstance.itemDisabled.set(true);
      await settle();

      expect(q('#item-b').getAttribute('aria-disabled')).toBe('true');
      expect(q('#item-b').classList.contains('is-disabled')).toBe(true);
      expect(q('#item-a').hasAttribute('aria-disabled')).toBe(false);
    });

    it('lets the highlight go instead of taking it', async () => {
      mockAnimate();
      fixture.componentInstance.itemDisabled.set(true);
      await hover('#item-a');

      await hover('#item-b');

      expect(menu().classList.contains('is-active')).toBe(false);
      expect(q('#item-a').classList.contains('is-active')).toBe(false);
      expect(q('#item-b').classList.contains('is-active')).toBe(false);
    });

    it('does not hold a pin', async () => {
      mockAnimate();
      fixture.componentInstance.pinned.set(true);
      fixture.componentInstance.itemDisabled.set(true);
      await settle();

      expect(fixture.componentInstance.menuRef().activeItem()).toBeNull();
    });

    it('drops the highlight when it is disabled under the pointer', async () => {
      mockAnimate();
      await hover('#item-b');

      fixture.componentInstance.itemDisabled.set(true);
      await settle();

      expect(menu().classList.contains('is-active')).toBe(false);
    });
  });

  describe('with disabledHover', () => {
    beforeEach(async () => {
      fixture.componentInstance.disabledHover.set(true);
      await settle();
    });

    it('does not follow the pointer', async () => {
      mockAnimate();
      await hover('#item-a');

      expect(menu().classList.contains('is-active')).toBe(false);
    });

    it('stays on the pinned item while the pointer crosses the others', async () => {
      mockAnimate();
      fixture.componentInstance.pinned.set(true);
      await settle();

      await hover('#item-a');
      await leave();

      expect(q('#item-b').classList.contains('is-active')).toBe(true);
      expect(q('#item-a').classList.contains('is-active')).toBe(false);
    });

    it('still follows the focus, and a pointer leaving does not take it away', async () => {
      mockAnimate();
      q('#item-a').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await settle();
      await leave();

      expect(q('#item-a').classList.contains('is-active')).toBe(true);
    });
  });

  it('stays away entirely with disabledHighlight', async () => {
    mockAnimate();
    fixture.componentInstance.disabledHighlight.set(true);
    fixture.componentInstance.pinned.set(true);
    await settle();

    await hover('#item-a');

    expect(menu().classList.contains('is-active')).toBe(false);
    expect(fixture.componentInstance.menuRef().activeItem()).toBeNull();
  });
});
