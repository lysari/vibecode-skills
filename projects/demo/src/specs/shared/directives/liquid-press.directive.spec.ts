import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';

@Component({
  imports: [LiquidPressable],
  template: `
    <button id="btn" type="button" liquidPress [disabled]="disabled()">
      <span id="label">Save</span>
    </button>
    <a id="link" href="/help" liquidPress><span>Help</span></a>
    <div id="tile" tabindex="0" liquidPress><span>Tile</span></div>
    <div id="marked" tabindex="0" liquidPress [attr.aria-disabled]="disabled()"><span>Marked</span></div>
    <span id="bare" liquidPress>Bare</span>
  `,
})
class Host {
  // Signals: components are OnPush by default, so a plain field change would never render.
  readonly disabled = signal(false);
}

describe('LiquidPressable', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  /** Records what each element was asked to animate, keyed by the element. */
  let animations: Array<{ element: Element; frames: Keyframe[] }>;

  const q = (selector: string) => fixture.nativeElement.querySelector(selector) as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const framesFor = (selector: string) =>
    animations.filter((call) => call.element.matches(selector)).map((call) => call.frames);
  const point = (selector: string, type: string) =>
    q(selector).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true }));
  const key = (selector: string, type: string, k: string) =>
    q(selector).dispatchEvent(new KeyboardEvent(type, { bubbles: true, key: k }));

  beforeEach(async () => {
    animations = [];
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      value: function (this: Element, frames: Keyframe[]) {
        animations.push({ element: this, frames });
        return { cancel: vi.fn(), finished: Promise.resolve(), playState: 'running' };
      },
    });

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  afterEach(() => {
    delete (Element.prototype as { animate?: unknown }).animate;
  });

  it('paints nothing and lays nothing out — it only squashes', async () => {
    // No class, no template, no extra elements: the host is exactly as authored.
    expect(q('#tile').className).toBe('');
    expect(q('#tile').children.length).toBe(1);

    point('#tile', 'pointerdown');
    await settle();
    expect(framesFor('#tile span')).toEqual([[{ scale: '1.08 0.9' }]]);
  });

  it('squashes the children, leaving the box free', async () => {
    point('#btn', 'pointerdown');
    await settle();

    expect(framesFor('#label')).toEqual([[{ scale: '1.08 0.9' }]]);
    // The box itself is whatever sizes or highlights it — never the press.
    expect(framesFor('#btn')).toEqual([]);
  });

  it('stands in for its own content when it holds nothing but text', async () => {
    point('#bare', 'pointerdown');
    await settle();

    expect(framesFor('#bare')).toEqual([[{ scale: '1.08 0.9' }]]);
  });

  it('springs back through the other shape on release', async () => {
    point('#btn', 'pointerdown');
    point('#btn', 'pointerup');
    await settle();

    const [, bounce] = framesFor('#label');
    expect(bounce?.map((frame) => frame['scale'])).toEqual([
      '1 1',
      '0.95 1.07',
      '1.02 0.985',
      // Implicit: lands wherever the element rests by then.
      undefined,
    ]);
  });

  it('squashes from where a child rests, and lands back there', async () => {
    // A child already scaled by a hover of its own — a service tile's icon plate.
    const label = q('#label');
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = real(element, pseudo);
      if (element !== label) return style;
      return new Proxy(style, {
        get: (target, name) => (name === 'scale' ? '1.06' : Reflect.get(target, name)),
      });
    });

    point('#btn', 'pointerdown');
    point('#btn', 'pointerup');
    await settle();

    const [squash, bounce] = framesFor('#label');
    // Relative to 1.06, not to 1, so the press does not start by shrinking it.
    expect(squash).toEqual([{ scale: '1.1448 0.954' }]);
    expect(bounce?.map((frame) => frame['scale'])).toEqual([
      '1.06',
      '1.007 1.1342',
      '1.0812 1.0441',
      // No value of its own: it eases into the hover scale instead of ending on
      // 1 and having the hover snap back in a single frame.
      undefined,
    ]);
  });

  it('lets go when the finger leaves without lifting', async () => {
    point('#btn', 'pointerdown');
    point('#btn', 'pointerleave');
    await settle();

    expect(framesFor('#label')).toHaveLength(2);
  });

  it('presses on Enter wherever it is put', async () => {
    key('#link', 'keydown', 'Enter');
    key('#tile', 'keydown', 'Enter');
    await settle();

    expect(framesFor('#link span')).toEqual([[{ scale: '1.08 0.9' }]]);
    expect(framesFor('#tile span')).toEqual([[{ scale: '1.08 0.9' }]]);
  });

  it('leaves Space to the page on a link, and takes it everywhere else', async () => {
    key('#link', 'keydown', ' ');
    key('#tile', 'keydown', ' ');
    key('#btn', 'keydown', ' ');
    await settle();

    // A link that squashed under Space would be answering a keystroke that is
    // about to scroll the page out from under it.
    expect(framesFor('#link span')).toEqual([]);
    expect(framesFor('#tile span')).toHaveLength(1);
    expect(framesFor('#label')).toHaveLength(1);
  });

  it('takes no press from a natively disabled host', async () => {
    host.disabled.set(true);
    await settle();

    point('#btn', 'pointerdown');
    key('#btn', 'keydown', 'Enter');
    await settle();

    expect(framesFor('#label')).toEqual([]);
  });

  it('takes no press from a host that only says it is disabled', async () => {
    host.disabled.set(true);
    await settle();
    expect(q('#marked').getAttribute('aria-disabled')).toBe('true');

    point('#marked', 'pointerdown');
    await settle();
    expect(framesFor('#marked span')).toEqual([]);

    // And presses again once the host says it is available.
    host.disabled.set(false);
    await settle();
    point('#marked', 'pointerdown');
    await settle();
    expect(framesFor('#marked span')).toHaveLength(1);
  });
});
