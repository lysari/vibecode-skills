import { TestBed } from '@angular/core/testing';
import { MetricCard } from '@app/shared/components/metric-card/metric-card';
import { METRIC_CARDS } from '@app/shared/constants/dashboard';

describe('MetricCard', () => {
  it('renders KPI boxes when kpis are provided', async () => {
    const fixture = TestBed.createComponent(MetricCard);
    fixture.componentRef.setInput('config', METRIC_CARDS[0]);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.kpi-box').length).toBe(3);
    expect(host.querySelectorAll('.util-bar').length).toBe(7);
  });

  it('renders segmented bars for transaction conflict series', async () => {
    const fixture = TestBed.createComponent(MetricCard);
    fixture.componentRef.setInput('config', METRIC_CARDS[1]);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.segmented-bar').length).toBe(2);
  });
});

