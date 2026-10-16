import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from '@app/app';
import { routes } from '@app/app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('marks Monitoring as the active page in the branch navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const current = (fixture.nativeElement as HTMLElement).querySelector('.nav-item.is-active');
    expect(current?.textContent).toContain('Monitoring');
  });

  it('displays the workspace email and project title in the header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.account-email')?.textContent).toContain('cansaas@gmail.com');
    expect(host.querySelector('.project-name')?.textContent).toContain('Monalisa');
  });
});
