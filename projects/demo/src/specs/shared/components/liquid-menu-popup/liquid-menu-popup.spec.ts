import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiquidMenuContent } from '@app/shared/components/liquid-menu-popup/liquid-menu-content.directive';
import { LiquidMenuFooter } from '@app/shared/components/liquid-menu-popup/liquid-menu-footer.directive';
import { LiquidMenuHeaderIcon } from '@app/shared/components/liquid-menu-popup/liquid-menu-header-icon.directive';
import { LiquidMenuHeader } from '@app/shared/components/liquid-menu-popup/liquid-menu-header.directive';
import { LiquidMenuItem } from '@app/shared/components/liquid-menu-popup/liquid-menu-item.directive';
import { LiquidMenuCloseReason, LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';

const KEY_CODES = { ArrowDown: 40, End: 35, Enter: 13, Escape: 27, Tab: 9 } as const;

/** A component that brings its own icon and footer, the way search and notifications do. */
@Component({
  selector: 'test-owned-slots',
  imports: [LiquidMenuHeaderIcon, LiquidMenuFooter],
  template: `
    <p>Body</p>
    <ng-template liquidMenuHeaderIcon><i class="owned-icon">*</i></ng-template>
    <ng-template liquidMenuFooter><span class="owned-footer">Owned</span></ng-template>
  `,
})
class OwnedSlots {}

@Component({
  imports: [
    LiquidMenuPopup,
    LiquidMenuTrigger,
    LiquidMenuItem,
    LiquidMenuContent,
    LiquidMenuHeader,
    LiquidMenuHeaderIcon,
    LiquidMenuFooter,
    OwnedSlots,
  ],
  template: `
    <button id="first" type="button" [liquidMenuTriggerFor]="menu">Open</button>
    <div id="icon" [liquidMenuTriggerFor]="menu">?</div>
    <x-liquid-menu-popup
      #menu="liquidMenu"
      title="Actions"
      (opened)="openCount = openCount + 1"
      (closed)="closedWith = $event"
    >
      <button liquidMenuItem type="button" (click)="picked = 'one'">One</button>
      <button liquidMenuItem type="button" disabled>Two</button>
      <button liquidMenuItem type="button">Three</button>
    </x-liquid-menu-popup>

    <button id="info" type="button" [liquidMenuTriggerFor]="info">Info</button>
    <x-liquid-menu-popup
      #info="liquidMenu"
      role="dialog"
      title="About"
      (closed)="infoClosedWith = $event"
    >
      <ng-template liquidMenuHeaderIcon><i class="about-icon">i</i></ng-template>
      <a href="#">Read more</a>
    </x-liquid-menu-popup>

    <button id="card" type="button" [liquidMenuTriggerFor]="card" [liquidMenuTriggerData]="'Sok Dara'">
      Card
    </button>
    <x-liquid-menu-popup #card="liquidMenu" role="dialog" title="Profile">
      <ng-template liquidMenuHeader let-name let-close="close">
        <strong class="custom-header">{{ name }}</strong>
        <button id="header-close" type="button" (click)="close()">Close</button>
      </ng-template>
      <ng-template liquidMenuContent>
        <input id="lazy-field" autofocus />
      </ng-template>
      <ng-template liquidMenuFooter let-name let-close="close">
        <span class="custom-footer">Signed in as {{ name }}</span>
        <button id="footer-close" type="button" (click)="close()">Done</button>
      </ng-template>
    </x-liquid-menu-popup>

    <button id="owned" type="button" [liquidMenuTriggerFor]="owned">Owned</button>
    <x-liquid-menu-popup #owned="liquidMenu" role="dialog" title="Owned">
      <ng-template liquidMenuContent><test-owned-slots /></ng-template>
    </x-liquid-menu-popup>

    <button id="account" type="button" [liquidMenuTriggerFor]="account">Account</button>
    <x-liquid-menu-popup
      #account="liquidMenu"
      title="Account"
      (closed)="accountClosedWith = $event"
    >
      <button id="sign-out" liquidMenuItem type="button" [liquidMenuTriggerFor]="confirm">
        Sign out
      </button>
    </x-liquid-menu-popup>
    <x-liquid-menu-popup #confirm="liquidMenu" role="dialog" title="Sign out?">
      <button id="confirm-cancel" type="button" autofocus (click)="confirm.close()">Cancel</button>
      <button id="confirm-ok" type="button" (click)="confirm.closeAll()">Sign out</button>
    </x-liquid-menu-popup>

    <button id="loose" type="button" [liquidMenuTriggerFor]="loose">Loose</button>
    <x-liquid-menu-popup
      #loose="liquidMenu"
      role="dialog"
      title="Loose"
      [overlay]="false"
      (closed)="looseClosedWith = $event"
    >
      <p id="loose-body">Body</p>
    </x-liquid-menu-popup>

    <button id="sticky" type="button" [liquidMenuTriggerFor]="sticky">Sticky</button>
    <x-liquid-menu-popup
      #sticky="liquidMenu"
      role="dialog"
      title="Sticky"
      [closeOnOutsideClick]="false"
      (closed)="stickyClosedWith = $event"
    >
      <p>Body</p>
    </x-liquid-menu-popup>

    <button id="outside" type="button">Outside</button>
  `,
})
class Host {
  openCount = 0;
  picked: string | null = null;
  closedWith: LiquidMenuCloseReason | null = null;
  infoClosedWith: LiquidMenuCloseReason | null = null;
  accountClosedWith: LiquidMenuCloseReason | null = null;
  looseClosedWith: LiquidMenuCloseReason | null = null;
  stickyClosedWith: LiquidMenuCloseReason | null = null;
}

describe('LiquidMenuPopup', () => {
  let fixture: ComponentFixture<Host>;

  const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
    fixture.nativeElement.querySelector(selector) as T;
  const panels = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.liquid-menu-popup')) as HTMLElement[];
  const items = () => Array.from(panels()[0].querySelectorAll('button')) as HTMLButtonElement[];
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = async (target: HTMLElement, name: keyof typeof KEY_CODES) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, key: name });
    // The CDK key manager still reads `keyCode`, which browsers fill in and jsdom does not.
    Object.defineProperty(event, 'keyCode', { value: KEY_CODES[name] });
    target.dispatchEvent(event);
    await settle();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  afterEach(() => vi.restoreAllMocks());

  it('opens from its trigger and lands on the first item', async () => {
    q('#first').click();
    await settle();

    const [panel] = panels();
    expect(panel.getAttribute('role')).toBe('menu');
    expect(document.activeElement).toBe(items()[0]);
    expect(fixture.componentInstance.openCount).toBe(1);
  });

  it('marks only the trigger that opened a shared menu as expanded', async () => {
    q('#first').click();
    await settle();

    const [panel] = panels();
    expect(q('#first').getAttribute('aria-expanded')).toBe('true');
    expect(q('#first').getAttribute('aria-controls')).toBe(panel.id);
    expect(q('#icon').getAttribute('aria-expanded')).toBe('false');
    expect(q('#icon').hasAttribute('aria-controls')).toBe(false);
  });

  it('moves with the arrow keys, skipping disabled items and wrapping', async () => {
    q('#first').click();
    await settle();
    const [one, two, three] = items();

    expect(two.getAttribute('aria-disabled')).toBe('true');

    await key(one, 'ArrowDown');
    expect(document.activeElement).toBe(three);

    await key(three, 'ArrowDown');
    expect(document.activeElement).toBe(one);

    await key(one, 'End');
    expect(document.activeElement).toBe(three);
  });

  it('closes when an item is clicked and hands focus back to the trigger', async () => {
    q('#first').click();
    await settle();

    items()[0].click();
    await settle();

    expect(fixture.componentInstance.picked).toBe('one');
    expect(fixture.componentInstance.closedWith).toBe('item');
    expect(document.activeElement).toBe(q('#first'));

    // Unmounts once the shrink animation reports it is done.
    panels()[0].dispatchEvent(new Event('animationend'));
    await settle();
    expect(panels()).toHaveLength(0);
  });

  it('closes on Tab and on Escape', async () => {
    q('#first').click();
    await settle();
    await key(items()[0], 'Tab');
    expect(fixture.componentInstance.closedWith).toBe('tab');
    expect(document.activeElement).toBe(q('#first'));

    q('#first').click();
    await settle();
    await key(items()[0], 'Escape');
    expect(fixture.componentInstance.closedWith).toBe('escape');
  });

  it('makes a non-button trigger focusable and opens it from the keyboard', async () => {
    const icon = q('#icon');
    expect(icon.getAttribute('tabindex')).toBe('0');
    expect(icon.getAttribute('role')).toBe('button');
    expect(icon.getAttribute('aria-haspopup')).toBe('menu');

    await key(icon, 'Enter');
    expect(icon.getAttribute('aria-expanded')).toBe('true');
  });

  it('opens a menu with ArrowDown on its trigger', async () => {
    await key(q('#first'), 'ArrowDown');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('as a dialog, focuses the panel and closes when focus leaves it', async () => {
    const trigger = q('#info');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');

    trigger.click();
    await settle();

    const [panel] = panels();
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(document.activeElement).toBe(panel);

    // Tab is not intercepted: the content is there to be tabbed through.
    await key(panel, 'Tab');
    expect(fixture.componentInstance.infoClosedWith).toBeNull();

    q<HTMLButtonElement>('#outside').focus();
    await settle();
    expect(fixture.componentInstance.infoClosedWith).toBe('focusout');
    expect(document.activeElement).toBe(q('#outside'));
  });

  it('puts a header icon in front of the default title, hidden from screen readers', async () => {
    q('#info').click();
    await settle();

    const title = panels()[0].querySelector('.liquid-menu-popup-title') as HTMLElement;
    const icon = title.querySelector('.liquid-menu-popup-title-icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.querySelector('.about-icon')).toBeTruthy();
    expect(title.querySelector('.liquid-menu-popup-title-text')?.textContent).toBe('About');
  });

  it('draws no header icon where none is given', async () => {
    q('#first').click();
    await settle();
    expect(panels()[0].querySelector('.liquid-menu-popup-title-icon')).toBeNull();
  });

  it('draws a custom header in place of the title, given the trigger data', async () => {
    q('#card').click();
    await settle();

    const [panel] = panels();
    const header = panel.querySelector('.liquid-menu-popup-header') as HTMLElement;
    expect(panel.querySelector('.liquid-menu-popup-title')).toBeNull();
    expect(header.querySelector('.custom-header')?.textContent).toBe('Sok Dara');
    // Still what the panel is labelled by.
    expect(panel.getAttribute('aria-labelledby')).toBe(header.id);
  });

  it('closes from the header through its close()', async () => {
    q('#card').click();
    await settle();

    q('#header-close').click();
    await settle();
    expect(q('#card').getAttribute('aria-expanded')).toBe('false');
  });

  it('draws a footer under the body, given the trigger data and close()', async () => {
    expect(q('.custom-footer')).toBeNull();

    q('#card').click();
    await settle();

    const [panel] = panels();
    const footer = panel.querySelector('.liquid-menu-popup-body + .liquid-menu-popup-footer');
    expect(footer?.querySelector('.custom-footer')?.textContent).toBe('Signed in as Sok Dara');

    q('#footer-close').click();
    await settle();
    expect(q('#card').getAttribute('aria-expanded')).toBe('false');
  });

  it('draws no footer when none is given', async () => {
    q('#first').click();
    await settle();
    expect(panels()[0].querySelector('.liquid-menu-popup-footer')).toBeNull();
  });

  it('draws slots a component inside the popup declares, and drops them with it', async () => {
    q('#owned').click();
    await settle();

    const [panel] = panels();
    expect(panel.querySelector('.liquid-menu-popup-title-icon .owned-icon')).toBeTruthy();
    expect(panel.querySelector('.liquid-menu-popup-footer .owned-footer')).toBeTruthy();

    // Closing destroys the component, and its slots unregister with it.
    q('#owned').click();
    await settle();
    panels()[0].dispatchEvent(new Event('animationend'));
    await settle();
    expect(panels()).toHaveLength(0);

    // Reopening registers them once more, not twice.
    q('#owned').click();
    await settle();
    expect(panels()[0].querySelectorAll('.owned-footer')).toHaveLength(1);
    expect(panels()[0].querySelectorAll('.owned-icon')).toHaveLength(1);
  });

  it('creates lazy content only while open and lands on its [autofocus]', async () => {
    expect(q('#lazy-field')).toBeNull();

    q('#card').click();
    await settle();
    expect(document.activeElement).toBe(q('#lazy-field'));
  });

  it('keeps the title and role inputs off the host element', () => {
    for (const host of fixture.nativeElement.querySelectorAll('x-liquid-menu-popup')) {
      expect(host.hasAttribute('title')).toBe(false);
      expect(host.hasAttribute('role')).toBe(false);
    }
  });

  describe('closing from outside', () => {
    const overlays = () =>
      Array.from(fixture.nativeElement.querySelectorAll('.liquid-menu-popup-overlay')) as HTMLElement[];
    const pointerdown = async (target: HTMLElement) => {
      target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      await settle();
    };

    it('closes on a click on the overlay by default', async () => {
      q('#first').click();
      await settle();
      expect(overlays()).toHaveLength(1);

      overlays()[0].click();
      await settle();
      expect(fixture.componentInstance.closedWith).toBe('backdrop');
      expect(document.activeElement).toBe(q('#first'));
    });

    it('with no overlay, closes on a press anywhere outside and leaves focus to it', async () => {
      q('#loose').click();
      await settle();
      expect(overlays()).toHaveLength(0);

      await pointerdown(q('#loose-body'));
      expect(fixture.componentInstance.looseClosedWith).toBeNull();

      await pointerdown(q('#outside'));
      expect(fixture.componentInstance.looseClosedWith).toBe('outside');
      expect(document.activeElement).not.toBe(q('#loose'));
    });

    it('with no overlay, leaves a press on its own trigger to the trigger', async () => {
      q('#loose').click();
      await settle();

      await pointerdown(q('#loose'));
      // The press moves focus onto the trigger before its click lands.
      q('#loose').focus();
      await settle();
      expect(fixture.componentInstance.looseClosedWith).toBeNull();

      q('#loose').click();
      await settle();
      expect(fixture.componentInstance.looseClosedWith).toBe('trigger');
    });

    it('stays up on a click outside when closeOnOutsideClick is off', async () => {
      q('#sticky').click();
      await settle();

      overlays()[0].click();
      await settle();
      expect(fixture.componentInstance.stickyClosedWith).toBeNull();
      expect(q('#sticky').getAttribute('aria-expanded')).toBe('true');

      await key(panels()[0], 'Escape');
      expect(fixture.componentInstance.stickyClosedWith).toBe('escape');
    });
  });

  describe('stacked', () => {
    const openStack = async () => {
      q('#account').click();
      await settle();
      q('#sign-out').click();
      await settle();
    };
    const accountPanel = () => q('#sign-out').closest('.liquid-menu-popup') as HTMLElement;

    it('keeps the menu open and covered under a popup opened from its item', async () => {
      await openStack();

      expect(panels()).toHaveLength(2);
      expect(accountPanel().classList.contains('is-covered')).toBe(true);
      expect(q('#sign-out').getAttribute('aria-expanded')).toBe('true');
      // Focus moving into the new popup did not count as leaving the menu.
      expect(fixture.componentInstance.accountClosedWith).toBeNull();
      expect(document.activeElement).toBe(q('#confirm-cancel'));
    });

    it('steps back on Escape: only the top popup closes, and the menu uncovers', async () => {
      await openStack();

      await key(q('#confirm-cancel'), 'Escape');

      expect(q('#sign-out').getAttribute('aria-expanded')).toBe('false');
      expect(accountPanel().classList.contains('is-covered')).toBe(false);
      expect(fixture.componentInstance.accountClosedWith).toBeNull();
      expect(document.activeElement).toBe(q('#sign-out'));
    });

    it('marks the panel settled only once its grow animation ends', async () => {
      q('#account').click();
      await settle();
      expect(accountPanel().classList.contains('is-settled')).toBe(false);

      accountPanel().dispatchEvent(new Event('animationend'));
      await settle();
      expect(accountPanel().classList.contains('is-settled')).toBe(true);
    });

    it('closes the whole stack with closeAll()', async () => {
      await openStack();

      q('#confirm-ok').click();
      await settle();

      expect(fixture.componentInstance.accountClosedWith).toBe('program');
      expect(q('#sign-out').getAttribute('aria-expanded')).toBe('false');
      expect(q('#account').getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(q('#account'));
    });
  });

  describe('placement', () => {
    const openAt = async (top: number) => {
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200);
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(500);
      const trigger = q('#first');
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(100, top, 40, 40),
      );
      trigger.click();
      await settle();
      return panels()[0];
    };

    beforeEach(() => {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    });

    it('keeps the shrink aimed at the trigger when the page scrolls during the close', async () => {
      const panel = await openAt(100);
      expect(panel.style.getPropertyValue('--menu-origin-y')).toBe('-48px');

      await key(items()[0], 'Escape');
      vi.spyOn(q('#first'), 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 60, 40, 40));
      window.dispatchEvent(new Event('scroll'));

      expect(panel.style.getPropertyValue('--menu-origin-y')).toBe('-88px');
    });

    it('flips above when only that side fits', async () => {
      const panel = await openAt(700);

      expect(panel.style.top).toBe(`${700 - 8 - 500}px`);
      expect(panel.style.getPropertyValue('--menu-height')).toBe('500px');
    });

    it('caps the height to the roomier side when neither fits', async () => {
      const panel = await openAt(300);
      // Below: 768 − 340 − 16 = 412 of room, more than the 284 above.
      expect(panel.style.top).toBe('348px');
      expect(panel.style.getPropertyValue('--menu-height')).toBe('412px');
      expect(panel.style.getPropertyValue('--menu-content-height')).toBe('412px');
    });
  });
});
