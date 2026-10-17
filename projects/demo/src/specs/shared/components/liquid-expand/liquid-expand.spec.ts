import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { ionIdCard, ionQrCode } from '@ng-icons/ionicons';
import {
  LiquidAccordion,
  LiquidAccordionItem,
  LiquidExpand,
} from '@app/shared/components/liquid-expand';

const SAMPLE_ITEMS: LiquidAccordionItem[] = [
  {
    key: 'item-1',
    question: 'What is Khmer eID?',
    answer: 'A digital identity account for civil records.',
    icon: 'ionIdCard',
  },
  {
    key: 'item-2',
    question: 'How do I sign in?',
    answer: 'Scan the QR code with the mobile app.',
    icon: 'ionQrCode',
  },
  {
    key: 'item-3',
    question: 'Is it free?',
    answer: 'Creating an account is free.',
    disabled: true,
  },
];

@Component({
  imports: [LiquidAccordion, LiquidExpand],
  providers: [provideIcons({ ionIdCard, ionQrCode })],
  template: `
    <x-liquid-accordion
      id="faq-acc"
      [items]="items"
      [(value)]="activeKey"
    />

    <x-liquid-accordion
      id="multi-acc"
      [items]="items"
      multiple
      [(values)]="activeKeys"
    />

    <x-liquid-expand
      id="standalone"
      title="Standalone Details"
      [(expanded)]="standaloneOpen"
    >
      <p id="standalone-body">Detailed standalone content</p>
    </x-liquid-expand>
  `,
})
class HostComponent {
  readonly items = SAMPLE_ITEMS;
  readonly activeKey = signal<string | null>('item-1');
  readonly activeKeys = signal<string[]>(['item-1', 'item-2']);
  readonly standaloneOpen = signal(false);
}

describe('LiquidAccordion & LiquidExpand', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  describe('LiquidAccordion (Single mode)', () => {
    it('renders all items with accessible buttons and panels', () => {
      const accordion = element.querySelector('#faq-acc')!;
      const triggers = accordion.querySelectorAll('.liquid-expand-trigger');
      expect(triggers.length).toBe(3);

      expect(triggers[0].textContent).toContain('What is Khmer eID?');
      expect(triggers[1].textContent).toContain('How do I sign in?');

      const firstItem = accordion.querySelector('.liquid-expand-item')!;
      expect(firstItem.classList).toContain('is-open');

      const trigger = firstItem.querySelector('.liquid-expand-trigger')!;
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      const panel = firstItem.querySelector('.liquid-expand-panel')!;
      expect(panel.hasAttribute('inert')).toBe(false);
      expect(panel.textContent).toContain('A digital identity account');
    });

    it('toggles item closed when clicked again', async () => {
      const accordion = element.querySelector('#faq-acc')!;
      const triggers = accordion.querySelectorAll<HTMLButtonElement>('.liquid-expand-trigger');

      triggers[0].click();
      await fixture.whenStable();

      expect(host.activeKey()).toBeNull();
      const firstItem = accordion.querySelector('.liquid-expand-item')!;
      expect(firstItem.classList).not.toContain('is-open');
      expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
      expect(firstItem.querySelector('.liquid-expand-panel')?.hasAttribute('inert')).toBe(true);
    });

    it('switches open item and closes previous item', async () => {
      const accordion = element.querySelector('#faq-acc')!;
      const triggers = accordion.querySelectorAll<HTMLButtonElement>('.liquid-expand-trigger');

      triggers[1].click();
      await fixture.whenStable();

      expect(host.activeKey()).toBe('item-2');
      const items = accordion.querySelectorAll('.liquid-expand-item');
      expect(items[0].classList).not.toContain('is-open');
      expect(items[1].classList).toContain('is-open');
      expect(items[1].querySelector('.liquid-expand-panel')?.textContent).toContain('Scan the QR code');
    });

    it('does not toggle disabled items', async () => {
      const accordion = element.querySelector('#faq-acc')!;
      const triggers = accordion.querySelectorAll<HTMLButtonElement>('.liquid-expand-trigger');

      triggers[2].click();
      await fixture.whenStable();

      expect(host.activeKey()).toBe('item-1');
      const items = accordion.querySelectorAll('.liquid-expand-item');
      expect(items[2].classList).not.toContain('is-open');
    });
  });

  describe('LiquidAccordion (Multiple mode)', () => {
    it('supports multiple items being open at once', async () => {
      const accordion = element.querySelector('#multi-acc')!;
      const items = accordion.querySelectorAll('.liquid-expand-item');

      expect(items[0].classList).toContain('is-open');
      expect(items[1].classList).toContain('is-open');
      expect(host.activeKeys()).toEqual(['item-1', 'item-2']);

      const triggers = accordion.querySelectorAll<HTMLButtonElement>('.liquid-expand-trigger');
      triggers[0].click();
      await fixture.whenStable();

      expect(host.activeKeys()).toEqual(['item-2']);
      expect(items[0].classList).not.toContain('is-open');
      expect(items[1].classList).toContain('is-open');
    });
  });

  describe('LiquidExpand (Standalone)', () => {
    it('starts collapsed and opens on click', async () => {
      const standalone = element.querySelector('#standalone')!;
      const trigger = standalone.querySelector<HTMLButtonElement>('.liquid-expand-trigger')!;
      const panel = standalone.querySelector('.liquid-expand-panel')!;

      expect(host.standaloneOpen()).toBe(false);
      expect(panel.hasAttribute('inert')).toBe(true);

      trigger.click();
      await fixture.whenStable();

      expect(host.standaloneOpen()).toBe(true);
      expect(standalone.querySelector('.liquid-expand-item')?.classList).toContain('is-open');
      expect(panel.hasAttribute('inert')).toBe(false);
      expect(panel.textContent).toContain('Detailed standalone content');
    });
  });
});
