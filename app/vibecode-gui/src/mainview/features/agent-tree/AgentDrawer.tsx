import { formatCost, formatDuration, type AgentNode, type RunView, type ThreadItem } from "../../utils/run-view";
import { Icon } from "../../components/Icon";
import { StatusPill } from "../../components/StatusPill";
import { ThreadEntry } from "../../components/ThreadEntry";

interface AgentDrawerProps {
	agent: AgentNode;
	thread: ThreadItem[];
	view: RunView;
	onClose: () => void;
	onSelect: (agentId: string) => void;
	onReply: (agentId: string) => void;
	onRetry: (agentId: string) => void;
}

export function AgentDrawer({ agent, thread, view, onClose, onSelect, onReply, onRetry }: AgentDrawerProps) {
	const last = thread[thread.length - 1];
	return (
		<aside aria-label={`${agent.name} transcript`} className="flex w-inspector shrink-0 flex-col border-l border-line bg-surface">
			<div className="flex flex-col gap-stack border-b border-line p-gutter">
				<div className="flex items-start gap-stack">
					<div className="min-w-0 flex-1">
						<h2 className="break-words text-heading font-medium text-ink">{agent.name}</h2>
						<p className="truncate text-meta text-muted">{agent.model}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close the transcript"
						className="flex size-control shrink-0 items-center justify-center rounded-control text-muted hover:bg-field hover:text-ink"
					>
						<Icon name="close" className="size-icon-sm" />
					</button>
				</div>
				<div className="flex items-center gap-stack text-meta text-muted">
					<StatusPill status={agent.status} />
					{formatCost(agent.costUsd)} · {formatDuration(agent.durationMs)}
				</div>
				<p className="text-body text-copy">{agent.task}</p>
			</div>
			<ol aria-label="Transcript" className="flex min-h-0 flex-1 flex-col gap-card overflow-y-auto p-gutter">
				{thread.length === 0 && <li className="text-body text-muted">Nothing yet.</li>}
				{thread.map((item) => (
					<li key={item.key}>
						<ThreadEntry
							item={item}
							view={view}
							isStreaming={agent.status === "running" && item === last && item.kind === "text"}
							onOpenAgent={onSelect}
							onReply={onReply}
							onRetry={onRetry}
						/>
					</li>
				))}
			</ol>
		</aside>
	);
}
