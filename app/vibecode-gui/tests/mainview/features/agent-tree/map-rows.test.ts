import { describe, expect, test } from "bun:test";
import { wrapMapRows } from "../../../../src/mainview/features/agent-tree/map-rows";

describe("wrapMapRows", () => {
	test("keeps every item in one row when they fit", () => {
		expect(wrapMapRows(["a", "b", "c"], { widths: [320, 320, 320], gap: 40, available: 1040 })).toEqual([
			["a", "b", "c"],
		]);
	});

	test("wraps into the most columns whose widest items and gaps fit", () => {
		const widths = [320, 320, 358, 320, 320, 358, 424, 320, 358];
		const items = widths.map((_, index) => index);
		expect(wrapMapRows(items, { widths, gap: 40, available: 822 })).toEqual([[0, 1], [2, 3], [4, 5], [6, 7], [8]]);
		expect(wrapMapRows(items, { widths, gap: 40, available: 821 })).toEqual(items.map((item) => [item]));
	});

	test("sizes each column by its widest item, not the average", () => {
		const space = { widths: [100, 100, 100, 300], gap: 0 };
		expect(wrapMapRows(["a", "b", "c", "d"], { ...space, available: 350 })).toEqual([["a"], ["b"], ["c"], ["d"]]);
		expect(wrapMapRows(["a", "b", "c", "d"], { ...space, available: 400 })).toEqual([
			["a", "b"],
			["c", "d"],
		]);
	});

	test("puts an item wider than the space in a single column", () => {
		expect(wrapMapRows(["a", "b"], { widths: [600, 300], gap: 40, available: 400 })).toEqual([["a"], ["b"]]);
	});

	test("starts unmeasured items in one row", () => {
		expect(wrapMapRows(["a", "b", "c"], { widths: [], gap: 0, available: 0 })).toEqual([["a", "b", "c"]]);
	});

	test("returns no rows for no items", () => {
		expect(wrapMapRows([], { widths: [], gap: 40, available: 400 })).toEqual([]);
	});
});
