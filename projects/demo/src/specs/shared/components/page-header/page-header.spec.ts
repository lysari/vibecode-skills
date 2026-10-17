import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PageHeader } from '@app/shared/components/page-header/page-header';
import { LiquidTab } from '@app/shared/components/liquid-tabs/liquid-tab.directive';
import { MONITORING_HEADER } from '@app/shared/constants/dashboard';

@Component({
  imports: [PageHeader],
  template: `<app-page-header [config]="headerConfig" />`,
})
class TestHost {
  headerConfig = MONITORING_HEADER;
}

describe('PageHeader', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders title, subtitle, and endpoint meta chips', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.title')?.textContent).toContain('Monitoring & Insights');
    expect(host.querySelector('.subtitle')?.textContent).toContain(
      'Track infrastructure health',
    );
    expect(host.querySelectorAll('.meta-chip').length).toBe(3);
  });

  it('renders liquid tabs for range controls', () => {
    const tabs = fixture.debugElement.query(By.css('x-liquid-tabs'));
    expect(tabs).not.toBeNull();
    const tabButtons = fixture.debugElement.queryAll(By.directive(LiquidTab));
    expect(tabButtons.length).toBe(4);
  });

  it('renders refresh button and emits refresh on click', () => {
    const host = fixture.nativeElement as HTMLElement;
    const refreshBtn = host.querySelector('.refresh-btn') as HTMLButtonElement;
    expect(refreshBtn).not.toBeNull();
    expect(refreshBtn.textContent).toContain('Refresh');
  });
});
