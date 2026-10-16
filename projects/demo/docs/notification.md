# Notification Component & Store

Event notification feed and reactive management store designed for popup dialog menus and standalone drawers.

## Features

- **Categorized Feed**: Automatically organizes notifications into "Today" and "Earlier" chronological groups.
- **Tab Filtering**: Leverages `<x-liquid-tabs>` to provide smooth sliding indicators between "All" and "Unread" feeds.
- **Unread Counter**: Dynamic badges reflecting unread counts in real time.
- **Kind Indicators**: Distinct semantic visual icons and color accents for notification types:
  - `device`: Mobile device authorization and sign-in alerts.
  - `security`: New session and authentication events.
  - `identity`: Document and credentials readiness alerts.
  - `document`: Vault and approval status notices.
  - `system`: Scheduled maintenance announcements.
- **Popup Docking**: Integrates seamlessly with `<x-liquid-menu-popup>` as well as standalone sidebars.

## Store API (`NotificationStore`)

- `notifications`: Signal array of `AppNotification` records.
- `unreadCount`: Computed signal of unread items count.
- `markRead(id: string)`: Marks an item as read.
- `markAllRead()`: Batch-updates all notifications to read.
- `addNotification(data)`: Prepends a new notification to the active list.
- `clearAll()`: Empties the store.

