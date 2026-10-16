import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Chatbot } from '@app/shared/components/chatbot/chatbot';
import { FAQ_ITEMS } from '@app/shared/constants/faq';

describe('Chatbot', () => {
  let fixture: ComponentFixture<Chatbot>;
  let element: HTMLElement;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [Chatbot],
    }).compileComponents();

    fixture = TestBed.createComponent(Chatbot);
    element = fixture.nativeElement;
    await settle();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial bot greeting message', () => {
    const bubbles = element.querySelectorAll('.chat-bubble');
    expect(bubbles.length).toBe(1);
    expect(bubbles[0].textContent).toContain('Hi! I can help');
  });

  it('renders quick FAQ suggestions', () => {
    const suggestions = element.querySelectorAll('.chat-suggestion');
    expect(suggestions.length).toBe(FAQ_ITEMS.length);
    expect(suggestions[0].textContent?.trim()).toBe(FAQ_ITEMS[0].question);
  });

  it('picking a suggestion removes it from available suggestions and triggers response', async () => {
    const firstBtn = element.querySelector('.chat-suggestion') as HTMLButtonElement;
    firstBtn.click();
    await settle();

    const remaining = element.querySelectorAll('.chat-suggestion');
    expect(remaining.length).toBe(FAQ_ITEMS.length - 1);

    vi.advanceTimersByTime(800);
    await settle();

    const bubbles = element.querySelectorAll('.chat-bubble');
    expect(bubbles.length).toBe(3);
    expect(bubbles[2].textContent?.trim()).toBe(FAQ_ITEMS[0].answer);
  });
});
