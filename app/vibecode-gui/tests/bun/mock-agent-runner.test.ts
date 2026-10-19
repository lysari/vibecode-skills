import { describe, expect, test } from "bun:test";
import { MockAgentRunner, type RunnerClock } from "../../src/bun/mock-agent-runner";
import type { AgentStatus, RunEvent, RunRequest } from "../../src/shared/run.interface";

const SEED_SEARCH = 200;

class ManualClock implements RunnerClock {
	private time = 0;
	private nextHandle = 1;
	private readonly timers = new Map<number, { at: number; callback: () => void }>();

	now(): number {
		return this.time;
	}

	setTimeout(callback: () => void, ms: number): unknown {
		const handle = this.nextHandle++;
		this.timers.set(handle, { at: this.time + ms, callback });
		return handle;
	}

	clearTimeout(handle: unknown): void {
		this.timers.delete(handle as number);
	}

	async run(limitMs = Number.POSITIVE_INFINITY): Promise<void> {
		const end = this.time + limitMs;
		for (;;) {
			await new Promise((resolve) => setImmediate(resolve));
			const [handle, timer] = [...this.timers].sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0] ?? [];
			if (!timer || timer.at > end) break;
			this.timers.delete(handle);
			this.time = timer.at;
			timer.callback();
		}
		if (Number.isFinite(end)) this.time = end;
	}
}

function request(prompt: string, skills: string[] = []): RunRequest {
	return { runId: "run-1", projectRoot: "/projects/app", prompt, agent: "use-claude-code", skills };
}

function start(prompt: string, seed: number, skills: string[] = []) {
	const clock = new ManualClock();
	const runner = new MockAgentRunner({ clock, seed });
	const events: RunEvent[] = [];
	runner.start(request(prompt, skills), (event) => events.push(event));
	return { clock, runner, events };
}

function statuses(events: RunEvent[]): Map<string, AgentStatus> {
	const result = new Map<string, AgentStatus>();
	for (const event of events) {
		if (event.type === "agent.spawned") result.set(event.agentId, "running");
		if (event.type === "agent.status") result.set(event.agentId, event.status);
	}
	return result;
}

function names(events: RunEvent[]): Map<string, string> {
	return new Map(events.flatMap((event) => (event.type === "agent.spawned" ? [[event.agentId, event.name] as const] : [])));
}

async function findSeed(prompt: string, hasFailure: boolean): Promise<number> {
	for (let seed = 1; seed < SEED_SEARCH; seed++) {
		const { clock, runner, events } = start(prompt, seed);
		await clock.run();
		const question = events.find((event) => event.type === "input.needed");
		if (question?.type === "input.needed") runner.reply("run-1", question.agentId, "Yes");
		await clock.run();
		const failed = events.some((event) => event.type === "agent.status" && event.status === "failed");
		if (failed === hasFailure && Boolean(question) === prompt.includes("?")) return seed;
	}
	throw new Error("No seed found");
}

describe("MockAgentRunner", () => {
	test("plays a full orchestration from run.started to run.finished", async () => {
		const seed = await findSeed("fix the header", false);
		const { clock, events } = start("/vibecode-review fix the header", seed, ["vibecode-review"]);
		await clock.run();
		expect(events[0]).toMatchObject({ type: "run.started", runId: "run-1", at: 0 });
		expect(events[1]).toMatchObject({ type: "agent.spawned", parentId: null, name: "Orchestrator", model: "claude · opus" });
		expect(events[events.length - 1]).toMatchObject({ type: "run.finished", status: "done" });
		const agentNames = [...names(events).values()];
		expect(agentNames).toContain("planner");
		expect(agentNames).toContain("reviewer · vibecode-review");
		expect(agentNames.filter((name) => name.startsWith("coder · ")).length).toBeGreaterThanOrEqual(2);
		expect(agentNames).toContain("test-runner");
		expect([...statuses(events).values()].every((status) => status === "done")).toBe(true);
		const rootText = events
			.filter((event) => event.type === "text.delta" && event.agentId === events[1].agentId)
			.map((event) => (event.type === "text.delta" ? event.text : ""))
			.join("");
		expect(rootText).toContain("**fix the header**");
		expect(rootText).toContain("`/vibecode-review`");
		const tools = events.filter((event) => event.type === "tool.started" || event.type === "tool.finished");
		expect(tools.length).toBeGreaterThan(0);
		expect(tools.length % 2).toBe(0);
		const lastUsage = events.filter((event) => event.type === "agent.usage").pop();
		expect(lastUsage).toMatchObject({ type: "agent.usage" });
		expect(events.every((event, index) => index === 0 || event.at >= events[index - 1].at)).toBe(true);
	});

	test("plays the same events for the same seed and other ones for another seed", async () => {
		const first = start("fix the header", 7);
		const second = start("fix the header", 7);
		const third = start("fix the header", 8);
		await Promise.all([first.clock.run(), second.clock.run(), third.clock.run()]);
		expect(second.events).toEqual(first.events);
		expect(third.events).not.toEqual(first.events);
	});

	test("stop marks every working agent stopped and ends the run", async () => {
		const { clock, runner, events } = start("fix the header", 3);
		await clock.run(1500);
		const working = [...statuses(events)].filter(([, status]) => status === "running").map(([id]) => id);
		expect(working.length).toBeGreaterThan(0);
		runner.stop("run-1");
		const stoppedAt = events.length;
		await clock.run();
		expect(events.length).toBe(stoppedAt);
		expect(events[events.length - 1]).toMatchObject({ type: "run.finished", status: "stopped" });
		for (const id of working) expect(statuses(events).get(id)).toBe("stopped");
	});

	test("a question in the prompt makes a coder wait for the user's reply", async () => {
		const seed = await findSeed("can you fix the header?", false);
		const { clock, runner, events } = start("can you fix the header?", seed);
		await clock.run();
		const question = events.find((event) => event.type === "input.needed");
		expect(question).toMatchObject({ type: "input.needed" });
		const coderId = question?.type === "input.needed" ? question.agentId : "";
		expect(names(events).get(coderId)).toStartWith("coder · ");
		expect(statuses(events).get(coderId)).toBe("needs-input");
		expect(events.some((event) => event.type === "run.finished")).toBe(false);
		runner.reply("run-1", coderId, "Keep the layout");
		await clock.run();
		const reply = events.find((event) => event.type === "text.delta" && event.agentId === coderId && event.text.includes("Keep"));
		expect(reply).toBeDefined();
		expect(events[events.length - 1]).toMatchObject({ type: "run.finished", status: "done" });
	});

	test("a failed agent waits for a retry, which replaces it and lets the run finish", async () => {
		const seed = await findSeed("fix the header", true);
		const { clock, runner, events } = start("fix the header", seed);
		await clock.run();
		const failure = events.find((event) => event.type === "error");
		const failedId = failure?.type === "error" ? failure.agentId : "";
		expect(names(events).get(failedId)).toBe("test-runner");
		expect(statuses(events).get(failedId)).toBe("failed");
		expect(events.some((event) => event.type === "run.finished")).toBe(false);
		runner.retry("run-1", failedId);
		await clock.run();
		const replacement = events.find((event) => event.type === "agent.spawned" && event.replaces === failedId);
		expect(replacement).toMatchObject({ name: "test-runner" });
		expect(statuses(events).get(failedId)).toBe("stopped");
		expect(statuses(events).get(replacement?.type === "agent.spawned" ? replacement.agentId : "")).toBe("done");
		expect(events[events.length - 1]).toMatchObject({ type: "run.finished", status: "done" });
	});

	test("ignores reply, retry and stop for unknown runs and agents", async () => {
		const { clock, runner, events } = start("fix the header", 3);
		runner.reply("run-1", "nobody", "hi");
		runner.retry("run-1", "nobody");
		runner.stop("other-run");
		await clock.run(500);
		expect(events.some((event) => event.type === "run.finished")).toBe(false);
	});
});
