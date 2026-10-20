import {
	AGENT_CLIS,
	type AgentRunner,
	type AgentStatus,
	type RunEvent,
	type RunEventBody,
	type RunRequest,
} from "../shared/interfaces/run.interface";

export interface RunnerClock {
	now(): number;
	setTimeout(callback: () => void, ms: number): unknown;
	clearTimeout(handle: unknown): void;
}

export interface MockAgentRunnerOptions {
	clock?: RunnerClock;
	seed?: number;
}

const SYSTEM_CLOCK: RunnerClock = {
	now: () => Date.now(),
	setTimeout: (callback, ms) => setTimeout(callback, ms),
	clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

const DEFAULT_CLI = "mock";
const QUESTION_CHANCE = 0.3;
const FAILURE_CHANCE = 0.4;
const THIRD_CODER_CHANCE = 0.5;
const AREAS = ["header", "layout", "state", "styles", "api", "docs"];
const WORDS_PER_DELTA = 3;
const DELTA_MS = { min: 50, max: 120 };
const TOOL_MS = { min: 600, max: 1800 };
const TOKENS = { min: 600, max: 4200 };
const PRICE_PER_TOKEN = { deep: 15e-6, balanced: 3e-6, fast: 0.8e-6 };
const MODELS = { deep: "opus", balanced: "sonnet", fast: "haiku" };

type ModelTier = keyof typeof MODELS;

interface MockAgent {
	id: string;
	parentId: string | null;
	name: string;
	model: string;
	tier: ModelTier;
	task: string;
	status: AgentStatus;
	startedAt: number;
	costUsd: number;
}

interface MockRun {
	request: RunRequest;
	emit: (event: RunEvent) => void;
	random: () => number;
	cli: string;
	agents: Map<string, MockAgent>;
	timers: Set<unknown>;
	replies: Map<string, (text: string) => void>;
	retries: Map<string, (replacement: MockAgent) => void>;
	nextId: number;
	isStopped: boolean;
}

class MockFailure extends Error {}

function createRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

function hashText(text: string): number {
	let hash = 2166136261;
	for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
	return hash >>> 0;
}

function between(random: () => number, { min, max }: { min: number; max: number }): number {
	return Math.round(min + random() * (max - min));
}

function pickAreas(random: () => number, count: number): string[] {
	const left = [...AREAS];
	return Array.from({ length: count }, () => left.splice(Math.floor(random() * left.length), 1)[0]);
}

function readTask(prompt: string): string {
	return prompt.replace(/^(\/[\w-]+\s+)+/, "").trim() || prompt;
}

export class MockAgentRunner implements AgentRunner {
	private readonly runs = new Map<string, MockRun>();
	private readonly clock: RunnerClock;

	constructor(private readonly options: MockAgentRunnerOptions = {}) {
		this.clock = options.clock ?? SYSTEM_CLOCK;
	}

	start(request: RunRequest, emit: (event: RunEvent) => void): void {
		const seed = this.options.seed ?? hashText(`${request.agent} ${request.skills.join(" ")} ${request.prompt}`);
		const run: MockRun = {
			request,
			emit,
			random: createRandom(seed),
			cli: (request.agent && AGENT_CLIS[request.agent]?.command) || DEFAULT_CLI,
			agents: new Map(),
			timers: new Set(),
			replies: new Map(),
			retries: new Map(),
			nextId: 1,
			isStopped: false,
		};
		this.runs.set(request.runId, run);
		this.orchestrate(run).catch((cause: unknown) => this.crash(run, cause));
	}

	stop(runId: string): void {
		const run = this.runs.get(runId);
		if (!run) return;
		run.isStopped = true;
		for (const timer of run.timers) this.clock.clearTimeout(timer);
		for (const agent of run.agents.values()) {
			if (agent.status === "running" || agent.status === "needs-input") this.setStatus(run, agent, "stopped");
		}
		this.finish(run, "stopped");
	}

	reply(runId: string, agentId: string, text: string): void {
		const run = this.runs.get(runId);
		const resolve = run?.replies.get(agentId);
		if (!run || !resolve) return;
		run.replies.delete(agentId);
		resolve(text);
	}

	retry(runId: string, agentId: string): void {
		const run = this.runs.get(runId);
		const resolve = run?.retries.get(agentId);
		const failed = run?.agents.get(agentId);
		if (!run || !resolve || !failed) return;
		run.retries.delete(agentId);
		this.setStatus(run, failed, "stopped");
		resolve(this.spawn(run, failed.parentId, failed.name, failed.tier, failed.task, failed.id));
	}

	private send(run: MockRun, event: RunEventBody): void {
		run.emit({ ...event, runId: run.request.runId, at: this.clock.now() } as RunEvent);
	}

	private finish(run: MockRun, status: "done" | "stopped" | "failed"): void {
		this.send(run, { type: "run.finished", status });
		this.runs.delete(run.request.runId);
	}

	private crash(run: MockRun, cause: unknown): void {
		if (run.isStopped) return;
		const root = run.agents.values().next().value;
		if (root) this.send(run, { type: "error", agentId: root.id, message: cause instanceof Error ? cause.message : String(cause) });
		this.finish(run, "failed");
	}

	private sleep(run: MockRun, ms: number): Promise<void> {
		return new Promise((resolve) => {
			const timer = this.clock.setTimeout(() => {
				run.timers.delete(timer);
				resolve();
			}, ms);
			run.timers.add(timer);
		});
	}

	private nextId(run: MockRun, kind: string): string {
		return `${run.request.runId}.${kind}${run.nextId++}`;
	}

	private spawn(run: MockRun, parentId: string | null, name: string, tier: ModelTier, task: string, replaces: string | null = null): MockAgent {
		const agent: MockAgent = {
			id: this.nextId(run, "a"),
			parentId,
			name,
			model: `${run.cli} · ${MODELS[tier]}`,
			tier,
			task,
			status: "running",
			startedAt: this.clock.now(),
			costUsd: 0,
		};
		run.agents.set(agent.id, agent);
		this.send(run, { type: "agent.spawned", agentId: agent.id, parentId, name, model: agent.model, task, replaces });
		return agent;
	}

	private setStatus(run: MockRun, agent: MockAgent, status: AgentStatus): void {
		agent.status = status;
		this.send(run, { type: "agent.status", agentId: agent.id, status });
	}

	private addUsage(run: MockRun, agent: MockAgent): void {
		agent.costUsd += between(run.random, TOKENS) * PRICE_PER_TOKEN[agent.tier];
		const durationMs = this.clock.now() - agent.startedAt;
		this.send(run, { type: "agent.usage", agentId: agent.id, costUsd: agent.costUsd, durationMs });
	}

	private async say(run: MockRun, agent: MockAgent, text: string): Promise<void> {
		const messageId = this.nextId(run, "m");
		const words = text.split(/(?<= )/);
		for (let index = 0; index < words.length; index += WORDS_PER_DELTA) {
			await this.sleep(run, between(run.random, DELTA_MS));
			this.send(run, { type: "text.delta", agentId: agent.id, messageId, text: words.slice(index, index + WORDS_PER_DELTA).join("") });
		}
		this.addUsage(run, agent);
	}

	private async useTool(run: MockRun, agent: MockAgent, name: string, input: string, result: string, isError = false): Promise<void> {
		const toolCallId = this.nextId(run, "t");
		this.send(run, { type: "tool.started", agentId: agent.id, toolCallId, name, input });
		await this.sleep(run, between(run.random, TOOL_MS));
		this.send(run, { type: "tool.finished", agentId: agent.id, toolCallId, result, isError });
		this.addUsage(run, agent);
	}

	private async ask(run: MockRun, agent: MockAgent, question: string): Promise<string> {
		this.send(run, { type: "input.needed", agentId: agent.id, question });
		this.setStatus(run, agent, "needs-input");
		const answer = await new Promise<string>((resolve) => run.replies.set(agent.id, resolve));
		this.setStatus(run, agent, "running");
		return answer;
	}

	private async runAgent(run: MockRun, agent: MockAgent, script: (agent: MockAgent, attempt: number) => Promise<void>): Promise<void> {
		let current = agent;
		for (let attempt = 0; ; attempt++) {
			try {
				await script(current, attempt);
				this.setStatus(run, current, "done");
				return;
			} catch (cause) {
				if (!(cause instanceof MockFailure)) throw cause;
				this.send(run, { type: "error", agentId: current.id, message: cause.message });
				this.setStatus(run, current, "failed");
				current = await new Promise<MockAgent>((resolve) => run.retries.set(current.id, resolve));
			}
		}
	}

	private async orchestrate(run: MockRun): Promise<void> {
		const { request, random } = run;
		const task = readTask(request.prompt);
		const asksQuestion = task.includes("?") || random() < QUESTION_CHANCE;
		const failingArea = random() < FAILURE_CHANCE ? 0 : -1;
		const areas = pickAreas(random, random() < THIRD_CODER_CHANCE ? 3 : 2);
		const skillList = request.skills.map((skill) => `\`/${skill}\``).join(", ");
		this.send(run, { type: "run.started" });
		const root = this.spawn(run, null, "Orchestrator", "deep", task);

		await this.say(
			run,
			root,
			`I'll take this on: **${task}**.\n\n${skillList ? `Following ${skillList} for this run. ` : ""}First I'll look at the project, then a planner breaks the work down and coders work on ${areas.join(", ")} in parallel.`,
		);
		await this.useTool(run, root, "Glob", "src/**/*.{ts,tsx}", `${between(random, { min: 18, max: 64 })} files`);

		const planner = this.spawn(run, root.id, "planner", "deep", `Break "${task}" into steps`);
		await this.runAgent(run, planner, async (agent) => {
			await this.useTool(run, agent, "Read", "README.md", `${between(random, { min: 40, max: 180 })} lines`);
			await this.say(run, agent, `Plan:\n\n${areas.map((area, index) => `${index + 1}. Update the ${area} code`).join("\n")}\n${areas.length + 1}. Run the tests and review the diff`);
		});

		await this.say(run, root, `The plan is ready. Starting ${areas.length} coders in parallel.`);
		await Promise.all(
			areas.map((area, index) =>
				this.runAgent(run, this.spawn(run, root.id, `coder · ${area}`, "balanced", `Update the ${area} code`), (agent) =>
					this.code(run, agent, area, { isFailing: index === failingArea, asksQuestion: asksQuestion && index === areas.length - 1 }),
				),
			),
		);

		const reviews = request.skills.length > 0 ? request.skills : ["review"];
		await Promise.all(
			reviews.map((skill) =>
				this.runAgent(run, this.spawn(run, root.id, `reviewer · ${skill}`, "deep", `Check the diff against /${skill}`), async (agent) => {
					await this.useTool(run, agent, "Bash", "git diff --stat", `${areas.length + 2} files changed`);
					await this.say(run, agent, `The diff follows \`/${skill}\`: no dead code, tokens reused, tests updated.`);
				}),
			),
		);

		await this.say(run, root, `Done. ${areas.length} areas updated, tests pass and ${reviews.length === 1 ? "the review" : `${reviews.length} reviews`} came back clean.`);
		this.setStatus(run, root, "done");
		this.finish(run, "done");
	}

	private async code(
		run: MockRun,
		agent: MockAgent,
		area: string,
		{ isFailing, asksQuestion }: { isFailing: boolean; asksQuestion: boolean },
	): Promise<void> {
		const file = `src/${area}/${area}.ts`;
		await this.useTool(run, agent, "Grep", `"${area}" src`, `${between(run.random, { min: 2, max: 9 })} matches`);
		if (asksQuestion) {
			const answer = await this.ask(run, agent, `Should the change keep the current ${area} structure, or may I restructure it?`);
			await this.say(run, agent, `Thanks, going with: "${answer.trim()}".`);
		}
		await this.say(run, agent, `Updating \`${file}\` in place and removing the code it replaces.`);
		await this.useTool(run, agent, "Edit", file, `+${between(run.random, { min: 6, max: 48 })} −${between(run.random, { min: 1, max: 20 })}`);
		const tester = this.spawn(run, agent.id, "test-runner", "fast", `Run the ${area} tests`);
		await this.runAgent(run, tester, async (runner, attempt) => {
			if (isFailing && attempt === 0) {
				await this.useTool(run, runner, "Bash", `bun test tests/${area}`, `2 fail: ${area}.test.ts`, true);
				throw new MockFailure(`2 tests failed in tests/${area}/${area}.test.ts`);
			}
			await this.useTool(run, runner, "Bash", `bun test tests/${area}`, `${between(run.random, { min: 4, max: 16 })} pass, 0 fail`);
			await this.say(run, runner, "All tests pass.");
		});
		await this.say(run, agent, `\`${file}\` is updated and its tests pass.`);
	}
}
