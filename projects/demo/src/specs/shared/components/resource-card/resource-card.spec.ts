import { TestBed } from '@angular/core/testing';
import { ResourceCard } from '@app/shared/components/resource-card/resource-card';
import { RESOURCE_CARD } from '@app/shared/constants/dashboard';

describe('ResourceCard', () => {
  it('renders resource items and status text from config', async () => {
    const fixture = TestBed.createComponent(ResourceCard);
    fixture.componentRef.setInput('config', RESOURCE_CARD);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.resource-item').length).toBe(3);
    expect(host.querySelector('.status-value')?.textContent).toContain(
      'Healthy · Autoscaling active',
    );
  });
});

