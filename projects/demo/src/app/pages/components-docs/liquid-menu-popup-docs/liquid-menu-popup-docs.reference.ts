import { ApiRow } from '../liquid-input-docs/liquid-input-docs.reference';

export const POPUP_SETUP = `<button type="button" [liquidMenuTriggerFor]="actions">Actions</button>
<x-liquid-menu-popup #actions="liquidMenu" title="Actions">
  <button type="button" liquidMenuItem>Rename</button>
  <button type="button" liquidMenuItem>Delete</button>
</x-liquid-menu-popup>`;

export const CLOSING_SETUP = `<!-- Default: an invisible overlay takes the click outside, and closes. -->
<x-liquid-menu-popup #menu="liquidMenu">…</x-liquid-menu-popup>

<!-- No overlay: the page stays live, and a press outside the panel closes it. -->
<x-liquid-menu-popup #menu="liquidMenu" [overlay]="false">…</x-liquid-menu-popup>

<!-- A click outside leaves it up; Escape, the trigger or close() still close it. -->
<x-liquid-menu-popup #menu="liquidMenu" [closeOnOutsideClick]="false">…</x-liquid-menu-popup>`;

export const POPUP_API: ApiRow[] = [
  {
    name: 'title',
    type: 'string | null',
    value: 'null',
    does: 'The heading over the body, and the panel’s accessible name.',
  },
  {
    name: 'role',
    type: `'menu' | 'dialog'`,
    value: `'menu'`,
    does: 'menu: arrow keys move between items, Tab closes. dialog: Tab moves through the content.',
  },
  {
    name: 'focusFirst',
    type: 'boolean',
    value: 'true',
    does: 'A menu lands on its first item when it opens. Off, it focuses the panel instead.',
  },
  {
    name: 'overlay',
    type: 'boolean',
    value: 'true',
    does: 'Lays an invisible overlay over the page while open. Off, the page behind stays live — hover, scroll and clicks all reach it.',
  },
  {
    name: 'closeOnOutsideClick',
    type: 'boolean',
    value: 'true',
    does: 'A click outside the panel closes it: on the overlay, or — with no overlay — anywhere but the panel and its trigger.',
  },
];

export const POPUP_OUTPUTS: ApiRow[] = [
  { name: 'opened', type: 'void', does: 'The panel started opening.' },
  {
    name: 'closed',
    type: 'LiquidMenuCloseReason',
    does: 'The panel started closing, and why.',
  },
];

export const CLOSE_REASONS: ApiRow[] = [
  { name: 'backdrop', type: 'overlay on', does: 'The overlay was clicked.' },
  { name: 'outside', type: 'overlay off', does: 'A press landed outside the panel and its trigger.' },
  { name: 'escape', type: 'any', does: 'Escape, on the popup at the top of the stack.' },
  { name: 'tab', type: `role="menu"`, does: 'Tab out of a menu.' },
  { name: 'item', type: `role="menu"`, does: 'A liquidMenuItem was picked.' },
  { name: 'focusout', type: 'any', does: 'Focus moved to something outside the panel.' },
  { name: 'trigger', type: 'any', does: 'Its own trigger was clicked again.' },
  { name: 'program', type: 'any', does: 'close() or closeAll() from code.' },
];
