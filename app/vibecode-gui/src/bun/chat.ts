import { randomUUID } from "node:crypto";
import { AGENT_CLIS, type AgentRunner, type RunEvent } from "../shared/run.interface";
import type { Session, SessionChoices, SessionSummary } from "../shared/session.interface";
import type { RunEventMessage } from "../shared/skills-rpc.interface";
import {
	createSession,
	DEFAULT_TITLE,
	deleteSession,
	listSessions,
	readLastRun,
	readSession,
	summarizeSession,
	titleFromText,
	writeSession,
} from "./sessions";
import { installSkill, listSkills, type SkillRoots } from "./skills";

interface ChatOptions {
	sessionsRoot: string;
	runner: AgentRunner;
	moveToTrash: (path: string) => boolean;
	onEvent: (message: RunEventMessage) => void;
}

interface LiveSession {
	session: Session;
	runId: string | null;
	saving: Promise<void> | null;
	hasUnsaved: boolean;
}

function stopInterruptedRun(session: Session): boolean {
	const run = readLastRun(session.events);
	if (!run || run.endStatus) return false;
	const at = Date.now();
	for (const [agentId, status] of run.statuses) {
		if (status === "running" || status === "needs-input") {
			session.events.push({ type: "agent.status", runId: run.runId, at, agentId, status: "stopped" });
		}
	}
	session.events.push({ type: "run.finished", runId: run.runId, at, status: "stopped" });
	return true;
}

export class Chat {
	private readonly live = new Map<string, LiveSession>();

	constructor(private readonly options: ChatOptions) {}

	async list(projectRoot: string): Promise<SessionSummary[]> {
		const sessions = await listSessions(this.options.sessionsRoot, projectRoot);
		return sessions
			.map((stored) => {
				const live = this.live.get(stored.id);
				return summarizeSession(live?.session ?? stored, Boolean(live?.runId));
			})
			.sort((a, b) => b.updatedAt - a.updatedAt);
	}

	async load(projectRoot: string, id: string): Promise<Session> {
		const live = this.live.get(id);
		if (live && live.session.projectRoot === projectRoot) return live.session;
		const session = await readSession(this.options.sessionsRoot, projectRoot, id);
		if (stopInterruptedRun(session)) await writeSession(this.options.sessionsRoot, session);
		return session;
	}

	create(projectRoot: string): Promise<Session> {
		return createSession(this.options.sessionsRoot, projectRoot);
	}

	async rename(projectRoot: string, id: string, title: string): Promise<void> {
		const trimmed = title.trim();
		if (!trimmed) throw new Error("Give the session a title.");
		return this.update(projectRoot, id, (session) => {
			session.title = trimmed;
		});
	}

	async choose(projectRoot: string, id: string, { agent, skills }: SessionChoices): Promise<void> {
		if (agent !== null && !AGENT_CLIS[agent]) throw new Error(`Unknown agent: ${agent}`);
		return this.update(projectRoot, id, (session) => {
			session.agent = agent;
			session.skills = skills;
		});
	}

	async remove(projectRoot: string, id: string): Promise<void> {
		const live = this.live.get(id);
		this.live.delete(id);
		if (live?.runId) this.options.runner.stop(live.runId);
		await deleteSession(this.options.sessionsRoot, projectRoot, id);
	}

	async send(roots: SkillRoots, id: string, { text, agent, skills }: SessionChoices & { text: string }): Promise<Session> {
		const message = text.trim();
		if (!message) throw new Error("Write a message first.");
		const session = await this.load(roots.project, id);
		if (this.live.get(id)?.runId) throw new Error("Wait for the current run to finish, or stop it.");
		const library = await listSkills(roots);
		const chosen = skills.flatMap((name) => library.filter((skill) => skill.name === name));
		for (const skill of chosen) {
			if (skill.install !== "available") continue;
			await installSkill(roots, { dir: skill.dir }, this.options.moveToTrash);
			session.messages.push({ kind: "note", id: randomUUID(), at: Date.now(), text: `Installed ${skill.name} into .claude/skills` });
		}
		const runId = randomUUID();
		const names = chosen.map((skill) => skill.name);
		const prompt = [...names.map((name) => `/${name}`), message].join(" ");
		session.messages.push({ kind: "user", id: randomUUID(), at: Date.now(), text: prompt, runId, replyTo: null });
		if (session.title === DEFAULT_TITLE) session.title = titleFromText(message);
		session.agent = agent !== null && AGENT_CLIS[agent] ? agent : null;
		session.skills = skills;
		session.updatedAt = Date.now();
		const live = this.track(session, runId);
		this.save(live);
		this.options.runner.start(
			{ runId, projectRoot: roots.project, prompt, agent: session.agent, skills: names },
			(event) => this.record(live, event),
		);
		return session;
	}

	reply(projectRoot: string, id: string, agentId: string, text: string): Session {
		const { live, runId } = this.requireRun(projectRoot, id);
		const message = text.trim();
		if (!message) throw new Error("Write a reply first.");
		live.session.messages.push({ kind: "user", id: randomUUID(), at: Date.now(), text: message, runId, replyTo: agentId });
		this.save(live);
		this.options.runner.reply(runId, agentId, message);
		return live.session;
	}

	retry(projectRoot: string, id: string, agentId: string): void {
		this.options.runner.retry(this.requireRun(projectRoot, id).runId, agentId);
	}

	stop(projectRoot: string, id: string): void {
		this.options.runner.stop(this.requireRun(projectRoot, id).runId);
	}

	async flush(): Promise<void> {
		await Promise.all([...this.live.values()].map((live) => live.saving));
	}

	private requireRun(projectRoot: string, id: string): { live: LiveSession; runId: string } {
		const live = this.live.get(id);
		if (!live?.runId || live.session.projectRoot !== projectRoot) throw new Error("This session has no run in progress.");
		return { live, runId: live.runId };
	}

	private track(session: Session, runId: string): LiveSession {
		const live = this.live.get(session.id) ?? { session, runId, saving: null, hasUnsaved: false };
		live.runId = runId;
		this.live.set(session.id, live);
		return live;
	}

	private record(live: LiveSession, event: RunEvent): void {
		if (this.live.get(live.session.id) !== live) return;
		live.session.events.push(event);
		live.session.updatedAt = event.at;
		if (event.type === "run.finished") live.runId = null;
		this.save(live);
		this.options.onEvent({ projectRoot: live.session.projectRoot, sessionId: live.session.id, event });
	}

	private save(live: LiveSession): void {
		live.hasUnsaved = true;
		if (live.saving) return;
		live.saving = (async () => {
			while (live.hasUnsaved && this.live.get(live.session.id) === live) {
				live.hasUnsaved = false;
				await writeSession(this.options.sessionsRoot, live.session);
			}
			live.saving = null;
			if (!live.runId && this.live.get(live.session.id) === live) this.live.delete(live.session.id);
		})().catch((cause: unknown) => {
			live.saving = null;
			console.error(`Could not save session ${live.session.id}:`, cause);
		});
	}

	private async update(projectRoot: string, id: string, change: (session: Session) => void): Promise<void> {
		const live = this.live.get(id);
		if (live && live.session.projectRoot === projectRoot) {
			change(live.session);
			this.save(live);
			return;
		}
		const session = await readSession(this.options.sessionsRoot, projectRoot, id);
		change(session);
		await writeSession(this.options.sessionsRoot, session);
	}
}
