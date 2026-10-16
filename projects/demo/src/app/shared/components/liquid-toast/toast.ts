import { TemplateRef, signal, untracked } from '@angular/core';

/**
 * The `toast()` API and the store behind it.
 *
 * Rebuilt from `.claude/demo/liquid-toast/liquid-toast.js` (the store at the top
 * of that file), which is the reference for every behaviour here. The one place
 * this deliberately departs from the twin is custom content: the twin takes a
 * render function returning a DOM node, because it has no framework; here a
 * custom toast carries a `TemplateRef`, which is the same idea in Angular's
 * terms and is what lets a custom card be written in a template.
 *
 * A module-level store rather than a service, so `toast()` can be called from
 * anywhere — a resolver, an interceptor, a plain function — with nothing to
 * inject. Exactly one `<x-liquid-toaster />` renders it.
 */

export type ToastId = string | number;

export type ToastEdge =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** Every edge, in the order the docs list them, and the set `resolve` validates against. */
export const TOAST_EDGES: readonly ToastEdge[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

/** A toast that comes out of an element rather than a screen edge. */
export interface ToastTargetPosition {
  /** A name given by `liquidToastTarget`, or the element itself. */
  target: string | HTMLElement;
  /** Where it goes when the target is not on screen. Defaults to `top-center`. */
  fallback?: ToastEdge;
  /**
   * Which side of the target the stack grows. `auto` picks by where the target
   * sits in the viewport and then keeps that choice, so the side never flips
   * under a stack that is already open.
   */
  side?: 'auto' | 'above' | 'below';
}

export type ToastPosition = ToastEdge | ToastTargetPosition;

/** When a toast shows its countdown pill. */
export type ToastTimer = 'hover' | 'always' | 'off';

export type ToastType = 'default' | 'success' | 'info' | 'warning' | 'error' | 'loading';

export interface ToastButton {
  label: string;
  /** Called with the click. Calling `preventDefault()` keeps the toast open. */
  onClick: (event: MouseEvent) => void;
}

/** What a custom template is handed. */
export interface ToastContext {
  $implicit: Toast;
  toast: Toast;
  dismiss: () => void;
}

export interface ToastOptions {
  /** Naming one replaces the toast that has it, where it stands. */
  id?: ToastId;
  description?: string;
  /** Overrides the toaster's `duration` for this one. */
  duration?: number;
  /** Overrides the toaster's `autoDismiss`. A `loading` toast never does by default. */
  autoDismiss?: boolean;
  /** Overrides the toaster's `closeButton`. */
  closeButton?: boolean;
  /** `false` takes the close button away and keeps it there until code says otherwise. */
  dismissible?: boolean;
  /** Overrides the toaster's `position`. */
  position?: ToastPosition;
  /** Overrides the toaster's `timer`. */
  timer?: ToastTimer;
  /** Announced assertively, interrupting a screen reader. Errors are anyway. */
  important?: boolean;
  /** A template for the plate, or `null` for no plate at all. */
  icon?: TemplateRef<unknown> | null;
  action?: ToastButton;
  cancel?: ToastButton;
  onDismiss?: (toast: Toast) => void;
  onAutoClose?: (toast: Toast) => void;
}

export interface Toast extends Omit<ToastOptions, 'id'> {
  id: ToastId;
  type: ToastType;
  title: string;
  /** Set by `toast.custom`: the card's whole contents. */
  custom?: TemplateRef<ToastContext> | null;
}

export type ToastMessage = string | { title: string; description?: string };

export interface ToastPromiseData<T> extends Omit<ToastOptions, 'id'> {
  loading: string;
  /** Leaving it out dismisses the toast on success rather than showing one. */
  success?: ToastMessage | ((value: T) => ToastMessage);
  /** Leaving it out dismisses the toast on failure. */
  error?: ToastMessage | ((reason: unknown) => ToastMessage);
  finally?: () => void;
}

// ── The store ────────────────────────────────────────────────────────────────

let counter = 0;

/** Newest first, which is the order every stack renders in. */
const items = signal<readonly Toast[]>([]);

const targets = signal<ReadonlyMap<string, HTMLElement>>(new Map());

/**
 * Every write below reads the current value first, and `toast()` is meant to be
 * callable from anywhere — including an `effect`, which is where a component
 * registers its target. Read inside that effect, the signal would subscribe it to
 * its own write and the effect would re-run forever, synchronously: a hang with no
 * stack to look at. Reading through this keeps a write a write.
 */
const read = <T>(source: () => T): T => untracked(source);

/**
 * Adds a toast, or replaces the one with the same id where it stands.
 *
 * A fresh object every time, even for an update: its identity changing is what
 * tells the toaster to restart the countdown and resize the card in place,
 * rather than having to compare the fields.
 */
function upsert(
  title: string,
  type: ToastType,
  options: ToastOptions = {},
  custom: TemplateRef<ToastContext> | null = null,
): ToastId {
  const id = options.id ?? ++counter;
  const current = read(items);
  const index = current.findIndex((item) => item.id === id);
  const previous = index === -1 ? {} : current[index];
  const next: Toast = { ...previous, ...options, id, type, title, custom };

  items.set(index === -1 ? [next, ...current] : current.map((item, i) => (i === index ? next : item)));
  return id;
}

function remove(id: ToastId): Toast | undefined {
  const current = read(items);
  const found = current.find((item) => item.id === id);
  if (found) items.set(current.filter((item) => item !== found));
  return found;
}

/** With no id, every toast; each one's `onDismiss` still runs. */
function dismiss(id?: ToastId): void {
  if (id === undefined) {
    const all = read(items);
    items.set([]);
    for (const item of all) item.onDismiss?.(item);
    return;
  }
  const found = remove(id);
  found?.onDismiss?.(found);
}

function message<T>(source: ToastMessage | ((value: T) => ToastMessage), value: T) {
  const resolved = typeof source === 'function' ? source(value) : source;
  return typeof resolved === 'string' ? { title: resolved } : resolved;
}

/**
 * A toast that follows a promise: loading while it runs, then success or error.
 *
 * Returns the id and `unwrap()`, which hands the promise back so a rejection
 * that has to be handled elsewhere still can be. The promise the toast itself
 * watches is caught, so showing a toast never makes an unhandled rejection.
 */
function promise<T>(source: Promise<T> | (() => Promise<T>), data: ToastPromiseData<T>) {
  const { loading, success, error, finally: onFinally, ...options } = data;
  const id = upsert(loading, 'loading', options);

  const settle = (type: ToastType, text: { title: string; description?: string }) =>
    upsert(text.title, type, { ...options, id, description: text.description ?? options.description });

  const result = (typeof source === 'function' ? source() : source)
    .then(
      (value) => {
        if (success === undefined) dismiss(id);
        else settle('success', message(success, value));
        return value;
      },
      (reason: unknown) => {
        if (error === undefined) dismiss(id);
        else settle('error', message(error, reason));
        throw reason;
      },
    )
    .finally(() => onFinally?.());

  result.catch(() => {});

  return { id, unwrap: () => result };
}

const typed = (type: ToastType) => (title: string, options?: ToastOptions) =>
  upsert(title, type, options);

/**
 * Shows a toast. `toast('…')` is the plain one; the rest carry a type, which is
 * the plate's icon and hue.
 */
export const toast = Object.assign(typed('default'), {
  message: typed('default'),
  success: typed('success'),
  info: typed('info'),
  warning: typed('warning'),
  error: typed('error'),
  loading: typed('loading'),
  /** A card with nothing of ours in it: the template is the whole contents. */
  custom: (template: TemplateRef<ToastContext>, options?: ToastOptions) =>
    upsert('', 'default', options, template),
  promise,
  dismiss,
  /** A snapshot, for code that needs to know what is showing. */
  getToasts: (): readonly Toast[] => read(items),
});

/**
 * Names an element that toasts can come out of, so a save can answer from the
 * thing that was saved. Returns the unregister; `liquidToastTarget` calls it.
 */
export function registerToastTarget(name: string, element: HTMLElement): () => void {
  const next = new Map(read(targets));
  next.set(name, element);
  targets.set(next);

  return () => {
    const current = read(targets);
    if (current.get(name) !== element) return;
    const without = new Map(current);
    without.delete(name);
    targets.set(without);
  };
}

/** For `<x-liquid-toaster>` only: the live list, the targets, and the timeout close. */
export const toastState = {
  toasts: items.asReadonly(),
  targets: targets.asReadonly(),
  /** Its time ran out, which is `onAutoClose` rather than `onDismiss`. */
  autoClose(id: ToastId): void {
    const found = remove(id);
    found?.onAutoClose?.(found);
  },
};
