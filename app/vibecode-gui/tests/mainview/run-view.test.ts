import { describe, expect, test } from "bun:test";
import { buildRunView, buildThread, formatCost, formatDuration, listTreeAgents } from "../../src/mainview/run-view";
import type { RunEvent } from "../../src/shared/run.interface";
import type { Session } from "../../src/shared/session.interface";

const events: RunEvent[] = [
	{ type: "run.started", runId: "r1", at: 10 },
	{ type: "agent.spawned", runId: "r1", at: 10, agentId: "root", parentId: null, name: "Orchestrator", model: "m", task: "t", replaces: null },
	{ type: "text.delta", runId: "r1", at: 11, agentId: "root", messageId: "m1", text: "Hello " },
	{ type: "tool.started", runId: "r1", at: 12, agentId: "root", toolCallId: "t1", name: "Glob", input: "src/**" },
	{ type: "text.delta", runId: "r1", at: 13, agentId: "root", messageId: "m1", text: "world" },
	{ type: "tool.finished", runId: "r1", at: 14, agentId: "root", toolCallId: "t1", result: "3 files", isError: false },
	{ type: "agent.spawned", runId: "r1", at: 15, agentId: "planner", parentId: "root", name: "planner", model: "m", task: "Plan", replaces: null },
	{ type: "input.needed", runId: "r1", at: 16, agentId: "planner", question: "Keep it?" },
	{ type: "agent.status", runId: "r1", at: 16, agentId: "planner", status: "needs-input" },
	{ type: "agent.usage", runId: "r1", at: 17, agentId: "planner", costUsd: 0.25, durationMs: 65_000 },
];

const session: Session = {
	id: "s1",
	projectRoot: "/p",
	title: "t",
	createdAt: 0,
	updatedAt: 0,
	agent: null,
	skills: [],
	messages: [
		{ kind: "note", id: "n1", at: 5, text: "Installed x into .claude/skills" },
		{ kind: "user", id: "u1", at: 9, text: "/x go", runId: "r1", replyTo: null },
		{ kind: "user", id: "u2", at: 20, text: "Yes", runId: "r1", replyTo: "planner" },
	],
	events,
};

describe("buildRunView", () => {
	test("builds the agent tree with live status, question and usage", () => {
		const view = buildRunView(events);
		expect(view.runs).toEqual([{ id: "r1", rootId: "root", status: "running" }]);
		const root = view.agents.get("root");
		expect(root && listTreeAgents(root).map((agent) => agent.id)).toEqual(["root", "planner"]);
		expect(view.agents.get("planner")).toMatchObject({ status: "needs-input", question: "Keep it?", costUsd: 0.25, durationMs: 65_000 });
	});

	test("joins text deltas by message, and fills tool results in place", () => {
		const items = buildRunView(events).items.get("root") ?? [];
		expect(items.map((item) => item.kind)).toEqual(["text", "tool", "agent", "question"]);
		expect(items[0]).toMatchObject({ text: "Hello world" });
		expect(items[1]).toMatchObject({ name: "Glob", result: "3 files", isError: false });
	});

	test("ends a run with a note and clears answered questions", () => {
		const view = buildRunView([
			...events,
			{ type: "agent.status", runId: "r1", at: 21, agentId: "planner", status: "done" },
			{ type: "run.finished", runId: "r1", at: 22, status: "stopped" },
		]);
		expect(view.agents.get("planner")?.question).toBeNull();
		expect(view.runs[0].status).toBe("stopped");
		expect(view.items.get("root")?.pop()).toMatchObject({ kind: "note", text: "Run stopped" });
	});
});

describe("buildThread", () => {
	test("merges messages with the orchestrator's transcript by time", () => {
		const thread = buildThread(session, buildRunView(events), null);
		expect(thread.map((item) => item.key)).toEqual(["n1", "u1", "m1", "t1", "r1:6", "r1:7", "u2"]);
	});

	test("shows an agent its own transcript and the replies sent to it", () => {
		const thread = buildThread(session, buildRunView(events), "planner");
		expect(thread.map((item) => item.kind)).toEqual(["question", "user"]);
	});
});

describe("formatting", () => {
	test("formats cost and duration compactly", () => {
		expect(formatCost(0)).toBe("$0.00");
		expect(formatCost(0.004)).toBe("<$0.01");
		expect(formatCost(1.234)).toBe("$1.23");
		expect(formatDuration(4_400)).toBe("4s");
		expect(formatDuration(65_000)).toBe("1m 05s");
	});
});
