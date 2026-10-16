import { ApiRow } from '@app/pages/components-docs/liquid-input-docs/liquid-input-docs.reference';

export const SLOT_SETUP = `import { NumberSlotDirective } from '@app/shared/directives/animations.directive';

@Component({ imports: [NumberSlotDirective] })

<span numberSlot>{{ total() | number }}</span>
<span [numberSlot]="score()" slotDirection="down" [slotSpins]="2"></span>`;

export const SLOT_API: ApiRow[] = [
  {
    name: 'numberSlot',
    type: 'string | number | null',
    value: 'host text',
    does: 'The formatted value. Digits spin, Latin 0–9 and Khmer ០–៩ alike; everything else stays. null clears it. Bind this or interpolate, not both.',
  },
  {
    name: 'slotDuration',
    type: 'number | null',
    value: 'null → 820ms',
    does: 'How long one reel spins, in ms. null leaves --slot-dur to the stylesheet.',
  },
  {
    name: 'slotStagger',
    type: 'number | null',
    value: 'null → 80ms',
    does: 'How long the next reel waits before it starts. Every reel uses the same duration.',
  },
  {
    name: 'slotBlur',
    type: 'number | null',
    value: 'null → 0.3em',
    does: 'Blur during the fast part of the spin, in px. 0 turns it off.',
  },
  {
    name: 'slotOvershoot',
    type: 'number | null',
    value: 'null → 0.16em',
    does: 'How far a reel slips past its digit before settling, in px. 0 lands flush.',
  },
  {
    name: 'slotSpins',
    type: 'number',
    value: '1',
    does: 'Extra full revolutions before the digit lands. 0 rolls the short way. Clamped to 0–12.',
  },
  {
    name: 'slotDirection',
    type: "'auto' | 'up' | 'down'",
    value: 'auto',
    does: 'auto rolls every reel up when the value rose and down when it fell. up always brings the next digit from below. down always brings it from above.',
  },
  {
    name: 'slotStaggerFrom',
    type: "'start' | 'end'",
    value: 'start',
    does: 'Which reel stops first. start is the left column.',
  },
  {
    name: 'slotAnimateOnInit',
    type: 'boolean',
    value: 'true',
    does: 'Whether the first value spins in from 0. false paints it and spins only later changes.',
  },
  {
    name: 'slotAnimateChangedOnly',
    type: 'boolean',
    value: 'true',
    does: 'A digit that matches the one it replaces stays put. Compared from the right. replay spins every digit.',
  },
  {
    name: 'slotDisabled',
    type: 'boolean',
    value: 'false',
    does: 'Paints the value with no spin.',
  },
];

export const SLOT_MEMBERS: ApiRow[] = [
  {
    name: 'replay()',
    type: 'void',
    does: 'Spins every digit again, from whatever is in the window. exportAs numberSlot.',
  },
];

export const SLOT_CSS: ApiRow[] = [
  { name: '--slot-dur', type: 'time', value: '820ms', does: 'How long one reel spins.' },
  { name: '--slot-stagger', type: 'time', value: '80ms', does: 'Delay between one reel and the next.' },
  { name: '--slot-blur', type: 'length', value: '0.3em', does: 'Blur during the fast part of the spin.' },
  {
    name: '--slot-overshoot',
    type: 'length',
    value: '0.16em',
    does: 'How far a reel slips past its digit before settling.',
  },
  {
    name: '--slot-pad',
    type: 'length',
    value: '0.12em',
    does: 'Room above and below the digit inside the window. Raise it for a font whose digits get clipped.',
  },
  {
    name: '--slot-line',
    type: 'length',
    value: '1em',
    does: 'The line the digit sits on, matched to the separators beside it.',
  },
  {
    name: '--slot-cell',
    type: 'length',
    value: 'line + 2 × pad (1.24em)',
    does: 'The height of one cell and of the window. Worked out from --slot-line and --slot-pad. Smaller clips the digit.',
  },
];
