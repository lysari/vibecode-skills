import { describe, expect, test } from "bun:test";
import { finishPresence, nextPresence, readPresencePhase, startPresence } from "../../../src/mainview/hooks/use-presence";

const first = { id: "a" };
const second = { id: "b" };

describe("startPresence", () => {
	test("shows a value open on the first render without an enter animation", () => {
		const state = startPresence(first);
		expect(state.shown).toBe(first);
		expect(readPresencePhase(state)).toBe("idle");
	});

	test("shows nothing for a closed first value", () => {
		expect(startPresence(null).shown).toBeNull();
		expect(startPresence(false).shown).toBeNull();
	});
});

describe("nextPresence", () => {
	test("returns the same state while the value is unchanged", () => {
		const open = startPresence(first);
		const closed = startPresence<typeof first>(null);
		expect(nextPresence(open, first)).toBe(open);
		expect(nextPresence(closed, null)).toBe(closed);
		expect(nextPresence(closed, false)).toBe(closed);
	});

	test("enters a value opened after the first render", () => {
		const state = nextPresence(startPresence<typeof first>(null), first);
		expect(state.shown).toBe(first);
		expect(readPresencePhase(state)).toBe("enter");
	});

	test("keeps a closed value shown while it exits, until its animation ends", () => {
		const closing = nextPresence(startPresence(first), null);
		expect(closing.shown).toBe(first);
		expect(readPresencePhase(closing)).toBe("exit");
		const closed = finishPresence(closing);
		expect(closed.shown).toBeNull();
		expect(readPresencePhase(closed)).toBe("idle");
	});

	test("switches to a new open value without replaying the enter", () => {
		const state = nextPresence(startPresence(first), second);
		expect(state.shown).toBe(second);
		expect(readPresencePhase(state)).toBe("idle");
	});

	test("enters again when reopened during its exit", () => {
		const closing = nextPresence(startPresence(first), null);
		const reopened = nextPresence(closing, second);
		expect(reopened.shown).toBe(second);
		expect(readPresencePhase(reopened)).toBe("enter");
		expect(finishPresence(reopened)).toBe(reopened);
	});

	test("treats false as closed", () => {
		const closing = nextPresence(startPresence(true), false);
		expect(readPresencePhase(closing)).toBe("exit");
		expect(finishPresence(closing).shown).toBeNull();
	});
});
