import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiquidTabContent } from '@app/shared/components/liquid-tabs/liquid-tab-content.directive';
import { LiquidTabPanel, type LiquidTabPanelMode } from '@app/shared/components/liquid-tabs/liquid-tab-panel.directive';
import { LiquidTab } from '@app/shared/components/liquid-tabs/liquid-tab.directive';
import {
  LiquidTabs,
  LiquidTabsActivation,
  LiquidTabsOrientation,
  LiquidTabsStorage,
} from '@app/shared/components/liquid-tabs/liquid-tabs';

const KEY_CODES = {
  ' ': 32,
  ArrowDown: 40,
  ArrowLeft: 37,
  ArrowRight: 39,
  End: 35,
  Enter: 13,
  Home: 36,
} as const;

@Component({
  imports: [LiquidTabs, LiquidTab, LiquidTabPanel, LiquidTabContent],
  template: `
    <x-liquid-tabs
      #tabs="liquidTabs"
      aria-label="Filter"
      [activation]="activation()"
      [orientation]="orientation()"
      [(value)]="value"
    >
      <button id="tab-all" type="button" liquidTab="all">All</button>
      <button id="tab-unread" type="button" liquidTab="unread">Unread</button>
      <span id="tab-archived" liquidTab="archived" [disabled]="true">Archived</span>
      <button id="tab-starred" type="button" liquidTab="starred">Starred</button>
    </x-liquid-tabs>

    <div id="panel-all" liquidTabPanel="all" [liquidTabPanelFor]="tabs">All</div>
    <div id="panel-unread" liquidTabPanel="unread" [liquidTabPanelFor]="tabs">
      <ng-template liquidTabContent let-value>
        <p id="content-unread">From the panel: {{ value }}</p>
      </ng-template>
    </div>
    <div id="panel-shared" liquidTabPanel [liquidTabPanelFor]="tabs">
      Everything else
      <ng-template liquidTabContent="starred">
        <p id="content-starred">Starred</p>
      </ng-template>
    </div>
    <ng-template liquidTabContent="all" [liquidTabContentFor]="tabs" let-value>
      <p id="content-all">Standalone: {{ value }}</p>
    </ng-template>
  `,
})
class Host {
  // Signals: components are OnPush by default, so a plain field change would never render.
  readonly value = signal<string | null>('all');
  readonly activation = signal<LiquidTabsActivation>('automatic');
  readonly orientation = signal<LiquidTabsOrientation>('horizontal');
  readonly tabsRef = viewChild.required<LiquidTabs<string>>('tabs');
}

@Component({
  imports: [LiquidTabs, LiquidTab],
  template: `
    <x-liquid-tabs default="unread">
      <button id="plain-all" type="button" liquidTab="all">All</button>
      <button id="plain-unread" type="button" liquidTab="unread">Unread</button>
    </x-liquid-tabs>

    <x-liquid-tabs default="unread" [(value)]="bound">
      <button id="bound-all" type="button" liquidTab="all">All</button>
      <button id="bound-unread" type="button" liquidTab="unread">Unread</button>
    </x-liquid-tabs>

    <x-liquid-tabs default="archived">
      <button id="off-all" type="button" liquidTab="all">All</button>
      <button id="off-archived" type="button" liquidTab="archived" disabled>Archived</button>
    </x-liquid-tabs>
  `,
})
class DefaultHost {
  readonly bound = signal<string | null>('all');
}

/** Tabs built by an `@for`: they reach the bar's query a pass before Angular binds them. */
@Component({
  imports: [LiquidTabs, LiquidTab],
  template: `
    <x-liquid-tabs [default]="keys[1]">
      @for (key of keys; track key) {
        <button [id]="'loop-' + key" type="button" [liquidTab]="key">{{ key }}</button>
      }
    </x-liquid-tabs>

    <x-liquid-tabs [(value)]="bound">
      @for (key of keys; track key) {
        <button [id]="'loop-bound-' + key" type="button" [liquidTab]="key">{{ key }}</button>
      }
    </x-liquid-tabs>
  `,
})
class LoopHost {
  readonly keys = ['all', 'unread', 'archived'];
  readonly bound = signal<string | null>('archived');
}

/** Every content in one container: what a shared panel looks like when the bar is spammed. */
@Component({
  imports: [LiquidTabs, LiquidTab, LiquidTabPanel, LiquidTabContent],
  template: `
    <x-liquid-tabs #tabs="liquidTabs" [(value)]="value">
      @for (key of keys; track key) {
        <button [id]="'spam-' + key" type="button" [liquidTab]="key">{{ key }}</button>
      }
    </x-liquid-tabs>

    <div id="spam-panel" liquidTabPanel [liquidTabPanelFor]="tabs">
      @for (key of keys; track key) {
        <ng-template [liquidTabContent]="key">
          <p [id]="'spam-content-' + key">{{ key }}</p>
        </ng-template>
      }
    </div>
  `,
})
class SpamHost {
  readonly keys = ['a', 'b', 'c', 'd', 'e'];
  readonly value = signal<string | null>('a');
}

/** A shared panel carrying its contents like a carousel. */
@Component({
  imports: [LiquidTabs, LiquidTab, LiquidTabPanel, LiquidTabContent],
  template: `
    <x-liquid-tabs #tabs="liquidTabs" [orientation]="orientation()" [(value)]="value">
      @for (key of keys; track key) {
        <button [id]="'slide-' + key" type="button" [liquidTab]="key">{{ key }}</button>
      }
    </x-liquid-tabs>

    <div id="slider-panel" liquidTabPanel [liquidTabPanelFor]="tabs" [panelMode]="mode()">
      @for (key of keys; track key) {
        <ng-template [liquidTabContent]="key">
          <p [id]="'slide-content-' + key">{{ key }}</p>
        </ng-template>
      }
    </div>
  `,
})
class SliderHost {
  readonly keys = ['a', 'b', 'c', 'd', 'e'];
  readonly value = signal<string | null>('a');
  readonly mode = signal<LiquidTabPanelMode>('slider');
  readonly orientation = signal<LiquidTabsOrientation>('horizontal');
}

@Component({
  imports: [LiquidTabs, LiquidTab],
  template: `
    <x-liquid-tabs default="all" [persist]="key()" [persistIn]="store()">
      @for (tab of tabs(); track tab.value) {
        <button
          [id]="'kept-' + tab.value"
          type="button"
          [liquidTab]="tab.value"
          [disabled]="tab.disabled"
        >
          {{ tab.value }}
        </button>
      }
    </x-liquid-tabs>
  `,
})
class PersistHost {
  readonly key = signal<string | undefined>('spec:tabs');
  readonly store = signal<LiquidTabsStorage>('local');
  readonly tabs = signal([
    { value: 'all', disabled: false },
    { value: 'unread', disabled: false },
    { value: 'starred', disabled: false },
  ]);
  readonly tabsRef = viewChild.required<LiquidTabs<string>>(LiquidTabs);
}

describe('LiquidTabs', () => {
  let fixture: ComponentFixture<Host>;

  const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  const bar = () => q('x-liquid-tabs');
  const host = () => fixture.componentInstance;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const focusTab = async (selector: string) => {
    q(selector).focus();
    await settle();
  };
  /** Pressed on whatever has focus, the way a real key would be. */
  const key = async (name: keyof typeof KEY_CODES) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: name });
    // The CDK key manager still reads `keyCode`, which browsers fill in and jsdom does not.
    Object.defineProperty(event, 'keyCode', { value: KEY_CODES[name] });
    (document.activeElement as HTMLElement).dispatchEvent(event);
    await settle();
  };
  /** Gives the first two tabs layout boxes, which jsdom does not compute: [left, top, width, height]. */
  const mockBoxes = () => {
    const boxes: Record<string, [number, number, number, number]> = {
      'tab-all': [3, 3, 60, 28],
      'tab-unread': [63, 3, 84, 28],
    };
    const props = ['offsetLeft', 'offsetTop', 'offsetWidth', 'offsetHeight'] as const;
    props.forEach((prop, i) =>
      vi.spyOn(HTMLElement.prototype, prop, 'get').mockImplementation(function (this: HTMLElement) {
        return (boxes[this.id] ?? [0, 0, 0, 0])[i];
      }),
    );
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  afterEach(() => vi.restoreAllMocks());

  it('is a tablist whose selected tab is the only tab stop', () => {
    expect(bar().getAttribute('role')).toBe('tablist');
    expect(bar().getAttribute('aria-orientation')).toBe('horizontal');

    expect(q('#tab-all').getAttribute('role')).toBe('tab');
    expect(q('#tab-all').getAttribute('aria-selected')).toBe('true');
    expect(q('#tab-all').getAttribute('tabindex')).toBe('0');
    for (const id of ['#tab-unread', '#tab-archived', '#tab-starred']) {
      expect(q(id).getAttribute('aria-selected')).toBe('false');
      expect(q(id).getAttribute('tabindex')).toBe('-1');
    }
    expect(q('#tab-archived').getAttribute('aria-disabled')).toBe('true');
  });

  it('makes the first enabled tab the tab stop while nothing is selected', async () => {
    host().value.set(null);
    await settle();

    expect(q('#tab-all').getAttribute('tabindex')).toBe('0');
    expect(q('#tab-all').getAttribute('aria-selected')).toBe('false');
    expect(bar().classList.contains('has-selection')).toBe(false);
  });

  it('selects on click and writes the value back through [(value)]', async () => {
    q('#tab-unread').click();
    await settle();

    expect(host().value()).toBe('unread');
    expect(q('#tab-unread').getAttribute('aria-selected')).toBe('true');
    expect(q('#tab-unread').getAttribute('tabindex')).toBe('0');
    expect(q('#tab-all').getAttribute('tabindex')).toBe('-1');
  });

  it('ignores a click on a disabled tab', async () => {
    q('#tab-archived').click();
    await settle();
    expect(host().value()).toBe('all');
  });

  it('selects from code, refusing a disabled or unknown value', async () => {
    const tabs = host().tabsRef();

    expect(tabs.select('archived')).toBe(false);
    expect(tabs.select('missing')).toBe(false);
    expect(tabs.select('starred')).toBe(true);
    await settle();

    expect(host().value()).toBe('starred');
    expect(tabs.selectedIndex()).toBe(3);
  });

  it('selects as the arrow keys move, skipping disabled tabs and wrapping', async () => {
    await focusTab('#tab-all');

    await key('ArrowRight');
    expect(document.activeElement).toBe(q('#tab-unread'));
    expect(host().value()).toBe('unread');

    await key('ArrowRight');
    expect(document.activeElement).toBe(q('#tab-starred'));

    await key('ArrowRight');
    expect(document.activeElement).toBe(q('#tab-all'));

    await key('ArrowLeft');
    expect(document.activeElement).toBe(q('#tab-starred'));

    await key('Home');
    expect(document.activeElement).toBe(q('#tab-all'));

    await key('End');
    expect(host().value()).toBe('starred');
  });

  it('in manual activation, moves focus only, and selects on Enter or Space', async () => {
    host().activation.set('manual');
    await settle();
    await focusTab('#tab-all');

    await key('ArrowRight');
    expect(document.activeElement).toBe(q('#tab-unread'));
    expect(host().value()).toBe('all');

    await key('Enter');
    expect(host().value()).toBe('unread');

    await key('ArrowRight');
    await key(' ');
    expect(host().value()).toBe('starred');
  });

  it('follows the up and down keys when vertical', async () => {
    host().orientation.set('vertical');
    await settle();
    expect(bar().getAttribute('aria-orientation')).toBe('vertical');
    expect(bar().classList.contains('is-vertical')).toBe(true);

    await focusTab('#tab-all');
    await key('ArrowRight');
    expect(document.activeElement).toBe(q('#tab-all'));

    await key('ArrowDown');
    expect(document.activeElement).toBe(q('#tab-unread'));
  });

  it('builds tab content only while its tab is selected, wherever it sits', async () => {
    // Standalone, following the bar it names.
    expect(q('#content-all')?.textContent?.trim()).toBe('Standalone: all');
    expect(q('#content-unread')).toBeNull();
    expect(q('#content-starred')).toBeNull();

    // Inside a panel, taking the panel's value.
    q('#tab-unread').click();
    await settle();
    expect(q('#content-all')).toBeNull();
    expect(q('#panel-unread #content-unread')?.textContent?.trim()).toBe('From the panel: unread');

    // Inside the shared panel, with a value of its own.
    q('#tab-starred').click();
    await settle();
    expect(q('#content-unread')).toBeNull();
    expect(q('#panel-shared #content-starred')).not.toBeNull();
  });

  describe('the press', () => {
    /** Records what each element was asked to animate, keyed by the element. */
    let animations: Array<{ element: HTMLElement; frames: Keyframe[]; cancel: () => void }>;

    const point = (selector: string, type: string) =>
      q(selector).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true }));
    const framesFor = (selector: string) =>
      animations.filter((call) => call.element === q(selector)).map((call) => call.frames);

    beforeEach(() => {
      animations = [];
      Object.defineProperty(HTMLElement.prototype, 'animate', {
        configurable: true,
        value: function (this: HTMLElement, frames: Keyframe[]) {
          const motion = { cancel: vi.fn(), finished: Promise.resolve(), playState: 'running' };
          animations.push({ element: this, frames, cancel: motion.cancel });
          return motion;
        },
      });
    });

    afterEach(() => {
      delete (HTMLElement.prototype as { animate?: unknown }).animate;
    });

    it('squashes what the tab holds under the finger, and holds it there', async () => {
      point('#tab-unread', 'pointerdown');
      await settle();

      // Flattened and spread: the shape anything soft takes under a finger.
      expect(framesFor('#tab-unread')).toEqual([[{ scale: '1.08 0.9' }]]);
    });

    it('springs back through the other shape on release', async () => {
      point('#tab-unread', 'pointerdown');
      point('#tab-unread', 'pointerup');
      await settle();

      const [, bounce] = framesFor('#tab-unread');
      expect(bounce!.map((frame) => frame['scale'])).toEqual([
        '1 1',
        '0.95 1.07',
        '1.02 0.985',
        // Implicit: it lands wherever the tab rests by then, not on a value
        // written down as the press began.
        undefined,
      ]);
      // Eased per keyframe, or the overshoot is rushed past before the eye has it.
      // The last keyframe starts no segment, so it has nothing to ease.
      expect(bounce!.slice(0, -1).every((frame) => frame.easing)).toBe(true);
      expect(bounce!.at(-1)).toEqual({ offset: 1 });
    });

    it('answers a tab that is already selected, where no pill moves', async () => {
      expect(host().value()).toBe('all');
      point('#tab-all', 'pointerdown');
      await settle();

      expect(framesFor('#tab-all')).toEqual([[{ scale: '1.08 0.9' }]]);
    });

    it('holds one press at a time, however long the finger stays down', async () => {
      point('#tab-unread', 'pointerdown');
      point('#tab-unread', 'pointerdown');
      await settle();

      expect(framesFor('#tab-unread')).toHaveLength(1);
    });

    it('leaves a disabled tab alone', async () => {
      point('#tab-archived', 'pointerdown');
      point('#tab-archived', 'pointerup');
      await settle();

      expect(framesFor('#tab-archived')).toEqual([]);
    });

    it('lets the press go when the pointer leaves without lifting', async () => {
      point('#tab-unread', 'pointerdown');
      point('#tab-unread', 'pointerleave');
      await settle();

      expect(framesFor('#tab-unread').at(-1)!.at(-1)).toEqual({ offset: 1 });
    });

    it('presses the pill under the tab as well as what the tab holds', async () => {
      point('#tab-all', 'pointerdown');
      await settle();

      // The surface under the finger answers, not just what is written on it.
      expect(framesFor('.liquid-tabs-indicator')).toEqual([[{ scale: '1.08 0.9' }]]);
    });

    it('springs the pill back with the tab', async () => {
      point('#tab-all', 'pointerdown');
      point('#tab-all', 'pointerup');
      await settle();

      const [, bounce] = framesFor('.liquid-tabs-indicator');
      expect(bounce!.at(-1)).toEqual({ offset: 1 });
    });

    it('leaves the pill alone for a disabled tab', async () => {
      point('#tab-archived', 'pointerdown');
      await settle();

      expect(framesFor('.liquid-tabs-indicator')).toEqual([]);
    });

    it('hands the pill to the pour rather than letting the two fight over it', async () => {
      mockBoxes();
      point('#tab-unread', 'pointerdown');
      await settle();
      const squash = animations.find((entry) => entry.element === q('.liquid-tabs-indicator'))!;

      point('#tab-unread', 'pointerup');
      q('#tab-unread').click();
      await settle();

      // Two animations on one element would jump: the second starts from its own
      // `0%`, skipping whatever the first had reached.
      expect(squash.cancel).toHaveBeenCalled();
    });

    it('does not press at all where motion is not wanted', async () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
      point('#tab-unread', 'pointerdown');
      await settle();
      vi.unstubAllGlobals();

      expect(framesFor('#tab-unread')).toEqual([]);
    });
  });

  describe('content crossfade', () => {
    /** Fade-outs are held open until the test lets them finish; everything else ends at once. */
    const createAnimate = (finishes: Array<() => void>) =>
      vi.fn((frames: Keyframe[], options?: KeyframeAnimationOptions) => {
        let settle = () => {};
        const finished =
          frames[0]?.['opacity'] === 1
            ? new Promise<void>((resolve) => {
                settle = resolve;
                finishes.push(resolve);
              })
            : Promise.resolve();
        return {
          finished,
          cancel: vi.fn(),
          // Enough of a real animation for a later switch to hurry this one along
          // or send it to its last frame.
          finish: vi.fn(() => settle()),
          updatePlaybackRate: vi.fn(),
          playbackRate: 1,
          currentTime: 0,
          effect: { getComputedTiming: () => ({ activeDuration: options?.duration ?? 0 }) },
        };
      });

    let finishes: Array<() => void>;
    let animate: ReturnType<typeof createAnimate>;

    beforeEach(() => {
      finishes = [];
      animate = createAnimate(finishes);
      Object.defineProperty(HTMLElement.prototype, 'animate', {
        configurable: true,
        value: animate,
      });
    });

    afterEach(() => {
      delete (HTMLElement.prototype as { animate?: unknown }).animate;
    });

    it('holds the old content over the new, out of the flow, until its fade ends', async () => {
      q('#tab-unread').click();
      await settle();

      const old = q('#content-all');
      expect(old).not.toBeNull();
      expect(old.style.position).toBe('absolute');
      expect(old.inert).toBe(true);
      expect(q('#content-unread')).not.toBeNull();
      expect(animate.mock.calls.some(([frames]) => frames[0]?.['opacity'] === 0)).toBe(true);

      // On to a later tab: the old content pulls back, the new comes in from ahead.
      const leaveFrames = animate.mock.calls.find(([frames]) => frames[0]?.['opacity'] === 1)![0];
      const enterFrames = animate.mock.calls.find(([frames]) => frames[0]?.['opacity'] === 0)![0];
      expect(leaveFrames.at(-1)).toMatchObject({ translate: '-6px 0px' });
      expect(enterFrames[0]).toMatchObject({ translate: '6px 0px' });

      finishes.forEach((finish) => finish());
      await settle();
      expect(q('#content-all')).toBeNull();
    });

    it('brings the same content back when its tab is picked again mid-fade', async () => {
      q('#tab-unread').click();
      await settle();
      const old = q('#content-all');
      const [finishFirstFade] = finishes;

      q('#tab-all').click();
      await settle();
      expect(q('#content-all')).toBe(old);
      expect(old.style.position).toBe('');
      expect(old.inert).toBe(false);

      // Back to an earlier tab: it comes in from the other side.
      const [reentry] = animate.mock.calls
        .filter(([frames]) => frames[0]?.['opacity'] === 0)
        .at(-1)!;
      expect(reentry[0]).toMatchObject({ translate: '-6px 0px' });
      expect(host().tabsRef().direction()).toBe(-1);

      // The fade it was pulled out of ending late changes nothing.
      finishFirstFade();
      await settle();
      expect(q('#content-all')).toBe(old);
    });

    it('crosses the two over on one curve, so the page never shows through', async () => {
      q('#tab-unread').click();
      await settle();

      const [leaveFrames, leaveOptions] = animate.mock.calls.find(
        ([frames]) => frames[0]?.['opacity'] === 1,
      )!;
      const [enterFrames, enterOptions] = animate.mock.calls.find(
        ([frames]) => frames[0]?.['opacity'] === 0,
      )!;

      // Same window, same easing: whatever the old content has faded by, the new
      // one has arrived by, so the two always add up to a covered panel.
      expect(leaveOptions).toMatchObject({
        duration: enterOptions!.duration,
        easing: enterOptions!.easing,
      });
      // And no waypoint on either to bend one of them off that curve.
      expect(leaveFrames).toHaveLength(2);
      expect(enterFrames).toHaveLength(2);
      expect(leaveFrames.at(-1)).toMatchObject({ opacity: 0 });
      expect(enterFrames.at(-1)).toMatchObject({ opacity: 1 });
    });

    it('pins the old content to its own container while it fades', async () => {
      const container = q('#content-all').parentElement!;
      expect(container.style.position).toBe('');

      q('#tab-unread').click();
      await settle();
      // Anchored to the container, not to whatever is positioned further up the
      // page: only then does the container's `overflow` reach the old content
      // while the container is easing to its new height.
      expect(container.style.position).toBe('relative');
      expect(q('#content-all').offsetParent ?? container).toBe(container);

      finishes.forEach((finish) => finish());
      await settle();
      expect(container.style.position).toBe('');
    });

    describe('a bar being spammed', () => {
      let spam: ComponentFixture<SpamHost>;
      const panel = () => spam.nativeElement.querySelector('#spam-panel') as HTMLElement;
      const pick = async (key: string) => {
        (spam.nativeElement.querySelector(`#spam-${key}`) as HTMLElement).click();
        spam.detectChanges();
        await spam.whenStable();
      };

      /** Lets every fade land. The views go a promise deeper than `whenStable` waits. */
      const land = async () => {
        finishes.forEach((finish) => finish());
        await new Promise((resolve) => setTimeout(resolve));
        spam.detectChanges();
        await spam.whenStable();
      };

      beforeEach(async () => {
        spam = TestBed.createComponent(SpamHost);
        spam.detectChanges();
        await spam.whenStable();
      });

      it('holds the container open for every content still leaving, not just the first', async () => {
        await pick('b');
        expect(panel().style.position).toBe('relative');

        await pick('c');
        await pick('d');
        // The first fade landing must not take the pin the others are still on.
        finishes[0]();
        await new Promise((resolve) => setTimeout(resolve));
        expect(panel().style.position).toBe('relative');

        await land();
        expect(panel().style.position).toBe('');
      });

      it('never lets more than a couple of contents pile up out of its flow', async () => {
        for (const key of ['b', 'c', 'd', 'e', 'a', 'b', 'c']) {
          await pick(key);
          // One in the flow, and at most `MAX_LEAVING` pinned over it however
          // fast the tabs are clicked — no fade is left to land on its own here.
          expect(panel().children.length).toBeLessThanOrEqual(3);
        }

        await land();
        expect(panel().children.length).toBe(1);
        expect(panel().querySelector('#spam-content-c')).not.toBeNull();
      });

      it('hurries the fades it has already got running when another starts', async () => {
        await pick('b');
        const [running] = animate.mock.results
          .map((result) => result.value)
          .filter((animation) => animation.finish.getMockName);

        await pick('c');
        expect(running.updatePlaybackRate).toHaveBeenCalled();
      });
    });
  });

  it('ties each tab to its panel and hides the panels of unselected tabs', async () => {
    expect(q('#tab-all').getAttribute('aria-controls')).toBe('panel-all');
    expect(q('#panel-all').getAttribute('role')).toBe('tabpanel');
    expect(q('#panel-all').getAttribute('aria-labelledby')).toBe('tab-all');
    expect(q('#panel-all').hidden).toBe(false);
    expect(q('#panel-unread').hidden).toBe(true);

    q('#tab-unread').click();
    await settle();

    expect(q('#panel-all').hidden).toBe(true);
    expect(q('#panel-unread').hidden).toBe(false);
  });

  it('points tabs without a panel at the shared one, labelled by the selected tab', async () => {
    expect(q('#tab-starred').getAttribute('aria-controls')).toBe('panel-shared');
    expect(q('#panel-shared').hidden).toBe(false);
    expect(q('#panel-shared').getAttribute('aria-labelledby')).toBe('tab-all');

    q('#tab-starred').click();
    await settle();

    expect(q('#panel-shared').hidden).toBe(false);
    expect(q('#panel-shared').getAttribute('aria-labelledby')).toBe('tab-starred');
  });

  it("rests the indicator on the selected tab's box", async () => {
    mockBoxes();

    q('#tab-unread').click();
    await settle();

    const style = bar().style;
    expect(style.getPropertyValue('--liquid-tabs-indicator-x')).toBe('63px');
    expect(style.getPropertyValue('--liquid-tabs-indicator-y')).toBe('3px');
    expect(style.getPropertyValue('--liquid-tabs-indicator-width')).toBe('84px');
    expect(style.getPropertyValue('--liquid-tabs-indicator-height')).toBe('28px');
    expect(bar().classList.contains('has-selection')).toBe(true);
  });

  it('reaches toward the next tab with the edge facing it before moving over', async () => {
    mockBoxes();
    // jsdom has no Web Animations; stand one in that records the keyframes.
    const animate = vi.fn((_frames: Keyframe[], _options?: KeyframeAnimationOptions) => ({
      playState: 'finished',
      cancel: vi.fn(),
    }));
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });

    try {
      // Rests the pill on a mocked box first, so the next moves start from one.
      q('#tab-unread').click();
      await settle();
      animate.mockClear();

      // Leftward: the start edge reaches out, the end edge holds.
      q('#tab-all').click();
      await settle();
      // The pill's own move — tab content crossfades are recorded here too, but only
      // the pill animates its size.
      const pillFrames = () =>
        animate.mock.calls.find(([candidate]) => 'width' in (candidate[0] ?? {}))![0];
      let frames = pillFrames();
      expect(frames[0]).toMatchObject({ translate: '63px 3px', width: '84px' });
      expect(frames[1]).toMatchObject({ translate: '53px 3px', width: '94px' });
      expect(frames.at(-1)).toMatchObject({ translate: '3px 3px', width: '60px', scale: '1 1' });

      // Rightward: the end edge reaches out, the start edge holds.
      animate.mockClear();
      q('#tab-unread').click();
      await settle();
      frames = pillFrames();
      expect(frames[1]).toMatchObject({ translate: '3px 3px', width: '70px' });
      expect(frames.at(-1)).toMatchObject({ translate: '63px 3px', width: '84px' });
    } finally {
      delete (HTMLElement.prototype as { animate?: unknown }).animate;
    }
  });
});

describe('LiquidTabs default', () => {
  it('starts on the default tab, unless a value is bound or that tab is disabled', async () => {
    await TestBed.configureTestingModule({ imports: [DefaultHost] }).compileComponents();
    const fixture = TestBed.createComponent(DefaultHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const selected = (id: string) =>
      fixture.nativeElement.querySelector(id).getAttribute('aria-selected');

    // Nothing bound: the default is selected.
    expect(selected('#plain-unread')).toBe('true');
    expect(selected('#plain-all')).toBe('false');

    // A bound value wins, and is left as it was.
    expect(selected('#bound-all')).toBe('true');
    expect(fixture.componentInstance.bound()).toBe('all');

    // A disabled default is skipped, leaving nothing selected.
    expect(selected('#off-archived')).toBe('false');
    expect(selected('#off-all')).toBe('false');
  });

  it('waits for tabs built by an `@for` to have their values bound', async () => {
    await TestBed.configureTestingModule({ imports: [LoopHost] }).compileComponents();
    const fixture = TestBed.createComponent(LoopHost);
    // The first render reads every tab while the later ones are still to be
    // bound; reading a required input that early used to throw NG0950.
    expect(() => fixture.detectChanges()).not.toThrow();
    await fixture.whenStable();
    const selected = (id: string) =>
      fixture.nativeElement.querySelector(id).getAttribute('aria-selected');

    expect(selected('#loop-unread')).toBe('true');
    expect(selected('#loop-all')).toBe('false');

    // And a value bound to a tab the bar only reaches on a later pass still lands.
    expect(selected('#loop-bound-archived')).toBe('true');
  });
});

describe('LiquidTabs persist', () => {
  let fixture: ComponentFixture<PersistHost>;

  /** `setup` runs before the first render, where the bar picks the tab it starts on. */
  const build = async (setup?: (host: PersistHost) => void) => {
    await TestBed.configureTestingModule({ imports: [PersistHost] }).compileComponents();
    fixture = TestBed.createComponent(PersistHost);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const q = (id: string) => fixture.nativeElement.querySelector(id) as HTMLElement;
  const selected = (id: string) => q(id).getAttribute('aria-selected');
  /** Throws away the bar and builds a fresh one, the way a reload would. */
  const rebuild = async (setup?: (host: PersistHost) => void) => {
    fixture.destroy();
    TestBed.resetTestingModule();
    await build(setup);
  };

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await build();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts the next build on the tab last selected, ahead of the default', async () => {
    expect(selected('#kept-all')).toBe('true');

    q('#kept-starred').click();
    await settle();
    expect(localStorage.getItem('spec:tabs')).toBe('"starred"');

    await rebuild();
    expect(selected('#kept-starred')).toBe('true');
    expect(selected('#kept-all')).toBe('false');
  });

  it('falls back to the default when the remembered tab is gone or disabled', async () => {
    q('#kept-unread').click();
    await settle();

    // Gone.
    localStorage.setItem('spec:tabs', '"archived"');
    await rebuild();
    expect(selected('#kept-all')).toBe('true');

    // There, but disabled.
    localStorage.setItem('spec:tabs', '"starred"');
    await rebuild((host) =>
      host.tabs.update((tabs) =>
        tabs.map((tab) => (tab.value === 'starred' ? { ...tab, disabled: true } : tab)),
      ),
    );
    expect(selected('#kept-all')).toBe('true');
    expect(selected('#kept-starred')).toBe('false');
  });

  it('keeps the selection in session storage when asked to', async () => {
    fixture.componentInstance.store.set('session');
    await settle();

    q('#kept-unread').click();
    await settle();

    expect(sessionStorage.getItem('spec:tabs')).toBe('"unread"');
    expect(localStorage.getItem('spec:tabs')).toBeNull();
  });

  it('remembers nothing without a key, and forgets on clearPersisted()', async () => {
    fixture.componentInstance.key.set(undefined);
    await settle();
    q('#kept-unread').click();
    await settle();
    expect(localStorage.getItem('spec:tabs')).toBeNull();

    fixture.componentInstance.key.set('spec:tabs');
    await settle();
    q('#kept-starred').click();
    await settle();
    expect(localStorage.getItem('spec:tabs')).toBe('"starred"');

    fixture.componentInstance.tabsRef().clearPersisted();
    expect(localStorage.getItem('spec:tabs')).toBeNull();

    await rebuild();
    expect(selected('#kept-all')).toBe('true');
  });
});

describe('LiquidTabs slider panel', () => {
  let fixture: ComponentFixture<SliderHost>;

  const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T | null;
  const host = () => fixture.componentInstance;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** A slide's resting offset: its own width per step, plus the 16px gap. */
  const at = (steps: number, axis: 'x' | 'y' = 'x') => {
    const along = `calc(${steps * 100}% + ${steps * 16}px)`;
    return axis === 'y' ? `0px ${along}` : `${along} 0px`;
  };
  /** Which contents are built, and where each is laid out along the row. */
  const laid = () =>
    host().keys.reduce<Record<string, string>>((row, key) => {
      const element = q(`#slide-content-${key}`);
      if (element) row[key] = element.style.translate;
      return row;
    }, {});
  const current = () => q('#slider-panel .liquid-tab-slide.is-current')?.id ?? null;

  /** Slides resolve as soon as they are asked to, so a switch lands within the test. */
  const animate = vi.fn(() => ({
    finished: Promise.resolve(),
    cancel: vi.fn(),
    finish: vi.fn(),
  }));

  beforeEach(async () => {
    animate.mockClear();
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    await TestBed.configureTestingModule({ imports: [SliderHost] }).compileComponents();
    fixture = TestBed.createComponent(SliderHost);
    await settle();
  });

  afterEach(() => {
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
    vi.restoreAllMocks();
  });

  it('builds the selected content and its neighbours, and nothing further out', () => {
    expect(q('#slider-panel')!.classList.contains('is-slider')).toBe(true);
    expect(laid()).toEqual({ a: at(0), b: at(1) });
    expect(current()).toBe('slide-content-a');
  });

  it('plays the neighbours down so the selected slide reads as the one in hand', () => {
    expect(q('#slide-content-a')!.style.scale).toBe('1');
    expect(q('#slide-content-a')!.style.opacity).toBe('1');
    expect(q('#slide-content-b')!.style.scale).toBe('0.94');
    expect(q('#slide-content-b')!.style.opacity).toBe('0.5');
  });

  it('leaves only the selected slide reachable', () => {
    expect(q('#slide-content-a')!.getAttribute('aria-hidden')).toBeNull();
    expect(q('#slide-content-a')!.inert).toBe(false);
    expect(q('#slide-content-b')!.getAttribute('aria-hidden')).toBe('true');
    expect(q('#slide-content-b')!.inert).toBe(true);
  });

  it('carries the whole row one step along on a switch', async () => {
    q('#slide-b')!.click();
    await settle();

    expect(laid()).toEqual({ a: at(-1), b: at(0), c: at(1) });
    expect(current()).toBe('slide-content-b');
    // The one that moved into the middle glided there from the edge it sat at,
    // coming up to full size as it went.
    expect(
      animate.mock.calls.some(
        ([frames]: any) =>
          frames[0]?.translate === at(1) &&
          frames[0]?.scale === '0.94' &&
          frames[1]?.translate === at(0) &&
          frames[1]?.scale === '1',
      ),
    ).toBe(true);
  });

  it('drops the contents that fall out of reach', async () => {
    q('#slide-c')!.click();
    await settle();
    q('#slide-d')!.click();
    await settle();

    expect(Object.keys(laid())).toEqual(['c', 'd', 'e']);
    expect(current()).toBe('slide-content-d');
  });

  it('brings a slide in from the side the bar came from, however far it jumped', async () => {
    // Three tabs on at once: the row is rebuilt around the tab picked rather
    // than walked to it, and the new content still arrives from the right.
    q('#slide-d')!.click();
    await settle();

    expect(laid()).toEqual({ c: at(-1), d: at(0), e: at(1) });
    expect(current()).toBe('slide-content-d');
    // The tab picked arrives from the right, the way the bar moved; the two that
    // come with it gather in over the nearer edge rather than racing across.
    expect(
      animate.mock.calls.some(
        ([frames]: any) => frames[0]?.translate === at(1) && frames[1]?.translate === at(0),
      ),
    ).toBe(true);
    expect(
      animate.mock.calls.some(
        ([frames]: any) => frames[0]?.translate === at(-2) && frames[1]?.translate === at(-1),
      ),
    ).toBe(true);
  });

  it('slides the other way going back along the bar', async () => {
    q('#slide-c')!.click();
    await settle();
    animate.mockClear();
    q('#slide-b')!.click();
    await settle();

    expect(laid()).toEqual({ a: at(-1), b: at(0), c: at(1) });
    expect(
      animate.mock.calls.some(
        ([frames]: any) => frames[0]?.translate === at(-1) && frames[1]?.translate === at(0),
      ),
    ).toBe(true);
  });

  it('lays a vertical bar out down the panel instead of across it', async () => {
    host().orientation.set('vertical');
    q('#slide-b')!.click();
    await settle();

    expect(q('#slider-panel')!.classList.contains('is-vertical')).toBe(true);
    expect(laid()).toEqual({ a: at(-1, 'y'), b: at(0, 'y'), c: at(1, 'y') });
  });

  it('falls back to one content at a time when the panel stops sliding', async () => {
    q('#slide-b')!.click();
    await settle();
    host().mode.set('dissolve');
    await settle();

    expect(q('#slider-panel')!.classList.contains('is-slider')).toBe(false);
    expect(Object.keys(laid())).toEqual(['b']);
    // The marks the slider left behind go with it.
    expect(q('#slide-content-b')!.style.translate).toBe('');
    expect(q('#slide-content-b')!.style.scale).toBe('');
    expect(q('#slide-content-b')!.style.opacity).toBe('');
    expect(q('#slide-content-b')!.classList.contains('liquid-tab-slide')).toBe(false);
  });
});
