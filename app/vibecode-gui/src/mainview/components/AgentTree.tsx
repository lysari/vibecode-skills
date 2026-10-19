import { useEffect, useRef, useState } from "react";
import { wrapMapRows } from "../map-rows";
import { formatCost, formatDuration, listTreeAgents, type AgentNode, type AgentRun } from "../run-view";
import { AgentTreeToolbar, type TreeZoomChange } from "./AgentTreeToolbar";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 1.25;
const WRAP_MIN_SCALE = 0.9;

interface AgentTreeProps {
	run: AgentRun;
	root: AgentNode;
	selectedId: string | null;
	onSelect: (agentId: string) => void;
	onReply: (agentId: string) => void;
	onRetry: (agentId: string) => void;
}

interface AgentCardProps {
	agent: AgentNode;
	isRoot: boolean;
	isSelected: boolean;
	isCollapsed: boolean;
	onToggle: () => void;
	onSelect: (agentId: string) => void;
}

function AgentCard({ agent, isRoot, isSelected, isCollapsed, onToggle, onSelect }: AgentCardProps) {
	const { children } = agent;
	return (
		<div
			data-agent-id={agent.id}
			className={`relative w-node scroll-m-card rounded-node bg-card p-node-pad shadow-node motion-safe:animate-node-in ${
				isRoot ? "border-selected border-accent" : "border border-line-card"
			} ${isSelected ? "outline outline-selected outline-offset-selected outline-accent" : ""}`}
		>
			<button
				type="button"
				onClick={() => onSelect(agent.id)}
				aria-pressed={isSelected}
				aria-label={`Show the transcript of ${agent.name}`}
				className="flex w-full flex-col gap-stack text-left"
			>
				<span className="flex w-full items-start gap-stack">
					<span
						className={`flex size-tile shrink-0 items-center justify-center ${
							isRoot ? "bg-accent-soft text-accent-text" : "bg-tile text-tile-icon"
						}`}
					>
						<Icon name={isRoot ? "logo" : "agent"} />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block break-words text-node font-medium text-ink">{agent.name}</span>
						<span className="block truncate text-meta text-muted">
							{agent.replaces && <span className="text-accent-text">Retry · </span>}
							{agent.model}
						</span>
					</span>
					<StatusPill status={agent.status} />
				</span>
				<span className="line-clamp-2 text-body text-copy">{agent.task}</span>
			</button>
			<div className="mt-stack flex h-chip-h items-center justify-between text-meta text-muted">
				<span>
					<span className="text-ink">{formatCost(agent.costUsd)}</span> · {formatDuration(agent.durationMs)}
				</span>
				{children.length > 0 && (
					<button
						type="button"
						onClick={onToggle}
						aria-expanded={!isCollapsed}
						aria-label={`${isCollapsed ? "Show" : "Hide"} ${children.length} sub-${children.length === 1 ? "agent" : "agents"}`}
						className="inline-flex h-chip-h items-center gap-rail-gap rounded-full px-rail-gap hover:bg-field"
					>
						{isCollapsed ? `+${children.length}` : children.length}
						<Icon name={isCollapsed ? "chevron-right" : "chevron-down"} className="size-icon-sm" />
					</button>
				)}
			</div>
			{children.length > 0 && !isCollapsed && (
				<span className="absolute bottom-0 left-port-x size-port translate-y-1/2 rounded-full border-selected border-connector bg-canvas" />
			)}
		</div>
	);
}

interface TreeEntryProps {
	agent: AgentNode;
	selectedId: string | null;
	collapsed: Set<string>;
	onToggle: (agentId: string) => void;
	onSelect: (agentId: string) => void;
}

function TreeEntry({ agent, selectedId, collapsed, onToggle, onSelect }: TreeEntryProps) {
	const isCollapsed = collapsed.has(agent.id);
	return (
		<>
			<AgentCard
				agent={agent}
				isRoot={false}
				isSelected={agent.id === selectedId}
				isCollapsed={isCollapsed}
				onToggle={() => onToggle(agent.id)}
				onSelect={onSelect}
			/>
			{!isCollapsed && agent.children.length > 0 && (
				<div className="map-branch">
					{agent.children.map((child) => (
						<div key={child.id} className="map-branch-item">
							<TreeEntry agent={child} selectedId={selectedId} collapsed={collapsed} onToggle={onToggle} onSelect={onSelect} />
						</div>
					))}
				</div>
			)}
		</>
	);
}

export function AgentTree({ run, root, selectedId, onSelect, onReply, onRetry }: AgentTreeProps) {
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const [zoom, setZoom] = useState<{ runId: string; scale: number } | null>(null);
	const [size, setSize] = useState({
		viewportWidth: 0,
		contentWidth: 0,
		contentHeight: 0,
		columnWidths: [] as number[],
		columnGap: 0,
		columnIndent: 0,
	});
	const scrollRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const isRootCollapsed = collapsed.has(root.id);
	const rows = wrapMapRows(root.children, {
		widths: size.columnWidths,
		gap: size.columnGap,
		available: size.viewportWidth / WRAP_MIN_SCALE - size.columnIndent,
	});
	const zoomScale = zoom?.runId === run.id ? zoom.scale : null;
	const fitScale = size.contentWidth > 0 ? Math.min(1, size.viewportWidth / size.contentWidth) : 1;
	const scale = zoomScale ?? fitScale;

	useEffect(() => {
		const scroller = scrollRef.current;
		const content = contentRef.current;
		if (!scroller || !content) return;
		const observer = new ResizeObserver(() => {
			const { paddingLeft, paddingRight } = getComputedStyle(scroller);
			const rowsGrid = content.querySelector<HTMLElement>(".map-rows");
			const columns = [...content.querySelectorAll<HTMLElement>(".map-column")];
			const contentBox = content.getBoundingClientRect();
			const shownScale = contentBox.width / content.offsetWidth;
			setSize({
				viewportWidth: scroller.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight),
				contentWidth: content.offsetWidth,
				contentHeight: content.offsetHeight,
				columnWidths: columns.map((column) => (column.firstElementChild as HTMLElement).offsetWidth),
				columnGap: rowsGrid ? parseFloat(getComputedStyle(rowsGrid).columnGap) : 0,
				columnIndent: columns[0] ? (columns[0].getBoundingClientRect().left - contentBox.left) / shownScale : 0,
			});
		});
		observer.observe(scroller);
		observer.observe(content);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const scroller = scrollRef.current;
		if (scroller) scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
	}, [run.id, scale]);

	useEffect(() => {
		if (!selectedId) return;
		contentRef.current
			?.querySelector(`[data-agent-id="${CSS.escape(selectedId)}"]`)
			?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
	}, [selectedId]);

	function changeZoom(change: TreeZoomChange) {
		if (change === "fit") {
			setZoom(null);
			return;
		}
		const next = change === "in" ? Math.min(MAX_ZOOM, scale * ZOOM_STEP) : Math.max(MIN_ZOOM, scale / ZOOM_STEP);
		setZoom({ runId: run.id, scale: next });
	}

	function toggle(agentId: string) {
		const next = new Set(collapsed);
		if (next.has(agentId)) next.delete(agentId);
		else next.add(agentId);
		setCollapsed(next);
	}

	return (
		<section aria-label="Agent tree" className="flex h-full min-h-0 flex-col bg-canvas bg-dots">
			<AgentTreeToolbar
				agents={listTreeAgents(root)}
				onReply={onReply}
				onRetry={onRetry}
				scale={scale}
				isFitted={zoomScale === null}
				canZoomIn={scale < MAX_ZOOM}
				canZoomOut={scale > MIN_ZOOM}
				onZoom={changeZoom}
			/>
			<div ref={scrollRef} className="min-h-0 flex-1 overflow-auto p-header-x">
				<div className="mx-auto" style={{ width: size.contentWidth * scale, height: size.contentHeight * scale }}>
					<div ref={contentRef} className="w-max origin-top-left" style={{ transform: `scale(${scale})` }}>
						<AgentCard
							agent={root}
							isRoot
							isSelected={root.id === selectedId}
							isCollapsed={isRootCollapsed}
							onToggle={() => toggle(root.id)}
							onSelect={onSelect}
						/>
						{!isRootCollapsed && rows.length > 0 && (
							<div className="map-branch map-rows" style={{ gridTemplateColumns: `repeat(${rows[0].length}, max-content)` }}>
								{rows.map((row) => (
									<div key={row[0].id} className="map-row">
										{row.map((child) => (
											<div key={child.id} className="map-column">
												<div className="w-max">
													<TreeEntry
														agent={child}
														selectedId={selectedId}
														collapsed={collapsed}
														onToggle={toggle}
														onSelect={onSelect}
													/>
												</div>
											</div>
										))}
									</div>
								))}
							</div>
						)}
						{root.children.length === 0 && <p className="mt-level text-body text-muted">No sub-agents yet.</p>}
					</div>
				</div>
			</div>
		</section>
	);
}
