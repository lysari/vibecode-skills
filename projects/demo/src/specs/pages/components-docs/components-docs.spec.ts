import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ComponentsDocs } from '@app/pages/components-docs/components-docs';
import { DocsSidebar } from '@app/shared/components/docs-sidebar/docs-sidebar';

describe('ComponentsDocs', () => {
  let fixture: ComponentFixture<ComponentsDocs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentsDocs, DocsSidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentsDocs);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('lists every component as a link in DocsSidebar', async () => {
    const sidebarFixture = TestBed.createComponent(DocsSidebar);
    sidebarFixture.detectChanges();
    await sidebarFixture.whenStable();

    const sidebarEl = sidebarFixture.nativeElement as HTMLElement;
    const links = [...sidebarEl.querySelectorAll<HTMLAnchorElement>('a.nav-item')];
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      expect.arrayContaining([
        '/components-docs/liquid-input',
        '/components-docs/liquid-autocomplete',
        '/components-docs/liquid-upload',
        '/components-docs/liquid-button',
        '/components-docs/liquid-tabs',
        '/components-docs/number-slot',
      ]),
    );
  });
});
