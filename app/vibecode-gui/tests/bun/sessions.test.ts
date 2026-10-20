import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, realpathSync } from "node:fs";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	createSession,
	DEFAULT_SKILLS,
	DEFAULT_TITLE,
	deleteSession,
	listSessions,
	readSession,
	summarizeSession,
	titleFromText,
	writeSession,
} from "../../src/bun/sessions";
import type { Session } from "../../src/shared/interfaces/session.interface";

const PROJECT = "/projects/app";
let sessionsRoot = "";

async function projectFolder(): Promise<string> {
	const [hash] = await readdir(sessionsRoot);
	return join(sessionsRoot, hash);
}

beforeEach(async () => {
	sessionsRoot = join(realpathSync(await mkdtemp(join(tmpdir(), "vibecode-gui-sessions-"))), "sessions");
});

afterEach(() => rm(join(sessionsRoot, ".."), { recursive: true, force: true }));

describe("sessions store", () => {
	test("creates a session file per project and reads it back", async () => {
		const session = await createSession(sessionsRoot, PROJECT);
		expect(session).toMatchObject({ projectRoot: PROJECT, title: DEFAULT_TITLE, agent: null, skills: ["vibecode-workflow"], messages: [], events: [] });
		expect(await readdir(await projectFolder())).toEqual([`${session.id}.json`]);
		expect(await readSession(sessionsRoot, PROJECT, session.id)).toEqual(session);
		expect(await listSessions(sessionsRoot, "/projects/other")).toEqual([]);
	});

	test("reuses the latest session while nothing was sent in it", async () => {
		const first = await createSession(sessionsRoot, PROJECT);
		expect(await createSession(sessionsRoot, PROJECT)).toEqual(first);
		await writeSession(sessionsRoot, { ...first, messages: [{ kind: "note", id: "n1", at: 1, text: "Hi" }] });
		expect((await createSession(sessionsRoot, PROJECT)).id).not.toBe(first.id);
	});

	test("keeps the skills chosen in a session instead of the default skills", async () => {
		const session = await createSession(sessionsRoot, PROJECT);
		await writeSession(sessionsRoot, { ...session, skills: [] });
		expect((await createSession(sessionsRoot, PROJECT)).skills).toEqual([]);
		await writeSession(sessionsRoot, { ...session, skills: ["vibecode"], messages: [{ kind: "note", id: "n1", at: 1, text: "Hi" }] });
		expect((await readSession(sessionsRoot, PROJECT, session.id)).skills).toEqual(["vibecode"]);
		expect((await createSession(sessionsRoot, PROJECT)).skills).toEqual(DEFAULT_SKILLS);
	});

	test("lists sessions most recently updated first and renames by rewriting the file", async () => {
		const older = await createSession(sessionsRoot, PROJECT);
		await writeSession(sessionsRoot, { ...older, updatedAt: 1, messages: [{ kind: "note", id: "n1", at: 1, text: "Hi" }] });
		const newer = await createSession(sessionsRoot, PROJECT);
		await writeSession(sessionsRoot, { ...newer, title: "Fix the header", updatedAt: 2 });
		expect((await listSessions(sessionsRoot, PROJECT)).map((session) => session.title)).toEqual(["Fix the header", DEFAULT_TITLE]);
	});

	test("deletes a session file", async () => {
		const session = await createSession(sessionsRoot, PROJECT);
		await deleteSession(sessionsRoot, PROJECT, session.id);
		expect(await listSessions(sessionsRoot, PROJECT)).toEqual([]);
		await expect(readSession(sessionsRoot, PROJECT, session.id)).rejects.toThrow("Session not found");
	});

	test("rejects a malformed session file and skips it in the list", async () => {
		const session = await createSession(sessionsRoot, PROJECT);
		const path = join(await projectFolder(), `${session.id}.json`);
		await writeFile(path, "{ not json");
		await expect(readSession(sessionsRoot, PROJECT, session.id)).rejects.toThrow("malformed");
		await writeFile(path, JSON.stringify({ ...session, title: 3 }));
		await expect(readSession(sessionsRoot, PROJECT, session.id)).rejects.toThrow("malformed");
		expect(await listSessions(sessionsRoot, PROJECT)).toEqual([]);
	});

	test("drops malformed messages and events but keeps the valid ones", async () => {
		const session = await createSession(sessionsRoot, PROJECT);
		const valid = { type: "agent.status", runId: "r1", at: 2, agentId: "a1", status: "done" };
		await writeFile(
			join(await projectFolder(), `${session.id}.json`),
			JSON.stringify({
				...session,
				skills: ["vibecode", 4],
				messages: [{ kind: "user", id: "u1", at: 1, text: "Go", runId: "r1", replyTo: null }, { kind: "user", id: "u2" }],
				events: [valid, { ...valid, status: "sleeping" }, { type: "unknown", runId: "r1", at: 3 }, { ...valid, at: "late" }],
			}),
		);
		const read = await readSession(sessionsRoot, PROJECT, session.id);
		expect(read.skills).toEqual(["vibecode"]);
		expect(read.messages.map((message) => message.id)).toEqual(["u1"]);
		expect(read.events).toEqual([valid as Session["events"][number]]);
	});

	test("refuses ids that are not session ids, so no path leaves the store", async () => {
		await expect(readSession(sessionsRoot, PROJECT, "../../projects")).rejects.toThrow("Not a session id");
		await expect(deleteSession(sessionsRoot, PROJECT, "../x")).rejects.toThrow("Not a session id");
		const session = await createSession(sessionsRoot, PROJECT);
		await expect(writeSession(sessionsRoot, { ...session, id: "../escape" })).rejects.toThrow("Not a session id");
		expect(existsSync(join(sessionsRoot, "escape.json"))).toBe(false);
	});

	test("refuses a session file stored for another project", async () => {
		const session = await createSession(sessionsRoot, PROJECT);
		await writeFile(join(await projectFolder(), `${session.id}.json`), JSON.stringify({ ...session, projectRoot: "/elsewhere" }));
		await expect(readSession(sessionsRoot, PROJECT, session.id)).rejects.toThrow("malformed");
	});
});

describe("session summaries and titles", () => {
	const base: Session = {
		id: "s1",
		projectRoot: PROJECT,
		title: "Run",
		createdAt: 0,
		updatedAt: 0,
		agent: null,
		skills: [],
		messages: [],
		events: [],
	};
	const started = [
		{ type: "run.started", runId: "r1", at: 1 },
		{ type: "agent.spawned", runId: "r1", at: 1, agentId: "a1", parentId: null, name: "Orchestrator", model: "m", task: "t", replaces: null },
	] as Session["events"];

	test("reports the latest run's state", () => {
		expect(summarizeSession(base, false).status).toBe("idle");
		expect(summarizeSession({ ...base, events: started }, true).status).toBe("running");
		expect(summarizeSession({ ...base, events: started }, false).status).toBe("stopped");
		const waiting = [...started, { type: "agent.status", runId: "r1", at: 2, agentId: "a1", status: "needs-input" }] as Session["events"];
		expect(summarizeSession({ ...base, events: waiting }, true).status).toBe("needs-input");
		const failed = [...started, { type: "agent.status", runId: "r1", at: 2, agentId: "a1", status: "failed" }] as Session["events"];
		expect(summarizeSession({ ...base, events: failed }, true).status).toBe("failed");
		const done = [...started, { type: "run.finished", runId: "r1", at: 3, status: "done" }] as Session["events"];
		expect(summarizeSession({ ...base, events: done }, false).status).toBe("done");
	});

	test("titles a session from its first message without the slash commands", () => {
		expect(titleFromText("/vibecode-review /vibecode fix the header\nand more")).toBe("fix the header");
		expect(titleFromText("   ")).toBe(DEFAULT_TITLE);
		expect(titleFromText("a".repeat(80))).toHaveLength(60);
	});
});
