import { TestBed } from '@angular/core/testing';
import { Header } from '@app/shared/components/header/header';

describe('Header', () => {
  it('renders workspace account email, plan badge, and project name', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.account-email')?.textContent).toContain('cansaas@gmail.com');
    expect(host.querySelector('.badge-free')?.textContent).toContain('Free');
    expect(host.querySelector('.project-name')?.textContent).toContain('Monalisa');
  });
});

