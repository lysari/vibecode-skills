import { useRef, useState } from "react";
import { formatCost, type AgentNode } from "../../utils/run-view";
import { useDismiss } from "../../hooks/use-dismiss";
import { Icon } from "../../components/Icon";

const PERCENT = 100;
const ZOOM_BUTTON_CLASS =
	"inline-flex h-pill-h items-center justify-center rounded-full border border-line-control bg-card text-ink hover:bg-field disabled:opacity-40";
const SECONDARY_CLASS = "h-control rounded-full border border-line-control px-card text-body text-ink hover:bg-field";
const PRIMARY_CLASS = "h-control rounded-full bg-inverse px-card text-body text-on-inverse";

export type TreeZoomChange = "in" | "out" | "fit";

interface AgentTreeToolbarProps {
	agents: AgentNode[];
	onReply: (agentId: string) => void;
	onRetry: (agentId: string) => void;
	scale: number;
	isFitted: boolean;
	canZoomIn: boolean;
	canZoomOut: boolean;
	onZoom: (change: TreeZoomChange) => void;
}

export function AgentTreeToolbar(props: AgentTreeToolbarProps) {
	const { agents, onReply, onRetry, onZoom } = props;
	const [dismissed, setDismissed] = useState<Set<string>>(new Set());
	const [openPopover, setOpenPopover] = useState<"needs-input" | "failed" | null>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	useDismiss(popoverRef, openPopover !== null, () => setOpenPopover(null));
	const runningCount = agents.filter((agent) => agent.status === "running").length;
	const totalCost = agents.reduce((total, agent) => total + agent.costUsd, 0);
	const waiting = agents.filter((agent) => agent.status === "needs-input" && !dismissed.has(agent.id));
	const failed = agents.filter((agent) => agent.status === "failed" && !dismissed.has(agent.id));
	const shown = openPopover === "needs-input" ? waiting : openPopover === "failed" ? failed : [];

	function act(action: (agentId: string) => void, agentId: string) {
		setOpenPopover(null);
		action(agentId);
	}

	return (
		<div className="flex shrink-0 flex-wrap items-center justify-between gap-card px-header-x pt-header-x">
			<p className="inline-flex h-stat-h items-center gap-stack whitespace-nowrap rounded-full border border-line bg-card px-node-pad text-meta text-chip">
				<Icon name="agent" className="size-icon-sm" />
				{agents.length} {agents.length === 1 ? "agent" : "agents"}
				<span className="h-icon-sm w-px bg-line" />
				{runningCount} running
				<span className="h-icon-sm w-px bg-line" />
				{formatCost(totalCost)}
			</p>
			<div ref={popoverRef} className="relative flex items-center gap-stack text-meta">
				{waiting.length > 0 && (
					<button
						type="button"
						onClick={() => setOpenPopover(openPopover === "needs-input" ? null : "needs-input")}
						aria-expanded={openPopover === "needs-input"}
						className="inline-flex h-pill-h items-center gap-rail-gap rounded-full bg-warning-soft px-stack text-warning-text"
					>
						{waiting.length} needs you
						<Icon name={openPopover === "needs-input" ? "chevron-up" : "chevron-down"} className="size-icon-sm" />
					</button>
				)}
				{failed.length > 0 && (
					<button
						type="button"
						onClick={() => setOpenPopover(openPopover === "failed" ? null : "failed")}
						aria-expanded={openPopover === "failed"}
						className="inline-flex h-pill-h items-center gap-rail-gap rounded-full bg-issue px-stack text-issue-text"
					>
						{failed.length} failed
						<Icon name={openPopover === "failed" ? "chevron-up" : "chevron-down"} className="size-icon-sm" />
					</button>
				)}
				{shown.length > 0 && (
					<div className="absolute right-0 top-full z-10 mt-rail-gap flex w-dialog flex-col gap-card rounded-card border border-line bg-card p-card shadow-popover">
						{shown.map((agent) => (
							<div key={agent.id} className="flex flex-col gap-stack">
								<p className="flex gap-stack text-body text-copy">
									<Icon
										name={openPopover === "failed" ? "alert" : "chat"}
										className={`size-icon ${openPopover === "failed" ? "text-issue-text" : "text-warning-text"}`}
									/>
									<span>
										<span className="font-medium text-ink">{agent.name}</span>{" "}
										{openPopover === "failed" ? agent.error : agent.question}
									</span>
								</p>
								<div className="flex justify-end gap-stack">
									<button
										type="button"
										onClick={() => setDismissed(new Set(dismissed).add(agent.id))}
										className={SECONDARY_CLASS}
									>
										Dismiss
									</button>
									{openPopover === "failed" ? (
										<button type="button" onClick={() => act(onRetry, agent.id)} className={PRIMARY_CLASS}>
											Retry
										</button>
									) : (
										<button type="button" onClick={() => act(onReply, agent.id)} className={PRIMARY_CLASS}>
											Reply
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
				<span className="flex items-center gap-rail-gap">
					<button
						type="button"
						onClick={() => onZoom("out")}
						disabled={!props.canZoomOut}
						aria-label="Zoom out"
						className={`${ZOOM_BUTTON_CLASS} w-pill-h`}
					>
						<Icon name="minus" className="size-icon-sm" />
					</button>
					<span aria-live="polite" className="w-zoom-label text-center tabular-nums text-chip">
						{Math.round(props.scale * PERCENT)}%
					</span>
					<button
						type="button"
						onClick={() => onZoom("in")}
						disabled={!props.canZoomIn}
						aria-label="Zoom in"
						className={`${ZOOM_BUTTON_CLASS} w-pill-h`}
					>
						<Icon name="plus" className="size-icon-sm" />
					</button>
					<button
						type="button"
						onClick={() => onZoom("fit")}
						disabled={props.isFitted}
						aria-label="Fit tree to view"
						className={`${ZOOM_BUTTON_CLASS} px-stack`}
					>
						Fit
					</button>
				</span>
			</div>
		</div>
	);
}
