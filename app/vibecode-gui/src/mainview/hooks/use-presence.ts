import { useState, type AnimationEvent } from "react";

export type PresencePhase = "idle" | "enter" | "exit";

export interface PresenceState<T> {
	shown: T | null;
	isOpen: boolean;
	hasEntered: boolean;
}

export interface PresenceAttributes {
	"data-presence": PresencePhase;
	onAnimationEnd: (event: AnimationEvent<HTMLElement>) => void;
}

function isOpenValue<T>(value: T | null | false): value is T {
	return value !== null && value !== false;
}

// A value open on the first render stays "idle", so nothing animates on the initial paint.
export function startPresence<T>(value: T | null | false): PresenceState<T> {
	return { shown: isOpenValue(value) ? value : null, isOpen: isOpenValue(value), hasEntered: false };
}

// Returns the same state object when nothing changed, so the hook can set it during render without looping.
// An open value is compared by identity: pass state or a memoized value, never one rebuilt on every render.
export function nextPresence<T>(state: PresenceState<T>, value: T | null | false): PresenceState<T> {
	if (isOpenValue(value)) {
		if (state.isOpen && Object.is(state.shown, value)) return state;
		return { shown: value, isOpen: true, hasEntered: state.isOpen ? state.hasEntered : true };
	}
	return state.isOpen ? { ...state, isOpen: false } : state;
}

export function finishPresence<T>(state: PresenceState<T>): PresenceState<T> {
	return state.isOpen || state.shown === null ? state : { ...state, shown: null };
}

export function readPresencePhase<T>(state: PresenceState<T>): PresencePhase {
	if (!state.isOpen) return state.shown === null ? "idle" : "exit";
	return state.hasEntered ? "enter" : "idle";
}

/**
 * Keeps a closed value mounted until its exit animation ends. `shown` is the open value, or the last one while it
 * animates out; spread `presence` on the animated element and style it with the `data-enter:` and `data-exit:`
 * variants. Only the element's own `animationend` unmounts it: the event bubbles from animated children too.
 */
export function usePresence<T>(value: T | null | false): { shown: T | null; presence: PresenceAttributes } {
	const [state, setState] = useState(() => startPresence(value));
	const next = nextPresence(state, value);
	if (next !== state) setState(next);
	return {
		shown: next.shown,
		presence: {
			"data-presence": readPresencePhase(next),
			onAnimationEnd: (event) => {
				if (event.target === event.currentTarget) setState(finishPresence);
			},
		},
	};
}
