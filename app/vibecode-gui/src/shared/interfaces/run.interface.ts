import type { GlobalSkillFolder } from "./skill.interface";

export const AGENT_STATUSES = ["running", "done", "needs-input", "failed", "stopped"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const RUN_END_STATUSES = ["done", "stopped", "failed"] as const;
export type RunEndStatus = (typeof RUN_END_STATUSES)[number];

export interface AgentCli {
	label: string;
	command: string;
	skillFolders: GlobalSkillFolder[];
}

export const AGENT_CLIS: Record<string, AgentCli> = {
	"use-claude-code": { label: "Claude Code", command: "claude", skillFolders: [".claude/skills"] },
	"use-cursor": { label: "Cursor", command: "agent", skillFolders: [".cursor/skills", ".claude/skills", ".codex/skills"] },
	"use-antigravity": { label: "Antigravity", command: "agy", skillFolders: [".gemini/config/skills", ".gemini/antigravity/skills"] },
};

interface RunEventBase {
	runId: string;
	at: number;
}

export interface RunStartedEvent extends RunEventBase {
	type: "run.started";
}

export interface RunFinishedEvent extends RunEventBase {
	type: "run.finished";
	status: RunEndStatus;
}

export interface AgentSpawnedEvent extends RunEventBase {
	type: "agent.spawned";
	agentId: string;
	parentId: string | null;
	name: string;
	model: string;
	task: string;
	replaces: string | null;
}

export interface AgentStatusEvent extends RunEventBase {
	type: "agent.status";
	agentId: string;
	status: AgentStatus;
}

export interface AgentUsageEvent extends RunEventBase {
	type: "agent.usage";
	agentId: string;
	costUsd: number;
	durationMs: number;
}

export interface TextDeltaEvent extends RunEventBase {
	type: "text.delta";
	agentId: string;
	messageId: string;
	text: string;
}

export interface ToolStartedEvent extends RunEventBase {
	type: "tool.started";
	agentId: string;
	toolCallId: string;
	name: string;
	input: string;
}

export interface ToolFinishedEvent extends RunEventBase {
	type: "tool.finished";
	agentId: string;
	toolCallId: string;
	result: string;
	isError: boolean;
}

export interface InputNeededEvent extends RunEventBase {
	type: "input.needed";
	agentId: string;
	question: string;
}

export interface RunErrorEvent extends RunEventBase {
	type: "error";
	agentId: string;
	message: string;
}

export type RunEvent =
	| RunStartedEvent
	| RunFinishedEvent
	| AgentSpawnedEvent
	| AgentStatusEvent
	| AgentUsageEvent
	| TextDeltaEvent
	| ToolStartedEvent
	| ToolFinishedEvent
	| InputNeededEvent
	| RunErrorEvent;

export type RunEventBody = RunEvent extends infer Event ? (Event extends RunEvent ? Omit<Event, "runId" | "at"> : never) : never;

export interface RunRequest {
	runId: string;
	projectRoot: string;
	prompt: string;
	agent: string | null;
	skills: string[];
}

export interface AgentRunner {
	start(request: RunRequest, emit: (event: RunEvent) => void): void;
	stop(runId: string): void;
	reply(runId: string, agentId: string, text: string): void;
	retry(runId: string, agentId: string): void;
}
