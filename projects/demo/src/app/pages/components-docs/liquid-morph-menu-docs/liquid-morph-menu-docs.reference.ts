import { ApiRow, Figure, MotionRow } from '../liquid-input-docs/liquid-input-docs.reference';

export interface MorphDemoItem {
  id: string;
  label: string;
  icon: string;
}

export const MORPH_DEMO_ITEMS: MorphDemoItem[] = [
  { id: 'search', label: 'Search', icon: 'ionSearchOutline' },
  { id: 'notifications', label: 'Notifications', icon: 'ionNotificationsOutline' },
  { id: 'settings', label: 'Settings', icon: 'ionSettingsOutline' },
  { id: 'languages', label: 'Languages', icon: 'ionGlobeOutline' },
];

export const MORPH_SETUP = `import { LiquidMorphMenu } from '@app/shared/components/liquid-morph-menu/liquid-morph-menu';
import { LiquidMorphItem } from '@app/shared/components/liquid-morph-menu/liquid-morph-item.directive';

@Component({ imports: [LiquidMorphMenu, LiquidMorphItem] })

<x-liquid-morph-menu pill>
  <button type="button" aria-label="Search" liquidMorphItem>
    <ng-icon name="ionSearchOutline" />
  </button>
  <button type="button" aria-label="Notifications" liquidMorphItem>
    <ng-icon name="ionNotificationsOutline" />
    @if (unread()) {
      <span class="liquid-morph-count">{{ unread() }}</span>
    }
  </button>
</x-liquid-morph-menu>`;

export const MORPH_POPUP_CODE = `<x-liquid-morph-menu pill>
  <button
    type="button"
    aria-label="Search"
    liquidMorphItem
    [liquidMorphActive]="search.isOpen()"
    [liquidMenuTriggerFor]="search"
  >
    <ng-icon name="ionSearchOutline" />
  </button>
</x-liquid-morph-menu>

<x-liquid-menu-popup #search="liquidMenu" title="Search">…</x-liquid-menu-popup>`;

export const MORPH_SELECTION_CODE = `<x-liquid-morph-menu pill disabledHover>
  @for (item of items; track item.id) {
    <button
      type="button"
      liquidMorphItem
      [liquidMorphActive]="selected() === item.id"
      (click)="selected.set(item.id)"
    >…</button>
  }
</x-liquid-morph-menu>`;

export const MORPH_DISABLED_CODE = `<!-- One item -->
<button type="button" liquidMorphItem [liquidMorphDisabled]="!canSignOut()">…</button>

<!-- The whole menu -->
<x-liquid-morph-menu pill [disabledHighlight]="busy()">…</x-liquid-morph-menu>`;

export const MORPH_CUSTOM_CODE = `.my-menu {
  --liquid-morph-color   : rgba(30, 111, 217, 0.12);
  --liquid-morph-radius  : 10px;
  --liquid-morph-pad-x   : 4px;
  --liquid-morph-duration: 420ms;
  --liquid-morph-pull    : 16px;
}`;

export const MENU_API: ApiRow[] = [
  {
    name: 'pill',
    type: 'boolean',
    value: 'false',
    does: 'Draws the menu as the glass pill of 24px icon items the header uses.',
  },
  {
    name: 'orientation',
    type: `'horizontal' | 'vertical'`,
    value: `'horizontal'`,
    does: 'Which way the items run, and the axis the highlight pours along. Vertical is the same menu in a column.',
  },
  {
    name: 'disabledHighlight',
    type: 'boolean',
    value: 'false',
    does: 'Keeps the highlight away from every item: no hover, no focus, no pin.',
  },
  {
    name: 'disabledHover',
    type: 'boolean',
    value: 'false',
    does: 'The highlight stops following the pointer and stays on the pinned item; focus still moves it.',
  },
];

export const MENU_MEMBERS: ApiRow[] = [
  {
    name: 'items',
    type: 'Signal<LiquidMorphItem[]>',
    does: 'Every item in the menu, in DOM order.',
  },
  {
    name: 'activeItem',
    type: 'Signal<LiquidMorphItem | null>',
    does: 'Where the highlight is: under the pointer, or else on the pinned item.',
  },
  {
    name: 'pinnedItem',
    type: 'Signal<LiquidMorphItem | null>',
    does: 'The first item with liquidMorphActive that is not disabled.',
  },
  {
    name: 'activate(item)',
    type: 'void',
    does: 'Moves the highlight onto an item, as the focus does. Ignored with disabledHighlight.',
  },
  {
    name: 'release()',
    type: 'void',
    does: 'Hands the highlight back to the pinned item, or lets it drain away.',
  },
];

export const ITEM_API: ApiRow[] = [
  {
    name: 'liquidMorphItem',
    type: 'directive',
    does: 'Makes the element an item. It keeps its own semantics; no role is added.',
  },
  {
    name: 'liquidMorphActive',
    type: 'boolean',
    value: 'false',
    does: 'Pins the highlight here while something the item owns is open, or while it is the selection.',
  },
  {
    name: 'liquidMorphDisabled',
    type: 'boolean',
    value: 'false',
    does: 'Keeps the highlight off this item and dims it: no hover, no pin, no press. Sets aria-disabled.',
  },
  {
    name: 'isActive',
    type: 'Signal<boolean>',
    does: 'Whether the highlight is on this item right now. Read it through #ref="liquidMorphItem".',
  },
];

export const MORPH_CLASSES: ApiRow[] = [
  {
    name: '.liquid-morph-count',
    type: 'class',
    does: 'The red count bubble in the top-right corner of a pill item.',
  },
  {
    name: '.is-active',
    type: 'on the menu',
    does: 'The highlight is showing.',
  },
  {
    name: '.is-vertical / .is-pill',
    type: 'on the menu',
    does: 'orientation is vertical / pill is on.',
  },
  {
    name: '.is-active',
    type: 'on the item',
    does: 'The highlight is on this item right now, hovered or pinned.',
  },
  {
    name: '.is-pinned',
    type: 'on the item',
    does: 'liquidMorphActive is true.',
  },
  {
    name: '.is-disabled',
    type: 'on the item',
    does: 'liquidMorphDisabled is true.',
  },
  {
    name: '.is-folding / .is-leaving',
    type: 'on the item',
    does: 'The item is folding in or out of the row; .is-leaving while it is on its way out.',
  },
];

export const MORPH_CSS: ApiRow[] = [
  { name: '--liquid-morph-color', type: 'rgba(255, 255, 255, 0.16)', does: 'The highlight fill.' },
  { name: '--liquid-morph-radius', type: '999px', does: 'The highlight corner, and the pill’s.' },
  {
    name: '--liquid-morph-shadow',
    type: 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.18)',
    does: 'The highlight’s edge.',
  },
  {
    name: '--liquid-morph-pad-x / -pad-y',
    type: '0',
    does: 'How far the highlight spreads beyond the item box.',
  },
  { name: '--liquid-morph-duration', type: '340ms', does: 'A pour between items.' },
  {
    name: '--liquid-morph-pull',
    type: '10px',
    does: 'How far the highlight reaches toward the next item before it sets off.',
  },
  {
    name: '--liquid-morph-enter-duration / -leave-duration',
    type: '240ms / 220ms',
    does: 'The highlight growing in and draining away.',
  },
  {
    name: '--liquid-morph-idle-scale',
    type: '0.72',
    does: 'How small the highlight grows from and drains back to.',
  },
  {
    name: '--liquid-morph-spring',
    type: 'cubic-bezier(0.34, 1.42, 0.5, 1)',
    does: 'The curve the highlight grows in on.',
  },
  {
    name: '--liquid-morph-item-duration',
    type: '320ms',
    does: 'An item folding in or out. Set it on the item, not the menu.',
  },
  {
    name: '--liquid-morph-press-duration',
    type: '110ms',
    does: 'The squash of a press; the bounce back takes 3.4× longer.',
  },
  {
    name: '--liquid-morph-pill-color',
    type: 'rgba(255, 255, 255, 0.8)',
    does: 'The icon colour in a pill.',
  },
  {
    name: '--liquid-morph-icon-size',
    type: '24px',
    does: 'The size of an icon or image in a pill item.',
  },
];

export const MORPH_MOTION: MotionRow[] = [
  {
    what: 'The highlight arriving',
    duration: '240ms',
    curve: 'grows in on the spot from scale 0.72, on a spring that overshoots a little',
  },
  {
    what: 'A pour between items',
    duration: '340ms',
    curve: 'reaches 10px toward the next item, surges across stretched and thinned, settles with a small overshoot — legs at 14% / 50% / 100%',
  },
  {
    what: 'The highlight leaving',
    duration: '220ms',
    curve: 'frozen where the eye last saw it, even mid-pour, and shrinks away from there',
  },
  {
    what: 'An item folding in',
    duration: '320ms',
    curve: 'cubic-bezier(0.25, 0, 0.25, 1); the content beads up from 0.12 and swells to 1.14 at 84%',
  },
  {
    what: 'An item folding out',
    duration: '320ms',
    curve: 'cubic-bezier(0.4, 0, 0.3, 1); the same shape reversed, box and content on one clock',
  },
  {
    what: 'A press',
    duration: '110ms + 374ms',
    curve: 'the content squashes to 1.08 × 0.9, then bounces through 0.95 × 1.07 back to 1',
  },
];

export const MORPH_FIGURES: Figure[] = [
  {
    value: '151 → 209px',
    note: 'the highlight stretching mid-pour across 143px, while thinning to scale-y 0.90',
  },
  {
    value: '3.5px',
    note: 'overshoot past the resting edge, landing by ~336ms of a 340ms pour',
  },
  {
    value: '0px',
    note: 'jump when a pour is interrupted mid-flight: the next one starts from the live box and scale',
  },
  {
    value: '300ms',
    note: 'a fold has nothing left moving after this, and hands the item back its exact inline styles',
  },
];

export const MORPH_BEHAVIOUR: string[] = [
  'Items are your own elements, so they keep their own semantics. The highlight is aria-hidden and the menu adds no roles.',
  'Keyboard focus moves the highlight like the pointer does, so a keyboard can follow it through the row. Focus leaving the menu releases it.',
  'A pinned item (liquidMorphActive) holds the highlight while the pointer is away. The pointer still wins, and the highlight pours back when the pointer leaves.',
  'disabledHover turns the pinned item into a selection marker: the pointer is ignored and the highlight only moves when the pin does, or with the focus.',
  'liquidMorphDisabled sets aria-disabled="true" on the item, which also stops the press. Crossing a disabled item lets the highlight go rather than leaving it on the item the pointer left.',
  'Items behind an @if or in a changing @for fold the row open and shut; the highlight rides the reflow instead of jumping.',
  'An item that changes size under the highlight — a count turning up, a font landing — takes it along without a pour.',
  'prefers-reduced-motion keeps every end state and removes all travel, in the CSS and in the script that drives the pour.',
];

export const MORPH_GAPS: string[] = [
  'The menu does not manage focus between items: Tab moves through them in DOM order. Add roving tabindex and arrow keys on the page if a toolbar needs them.',
  'liquidMorphDisabled does not stop clicks. On a <button> pair it with the native disabled attribute; on anything else, guard the handler.',
  'The pill background is fixed glass; only its icon colour and size are tunable.',
];

export const MORPH_FILES: ApiRow[] = [
  {
    name: 'liquid-morph-menu/liquid-morph-menu.ts',
    type: 'component',
    does: 'The menu: which item has the highlight, and the pour between items.',
  },
  {
    name: 'liquid-morph-menu/liquid-morph-item.directive.ts',
    type: 'directive',
    does: 'An item: hover and focus, the pin, disabled, the fold in and out, and the press.',
  },
  {
    name: 'liquid-morph-menu/liquid-morph-menu.scss',
    type: 'styles',
    does: 'The highlight, the vertical axis, the pill and the count bubble.',
  },
  {
    name: 'utils/liquid-pour.ts',
    type: 'util',
    does: 'The pour keyframes and the box reads, shared with liquid-tabs.',
  },
  {
    name: 'utils/liquid-press.ts',
    type: 'util',
    does: 'The press, shared with everything liquid that answers a tap.',
  },
];
