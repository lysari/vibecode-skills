import { Component, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LiquidMenuHeaderIcon } from '@app/shared/components/liquid-menu-popup/liquid-menu-header-icon.directive';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidTabPanel } from '@app/shared/components/liquid-tabs/liquid-tab-panel.directive';
import { LiquidTab } from '@app/shared/components/liquid-tabs/liquid-tab.directive';
import { LiquidTabs } from '@app/shared/components/liquid-tabs/liquid-tabs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  ionCheckmarkDoneOutline,
  ionDocumentTextOutline,
  ionIdCardOutline,
  ionMegaphoneOutline,
  ionNotificationsOffOutline,
  ionNotificationsOutline,
  ionPhonePortraitOutline,
  ionShieldCheckmarkOutline,
} from '@ng-icons/ionicons';
import { AppNotification, NotificationKind, NotificationStore } from './notification.store';

type NotificationFilter = 'all' | 'unread';

const NOTIFICATION_ICONS: Record<NotificationKind, string> = {
  device: 'ionPhonePortraitOutline',
  security: 'ionShieldCheckmarkOutline',
  identity: 'ionIdCardOutline',
  document: 'ionDocumentTextOutline',
  system: 'ionMegaphoneOutline',
};

/**
 * The notification feed, made to sit inside an `<x-liquid-menu-popup>`:
 *
 * ```html
 * <x-liquid-menu-popup #notifyMenu="liquidMenu" role="dialog" title="Notifications">
 *   <ng-template liquidMenuContent>
 *     <app-notification />
 *   </ng-template>
 * </x-liquid-menu-popup>
 * ```
 *
 * Inside `liquidMenuContent` it is built on each open, so every open starts on
 * the All tab. It brings its own bell icon for the popup's title, and closes the
 * popup when an item navigates away; outside a popup it simply renders the feed.
 */
@Component({
  imports: [NgIcon, LiquidMenuHeaderIcon, LiquidTabs, LiquidTab, LiquidTabPanel],
  providers: [
    provideIcons({
      ionNotificationsOutline,
      ionCheckmarkDoneOutline,
      ionDocumentTextOutline,
      ionIdCardOutline,
      ionMegaphoneOutline,
      ionNotificationsOffOutline,
      ionPhonePortraitOutline,
      ionShieldCheckmarkOutline,
    }),
  ],
  selector: 'app-notification',
  styleUrl: './notification.scss',
  templateUrl: './notification.html',
})
export class Notification {
  private readonly store = inject(NotificationStore);
  private readonly router = inject(Router);
  /** The popup this is projected into — the same lookup `liquidMenuItem` makes. */
  private readonly menu = inject(LiquidMenuPopup, { optional: true });
  private readonly locale = inject(LOCALE_ID);

  protected readonly icons = NOTIFICATION_ICONS;
  protected readonly unreadCount = this.store.unreadCount;
  protected readonly filter = signal<NotificationFilter>('all');

  /**
   * The unread tab lists what was unread when it was picked, so an item read
   * from there loses its dot instead of vanishing from under the pointer.
   */
  private readonly unreadShown = signal<ReadonlySet<string>>(new Set());

  protected readonly groups = computed(() => {
    const unreadOnly = this.filter() === 'unread';
    const unreadShown = this.unreadShown();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const today: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    for (const item of this.store.notifications()) {
      if (unreadOnly && !unreadShown.has(item.id)) continue;
      (item.createdAt.getTime() >= startOfToday ? today : earlier).push(item);
    }

    return [
      { title: $localize`:@@notifications.today:Today`, items: today },
      { title: $localize`:@@notifications.earlier:Earlier`, items: earlier },
    ].filter((group) => group.items.length > 0);
  });

  private readonly relativeFormat = new Intl.RelativeTimeFormat(this.locale, {
    numeric: 'auto',
    style: 'short',
  });
  private readonly dateFormat = new Intl.DateTimeFormat(this.locale, {
    day: 'numeric',
    month: 'short',
  });

  constructor() {
    console.log("Notification")
  }

  protected setFilter(filter: NotificationFilter | null): void {
    if (!filter) return;
    if (filter === 'unread') {
      this.unreadShown.set(
        new Set(
          this.store
            .notifications()
            .filter((item) => !item.read)
            .map((item) => item.id),
        ),
      );
    }
    this.filter.set(filter);
  }

  protected open(item: AppNotification): void {
    this.store.markRead(item.id);
    if (!item.path) return;
    this.menu?.close('item');
    this.router.navigateByUrl(item.path);
  }

  protected markAllRead(): void {
    this.store.markAllRead();
  }

  /** "now", "12 min ago", "3 hr ago" — past a week, just the date. */
  protected relativeTime(date: Date): string {
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const elapsed = Math.abs(seconds);

    if (elapsed < 60) return this.relativeFormat.format(0, 'second');
    if (elapsed < 3600) return this.relativeFormat.format(Math.round(seconds / 60), 'minute');
    if (elapsed < 86_400) return this.relativeFormat.format(Math.round(seconds / 3600), 'hour');
    if (elapsed < 604_800) return this.relativeFormat.format(Math.round(seconds / 86_400), 'day');
    return this.dateFormat.format(date);
  }
}
