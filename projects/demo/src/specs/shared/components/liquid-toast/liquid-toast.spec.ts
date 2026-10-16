import { Component, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiquidToaster } from '@app/shared/components/liquid-toast/liquid-toast';
import { LiquidToastTarget } from '@app/shared/components/liquid-toast/liquid-toast-target.directive';
import { type ToastContext, registerToastTarget, toast, toastState } from '@app/shared/components/liquid-toast/toast';

describe('toast', () => {
  afterEach(() => toast.dismiss());

  it('adds the newest first, with its type', () => {
    toast('First');
    toast.success('Second', { description: 'Done' });

    const [newest, oldest] = toast.getToasts();
    expect(newest).toMatchObject({ title: 'Second', type: 'success', description: 'Done' });
    expect(oldest).toMatchObject({ title: 'First', type: 'default' });
  });

  it('updates a toast in place when given its id, keeping its position in the stack', () => {
    toast('Other');
    const id = toast.loading('Uploading…');
    toast.success('Uploaded', { id });

    expect(toast.getToasts().map((item) => [item.title, item.type])).toEqual([
      ['Uploaded', 'success'],
      ['Other', 'default'],
    ]);
  });

  it('gives an update a new identity, so the toaster can tell it changed', () => {
    const id = toast.loading('Uploading…');
    const before = toast.getToasts()[0];
    toast.success('Uploaded', { id });

    expect(toast.getToasts()[0]).not.toBe(before);
  });

  it('carries the previous options through an update', () => {
    const id = toast.loading('Uploading…', { autoDismiss: false, description: 'Hold on' });
    toast.success('Uploaded', { id });

    expect(toast.getToasts()[0]).toMatchObject({ autoDismiss: false, description: 'Hold on' });
  });

  it('calls onDismiss when dismissed, one or all', () => {
    const onDismiss = vi.fn();
    const id = toast('One', { onDismiss });
    toast('Two', { onDismiss });

    toast.dismiss(id);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    toast.dismiss();
    expect(onDismiss).toHaveBeenCalledTimes(2);
    expect(toast.getToasts()).toHaveLength(0);
  });

  it('follows a promise from loading to success', async () => {
    const { id, unwrap } = toast.promise(Promise.resolve({ name: 'draft' }), {
      loading: 'Saving…',
      success: (data) => `Saved ${data.name}`,
      error: 'Failed',
    });
    expect(toast.getToasts()[0]).toMatchObject({ id, type: 'loading', title: 'Saving…' });

    await expect(unwrap()).resolves.toEqual({ name: 'draft' });
    expect(toast.getToasts()[0]).toMatchObject({ id, type: 'success', title: 'Saved draft' });
  });

  it('follows a promise from loading to error, and unwrap still rejects', async () => {
    const { unwrap } = toast.promise(() => Promise.reject(new Error('offline')), {
      loading: 'Saving…',
      error: (error) => ({ title: 'Could not save', description: (error as Error).message }),
    });

    await expect(unwrap()).rejects.toThrow('offline');
    expect(toast.getToasts()[0]).toMatchObject({
      type: 'error',
      title: 'Could not save',
      description: 'offline',
    });
  });

  it('dismisses rather than showing anything when a promise has no message for the outcome', async () => {
    const { id, unwrap } = toast.promise(Promise.resolve('ok'), { loading: 'Saving…' });
    expect(toast.getToasts().map((item) => item.id)).toEqual([id]);

    await unwrap();
    expect(toast.getToasts()).toHaveLength(0);
  });

  it('runs a promise finally either way', async () => {
    const after = vi.fn();
    await toast.promise(Promise.resolve(1), { loading: 'x', finally: after }).unwrap();
    expect(after).toHaveBeenCalledTimes(1);

    const failing = toast.promise(() => Promise.reject(new Error('no')), {
      loading: 'x',
      finally: after,
    });
    await expect(failing.unwrap()).rejects.toThrow('no');
    expect(after).toHaveBeenCalledTimes(2);
  });
});

/** A host, so a custom card and a target can be given real templates. */
@Component({
  imports: [LiquidToaster, LiquidToastTarget],
  template: `
    <button liquidToastTarget="bell" #bell>Notifications</button>
    <ng-template #card let-t>Paid {{ t.title }}</ng-template>
    <x-liquid-toaster />
  `,
})
class Host {
  readonly card = viewChild.required<TemplateRef<ToastContext>>('card');
  readonly toaster = viewChild.required(LiquidToaster);
}

describe('LiquidToaster', () => {
  let fixture: ComponentFixture<LiquidToaster>;
  const element = () => fixture.nativeElement as HTMLElement;
  const slots = () => element().querySelectorAll('.liquid-toast-slot:not(.is-ghost)');

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [LiquidToaster] }).compileComponents();
    fixture = TestBed.createComponent(LiquidToaster);
    fixture.detectChanges();
  });

  afterEach(() => {
    toast.dismiss();
    vi.useRealTimers();
  });

  it('renders a toast with its title, description and type', () => {
    toast.error('Upload failed', { description: 'The file is too large.' });
    fixture.detectChanges();

    const card = element().querySelector('.liquid-toast') as HTMLElement;
    expect(card.classList).toContain('is-error');
    expect(card.getAttribute('role')).toBe('alert');
    expect(card.textContent).toContain('Upload failed');
    expect(card.textContent).toContain('The file is too large.');
  });

  it('announces assertively only for an error or an important toast', () => {
    toast('Quiet');
    toast('Loud', { important: true });
    fixture.detectChanges();

    const roles = Array.from(element().querySelectorAll('.liquid-toast')).map((card) =>
      card.getAttribute('role'),
    );
    expect(roles).toEqual(['alert', null]);
  });

  it('gives a plate to a typed toast, none to a plain one, and none at all for icon: null', () => {
    toast('Plain');
    fixture.detectChanges();
    expect(element().querySelector('.liquid-toast-plate')).toBeNull();

    toast.dismiss();
    toast.success('Typed');
    fixture.detectChanges();
    expect(element().querySelector('.liquid-toast-plate')).not.toBeNull();

    toast.dismiss();
    toast.success('Bare', { icon: null });
    fixture.detectChanges();
    expect(element().querySelector('.liquid-toast-plate')).toBeNull();
  });

  it('spins while loading', () => {
    toast.loading('Uploading…');
    fixture.detectChanges();
    expect(element().querySelector('.liquid-toast-spinner')).not.toBeNull();
  });

  it('shows a close button only when asked', () => {
    toast('Plain');
    fixture.detectChanges();
    expect(element().querySelector('.liquid-toast-close')).toBeNull();

    fixture.componentRef.setInput('closeButton', true);
    fixture.detectChanges();
    (element().querySelector('.liquid-toast-close') as HTMLButtonElement).click();
    expect(toast.getToasts()).toHaveLength(0);
  });

  it('withholds the close button from a toast that says it is not dismissible', () => {
    toast.info('Waiting for approval', { autoDismiss: false, dismissible: false });
    fixture.detectChanges();
    expect(element().querySelector('.liquid-toast-close')).toBeNull();
    expect(slots()).toHaveLength(1);
  });

  it('runs an action and dismisses, unless the action prevents it', () => {
    const kept = toast('Kept', {
      action: { label: 'Keep', onClick: (event) => event.preventDefault() },
    });
    fixture.detectChanges();
    (element().querySelector('.liquid-toast-button') as HTMLButtonElement).click();
    expect(toast.getToasts().map((item) => item.id)).toEqual([kept]);

    const onClick = vi.fn();
    toast('Undo', { cancel: { label: 'Undo', onClick } });
    fixture.detectChanges();
    (element().querySelector('.liquid-toast-button') as HTMLButtonElement).click();
    expect(onClick).toHaveBeenCalled();
    expect(toast.getToasts().map((item) => item.id)).toEqual([kept]);
  });

  it('closes itself after its duration and calls onAutoClose, not onDismiss', () => {
    const onAutoClose = vi.fn();
    const onDismiss = vi.fn();
    toast.success('Done', { duration: 1000, onAutoClose, onDismiss });
    fixture.detectChanges();

    vi.advanceTimersByTime(999);
    expect(toast.getToasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.getToasts()).toHaveLength(0);
    expect(onAutoClose).toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('holds every countdown while the stack is hovered, and keeps what is left', () => {
    toast('Done', { duration: 1000 });
    fixture.detectChanges();
    vi.advanceTimersByTime(600);

    const list = element().querySelector('.liquid-toast-list') as HTMLElement;
    list.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(5000);
    expect(toast.getToasts()).toHaveLength(1);

    list.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(399);
    expect(toast.getToasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.getToasts()).toHaveLength(0);
  });

  it('holds every countdown while the tab is hidden', () => {
    toast('Done', { duration: 1000 });
    fixture.detectChanges();

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(5000);
    expect(toast.getToasts()).toHaveLength(1);
  });

  it('keeps a loading toast until it settles, then starts its countdown', () => {
    const id = toast.loading('Uploading…');
    fixture.detectChanges();
    vi.advanceTimersByTime(60_000);
    expect(toast.getToasts()).toHaveLength(1);

    toast.success('Uploaded', { id });
    fixture.detectChanges();
    vi.advanceTimersByTime(4000);
    expect(toast.getToasts()).toHaveLength(0);
  });

  it('keeps a toast with autoDismiss: false until it is closed, and gives it a close button', () => {
    toast.warning('Session expired', { autoDismiss: false });
    fixture.detectChanges();
    vi.advanceTimersByTime(60_000);
    expect(toast.getToasts()).toHaveLength(1);

    (element().querySelector('.liquid-toast-close') as HTMLButtonElement).click();
    expect(toast.getToasts()).toHaveLength(0);
  });

  it('keeps every toast when the toaster has autoDismiss off, unless a toast opts in', () => {
    fixture.componentRef.setInput('autoDismiss', false);
    toast('Stays');
    toast('Goes', { autoDismiss: true, duration: 1000 });
    fixture.detectChanges();

    vi.advanceTimersByTime(60_000);
    expect(toast.getToasts().map((item) => item.title)).toEqual(['Stays']);
  });

  it('stacks toasts against the edge they ask for', () => {
    toast('Top');
    toast('Bottom', { position: 'bottom-right' });
    fixture.detectChanges();

    const top = element().querySelector('.liquid-toast-list.is-edge.is-top:not(.is-left, .is-right)');
    const bottomRight = element().querySelector('.liquid-toast-list.is-edge.is-up.is-right');
    expect(top?.textContent?.trim()).toBe('Top');
    expect(bottomRight?.textContent?.trim()).toBe('Bottom');
  });

  it('falls back to top-center for an edge it does not know', () => {
    toast('Odd', { position: 'middle-nowhere' as never });
    fixture.detectChanges();
    expect(
      element().querySelector('.liquid-toast-list.is-edge.is-top:not(.is-left, .is-right)'),
    ).not.toBeNull();
  });

  it('sends a toast to its fallback edge while its target is not on screen', () => {
    // Not in the document, so not showing.
    const unregister = registerToastTarget('notifications', document.createElement('button'));
    toast('New message', { position: { target: 'notifications', fallback: 'bottom-center' } });
    fixture.detectChanges();

    const list = element().querySelector('.liquid-toast-list') as HTMLElement;
    expect(list.classList).toContain('is-edge');
    expect(list.classList).toContain('is-up');
    unregister();
    expect(toastState.targets().has('notifications')).toBe(false);
  });

  it('counts what is waiting in a ghost, which shows all of them and folds them back', () => {
    for (let i = 1; i <= 5; i++) toast(`Toast ${i}`, { autoDismiss: false });
    fixture.detectChanges();

    const ghost = () => element().querySelector('.liquid-toast-ghost') as HTMLButtonElement | null;
    // The count pops through `numberPopIn`, which also keeps a screen-reader copy
    // of the value — so read the label without it.
    const label = () => {
      const button = ghost()?.cloneNode(true) as HTMLElement | undefined;
      button?.querySelectorAll('.t-digit-sr').forEach((node) => node.remove());
      return button?.textContent?.replace(/\s+/g, ' ').trim();
    };
    expect(slots()).toHaveLength(3);
    expect(label()).toBe('+2 more');
    expect(ghost()?.getAttribute('aria-expanded')).toBe('false');

    ghost()!.click();
    fixture.detectChanges();
    expect(slots()).toHaveLength(5);
    expect(label()).toBe('Show less');
    expect(ghost()?.getAttribute('aria-expanded')).toBe('true');

    ghost()!.click();
    fixture.detectChanges();
    expect(slots()).toHaveLength(3);
    expect(label()).toBe('+2 more');
  });

  it('drops the ghost, and forgets it was expanded, once nothing is waiting', () => {
    const ids = [1, 2, 3, 4].map((i) => toast(`Toast ${i}`, { autoDismiss: false }));
    fixture.detectChanges();
    (element().querySelector('.liquid-toast-ghost') as HTMLButtonElement).click();
    fixture.detectChanges();

    toast.dismiss(ids[0]);
    fixture.detectChanges();
    expect(element().querySelector('.liquid-toast-slot.is-ghost')).toBeNull();

    // A new overflow starts collapsed again.
    toast('Toast 5', { autoDismiss: false });
    fixture.detectChanges();
    expect(slots()).toHaveLength(3);
    const remaining = element().querySelector('.liquid-toast-ghost')!.cloneNode(true) as HTMLElement;
    remaining.querySelectorAll('.t-digit-sr').forEach((node) => node.remove());
    expect(remaining.textContent?.replace(/\s+/g, ' ').trim()).toBe('+1 more');
  });

  it('gives a toast waiting behind the ghost no countdown until it shows', () => {
    for (let i = 1; i <= 4; i++) toast(`Toast ${i}`, { duration: 1000 });
    fixture.detectChanges();

    // The three showing time out; the fourth has not started counting.
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(toast.getToasts().map((item) => item.title)).toEqual(['Toast 1']);
  });

  it('shows only visibleToasts at once', () => {
    for (let i = 1; i <= 5; i++) toast(`Toast ${i}`, { autoDismiss: false });
    fixture.detectChanges();

    expect(slots()).toHaveLength(3);
    expect(toast.getToasts()).toHaveLength(5);
  });

  it('follows visibleToasts when it changes', () => {
    for (let i = 1; i <= 5; i++) toast(`Toast ${i}`, { autoDismiss: false });
    fixture.componentRef.setInput('visibleToasts', 5);
    fixture.detectChanges();
    expect(slots()).toHaveLength(5);
    expect(element().querySelector('.liquid-toast-slot.is-ghost')).toBeNull();
  });

  it('puts gap and offset on the host, where the stacks read them', () => {
    fixture.componentRef.setInput('gap', 12);
    fixture.componentRef.setInput('offset', '2rem');
    fixture.detectChanges();

    expect(element().style.getPropertyValue('--_liquid-toast-gap')).toBe('12px');
    expect(element().style.getPropertyValue('--_liquid-toast-offset')).toBe('2rem');
  });

  it('moves focus into the stack on the hotkey, and not without a toast', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, code: 'KeyT' }));
    expect(document.activeElement).not.toBe(element().querySelector('.liquid-toast-list'));

    toast('Read me', { autoDismiss: false });
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, code: 'KeyT' }));
    expect(document.activeElement).toBe(element().querySelector('.liquid-toast-list'));
  });

  describe('countdown pill', () => {
    const slot = () => element().querySelector('.liquid-toast-slot:not(.is-ghost)') as HTMLElement;
    /** The pill while it is out; hidden, it stays in the DOM without `data-shown`. */
    const pill = () =>
      element().querySelector(
        '.liquid-toast-timer-anchor[data-shown] .liquid-toast-timer',
      ) as HTMLElement | null;
    const anchor = () => element().querySelector('.liquid-toast-timer-anchor');
    const hover = (on: boolean) => {
      slot().dispatchEvent(new PointerEvent(on ? 'pointerenter' : 'pointerleave'));
      slot().parentElement!.dispatchEvent(new PointerEvent(on ? 'pointerenter' : 'pointerleave'));
      fixture.detectChanges();
    };

    it('shows the time left while the toast is hovered, held still by the pause', () => {
      toast('Saved', { duration: 5000, timer: 'hover' });
      fixture.detectChanges();
      vi.advanceTimersByTime(1200);
      fixture.detectChanges();
      expect(pill()).toBeNull();

      hover(true);
      expect(pill()?.textContent).toContain('4');
      expect(pill()?.textContent).toContain('s');

      vi.advanceTimersByTime(3000);
      fixture.detectChanges();
      expect(toast.getToasts()).toHaveLength(1);

      hover(false);
      expect(pill()).toBeNull();
    });

    it('keeps ticking while hovered when pauseOnHover is off', () => {
      fixture.componentRef.setInput('pauseOnHover', false);
      toast('Saved', { duration: 5000, timer: 'hover' });
      fixture.detectChanges();
      hover(true);

      vi.advanceTimersByTime(2600);
      fixture.detectChanges();
      expect(pill()?.textContent).toContain('3');
      vi.advanceTimersByTime(2400);
      expect(toast.getToasts()).toHaveLength(0);
    });

    it('counts in minutes past 99 seconds', () => {
      fixture.componentRef.setInput('pauseOnHover', false);
      toast('Long', { duration: 300_000, timer: 'always' });
      fixture.detectChanges();
      vi.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(pill()?.textContent).toContain('m');
    });

    it('follows the timer option: always without a hover, off never', () => {
      toast('Always', { duration: 5000, timer: 'always' });
      fixture.detectChanges();
      vi.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(pill()).not.toBeNull();

      toast.dismiss();
      toast('Off', { duration: 5000, timer: 'off' });
      fixture.detectChanges();
      hover(true);
      expect(anchor()).toBeNull();
    });

    it('takes the toaster-wide timer, which a toast can override', () => {
      fixture.componentRef.setInput('timer', 'always');
      toast('Shown', { duration: 5000 });
      toast('Hidden', { duration: 5000, timer: 'off' });
      fixture.detectChanges();
      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(element().querySelectorAll('.liquid-toast-timer-anchor')).toHaveLength(1);
    });

    it('is off unless asked for', () => {
      toast('Plain', { duration: 5000 });
      fixture.detectChanges();
      hover(true);
      expect(anchor()).toBeNull();
    });

    it('has nothing to show for a toast that does not dismiss itself', () => {
      toast('Stays', { autoDismiss: false, timer: 'always' });
      fixture.detectChanges();
      hover(true);
      expect(anchor()).toBeNull();
    });

    /**
     * The pill's width *is* its digits. Drop them in the frame the hover ends and
     * the gather has nothing left to close but 18px of bare padding, so the width
     * snaps shut instead of shrinking — measured against the demo as 18px on every
     * frame where it should have run 38 → 18. The hold has to be taken in the pass
     * that hides the pill, ahead of the template, not afterwards.
     *
     * Web Animations are stubbed for this one test: jsdom has none, and without
     * them `gatherTimer` bails to its release and the hold is over before it can be
     * observed. The stub never settles, which is the window being asserted on.
     */
    it('keeps the digits mounted while the pill gathers away', () => {
      const proto = Element.prototype as unknown as Record<string, unknown>;
      const original = { animate: proto['animate'], getAnimations: proto['getAnimations'] };
      proto['animate'] = () => ({ finished: new Promise<void>(() => {}), cancel: () => {} });
      proto['getAnimations'] = () => [];

      try {
        toast('Saved', { duration: 5000, timer: 'hover' });
        fixture.detectChanges();
        hover(true);
        expect(element().querySelector('.liquid-toast-timer-unit')).not.toBeNull();

        hover(false);
        // No longer shown — and still carrying its digits, mid-gather.
        expect(element().querySelector('.liquid-toast-timer-anchor[data-shown]')).toBeNull();
        expect(element().querySelector('.liquid-toast-timer-unit')).not.toBeNull();
      } finally {
        proto['animate'] = original.animate;
        proto['getAnimations'] = original.getAnimations;
      }
    });
  });
});

describe('LiquidToaster in a host', () => {
  let fixture: ComponentFixture<Host>;
  const element = () => fixture.nativeElement as HTMLElement;

  /**
   * A target is only a target while it is laid out, which jsdom never reports:
   * `getClientRects()` is empty for everything in it, so without this every
   * anchored toast would fall back to an edge and the anchored path would go
   * untested. Giving the button a box is what makes it visible to `isShowing`.
   */
  const giveTheTargetABox = () => {
    const bell = element().querySelector('button[liquidtoasttarget]') as HTMLElement;
    const box = { x: 40, y: 200, width: 120, height: 32, top: 200, left: 40, right: 160, bottom: 232 };
    const rect = { ...box, toJSON: () => box } as DOMRect;
    vi.spyOn(bell, 'getClientRects').mockReturnValue({
      length: 1,
      item: () => rect,
      [0]: rect,
      [Symbol.iterator]: function* () { yield rect; },
    } as unknown as DOMRectList);
    vi.spyOn(bell, 'getBoundingClientRect').mockReturnValue(rect);
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  // The fixture goes before the store does: dismissing first leaves rows playing
  // `animate.leave`, and nothing in this environment finishes a Web Animation, so
  // the teardown would wait on a row that never departs.
  afterEach(() => {
    fixture.destroy();
    toast.dismiss();
    vi.useRealTimers();
  });

  it('renders a custom template as the whole card', () => {
    toast.custom(fixture.componentInstance.card(), { autoDismiss: false });
    fixture.detectChanges();

    const body = element().querySelector('.liquid-toast-body') as HTMLElement;
    expect(body.classList).toContain('is-custom');
    expect(body.textContent).toContain('Paid');
    expect(body.querySelector('.liquid-toast-copy')).toBeNull();
  });

  it('anchors a stack to a registered target that is on screen', () => {
    giveTheTargetABox();
    toast('Beside the bell', { position: { target: 'bell' }, autoDismiss: false });
    fixture.detectChanges();

    const list = element().querySelector('.liquid-toast-list') as HTMLElement;
    expect(list.classList).toContain('is-anchored');
    expect(list.classList).not.toContain('is-edge');
  });

  it('grows above the target when told to, whatever the room', () => {
    giveTheTargetABox();
    toast('Above', { position: { target: 'bell', side: 'above' }, autoDismiss: false });
    fixture.detectChanges();

    expect(element().querySelector('.liquid-toast-list')?.classList).toContain('is-above');
  });

  it('keeps a target stack and an edge stack apart', () => {
    giveTheTargetABox();
    toast('Edge', { autoDismiss: false });
    toast('Anchored', { position: { target: 'bell' }, autoDismiss: false });
    fixture.detectChanges();

    expect(element().querySelectorAll('.liquid-toast-list')).toHaveLength(2);
  });

  it('gives the registration back when the target element goes', () => {
    expect(toastState.targets().has('bell')).toBe(true);
    fixture.destroy();
    expect(toastState.targets().has('bell')).toBe(false);
    // `afterEach` destroys it again; a second destroy is a no-op.
  });
});
