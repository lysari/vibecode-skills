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

  it('marks Today as the current page in the main navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const current = (fixture.nativeElement as HTMLElement).querySelector('[aria-current="page"]');
    expect(current?.getAttribute('aria-label')).toBe('Today');
  });
});
