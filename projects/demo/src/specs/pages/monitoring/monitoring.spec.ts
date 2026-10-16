import { TestBed } from '@angular/core/testing';
import { Monitoring } from '@app/pages/monitoring/monitoring';

describe('Monitoring', () => {
  let page: HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(Monitoring);
    await fixture.whenStable();
    page = fixture.nativeElement as HTMLElement;
  });

  it('shows the monitoring and insights title', () => {
    expect(page.querySelector('h1')?.textContent).toContain('Monitoring & Insights');
    expect(page.querySelector('.subtitle')?.textContent).toContain(
      'Track infrastructure health and resource utilization',
    );
  });

  it('shows the primary compute selector with online indicator', () => {
    expect(page.querySelector('.pill-name')?.textContent).toContain('Primary');
    expect(page.querySelector('.status-indicator')?.getAttribute('aria-label')).toBe(
      'Status: online',
    );
  });

  it('lists the three resource configuration items', () => {
    const items = page.querySelectorAll('.resource-item');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('Base Capacity');
    expect(items[1].textContent).toContain('Scaling Limit');
    expect(items[2].textContent).toContain('Idle Timeout');
  });

  it('displays the transaction conflicts chart', () => {
    expect(page.querySelector('.conflicts-card h2')?.textContent).toContain(
      'Transaction Conflicts',
    );
    expect(page.querySelectorAll('.segmented-bar').length).toBe(2);
  });
});

