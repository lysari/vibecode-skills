import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Chat } from "../../src/bun/chat";
import { readSession, writeSession } from "../../src/bun/sessions";
import type { SkillRoots } from "../../src/bun/skills";
import type { AgentRunner, RunEvent, RunRequest } from "../../src/shared/interfaces/run.interface";
import type { RunEventMessage } from "../../src/shared/interfaces/skills-rpc.interface";

class StubRunner implements AgentRunner {
	readonly started: { request: RunRequest; emit: (event: RunEvent) => void }[] = [];
	readonly calls: string[] = [];

	start(request: RunRequest, emit: (event: RunEvent) => void): void {
		this.started.push({ request, emit });
	}

	stop(runId: string): void {
		this.calls.push(`stop ${runId}`);
	}

	reply(runId: string, agentId: string, text: string): void {
		this.calls.push(`reply ${runId} ${agentId} ${text}`);
	}

	retry(runId: string, agentId: string): void {
		this.calls.push(`retry ${runId} ${agentId}`);
	}
}

let tempRoot = "";
let roots: SkillRoots = { project: "", home: "" };
let sessionsRoot = "";
let runner = new StubRunner();
let messages: RunEventMessage[] = [];
let chat: Chat;

async function writeSkill(root: string, source: string, name: string): Promise<void> {
	const dir = join(root, source, name);
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: Test.\n---\n`);
}

function emit(event: Partial<RunEvent> & { type: RunEvent["type"] }): void {
	const { request, emit: send } = runner.started[runner.started.length - 1];
	send({ runId: request.runId, at: Date.now(), ...event } as RunEvent);
}

beforeEach(async () => {
	tempRoot = realpathSync(await mkdtemp(join(tmpdir(), "vibecode-gui-chat-")));
	roots = { project: join(tempRoot, "project"), home: join(tempRoot, "home") };
	sessionsRoot = join(tempRoot, "user-data", "sessions");
	await mkdir(roots.project);
	runner = new StubRunner();
	messages = [];
	chat = new Chat({ sessionsRoot, runner, onEvent: (message) => messages.push(message) });
	await writeSkill(roots.project, ".claude/skills", "own");
	await writeSkill(roots.home, ".claude/skills", "claude-only");
	await writeSkill(roots.home, ".gemini/config/skills", "agy-only");
});

afterEach(() => rm(tempRoot, { recursive: true, force: true }));

describe("sending a message", () => {
	test("puts the selected skills the agent can use in front of the message, copies nothing, and starts the run", async () => {
		const session = await chat.create(roots.project);
		const sent = await chat.send(roots, session.id, {
			text: "fix the header",
			agent: "use-cursor",
			skills: ["agy-only", "claude-only", "own", "unknown"],
		});
		expect(sent.messages.map((message) => [message.kind, message.text])).toEqual([["user", "/claude-only /own fix the header"]]);
		expect(sent.title).toBe("fix the header");
		expect(sent.agent).toBe("use-cursor");
		expect(sent.skills).toEqual(["agy-only", "claude-only", "own", "unknown"]);
		expect(runner.started.map(({ request }) => request)).toEqual([
			{
				runId: sent.messages[0].kind === "user" ? sent.messages[0].runId : "",
				projectRoot: roots.project,
				prompt: "/claude-only /own fix the header",
				agent: "use-cursor",
				skills: ["claude-only", "own"],
			},
		]);
		expect(await readdir(join(roots.project, ".claude/skills"))).toEqual(["own"]);
		await chat.flush();
		expect((await readSession(sessionsRoot, roots.project, session.id)).messages).toHaveLength(1);
	});

	test("offers the default agent the skills of every agent's global folder", async () => {
		const session = await chat.create(roots.project);
		await chat.send(roots, session.id, { text: "fix", agent: null, skills: ["agy-only", "claude-only"] });
		expect(runner.started[0].request.prompt).toBe("/agy-only /claude-only fix");
	});

	test("refuses an empty message and a second run while one is in progress", async () => {
		const session = await chat.create(roots.project);
		await expect(chat.send(roots, session.id, { text: "  ", agent: null, skills: [] })).rejects.toThrow("Write a message first");
		await chat.send(roots, session.id, { text: "first", agent: null, skills: [] });
		await expect(chat.send(roots, session.id, { text: "second", agent: null, skills: [] })).rejects.toThrow("current run");
		expect(runner.started).toHaveLength(1);
	});

	test("records the run's events in the session, streams them, and keeps them after the run", async () => {
		const session = await chat.create(roots.project);
		await chat.send(roots, session.id, { text: "fix", agent: null, skills: [] });
		emit({ type: "run.started" });
		emit({ type: "agent.spawned", agentId: "a1", parentId: null, name: "Orchestrator", model: "m", task: "fix", replaces: null });
		expect((await chat.list(roots.project))[0].status).toBe("running");
		emit({ type: "agent.status", agentId: "a1", status: "done" });
		emit({ type: "run.finished", status: "done" });
		expect(messages.map((message) => message.event.type)).toEqual(["run.started", "agent.spawned", "agent.status", "run.finished"]);
		expect(messages.every((message) => message.sessionId === session.id && message.projectRoot === roots.project)).toBe(true);
		await chat.flush();
		const stored = await readSession(sessionsRoot, roots.project, session.id);
		expect(stored.events.map((event) => event.type)).toEqual(["run.started", "agent.spawned", "agent.status", "run.finished"]);
		expect((await chat.list(roots.project))[0].status).toBe("done");
		await chat.send(roots, session.id, { text: "again", agent: null, skills: [] });
		expect(runner.started).toHaveLength(2);
	});

	test("passes replies, retries and stops to the runner of the session's run", async () => {
		const session = await chat.create(roots.project);
		expect(() => chat.reply(roots.project, session.id, "a2", "yes")).toThrow("no run in progress");
		await chat.send(roots, session.id, { text: "fix", agent: null, skills: [] });
		const runId = runner.started[0].request.runId;
		const replied = chat.reply(roots.project, session.id, "a2", " keep it ");
		expect(replied.messages[replied.messages.length - 1]).toMatchObject({ kind: "user", text: "keep it", runId, replyTo: "a2" });
		chat.retry(roots.project, session.id, "a3");
		chat.stop(roots.project, session.id);
		expect(runner.calls).toEqual([`reply ${runId} a2 keep it`, `retry ${runId} a3`, `stop ${runId}`]);
	});

	test("marks a run that a quit interrupted as stopped when the session opens again", async () => {
		const session = await chat.create(roots.project);
		await writeSession(sessionsRoot, {
			...session,
			events: [
				{ type: "run.started", runId: "r1", at: 1 },
				{ type: "agent.spawned", runId: "r1", at: 1, agentId: "a1", parentId: null, name: "O", model: "m", task: "t", replaces: null },
				{ type: "agent.spawned", runId: "r1", at: 2, agentId: "a2", parentId: "a1", name: "c", model: "m", task: "t", replaces: null },
				{ type: "agent.status", runId: "r1", at: 3, agentId: "a2", status: "done" },
			],
		});
		expect((await chat.list(roots.project))[0].status).toBe("stopped");
		const opened = await chat.load(roots.project, session.id);
		expect(opened.events.slice(4).map((event) => (event.type === "agent.status" ? `${event.agentId} ${event.status}` : event.type))).toEqual([
			"a1 stopped",
			"run.finished",
		]);
		expect((await readSession(sessionsRoot, roots.project, session.id)).events).toHaveLength(6);
	});

	test("deleting a session stops its run without writing the file back", async () => {
		const session = await chat.create(roots.project);
		await chat.send(roots, session.id, { text: "fix", agent: null, skills: [] });
		await chat.flush();
		await chat.remove(roots.project, session.id);
		emit({ type: "run.finished", status: "stopped" });
		await chat.flush();
		expect(runner.calls).toEqual([`stop ${runner.started[0].request.runId}`]);
		expect(await chat.list(roots.project)).toEqual([]);
	});

	test("rejects an unknown agent and keeps the composer choices", async () => {
		const session = await chat.create(roots.project);
		await expect(chat.choose(roots.project, session.id, { agent: "use-nothing", skills: [] })).rejects.toThrow("Unknown agent");
		await chat.choose(roots.project, session.id, { agent: "use-claude-code", skills: ["own"] });
		await chat.rename(roots.project, session.id, "  Header work ");
		expect(await chat.load(roots.project, session.id)).toMatchObject({ agent: "use-claude-code", skills: ["own"], title: "Header work" });
	});

	test("starts a new session with vibecode-workflow and keeps it removed once the user removes it", async () => {
		const session = await chat.create(roots.project);
		expect(session.skills).toEqual(["vibecode-workflow"]);
		await chat.choose(roots.project, session.id, { agent: null, skills: [] });
		expect((await chat.load(roots.project, session.id)).skills).toEqual([]);
		expect((await chat.create(roots.project)).skills).toEqual([]);
	});

	test("sends the default skill when the agent can use it and leaves it out of the prompt when it cannot", async () => {
		const session = await chat.create(roots.project);
		const sent = await chat.send(roots, session.id, { text: "fix", agent: null, skills: session.skills });
		expect(runner.started[0].request).toMatchObject({ prompt: "fix", skills: [] });
		expect(sent.skills).toEqual(["vibecode-workflow"]);
		emit({ type: "run.finished", status: "done" });
		await writeSkill(roots.home, ".claude/skills", "vibecode-workflow");
		await chat.send(roots, session.id, { text: "again", agent: "use-claude-code", skills: sent.skills });
		expect(runner.started[1].request).toMatchObject({ prompt: "/vibecode-workflow again", skills: ["vibecode-workflow"] });
	});
});
