import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Search, SearchItem } from '@app/shared/components/search/search';

const items: SearchItem[] = [
  { title: 'Digital ID Card', path: '/id', section: 'Identity', icon: 'ionSearchOutline' },
  { title: 'Verify Identity', path: '/verify', section: 'Identity', icon: 'ionSearchOutline' },
  { title: 'Birth Certificate', path: '/birth', section: 'Documents', icon: 'ionSearchOutline' },
];

describe('Search', () => {
  let fixture: ComponentFixture<Search>;

  const options = () =>
    Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('[role="option"]'));
  const titles = () =>
    options().map((option) => option.querySelector('.search-option-title')?.textContent?.trim());

  const type = async (value: string) => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    // Node's test runner has no storage unless it is given a file; the component copes either way.
    globalThis.localStorage?.clear();
    await TestBed.configureTestingModule({
      imports: [Search],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Search);
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
  });

  it('suggests one page per section while the field is empty', () => {
    expect(titles()).toEqual(['Digital ID Card', 'Birth Certificate']);
  });

  it('filters by title and marks the matched text', async () => {
    await type('cert');
    expect(titles()).toEqual(['Birth Certificate']);
    expect(fixture.nativeElement.querySelector('mark')?.textContent).toBe('Cert');
  });

  it('matches on the section as well', async () => {
    await type('identity');
    expect(titles()).toEqual(['Digital ID Card', 'Verify Identity']);
  });

  it('shows the empty state when nothing matches', async () => {
    await type('zzz');
    expect(options().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.search-empty')).toBeTruthy();
  });
});
