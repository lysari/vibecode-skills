import { ApiRow, Figure, MotionRow } from '../liquid-input-docs/liquid-input-docs.reference';

/**
 * What the page says about the toast, kept apart from the page that shows it.
 * Ported from `.claude/demo/liquid-toast/`, and checked against the source it
 * documents rather than copied across.
 */

export const TOAST_CALLS: ApiRow[] = [
  {
    name: 'toast(title, options?)',
    type: 'ToastId',
    does: 'A plain toast. The same as toast.message.',
  },
  {
    name: 'toast.success / info / warning / error',
    type: 'ToastId',
    does: 'The same, with a type — which is only a hue: the plate and the icon derive from it.',
  },
  {
    name: 'toast.loading',
    type: 'ToastId',
    does: 'Spins and stays until it is updated or dismissed, unless given autoDismiss: true.',
  },
  {
    name: 'toast.custom(template, options?)',
    type: 'ToastId',
    does: 'Your own template in the card, with the same motion around it. The context gives the toast and a dismiss.',
  },
  {
    name: 'toast.promise(promise, data)',
    type: '{ id, unwrap }',
    does: 'One toast follows the work: loading, then success or error. Messages may be strings, functions of the result, or { title, description }.',
  },
  {
    name: 'toast.dismiss(id?)',
    type: 'void',
    does: 'One by id, or everything showing when called with nothing.',
  },
  {
    name: 'toast.getToasts()',
    type: 'readonly Toast[]',
    does: 'Everything showing or queued, newest first.',
  },
];

export const TOAST_OPTIONS: ApiRow[] = [
  {
    name: 'id',
    type: 'ToastId',
    value: '—',
    does: 'Updates the toast with this id where it stands, or creates one that has it.',
  },
  {
    name: 'description',
    type: 'string',
    value: '—',
    does: 'A second, quieter line. The card is sized to it before it grows, so nothing re-wraps mid-flight.',
  },
  {
    name: 'position',
    type: 'ToastPosition',
    value: "the toaster's",
    does: 'An edge, or a target to grow out of.',
  },
  {
    name: 'autoDismiss',
    type: 'boolean',
    value: "the toaster's",
    does: 'false keeps it until it is dismissed — and gives it a close button unless told otherwise.',
  },
  {
    name: 'duration',
    type: 'number',
    value: "the toaster's",
    does: 'In ms, when it does dismiss itself. The toaster’s own default is 4000.',
  },
  {
    name: 'timer',
    type: "'hover' | 'always' | 'off'",
    value: "the toaster's",
    does: 'When the countdown pill shows beside it.',
  },
  {
    name: 'action / cancel',
    type: 'ToastButton',
    value: '—',
    does: "The main button and a quieter one. The toast dismisses after a button's onClick unless it calls preventDefault().",
  },
  {
    name: 'icon',
    type: 'TemplateRef | null',
    value: '—',
    does: "Replaces the type's icon; null shows none.",
  },
  {
    name: 'closeButton / dismissible',
    type: 'boolean',
    value: "the toaster's / true",
    does: 'Whether it offers a close button, and whether it can be closed by hand at all.',
  },
  {
    name: 'important',
    type: 'boolean',
    value: 'false',
    does: 'Announced assertively, interrupting what a screen reader is reading.',
  },
  {
    name: 'onDismiss / onAutoClose',
    type: '(toast) => void',
    value: '—',
    does: 'Dismissed by hand, or its time ran out. Never both.',
  },
];

export const TOASTER_API: ApiRow[] = [
  {
    name: 'position',
    type: 'ToastPosition',
    value: "'top-center'",
    does: 'Which edge the stack grows from. Six of them.',
  },
  { name: 'closeButton', type: 'boolean', value: 'false', does: 'Whether every toast offers one.' },
  { name: 'autoDismiss', type: 'boolean', value: 'true', does: 'Whether a toast sees itself out.' },
  { name: 'duration', type: 'number', value: '4000', does: 'How long it stays, in ms.' },
  {
    name: 'visibleToasts',
    type: 'number',
    value: '3',
    does: 'Past this many, a ghost pill counts what is waiting.',
  },
  {
    name: 'gap / offset',
    type: 'number | string',
    value: '8 / 16',
    does: 'Between the cards, and from the edge of the screen.',
  },
  {
    name: 'hotkey',
    type: 'readonly string[]',
    value: "['altKey', 'KeyT']",
    does: 'What moves the focus into the stack.',
  },
  {
    name: 'timer / timerSide',
    type: "ToastTimer / 'auto' | 'left' | 'right'",
    value: "'off' / 'auto'",
    does: 'The countdown pill, and which side it faces.',
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    value: 'true',
    does: 'Whether hovering holds the countdown where it is.',
  },
];

export const TARGET_API: ApiRow[] = [
  {
    name: 'liquidToastTarget',
    type: 'string',
    value: '—',
    does: 'Names an element toasts can come out of. Required; the name is what a toast asks for.',
  },
  {
    name: 'position.target',
    type: 'string | HTMLElement | ElementRef',
    value: '—',
    does: 'The name registered above, or the element itself.',
  },
  {
    name: 'position.side',
    type: "'auto' | 'below' | 'above'",
    value: "'auto'",
    does: 'Which side of the target the toasts stack on. auto picks the roomier one.',
  },
  {
    name: 'position.fallback',
    type: 'ToastEdge',
    value: "'top-center'",
    does: 'Where a toast goes while the target is missing or hidden.',
  },
];

export const TOAST_CSS: ApiRow[] = [
  { name: '--liquid-toast-width', type: 'min(400px, 100vw - 32px)', does: 'How wide a card is.' },
  { name: '--liquid-toast-radius', type: '22px', does: 'Its corner.' },
  {
    name: '--liquid-toast-max-height',
    type: '100dvh',
    does: 'How tall the stack may grow before it scrolls.',
  },
  {
    name: '--liquid-toast-open-duration',
    type: '340ms',
    does: 'The arrival, read in TypeScript — the card, its room and its content are on this one clock.',
  },
  { name: '--liquid-toast-close-duration', type: '240ms', does: 'The way out.' },
  {
    name: '--liquid-toast-resize-duration',
    type: '280ms',
    does: 'The card changing to new content on an update.',
  },
  {
    name: '--liquid-toast-press-duration',
    type: '110ms',
    does: 'The squash a card answers a tap with, at depth 0.4.',
  },
  {
    name: '--liquid-toast-target-press-duration',
    type: '110ms',
    does: 'The squash a target gives as a toast leaves it and returns.',
  },
];

export const TOAST_MOTION: MotionRow[] = [
  {
    what: 'A toast arriving',
    duration: '340ms',
    curve:
      'grow from origin: the card grows out of a 96 × 36 drop formed 10px past its resting place toward the edge — or out of the element it belongs to — on the popup’s spring',
  },
  {
    what: 'Its content',
    duration: '+40ms',
    curve: 'follows the card in from blur(12px) and scale(0.96); both land together',
  },
  {
    what: 'A toast leaving',
    duration: '240ms',
    curve:
      'one movement: away at once, slowing into its origin, fading from 12% and gone as it arrives. The content leads out',
  },
  {
    what: 'Resizing on update',
    duration: '280ms',
    curve: 'cubic-bezier(0.32, 0.72, 0, 1). The new content starts at once — no empty frame',
  },
  {
    what: 'The press',
    duration: '110ms down',
    curve:
      'the liquid press at depth 0.4 on a card this size: 1.032 × 0.96, springing back over 3.4×. A dismissal mid-press carries the squash into the close',
  },
  {
    what: 'The countdown pill',
    duration: '340ms out, 200ms back',
    curve:
      'grows out of a sliver 8px inside the card’s edge on the spring, gathers back on the close curve while fading. Turns around mid-way with no jump',
  },
];

export const TOAST_FIGURES: Figure[] = [
  {
    value: '96 → 410px',
    note: 'an edge open: out of its drop, 10px past itself, settled at 400px by ~300ms with no animations left on the element',
  },
  {
    value: '240ms',
    note: 'an edge close from a real click: 2px at 13ms, 10px at 22ms — one frame of latency, the rest travel — and ~0 speed on reaching the drop',
  },
  {
    value: '1.032 × 0.96',
    note: 'the card’s press at depth 0.4, and a dismissal mid-press carries that squash into the close',
  },
  {
    value: '0px',
    note: 'jump when interrupted: a dismissal or update mid-grow carries on from the live box',
  },
];

export const TOAST_BEHAVIOUR: string[] = [
  'The stack is an aria-live region: a toast is announced as it arrives, politely unless important says otherwise.',
  'Alt+T moves the focus into the stack, past anything already folding away. The hotkey is configurable on the toaster.',
  'Hovering holds the countdown where it is, so a toast being read does not leave mid-sentence. pauseOnHover: false lets it tick.',
  'Past visibleToasts, a ghost pill counts what is waiting; the ones behind it do not start counting down until they show.',
  'A toast can grow out of an element rather than the screen edge — liquidToastTarget names one — so a save can answer from the thing that was saved.',
  'prefers-reduced-motion keeps every end state and removes all travel: the toast is simply there, and simply gone.',
];

export const TOAST_GAPS: string[] = [
  'A toast is not a dialog: it takes no focus of its own until Alt+T asks for it, so nothing that must be answered belongs in one.',
  'toast.promise resolves its own messages; a rejection that should be handled elsewhere still needs its own catch — unwrap() hands the promise back for that.',
];

export const TOAST_FILES: ApiRow[] = [
  {
    name: 'liquid-toast/toast.ts',
    type: 'api',
    does: 'The toast() function, its options and the state every toaster reads.',
  },
  {
    name: 'liquid-toast/liquid-toast.ts',
    type: 'component',
    does: 'The toaster: the stack, the motion, the countdown, the overflow ghost.',
  },
  {
    name: 'liquid-toast/liquid-toast-target.directive.ts',
    type: 'directive',
    does: 'Names an element a toast can grow out of.',
  },
  {
    name: '.claude/demo/liquid-toast/',
    type: 'twin',
    does: 'The framework-free copy that runs off disk. This page is the one that cannot drift.',
  },
];
