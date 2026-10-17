import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '@app/app.routes';
import { Sidebar } from '@app/shared/components/sidebar/sidebar';

describe('Sidebar', () => {
  it('renders navigation sections and active branch selector', async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter(routes)],
    }).compileComponents();

    const fixture = TestBed.createComponent(Sidebar);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.nav-section').length).toBe(3);
    expect(host.querySelector('.branch-label')?.textContent).toContain('production');
  });

  it('renders search trigger with hotkey badge', async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter(routes)],
    }).compileComponents();

    const fixture = TestBed.createComponent(Sidebar);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.search-trigger')).not.toBeNull();
    expect(host.querySelector('.search-placeholder')?.textContent).toContain('Search...');
    expect(host.querySelector('.hotkey')?.textContent).toBe('/');
  });
});

