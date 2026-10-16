import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { LiquidMenuContent } from '@app/shared/components/liquid-menu-popup/liquid-menu-content.directive';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';
import { Search, type SearchItem } from '@app/shared/components/search/search';
import { provideIcons } from '@ng-icons/core';
import {
  ionCardOutline,
  ionFingerPrintOutline,
  ionGlobeOutline,
  ionKeyOutline,
  ionServerOutline,
  ionShieldCheckmarkOutline,
} from '@ng-icons/ionicons';

interface Section {
  id: string;
  title: string;
}

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

const SAMPLE_SEARCH_ITEMS: SearchItem[] = [
  {
    title: 'Cluster Topology & Health',
    path: '/monitoring',
    section: 'Analytics',
    icon: 'ionGlobeOutline',
  },
  {
    title: 'Metrics & Telemetry Stream',
    path: '/monitoring',
    section: 'Analytics',
    icon: 'ionServerOutline',
  },
  {
    title: 'Identity & Access Policies',
    path: '/components-docs/liquid-input',
    section: 'Security',
    icon: 'ionShieldCheckmarkOutline',
  },
  {
    title: 'OAuth API Credentials',
    path: '/components-docs/pincode-box',
    section: 'Security',
    icon: 'ionKeyOutline',
  },
  {
    title: 'Biometric eID Enrollment',
    path: '/components-docs/liquid-stepper',
    section: 'Identity',
    icon: 'ionFingerPrintOutline',
  },
  {
    title: 'Billing & Quota Management',
    path: '/components-docs/liquid-slider',
    section: 'Organization',
    icon: 'ionCardOutline',
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LiquidButton,
    LiquidMenuPopup,
    LiquidMenuTrigger,
    LiquidMenuContent,
    Search,
  ],
  providers: [
    provideIcons({
      ionCardOutline,
      ionFingerPrintOutline,
      ionGlobeOutline,
      ionKeyOutline,
      ionServerOutline,
      ionShieldCheckmarkOutline,
    }),
  ],
  selector: 'app-search-docs',
  styleUrls: ['../shared/docs-shared.scss', './search-docs.scss'],
  templateUrl: './search-docs.html',
})
export class SearchDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly allItems = SAMPLE_SEARCH_ITEMS;
  protected readonly sectionFilter = signal<string>('all');

  protected readonly items = computed(() => {
    const filter = this.sectionFilter();
    if (filter === 'all') return this.allItems;
    return this.allItems.filter((item) => item.section === filter);
  });

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'sizes', title: 'Contexts & Overlays' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected readonly apiRows: ApiRow[] = [
    {
      name: 'items',
      type: 'SearchItem[]',
      default: 'required',
      description: 'Collection of searchable items with title, path, section, and ng-icon name.',
    },
  ];

  protected readonly playMarkup = computed(() => {
    return [
      `<x-liquid-menu-popup #searchMenu="liquidMenu" role="dialog" title="Search">`,
      `  <ng-template liquidMenuContent>`,
      `    <app-search [items]="searchItems" />`,
      `  </ng-template>`,
      `</x-liquid-menu-popup>`,
    ].join('\n');
  });

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected scrollTo(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected setSectionFilter(sec: string): void {
    this.sectionFilter.set(sec);
  }
}
