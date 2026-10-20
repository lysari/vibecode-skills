import { useState } from "react";
import type { UserMessage } from "../../shared/interfaces/session.interface";
import { formatCost, formatDuration, type RunView, type ThreadItem, type ToolItem } from "../run-view";
import { Icon } from "./Icon";
import { Markdown } from "./Markdown";
import { StatusPill } from "./StatusPill";

const SLASH_COMMANDS = /^((?:\/[\w-]+\s+)*)([\s\S]*)$/;
const MARKDOWN_MARKS = /[`*_#]/g;
const ACTION_CLASS = "h-control shrink-0 rounded-full px-card text-body";

interface ThreadEntryProps {
	item: ThreadItem;
	view: RunView;
	isStreaming: boolean;
	onOpenAgent: (agentId: string) => void;
	onReply: (agentId: string) => void;
	onRetry: (agentId: string) => void;
}

function UserBubble({ message, view }: { message: UserMessage; view: RunView }) {
	const [, commands, text] = SLASH_COMMANDS.exec(message.text) ?? ["", "", message.text];
	const replyTo = message.replyTo ? view.agents.get(message.replyTo) : undefined;
	return (
		<div className="flex flex-col items-end gap-rail-gap">
			{replyTo && <p className="text-meta text-muted">Reply to {replyTo.name}</p>}
			<p className="max-w-full whitespace-pre-wrap break-words rounded-node bg-field px-node-pad py-stack text-body text-ink">
				{commands
					.trim()
					.split(/\s+/)
					.filter(Boolean)
					.map((command) => (
						<span key={command} className="mr-rail-gap font-mono text-code text-accent-text">
							{command}
						</span>
					))}
				{text}
			</p>
		</div>
	);
}

function ToolBlock({ tool }: { tool: ToolItem }) {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div className="rounded-card border border-line-card bg-card">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				className="flex h-group w-full items-center gap-stack px-card text-left text-body"
			>
				<Icon name="tool" className="size-icon-sm text-muted" />
				<span className="shrink-0 font-medium text-ink">{tool.name}</span>
				<span className="min-w-0 flex-1 truncate font-mono text-code text-muted">{tool.input}</span>
				{tool.result === null ? (
					<Icon name="loader" className="size-icon-sm text-info-text motion-safe:animate-spin" />
				) : (
					<Icon name={tool.isError ? "alert" : "check"} className={`size-icon-sm ${tool.isError ? "text-issue-text" : "text-valid-text"}`} />
				)}
				<Icon name={isOpen ? "chevron-up" : "chevron-down"} className="size-icon-sm text-muted" />
			</button>
			{isOpen && (
				<pre className="overflow-x-auto border-t border-line bg-field px-card py-stack font-mono text-code text-ink">
					{tool.result ?? "Running…"}
				</pre>
			)}
		</div>
	);
}

export function ThreadEntry({ item, view, isStreaming, onOpenAgent, onReply, onRetry }: ThreadEntryProps) {
	if (item.kind === "user") return <UserBubble message={item.message} view={view} />;
	if (item.kind === "note") {
		return (
			<p className="flex items-center justify-center gap-rail-gap text-meta text-muted">
				<Icon name="check" className="size-icon-sm" />
				{item.text}
			</p>
		);
	}
	if (item.kind === "text") {
		return (
			<div className={isStreaming ? "streaming" : undefined}>
				<Markdown source={item.text} />
			</div>
		);
	}
	if (item.kind === "tool") return <ToolBlock tool={item} />;
	const agent = view.agents.get(item.agentId);
	if (!agent) return null;
	if (item.kind === "agent") {
		const summary = [...(view.items.get(agent.id) ?? [])].reverse().find((entry) => entry.kind === "text");
		return (
			<button
				type="button"
				onClick={() => onOpenAgent(agent.id)}
				aria-label={`Show ${agent.name} in the tree`}
				className="flex w-full items-start gap-stack rounded-card border border-line-card bg-card p-card text-left shadow-card hover:border-accent"
			>
				<span className="flex size-tile shrink-0 items-center justify-center bg-accent-soft text-accent-text">
					<Icon name="agent" />
				</span>
				<span className="min-w-0 flex-1">
					<span className="flex items-center gap-stack">
						<span className="min-w-0 truncate text-heading font-medium text-ink">{agent.name}</span>
						<span className="min-w-0 truncate text-meta text-muted">{agent.model}</span>
					</span>
					<span className="line-clamp-2 text-body text-copy">
						{summary?.kind === "text" ? summary.text.replace(MARKDOWN_MARKS, "") : agent.task}
					</span>
					<span className="block text-meta text-muted">
						{formatCost(agent.costUsd)} · {formatDuration(agent.durationMs)}
						{agent.children.length > 0 && ` · ${agent.children.length} ${agent.children.length === 1 ? "sub-agent" : "sub-agents"}`}
					</span>
				</span>
				<StatusPill status={agent.status} />
			</button>
		);
	}
	const isOpen = item.kind === "question" ? agent.question === item.text : agent.status === "failed" && agent.error === item.text;
	const isRetried = [...view.agents.values()].some((other) => other.replaces === agent.id);
	const closedLabel = agent.status === "stopped" && !isRetried ? "Stopped" : item.kind === "question" ? "Answered" : "Retried";
	return (
		<div
			className={`flex items-start gap-stack rounded-card p-card text-body ${
				item.kind === "question" ? "bg-warning-soft text-warning-text" : "bg-issue text-issue-text"
			}`}
		>
			<Icon name={item.kind === "question" ? "chat" : "alert"} className="mt-rail-gap size-icon" />
			<p className="min-w-0 flex-1">
				<span className="font-medium">{agent.name}</span> {item.kind === "question" ? "needs you: " : "failed: "}
				<span className="text-ink">{item.text}</span>
			</p>
			{isOpen && item.kind === "question" && (
				<button type="button" onClick={() => onReply(agent.id)} className={`${ACTION_CLASS} bg-inverse text-on-inverse`}>
					Reply
				</button>
			)}
			{isOpen && item.kind === "error" && (
				<button type="button" onClick={() => onRetry(agent.id)} className={`${ACTION_CLASS} bg-inverse text-on-inverse`}>
					Retry
				</button>
			)}
			{!isOpen && <span className="shrink-0 text-meta">{closedLabel}</span>}
		</div>
	);
}
