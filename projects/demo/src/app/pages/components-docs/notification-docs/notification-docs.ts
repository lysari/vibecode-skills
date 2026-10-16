import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';
import { Notification } from '@app/shared/components/notification/notification';
import { NotificationStore } from '@app/shared/components/notification/notification.store';

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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LiquidButton,
    LiquidMenuPopup,
    LiquidMenuTrigger,
    Notification,
  ],
  selector: 'app-notification-docs',
  styleUrls: ['../shared/docs-shared.scss', './notification-docs.scss'],
  templateUrl: './notification-docs.html',
})
export class NotificationDocs {
  private readonly document = inject(DOCUMENT);
  protected readonly store = inject(NotificationStore);

  protected readonly containerWidth = signal(360);
  protected readonly containerHeight = signal(460);

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'sizes', title: 'Sizes & Popups' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected readonly apiRows: ApiRow[] = [
    {
      name: 'notifications',
      type: 'Signal<AppNotification[]>',
      default: 'store items',
      description: 'Read-only reactive signal array of active system notifications.',
    },
    {
      name: 'unreadCount',
      type: 'Signal<number>',
      default: 'computed',
      description: 'Total number of items currently in unread state.',
    },
    {
      name: 'filter',
      type: "Signal<'all' | 'unread'>",
      default: "'all'",
      description: 'Active tab filter controlling whether all or only unread items show.',
    },
    {
      name: 'markRead(id)',
      type: '(id: string) => void',
      default: 'method',
      description: 'Sets a specific notification item state to read.',
    },
    {
      name: 'markAllRead()',
      type: '() => void',
      default: 'method',
      description: 'Marks every current notification as read in a single batch.',
    },
  ];

  protected readonly playMarkup = computed(() => {
    return [
      `<x-liquid-menu-popup #notifyMenu="liquidMenu" role="dialog" title="Notifications">`,
      `  <app-notification />`,
      `</x-liquid-menu-popup>`,
      ``,
      `<button`,
      `  type="button"`,
      `  liquidButton="tinted"`,
      `  [liquidMenuTriggerFor]="notifyMenu"`,
      `>`,
      `  Notifications (${this.store.unreadCount()})`,
      `</button>`,
    ].join('\n');
  });

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected scrollTo(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected setWidth(val: number): void {
    this.containerWidth.set(val);
  }

  protected setHeight(val: number): void {
    this.containerHeight.set(val);
  }

  protected markAllAsRead(): void {
    this.store.markAllRead();
  }
}
