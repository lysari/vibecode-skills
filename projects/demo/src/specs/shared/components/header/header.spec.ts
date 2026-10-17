import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from '@app/shared/components/header/header';

describe('Header', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders workspace account email, plan badge, and project name', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.account-email')?.textContent).toContain('cansaas@gmail.com');
    expect(host.querySelector('.badge-free')?.textContent).toContain('Free');
    expect(host.querySelector('.project-name')?.textContent).toContain('Monalisa');
    expect(host.querySelector('a.header-pill')?.getAttribute('href')).toBe('/components-docs');
  });

  it('renders notification and chatbot assistant buttons', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('button[aria-label="Notifications"]')).not.toBeNull();
    expect(host.querySelector('button[aria-label="Neon AI Assistant"]')).not.toBeNull();
    expect(host.querySelector('.assistant-label')?.textContent).toContain('Ask AI');
  });
});

