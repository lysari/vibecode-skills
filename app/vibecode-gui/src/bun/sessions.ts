import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AGENT_STATUSES, RUN_END_STATUSES, type AgentStatus, type RunEndStatus, type RunEvent } from "../shared/interfaces/run.interface";
import type { ChatMessage, Session, SessionStatus, SessionSummary } from "../shared/interfaces/session.interface";

export const DEFAULT_TITLE = "New session";
const TITLE_LENGTH = 60;
const SESSION_FILE = /^(.+)\.json$/;
const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PROJECT_HASH_LENGTH = 16;

type FieldType = "string" | "number" | "boolean" | "string-or-null" | "agent-status" | "run-end-status";

const EVENT_FIELDS: Record<RunEvent["type"], Record<string, FieldType>> = {
	"run.started": {},
	"run.finished": { status: "run-end-status" },
	"agent.spawned": {
		agentId: "string",
		parentId: "string-or-null",
		name: "string",
		model: "string",
		task: "string",
		replaces: "string-or-null",
	},
	"agent.status": { agentId: "string", status: "agent-status" },
	"agent.usage": { agentId: "string", costUsd: "number", durationMs: "number" },
	"text.delta": { agentId: "string", messageId: "string", text: "string" },
	"tool.started": { agentId: "string", toolCallId: "string", name: "string", input: "string" },
	"tool.finished": { agentId: "string", toolCallId: "string", result: "string", isError: "boolean" },
	"input.needed": { agentId: "string", question: "string" },
	error: { agentId: "string", message: "string" },
};

function isFieldType(value: unknown, type: FieldType): boolean {
	if (type === "string-or-null") return value === null || typeof value === "string";
	if (type === "agent-status") return AGENT_STATUSES.includes(value as AgentStatus);
	if (type === "run-end-status") return RUN_END_STATUSES.includes(value as RunEndStatus);
	return typeof value === type;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readRunEvent(value: unknown): RunEvent | null {
	if (!isRecord(value) || typeof value.runId !== "string" || typeof value.at !== "number") return null;
	const fields = EVENT_FIELDS[value.type as RunEvent["type"]];
	if (!fields) return null;
	return Object.entries(fields).every(([key, type]) => isFieldType(value[key], type)) ? (value as unknown as RunEvent) : null;
}

function readChatMessage(value: unknown): ChatMessage | null {
	if (!isRecord(value) || typeof value.id !== "string" || typeof value.at !== "number" || typeof value.text !== "string") {
		return null;
	}
	const { id, at, text } = value;
	if (value.kind === "note") return { kind: "note", id, at, text };
	if (value.kind !== "user" || typeof value.runId !== "string" || !isFieldType(value.replyTo, "string-or-null")) return null;
	return { kind: "user", id, at, text, runId: value.runId, replyTo: value.replyTo as string | null };
}

function parseSession(text: string): Session | null {
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch {
		return null;
	}
	if (!isRecord(value)) return null;
	const { id, projectRoot, title, createdAt, updatedAt, agent, skills, messages, events } = value;
	if (
		typeof id !== "string" ||
		typeof projectRoot !== "string" ||
		typeof title !== "string" ||
		typeof createdAt !== "number" ||
		typeof updatedAt !== "number" ||
		!isFieldType(agent, "string-or-null") ||
		!Array.isArray(skills) ||
		!Array.isArray(messages) ||
		!Array.isArray(events)
	) {
		return null;
	}
	return {
		id,
		projectRoot,
		title,
		createdAt,
		updatedAt,
		agent: agent as string | null,
		skills: skills.filter((skill): skill is string => typeof skill === "string"),
		messages: messages.map(readChatMessage).filter((message): message is ChatMessage => message !== null),
		events: events.map(readRunEvent).filter((event): event is RunEvent => event !== null),
	};
}

function projectDir(sessionsRoot: string, projectRoot: string): string {
	const hash = createHash("sha256").update(projectRoot).digest("hex").slice(0, PROJECT_HASH_LENGTH);
	return join(sessionsRoot, hash);
}

function sessionPath(sessionsRoot: string, projectRoot: string, id: string): string {
	if (!SESSION_ID.test(id)) throw new Error(`Not a session id: ${id}`);
	return join(projectDir(sessionsRoot, projectRoot), `${id}.json`);
}

export async function readSession(sessionsRoot: string, projectRoot: string, id: string): Promise<Session> {
	const path = sessionPath(sessionsRoot, projectRoot, id);
	if (!existsSync(path)) throw new Error(`Session not found: ${id}`);
	const session = parseSession(await readFile(path, "utf8"));
	if (!session || session.id !== id || session.projectRoot !== projectRoot) throw new Error(`Session file is malformed: ${path}`);
	return session;
}

export async function listSessions(sessionsRoot: string, projectRoot: string): Promise<Session[]> {
	const dir = projectDir(sessionsRoot, projectRoot);
	if (!existsSync(dir)) return [];
	const ids = (await readdir(dir)).map((file) => SESSION_FILE.exec(file)?.[1] ?? "").filter((id) => SESSION_ID.test(id));
	const sessions = await Promise.all(ids.map((id) => readSession(sessionsRoot, projectRoot, id).catch(() => null)));
	return sessions.filter((session): session is Session => session !== null).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function writeSession(sessionsRoot: string, session: Session): Promise<void> {
	const path = sessionPath(sessionsRoot, session.projectRoot, session.id);
	await mkdir(projectDir(sessionsRoot, session.projectRoot), { recursive: true });
	await writeFile(`${path}.tmp`, `${JSON.stringify(session)}\n`);
	await rename(`${path}.tmp`, path);
}

export async function createSession(sessionsRoot: string, projectRoot: string): Promise<Session> {
	const [latest] = await listSessions(sessionsRoot, projectRoot);
	if (latest && latest.messages.length === 0) return latest;
	const now = Date.now();
	const session: Session = {
		id: randomUUID(),
		projectRoot,
		title: DEFAULT_TITLE,
		createdAt: now,
		updatedAt: now,
		agent: null,
		skills: [],
		messages: [],
		events: [],
	};
	await writeSession(sessionsRoot, session);
	return session;
}

export async function deleteSession(sessionsRoot: string, projectRoot: string, id: string): Promise<void> {
	await rm(sessionPath(sessionsRoot, projectRoot, id));
}

export function titleFromText(text: string): string {
	const line = text.trim().split("\n")[0].replace(/^(\/[\w-]+\s+)+/, "").trim();
	if (!line) return DEFAULT_TITLE;
	return line.length > TITLE_LENGTH ? `${line.slice(0, TITLE_LENGTH - 1).trimEnd()}…` : line;
}

interface LastRun {
	runId: string;
	endStatus: RunEndStatus | null;
	statuses: Map<string, AgentStatus>;
}

export function readLastRun(events: RunEvent[]): LastRun | null {
	let run: LastRun | null = null;
	for (const event of events) {
		if (event.type === "run.started") run = { runId: event.runId, endStatus: null, statuses: new Map() };
		if (!run || event.runId !== run.runId) continue;
		if (event.type === "run.finished") run.endStatus = event.status;
		if (event.type === "agent.spawned") run.statuses.set(event.agentId, "running");
		if (event.type === "agent.status") run.statuses.set(event.agentId, event.status);
	}
	return run;
}

export function summarizeSession(session: Session, isLive: boolean): SessionSummary {
	const run = readLastRun(session.events);
	const statuses = [...(run?.statuses.values() ?? [])];
	let status: SessionStatus = "idle";
	if (run?.endStatus) status = run.endStatus;
	else if (run && !isLive) status = "stopped";
	else if (statuses.includes("needs-input")) status = "needs-input";
	else if (statuses.includes("failed")) status = "failed";
	else if (run) status = "running";
	return { id: session.id, projectRoot: session.projectRoot, title: session.title, updatedAt: session.updatedAt, status };
}
