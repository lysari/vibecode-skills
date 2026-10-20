import type { AgentStatus, RunEndStatus, RunEvent } from "../shared/run.interface";
import type { Session, UserMessage } from "../shared/session.interface";

const SECOND_MS = 1000;
const MINUTE_SECONDS = 60;
const CENTS = 0.01;

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

export function formatCost(costUsd: number): string {
	return costUsd > 0 && costUsd < CENTS ? "<$0.01" : `$${costUsd.toFixed(2)}`;
}

export function formatDuration(durationMs: number): string {
	const seconds = Math.round(durationMs / SECOND_MS);
	if (seconds < MINUTE_SECONDS) return `${seconds}s`;
	return `${Math.floor(seconds / MINUTE_SECONDS)}m ${String(seconds % MINUTE_SECONDS).padStart(2, "0")}s`;
}

function runEndText(status: RunEndStatus, root: AgentNode | undefined): string {
	if (status === "stopped") return "Run stopped";
	if (status === "failed") return "Run failed";
	return root ? `Run finished in ${formatDuration(root.durationMs)} · ${formatCost(root.costUsd)}` : "Run finished";
}

export function buildRunView(events: RunEvent[]): RunView {
	const agents = new Map<string, AgentNode>();
	const runs: AgentRun[] = [];
	const items = new Map<string, ThreadItem[]>();
	const texts = new Map<string, TextItem>();
	const tools = new Map<string, ToolItem>();
	const push = (agentId: string, item: ThreadItem) => items.get(agentId)?.push(item);
	// Questions and errors of sub-agents also show in the orchestrator's transcript, which is the chat.
	const pushToAgentAndRoot = (agent: AgentNode, item: ThreadItem) => {
		push(agent.id, item);
		const rootId = runs.find((run) => run.id === agent.runId)?.rootId;
		if (rootId && rootId !== agent.id) push(rootId, item);
	};

	events.forEach((event, index) => {
		const key = `${event.runId}:${index}`;
		const agent = "agentId" in event ? agents.get(event.agentId) : undefined;
		switch (event.type) {
			case "run.started":
				runs.push({ id: event.runId, rootId: null, status: "running" });
				break;
			case "run.finished": {
				const run = runs.find((candidate) => candidate.id === event.runId);
				if (!run) break;
				run.status = event.status;
				const root = run.rootId ? agents.get(run.rootId) : undefined;
				if (root) push(root.id, { kind: "note", key, at: event.at, text: runEndText(event.status, root) });
				break;
			}
			case "agent.spawned": {
				const node: AgentNode = {
					id: event.agentId,
					runId: event.runId,
					parentId: event.parentId,
					name: event.name,
					model: event.model,
					task: event.task,
					status: "running",
					costUsd: 0,
					durationMs: 0,
					replaces: event.replaces,
					question: null,
					error: null,
					children: [],
				};
				agents.set(node.id, node);
				items.set(node.id, []);
				const parent = event.parentId ? agents.get(event.parentId) : undefined;
				const run = runs.find((candidate) => candidate.id === event.runId);
				if (parent) {
					parent.children.push(node);
					push(parent.id, { kind: "agent", key, at: event.at, agentId: node.id, text: event.task });
				} else if (run && !run.rootId) {
					run.rootId = node.id;
				}
				break;
			}
			case "agent.status":
				if (!agent) break;
				agent.status = event.status;
				if (event.status !== "needs-input") agent.question = null;
				if (event.status !== "failed") agent.error = null;
				break;
			case "agent.usage":
				if (!agent) break;
				agent.costUsd = event.costUsd;
				agent.durationMs = event.durationMs;
				break;
			case "text.delta": {
				const text = texts.get(event.messageId);
				if (text) {
					text.text += event.text;
					break;
				}
				const item: TextItem = { kind: "text", key: event.messageId, at: event.at, agentId: event.agentId, text: event.text };
				texts.set(event.messageId, item);
				push(event.agentId, item);
				break;
			}
			case "tool.started": {
				const tool: ToolItem = { kind: "tool", key: event.toolCallId, at: event.at, name: event.name, input: event.input, result: null, isError: false };
				tools.set(event.toolCallId, tool);
				push(event.agentId, tool);
				break;
			}
			case "tool.finished": {
				const tool = tools.get(event.toolCallId);
				if (!tool) break;
				tool.result = event.result;
				tool.isError = event.isError;
				break;
			}
			case "input.needed":
				if (!agent) break;
				agent.question = event.question;
				pushToAgentAndRoot(agent, { kind: "question", key, at: event.at, agentId: agent.id, text: event.question });
				break;
			case "error":
				if (!agent) break;
				agent.error = event.message;
				pushToAgentAndRoot(agent, { kind: "error", key, at: event.at, agentId: agent.id, text: event.message });
				break;
		}
	});
	return { agents, runs, items };
}

export function buildThread(session: Session, view: RunView, agentId: string | null): ThreadItem[] {
	const messages: ThreadItem[] = session.messages
		.filter((message) => (agentId ? message.kind === "user" && message.replyTo === agentId : true))
		.map((message) =>
			message.kind === "user"
				? { kind: "user", key: message.id, at: message.at, message }
				: { kind: "note", key: message.id, at: message.at, text: message.text },
		);
	const agentIds = agentId ? [agentId] : view.runs.map((run) => run.rootId).filter((id): id is string => id !== null);
	const transcript = agentIds.flatMap((id) => view.items.get(id) ?? []);
	// Array sort is stable, so a message sent in the same millisecond as an event stays before it.
	return [...messages, ...transcript].sort((a, b) => a.at - b.at);
}

export function listTreeAgents(root: AgentNode): AgentNode[] {
	return [root, ...root.children.flatMap(listTreeAgents)];
}
