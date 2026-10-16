import {
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  ionArrowDownOutline,
  ionArrowForwardOutline,
  ionArrowUpOutline,
  ionCloseCircle,
  ionReturnDownBackOutline,
  ionSearchOutline,
  ionTimeOutline,
} from '@ng-icons/ionicons';
import { LiquidMenuFooter } from '@app/shared/components/liquid-menu-popup/liquid-menu-footer.directive';
import { LiquidMenuHeaderIcon } from '@app/shared/components/liquid-menu-popup/liquid-menu-header-icon.directive';
import { highlight } from '@app/shared/utils/highlight';

export interface SearchItem {
  title: string;
  path: string;
  /** The heading it is listed under, and a second thing a query can match. */
  section: string;
  /** An ng-icon name; the component that owns the items registers the icon. */
  icon: string;
}

interface SearchResult {
  item: SearchItem;
  /** The title split around the matched text, so the match can be marked up. */
  before: string;
  match: string;
  after: string;
  /** Position across every group — what the arrow keys step through. */
  index: number;
}

interface SearchGroup {
  key: string;
  title: string;
  recent: boolean;
  results: SearchResult[];
}

const RECENT_KEY = 'khmer-eid:search-recent';
const RECENT_LIMIT = 4;

let searchUid = 0;

/**
 * Site search, made to sit inside an `<x-liquid-menu-popup>`:
 *
 * ```html
 * <x-liquid-menu-popup #searchMenu="liquidMenu" role="dialog" title="Search">
 *   <ng-template liquidMenuContent>
 *     <app-search [items]="searchItems" />
 *   </ng-template>
 * </x-liquid-menu-popup>
 * ```
 *
 * It brings its own title icon and key-hint footer, so the popup around it
 * needs nothing else.
 *
 * A combobox: the focus stays in the field and the arrow keys move the active
 * result, so typing never has to stop to pick one. Empty, it offers the pages
 * picked most recently and one suggestion per section.
 */
@Component({
  imports: [NgIcon, LiquidButton, LiquidMenuHeaderIcon, LiquidMenuFooter],
  providers: [
    provideIcons({
      ionArrowDownOutline,
      ionArrowForwardOutline,
      ionArrowUpOutline,
      ionCloseCircle,
      ionReturnDownBackOutline,
      ionSearchOutline,
      ionTimeOutline,
    }),
  ],
  selector: 'app-search',
  styleUrl: './search.scss',
  templateUrl: './search.html',
})
export class Search {
  readonly items = input.required<SearchItem[]>();

  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  /** The popup this is rendered in — the same lookup `liquidMenuItem` makes. */
  private readonly menu = inject(LiquidMenuPopup, { optional: true });

  protected readonly listboxId = `search-listbox-${++searchUid}`;

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  private readonly recentPaths = signal<string[]>(readRecent());

  private readonly recentTitle = $localize`:@@search.recent:Recent`;
  private readonly suggestedTitle = $localize`:@@search.suggested:Suggested`;

  private readonly term = computed(() => this.query().trim().toLocaleLowerCase());

  private readonly recent = computed(() => {
    const byPath = new Map(this.items().map((item) => [item.path, item]));
    return this.recentPaths()
      .map((path) => byPath.get(path))
      .filter((item): item is SearchItem => item !== undefined);
  });

  /** The first page of each section. */
  private readonly suggested = computed(() => {
    const sections = new Set<string>();
    const picks: SearchItem[] = [];
    for (const item of this.items()) {
      if (sections.has(item.section)) continue;
      sections.add(item.section);
      picks.push(item);
    }
    return picks;
  });

  protected readonly groups = computed<SearchGroup[]>(() => {
    const term = this.term();
    const drafts: (Omit<SearchGroup, 'results'> & { items: SearchItem[] })[] = [];

    if (!term) {
      const recent = this.recent();
      const recentPaths = new Set(recent.map((item) => item.path));
      drafts.push(
        { key: 'recent', title: this.recentTitle, recent: true, items: recent },
        {
          key: 'suggested',
          title: this.suggestedTitle,
          recent: false,
          items: this.suggested().filter((item) => !recentPaths.has(item.path)),
        },
      );
    } else {
      for (const item of this.items()) {
        if (!matches(item, term)) continue;
        const key = `section:${item.section}`;
        let draft = drafts.find((entry) => entry.key === key);
        if (!draft) {
          draft = { key, title: item.section, recent: false, items: [] };
          drafts.push(draft);
        }
        draft.items.push(item);
      }
    }

    let index = 0;
    return drafts
      .filter((draft) => draft.items.length > 0)
      .map(({ items, ...group }) => ({
        ...group,
        results: items.map((item) => ({ item, index: index++, ...highlight(item.title, term) })),
      }));
  });

  private readonly options = computed(() => this.groups().flatMap((group) => group.results));

  protected readonly activeOption = computed(() => this.options()[this.activeIndex()] ?? null);

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    if (!count) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex.update((index) => (index + step + count) % count);
      this.revealActive();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const option = this.activeOption();
      if (option) this.go(option.item);
    }
  }

  protected clear(field: HTMLInputElement): void {
    this.onInput('');
    field.focus();
  }

  protected clearRecent(): void {
    this.recentPaths.set([]);
    this.activeIndex.set(0);
    writeRecent([]);
  }

  protected go(item: SearchItem): void {
    const paths = [item.path, ...this.recentPaths().filter((path) => path !== item.path)];
    writeRecent(paths.slice(0, RECENT_LIMIT));

    this.menu?.close('item');
    this.router.navigateByUrl(item.path);
  }

  /** Keeps the active result in view once the list has re-rendered around it. */
  private revealActive(): void {
    afterNextRender(
      () => document.getElementById(this.optionId(this.activeIndex()))?.scrollIntoView({ block: 'nearest' }),
      { injector: this.injector },
    );
  }
}

function matches(item: SearchItem, term: string): boolean {
  return (
    item.title.toLocaleLowerCase().includes(term) ||
    item.section.toLocaleLowerCase().includes(term)
  );
}

/** Per browser, and allowed to fail: a private window or blocked storage just has no history. */
function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((path): path is string => typeof path === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeRecent(paths: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(paths));
  } catch {
    // Nothing to do: the history is a convenience.
  }
}
