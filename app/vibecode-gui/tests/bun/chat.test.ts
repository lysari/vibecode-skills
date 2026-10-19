import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Chat } from "../../src/bun/chat";
import { readSession, writeSession } from "../../src/bun/sessions";
import type { SkillRoots } from "../../src/bun/skills";
import type { AgentRunner, RunEvent, RunRequest } from "../../src/shared/run.interface";
import type { RunEventMessage } from "../../src/shared/skills-rpc.interface";

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
let roots: SkillRoots = { project: "", library: null };
let sessionsRoot = "";
let runner = new StubRunner();
let messages: RunEventMessage[] = [];
let chat: Chat;

async function writeSkill(root: string, name: string, version: string, body = ""): Promise<string> {
	const dir = join(root, ".claude/skills", name);
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: Test.\nmetadata:\n  version: "${version}"\n---\n${body}`);
	return dir;
}

function emit(event: Partial<RunEvent> & { type: RunEvent["type"] }): void {
	const { request, emit: send } = runner.started[runner.started.length - 1];
	send({ runId: request.runId, at: Date.now(), ...event } as RunEvent);
}

beforeEach(async () => {
	tempRoot = realpathSync(await mkdtemp(join(tmpdir(), "vibecode-gui-chat-")));
	roots = { project: join(tempRoot, "project"), library: join(tempRoot, "library") };
	sessionsRoot = join(tempRoot, "user-data", "sessions");
	await mkdir(roots.project);
	runner = new StubRunner();
	messages = [];
	chat = new Chat({ sessionsRoot, runner, moveToTrash: () => false, onEvent: (message) => messages.push(message) });
	await writeSkill(roots.library ?? "", "fresh", "1.0.0", "Library copy.");
	await writeSkill(roots.library ?? "", "newer", "2.0.0", "Library copy.");
	await writeSkill(roots.library ?? "", "same", "1.0.0");
	await writeSkill(roots.project, "newer", "1.0.0", "Project copy.");
	await writeSkill(roots.project, "same", "1.0.0");
});

afterEach(() => rm(tempRoot, { recursive: true, force: true }));

describe("sending a message", () => {
	test("installs the selected skills the project lacks, leaves differing copies, and starts the run", async () => {
		const session = await chat.create(roots.project);
		const sent = await chat.send(roots, session.id, {
			text: "fix the header",
			agent: "use-cursor",
			skills: ["fresh", "newer", "same", "unknown"],
		});
		expect(await readFile(join(roots.project, ".claude/skills/fresh/SKILL.md"), "utf8")).toContain("Library copy.");
		expect(await readFile(join(roots.project, ".claude/skills/newer/SKILL.md"), "utf8")).toContain("Project copy.");
		expect(sent.messages.map((message) => [message.kind, message.text])).toEqual([
			["note", "Installed fresh into .claude/skills"],
			["user", "/fresh /newer /same fix the header"],
		]);
		expect(sent.title).toBe("fix the header");
		expect(sent.agent).toBe("use-cursor");
		expect(runner.started.map(({ request }) => request)).toEqual([
			{
				runId: sent.messages[1].kind === "user" ? sent.messages[1].runId : "",
				projectRoot: roots.project,
				prompt: "/fresh /newer /same fix the header",
				agent: "use-cursor",
				skills: ["fresh", "newer", "same"],
			},
		]);
		await chat.flush();
		expect((await readSession(sessionsRoot, roots.project, session.id)).messages).toHaveLength(2);
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
		await chat.choose(roots.project, session.id, { agent: "use-claude-code", skills: ["same"] });
		await chat.rename(roots.project, session.id, "  Header work ");
		expect(await chat.load(roots.project, session.id)).toMatchObject({ agent: "use-claude-code", skills: ["same"], title: "Header work" });
	});
});
