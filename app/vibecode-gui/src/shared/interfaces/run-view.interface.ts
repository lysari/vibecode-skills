import type { AgentStatus, RunEndStatus } from "./run.interface";
import type { UserMessage } from "./session.interface";

export interface AgentNode {
	id: string;
	runId: string;
	parentId: string | null;
	name: string;
	model: string;
	task: string;
	status: AgentStatus;
	costUsd: number;
	durationMs: number;
	replaces: string | null;
	question: string | null;
	error: string | null;
	children: AgentNode[];
}

export interface AgentRun {
	id: string;
	rootId: string | null;
	status: RunEndStatus | "running";
}

interface ThreadItemBase {
	key: string;
	at: number;
}

export interface UserItem extends ThreadItemBase {
	kind: "user";
	message: UserMessage;
}

export interface NoteItem extends ThreadItemBase {
	kind: "note";
	text: string;
}

export interface TextItem extends ThreadItemBase {
	kind: "text";
	agentId: string;
	text: string;
}

export interface ToolItem extends ThreadItemBase {
	kind: "tool";
	name: string;
	input: string;
	result: string | null;
	isError: boolean;
}

export interface AgentItem extends ThreadItemBase {
	kind: "agent" | "question" | "error";
	agentId: string;
	text: string;
}

export type ThreadItem = UserItem | NoteItem | TextItem | ToolItem | AgentItem;

export interface RunView {
	agents: Map<string, AgentNode>;
	runs: AgentRun[];
	items: Map<string, ThreadItem[]>;
}
