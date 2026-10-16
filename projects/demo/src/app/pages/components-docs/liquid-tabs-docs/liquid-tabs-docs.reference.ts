import { ApiRow } from '../liquid-input-docs/liquid-input-docs.reference';

export const TABS_SETUP = `import { LiquidTabs } from '@app/shared/components/liquid-tabs/liquid-tabs';
import { LiquidTab } from '@app/shared/components/liquid-tabs/liquid-tab.directive';
import { LiquidTabPanel } from '@app/shared/components/liquid-tabs/liquid-tab-panel.directive';
import { LiquidTabContent } from '@app/shared/components/liquid-tabs/liquid-tab-content.directive';

@Component({ imports: [LiquidTabs, LiquidTab, LiquidTabPanel, LiquidTabContent] })

<x-liquid-tabs #tabs="liquidTabs" aria-label="Filter" [(value)]="filter">
  <button type="button" liquidTab="all">All</button>
  <button type="button" liquidTab="unread">Unread <span class="count">3</span></button>
  <button type="button" liquidTab="archived" disabled>Archived</button>
</x-liquid-tabs>`;

export const TABS_PANELS = `<!-- One panel per tab: hidden while its tab is not selected -->
<section liquidTabPanel="profile" [liquidTabPanelFor]="tabs">…</section>
<section liquidTabPanel="security" [liquidTabPanelFor]="tabs">…</section>

<!-- One shared panel, its contents built only while their tab is selected -->
<div liquidTabPanel [liquidTabPanelFor]="tabs">
  <ng-template liquidTabContent="all">…</ng-template>
  <ng-template liquidTabContent="unread">…</ng-template>
</div>`;

export const TABS_SLIDER = `<div liquidTabPanel [liquidTabPanelFor]="tabs" panelMode="slider">
  @for (tab of tabs; track tab.key) {
    <ng-template [liquidTabContent]="tab.key">…</ng-template>
  }
</div>`;

export const TABS_OPTIONS = `<!-- Start on a tab with nothing bound -->
<x-liquid-tabs default="week">…</x-liquid-tabs>

<!-- Remember the selection across visits; default covers the first one -->
<x-liquid-tabs default="week" persist="docs:range" persistIn="session">…</x-liquid-tabs>

<!-- Equal widths, filling the container -->
<x-liquid-tabs stretch>…</x-liquid-tabs>

<!-- The arrow keys move focus only; Enter or Space selects -->
<x-liquid-tabs activation="manual">…</x-liquid-tabs>

<x-liquid-tabs orientation="vertical">…</x-liquid-tabs>`;

export const TABS_COLOUR = `.tabs-dark {
  --liquid-tabs-background     : #1c2b3a;
  --liquid-tabs-indicator-color: #2f4358;
  --liquid-tabs-color          : rgba(255, 255, 255, 0.6);
  --liquid-tabs-hover-color    : rgba(255, 255, 255, 0.85);
  --liquid-tabs-selected-color : #fff;
}`;

export const TABS_API: ApiRow[] = [
  {
    name: 'value',
    type: 'T | null',
    value: 'null',
    does: 'The selected tab’s value. Two-way: [(value)].',
  },
  {
    name: 'default',
    type: 'T',
    value: 'undefined',
    does: 'The tab to start on while value is still null. Applied once; a missing or disabled tab leaves none selected.',
  },
  {
    name: 'persist',
    type: 'string',
    value: 'undefined',
    does: 'A storage key the bar remembers its selection under, and starts on again next time. Kept as JSON.',
  },
  {
    name: 'persistIn',
    type: `'local' | 'session'`,
    value: `'local'`,
    does: 'Which storage persist writes to.',
  },
  {
    name: 'orientation',
    type: `'horizontal' | 'vertical'`,
    value: `'horizontal'`,
    does: 'Which way the tabs lie, and which arrow keys move between them.',
  },
  {
    name: 'activation',
    type: `'automatic' | 'manual'`,
    value: `'automatic'`,
    does: 'automatic: the arrow keys select as they move. manual: they only move focus, and Enter or Space selects.',
  },
  {
    name: 'stretch',
    type: 'boolean',
    value: 'false',
    does: 'Tabs share the width equally and the bar fills its container.',
  },
  { name: 'disabled', type: 'boolean', value: 'false', does: 'Disables every tab at once.' },
];

export const TABS_MEMBERS: ApiRow[] = [
  {
    name: 'select(value)',
    type: 'boolean',
    does: 'Selects the tab holding value. Returns whether there was an enabled one.',
  },
  {
    name: 'clearPersisted()',
    type: 'void',
    does: 'Forgets the remembered selection; the current tab stays selected.',
  },
  { name: 'focus(options?)', type: 'void', does: 'Moves focus onto the bar’s tab stop.' },
];

export const TAB_API: ApiRow[] = [
  {
    name: 'liquidTab',
    type: 'T',
    value: 'required',
    does: 'What [(value)] on the bar becomes when this tab is selected.',
  },
  { name: 'disabled', type: 'boolean', value: 'false', does: 'Skipped by the keyboard and the pointer.' },
  {
    name: 'id',
    type: 'string',
    value: 'generated',
    does: 'Panels point aria-labelledby at it.',
  },
];

export const TAB_PANEL_API: ApiRow[] = [
  {
    name: 'liquidTabPanel',
    type: 'T',
    value: 'shared',
    does: 'The value of the tab that shows this panel. Left empty, the panel is shared: never hidden, controlled by every tab with no panel of its own.',
  },
  {
    name: 'liquidTabPanelFor',
    type: 'LiquidTabs',
    value: 'required',
    does: 'The bar it belongs to. A panel can sit anywhere.',
  },
  {
    name: 'panelMode',
    type: `'dissolve' | 'slider'`,
    value: `'dissolve'`,
    does: 'How the liquidTabContent templates inside change over: a blurred crossfade, or a carousel.',
  },
  { name: 'id', type: 'string', value: 'generated', does: 'Tabs point aria-controls at it.' },
];

export const TAB_CONTENT_API: ApiRow[] = [
  {
    name: 'liquidTabContent',
    type: 'T',
    value: 'the panel’s',
    does: 'On an ng-template: the tab whose selection builds it. Left empty inside a panel with a value, it takes the panel’s.',
  },
  {
    name: 'liquidTabContentFor',
    type: 'LiquidTabs',
    value: 'undefined',
    does: 'The bar to follow when the content is not inside a panel.',
  },
  {
    name: 'liquidTabContentAnimate',
    type: 'boolean',
    value: 'true',
    does: 'False turns the crossfade off.',
  },
];

export const TABS_CSS: ApiRow[] = [
  { name: '--liquid-tabs-padding', type: 'length', value: '3px', does: 'Space around the tabs, inside the bar.' },
  { name: '--liquid-tabs-radius', type: 'length', value: '999px', does: 'Corner radius of the bar.' },
  { name: '--liquid-tabs-background', type: 'color', value: 'rgba(0,0,0,.05)', does: 'The bar’s track.' },
  { name: '--liquid-tabs-indicator-color', type: 'color', value: '#fff', does: 'The pill.' },
  { name: '--liquid-tabs-indicator-shadow', type: 'box-shadow', value: '0 1px 4px rgba(0,0,0,.12)', does: 'The pill’s shadow.' },
  { name: '--liquid-tabs-color', type: 'color', value: 'rgba(29,29,31,.55)', does: 'An unselected tab’s label.' },
  { name: '--liquid-tabs-hover-color', type: 'color', value: 'rgba(29,29,31,.8)', does: 'A label under the pointer.' },
  { name: '--liquid-tabs-selected-color', type: 'color', value: '#1a73e8', does: 'The selected label. Set it on the bar itself: the bar declares its own, which shadows one set on an ancestor.' },
  { name: '--liquid-tabs-tab-padding', type: 'length', value: '5px 14px', does: 'Padding inside each tab.' },
  { name: '--liquid-tabs-font-size', type: 'length', value: '13px', does: 'Label size.' },
  { name: '--liquid-tabs-duration', type: 'ms', value: '340', does: 'How long the pill takes to pour across.' },
  { name: '--liquid-tabs-pull', type: 'px', value: '10', does: 'How far the pill reaches toward the next tab before it sets off.' },
  { name: '--liquid-tabs-press-duration', type: 'ms', value: '110', does: 'How long a pressed tab and its pill hold the squash.' },
  { name: '--liquid-slider-width', type: 'length', value: '72%', does: 'Slider panels: how much of the panel one slide takes.' },
  { name: '--liquid-slider-gap / -scale / -dim', type: 'px / number', value: '16 / 0.94 / 0.5', does: 'Slider panels: the space between slides, and how far the neighbours are played down.' },
];
