import { Injectable, computed, signal } from '@angular/core';

export type NotificationKind = 'device' | 'security' | 'identity' | 'document' | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: Date;
  read: boolean;
  /** Where clicking it goes; absent for a notice that is only there to be read. */
  path?: string;
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

/** The signed-in user's notifications, shared by the header bell and the feed. */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  // Placeholder feed until notifications are stored per user in Firestore.
  private readonly items = signal<AppNotification[]>([
    {
      id: 'n1',
      kind: 'device',
      title: 'New sign-in request',
      body: 'iPhone 15 Pro near Phnom Penh is asking to sign in. Approve it from the mobile app if it was you.',
      createdAt: minutesAgo(2),
      read: false,
      path: '/user-panel',
    },
    {
      id: 'n2',
      kind: 'security',
      title: 'Signed in on a new browser',
      body: "Chrome on macOS signed in with a QR code. If this wasn't you, sign that device out.",
      createdAt: minutesAgo(48),
      read: false,
      path: '/user-panel',
    },
    {
      id: 'n3',
      kind: 'identity',
      title: 'Your Digital ID card is ready',
      body: 'Add it to the Khmer eID app to show it at service counters.',
      createdAt: minutesAgo(180),
      read: false,
    },
    {
      id: 'n4',
      kind: 'document',
      title: 'Birth certificate request approved',
      body: 'Your certified copy is waiting in your Document Vault.',
      createdAt: minutesAgo(26 * 60),
      read: true,
    },
    {
      id: 'n5',
      kind: 'system',
      title: 'Scheduled maintenance',
      body: 'Some services will be unavailable on Sunday from 1:00 to 3:00 AM.',
      createdAt: minutesAgo(3 * 24 * 60),
      read: true,
    },
  ]);

  readonly notifications = this.items.asReadonly();

  readonly unreadCount = computed(() => this.items().filter((item) => !item.read).length);

  markRead(id: string): void {
    this.items.update((list) =>
      list.map((item) => (item.id === id && !item.read ? { ...item, read: true } : item)),
    );
  }

  markAllRead(): void {
    this.items.update((list) => list.map((item) => (item.read ? item : { ...item, read: true })));
  }
}
