import type { RunEvent } from "./run.interface";

export interface UserMessage {
	kind: "user";
	id: string;
	at: number;
	text: string;
	runId: string;
	replyTo: string | null;
}

export interface SystemNote {
	kind: "note";
	id: string;
	at: number;
	text: string;
}

export type ChatMessage = UserMessage | SystemNote;

export interface Session {
	id: string;
	projectRoot: string;
	title: string;
	createdAt: number;
	updatedAt: number;
	agent: string | null;
	skills: string[];
	messages: ChatMessage[];
	events: RunEvent[];
}

export type SessionStatus = "idle" | "running" | "needs-input" | "failed" | "done" | "stopped";

export interface SessionSummary {
	id: string;
	projectRoot: string;
	title: string;
	updatedAt: number;
	status: SessionStatus;
}

export interface SessionChoices {
	agent: string | null;
	skills: string[];
}
