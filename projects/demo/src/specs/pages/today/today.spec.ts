import { TestBed } from '@angular/core/testing';
import { Today } from '@app/pages/today/today';

describe('Today', () => {
  let page: HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(Today);
    await fixture.whenStable();
    page = fixture.nativeElement as HTMLElement;
  });

  it('shows the daily focus class', () => {
    expect(page.querySelector('h1')?.textContent).toContain('Today');
    expect(page.querySelector('#focus-title')?.textContent).toContain('Power Sculpt');
  });

  it('describes the activity rings for screen readers', () => {
    expect(page.querySelector('.rings')?.getAttribute('aria-label')).toBe(
      'Activity: 3280 of 8000 steps, 460 of 500 kcal, 20 of 30 min',
    );
  });

  it('fills each ring to its share of the goal', () => {
    expect(page.querySelector('.ring.is-steps')?.getAttribute('stroke-dasharray')).toBe('41 100');
    expect(page.querySelector('.ring.is-move')?.getAttribute('stroke-dasharray')).toBe('92 100');
    expect(page.querySelector('.ring.is-exercise')?.getAttribute('stroke-dasharray')).toBe(
      '67 100',
    );
  });

  it('lists every followed trainer', () => {
    expect(page.querySelectorAll('.trainer').length).toBe(4);
  });
});
