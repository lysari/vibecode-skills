/**
 * What the page says about `x-liquid-input` and `x-liquid-input-group`, kept
 * apart from the page that shows it: a table of prose is data, and a template
 * full of `<tr>`s is harder to keep true than a list is.
 *
 * Every default here is the one the source produces. When a component changes,
 * this changes with it — the examples beside it would fail to compile first.
 */

/** One heading a docs page can be linked to, and its rail on the right lists. */
export interface Section {
  id: string;
  title: string;
  /** Sits under the heading above it, in the rail. */
  nested?: boolean;
}

export interface ApiRow {
  name: string;
  type: string;
  value?: string;
  does: string;
}

export interface MotionRow {
  what: string;
  duration: string;
  curve: string;
}

export interface Figure {
  value: string;
  note: string;
}

export const INPUT_API: ApiRow[] = [
  {
    name: 'value',
    type: 'string | number | null',
    value: 'null',
    does: 'What the field holds. Two-way: [(value)].',
  },
  {
    name: 'type',
    type: 'LiquidInputType',
    value: "'text'",
    does: "The native type, or 'textarea'.",
  },
  {
    name: 'label',
    type: 'string | null',
    value: 'null',
    does: 'The label above the field. With none, the placeholder names the control.',
  },
  { name: 'placeholder', type: 'string', value: "''", does: 'Shown in an empty field.' },
  {
    name: 'hint',
    type: 'string | null',
    value: 'null',
    does: 'A quiet line under the field. The error takes its place while there is one.',
  },
  {
    name: 'error',
    type: 'string | null',
    value: 'null',
    does: "A message of the page's own, shown instead of anything errorMessages would say.",
  },
  {
    name: 'errorMessages',
    type: 'LiquidInputErrorMessages',
    value: '{}',
    does: 'A message per validator key, said once the control has been touched.',
  },
  {
    name: 'mask',
    type: 'string | null',
    value: 'null',
    does: 'A fixed-width pattern the field types itself into. Ignored on a number, a text area and a picker.',
  },
  {
    name: 'maskStores',
    type: "'raw' | 'formatted'",
    value: "'raw'",
    does: 'What a masked field hands the form: the characters typed, or its own text.',
  },
  {
    name: 'transformWith',
    type: 'LiquidInputTransform | null',
    value: 'null',
    does: 'What each character becomes as it arrives. Runs before the mask; null refuses it.',
  },
  {
    name: 'options',
    type: 'LiquidInputOption[] | null',
    value: 'null',
    does: 'Turns the field into a list to choose from. A mask has nothing to act on then.',
  },
  {
    name: 'prefixIcon / suffixIcon',
    type: 'string | null',
    value: 'null',
    does: 'An ng-icon name, registered by the caller.',
  },
  {
    name: 'clearable',
    type: 'boolean',
    value: 'false',
    does: 'Offers a button that empties the field.',
  },
  {
    name: 'revealable',
    type: 'boolean',
    value: 'false',
    does: 'Offers the eye that shows what was typed. Only on a password field.',
  },
  {
    name: 'showCount',
    type: 'boolean',
    value: 'false',
    does: 'Prints length / maxlength, or length / what the mask holds.',
  },
  {
    name: 'optional',
    type: 'boolean',
    value: 'false',
    does: 'Marks the field as one that may be left empty.',
  },
  {
    name: 'disabled / readonly',
    type: 'boolean',
    value: 'false',
    does: "Dimmed, or selectable but out of reach. A form's setDisabledState does the first without being told.",
  },
  {
    name: 'invalid',
    type: 'boolean',
    value: 'false',
    does: 'Forces the invalid ring on, for a page validating outside the control.',
  },
  {
    name: 'required',
    type: 'boolean',
    value: 'false',
    does: 'Forces the mark on; a Validators.required on the control is found on its own.',
  },
  {
    name: 'uppercase',
    type: 'boolean',
    value: 'false',
    does: 'Draws capitals without touching the value. A transform changes the value itself.',
  },
  {
    name: 'bare',
    type: 'boolean',
    value: 'false',
    does: 'Draws no box, label or line under it: the field is a segment of a group.',
  },
  {
    name: 'width',
    type: 'string | null',
    value: 'null',
    does: 'How wide a segment is, as any CSS length. It sizes the control, not the box.',
  },
  {
    name: 'lang',
    type: 'string | null',
    value: 'null',
    does: "The language what is typed is in — 'km' for a Khmer name.",
  },
  {
    name: 'autocomplete / inputmode / spellcheck',
    type: 'string | boolean | null',
    value: 'null',
    does: 'The native attributes.',
  },
  {
    name: 'maxlength / minlength',
    type: 'number | null',
    value: 'null',
    does: 'The native limits.',
  },
  {
    name: 'min / max / step',
    type: 'string | number | null',
    value: 'null',
    does: 'For a number or a date.',
  },
  { name: 'rows', type: 'number', value: '3', does: 'How many lines a textarea opens at.' },
  {
    name: 'inputId',
    type: 'string',
    value: 'liquid-input-{n}',
    does: "The control's id — what the label points at and where focus() lands.",
  },
  {
    name: 'name',
    type: 'string | null',
    value: 'null',
    does: 'What it is submitted under, and the key a group holds it by.',
  },
  {
    name: 'describedBy',
    type: 'string | null',
    value: 'null',
    does: 'Ids of anything else that describes the field.',
  },
];

export const INPUT_MEMBERS: ApiRow[] = [
  {
    name: 'valueChange',
    type: 'string | number | null',
    does: "The model's own output — what [(value)] binds to.",
  },
  {
    name: 'focused / blurred',
    type: 'void',
    does: 'Took or lost the focus. The control is marked touched on blur.',
  },
  { name: 'cleared', type: 'void', does: 'The clear button was used.' },
  {
    name: 'capacity()',
    type: 'number | null',
    does: 'How much it can hold: its maxlength, else what its mask takes. A group reads it to know when to move on.',
  },
  {
    name: 'focus(options?) / blur() / select()',
    type: 'void',
    does: 'Where a failed validation puts the focus, and back again.',
  },
  {
    name: 'element()',
    type: 'HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null',
    does: 'The control itself, for whatever this does not wrap.',
  },
];

export const GROUP_API: ApiRow[] = [
  {
    name: 'value',
    type: 'Record<string, unknown>',
    value: '{}',
    does: "One value per segment, under the segment's own name. Two-way: [(value)].",
  },
  {
    name: 'label / hint / error',
    type: 'string | null',
    value: 'null',
    does: 'Drawn once, for all of the segments.',
  },
  {
    name: 'errorMessages',
    type: 'LiquidInputErrorMessages',
    value: '{}',
    does: 'A message per validator key, said once the group has been touched.',
  },
  {
    name: 'optional / required / disabled / invalid',
    type: 'boolean',
    value: 'false',
    does: 'As a single field, for every segment at once.',
  },
  {
    name: 'inputId',
    type: 'string | null',
    value: 'null',
    does: "What the label points at. The first segment's own id unless told otherwise.",
  },
  {
    name: 'focused / blurred',
    type: 'void',
    does: 'The focus entering and leaving the group — not moving inside it.',
  },
  {
    name: 'segment(name)',
    type: 'LiquidSegment | null',
    does: 'The segment of that name, for whatever the group does not wrap.',
  },
];

export const CSS_API: ApiRow[] = [
  {
    name: '--liquid-input-hue',
    type: 'var(--svc-accent, 262)',
    does: 'An OKLCH hue: the focus ring, the icons, the actions.',
  },
  {
    name: '--liquid-input-height',
    type: '46px',
    does: "The field's height — a textarea's minimum.",
  },
  { name: '--liquid-input-radius', type: '14px', does: 'The corner.' },
  {
    name: '--liquid-input-background',
    type: '#f5f5f7',
    does: 'At rest, and while disabled or read-only.',
  },
  { name: '--liquid-input-background-hover', type: '#ededf0', does: 'Under the pointer.' },
  { name: '--liquid-input-background-focus', type: '#fff', does: 'While the field has the focus.' },
  {
    name: '--liquid-input-font-size',
    type: '14px',
    does: "The value's size; -label-font-size is the label's.",
  },
  {
    name: '--liquid-input-settle-duration',
    type: '340ms',
    does: 'Times the ring growing and the fill arriving.',
  },
  {
    name: '--liquid-input-press-duration',
    type: '110ms',
    does: 'The squash the field answers with; the bounce takes 3.4× longer.',
  },
  {
    name: '--liquid-input-press-depth',
    type: '0.3',
    does: "How much of the press's 1.08 × 0.9 the field uses. 1 is a button's.",
  },
  {
    name: '--liquid-input-group-separator',
    type: 'rgba(29, 29, 31, 0.12)',
    does: 'The hairline between two segments, and -separator-height its 22px.',
  },
  {
    name: '--liquid-input-group-*',
    type: 'as above',
    does: 'A group reads every one of these under its own prefix — hue, tint, height, radius, the three backgrounds and settle-duration through the same mixin, plus its own press-duration and press-depth — so it can be retuned without touching the segments inside it.',
  },
];

export const MOTION: MotionRow[] = [
  {
    what: 'Ring growing on focus',
    duration: '340ms',
    curve:
      "cubic-bezier(0.34, 1.32, 0.4, 1) — the popup's spring. A box-shadow spread interpolates, so the ring goes past its 2px and comes back",
  },
  {
    what: 'The field answering',
    duration: '110ms down, 374ms back',
    curve:
      'the press at depth 0.3: 1.024 0.97 held, then back through 0.985 1.021 — the shared liquid-press.ts, moving the whole box as one',
  },
  {
    what: 'Fill arriving',
    duration: '340ms',
    curve:
      'cubic-bezier(0.25, 1, 0.5, 1) — the same clock, without the overshoot a colour would clamp',
  },
  {
    what: 'Prefix / suffix icon colour',
    duration: '260ms, after 40ms',
    curve: 'the box leads on the way in; the content leads on the way out',
  },
  {
    what: 'Letting go',
    duration: '200ms',
    curve:
      'cubic-bezier(0.32, 0.72, 0, 1) — quicker and tighter than taking hold, and still landing',
  },
  {
    what: 'Hint or error arriving',
    duration: '260ms, after 40ms',
    curve: 'into a −1.5px overshoot, then back; the leaving line goes out of the flow',
  },
  {
    what: 'Clear / eye folding in',
    duration: '260ms',
    curve: 'width, margin and scale on one clock; 1.08 at 58%, then settle',
  },
];

export const FIGURES: Figure[] = [
  {
    value: '1.024 × 0.97',
    note: 'the squash, landing at 108ms — the press’s own 1.08 × 0.9 at depth 0.3',
  },
  {
    value: '0.985 × 1.021',
    note: 'the shape it springs back through at 240ms, then exactly 1 × 1 with nothing left on it',
  },
  {
    value: '2.7px',
    note: 'travelled by the prefix icon, with the edge it sits by — the surface takes its contents with it',
  },
  {
    value: '0px',
    note: 'the row’s own width through the whole press: the field squashes past its edges and the grid never moves',
  },
  {
    value: '1.5px',
    note: 'overshoot on the error line, exactly the keyframe; opacity full at 187ms',
  },
  {
    value: '0px',
    note: 'change in the row’s height while the hint leaves and the error takes its place',
  },
];

export const BEHAVIOUR: string[] = [
  'The label is a real <label for> on the control’s own id. With no label, the placeholder becomes its aria-label rather than leaving it unnamed.',
  'aria-describedby names only what is on the page: the hint, or the error that replaced it, plus the counter and anything in describedBy.',
  'The error line is a role="alert", and aria-invalid goes on the control at the same moment. A control that fails a validator nothing has words for still draws the ring.',
  'The control is marked touched on blur, and the field re-reads its control whenever the form reports anything — so markAllAsTouched() on submit lights every field at once.',
  'The field never loses the focus to its own buttons: they swallow mousedown, so clearing keeps the caret in the field and marks nothing touched.',
  'The browser’s own chrome is swept out — the number spinner, a search field’s clear, Edge’s reveal, the date glyph — and whatever it stood for is offered back in the field’s vocabulary. A date field gets its own button calling showPicker().',
  'A transform runs on the way in, never on the way out, and a composition is left alone until the IME hands it over.',
  'In a group, the focus moving between segments is not the focus leaving: the group asks the document where the focus is rather than guessing from which event arrived last.',
  'prefers-reduced-motion keeps every end state and removes all travel. The press is script-driven, so it checks the same query in TypeScript.',
  'Khmer stacks subscripts below the line, so the control’s leading is 1.7 rather than a tighter default that would clip them.',
];

export const GAPS: string[] = [
  'Errors appear on touched, not on submitted. A form that wants its fields lit on submit calls markAllAsTouched().',
  'A group holds an object, so Validators.required passes an empty one — it only checks for null or an empty length. Validate the parts.',
  'A mask is fixed width. A number that is sometimes nine digits and sometimes ten needs two masks or none.',
  'A segment hand-off happens in an effect, so a burst of input faster than a change-detection cycle can outrun it. Real typing does not.',
  'There is no floating label, and a textarea does not grow with its content.',
];

export const FILES: ApiRow[] = [
  {
    name: 'liquid-input/liquid-input.ts',
    type: 'component',
    does: 'The field itself: masks, transforms, the picker button, the press.',
  },
  {
    name: 'liquid-input-group/liquid-input-group.ts',
    type: 'component',
    does: 'One box around several segments, with one value, one error and one ring.',
  },
  {
    name: 'liquid-form/liquid-segment.ts',
    type: 'contract',
    does: 'What a group needs of its segments, so any component can be one.',
  },
  {
    name: 'utils/input-mask.ts',
    type: 'util',
    does: 'Which characters a pattern takes and where the caret lands. 13 tests of its own.',
  },
  {
    name: 'utils/liquid-press.ts',
    type: 'util',
    does: 'The press every liquid surface answers with, shared.',
  },
  {
    name: 'styles/_liquid-field.scss',
    type: 'styles',
    does: 'The chrome the field and the group both draw, so there is only one of it.',
  },
];
