import { useEffect, useRef, useState } from "react";
import type { Skill } from "../../shared/skill.interface";
import type { SkillView } from "../skill-view";
import { Icon } from "./Icon";
import { MapToolbar, type MapZoomChange } from "./MapToolbar";
import { StatusPill } from "./StatusPill";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 1.25;

interface MapNode {
	key: string;
	skill: Skill;
	children: MapNode[];
	isRepeat: boolean;
}

interface SkillMapProps {
	skill: Skill;
	skills: Skill[];
	isDirty: boolean;
	onSelect: (dir: string, view?: SkillView) => void;
	onSave: () => void;
	onDiscard: () => void;
}

function buildMap(root: Skill, skills: Skill[]): { tree: MapNode; skillCount: number; linkCount: number } {
	const skillsByDir = new Map(skills.map((skill) => [skill.dir, skill]));
	const seen = new Set([root.dir]);
	const tree: MapNode = { key: root.dir, skill: root, children: [], isRepeat: false };
	const queue = [tree];
	let linkCount = 0;
	for (let node = queue.shift(); node; node = queue.shift()) {
		for (const dir of node.skill.references) {
			const skill = skillsByDir.get(dir);
			if (!skill) continue;
			const child: MapNode = { key: `${node.key}>${dir}`, skill, children: [], isRepeat: seen.has(dir) };
			node.children.push(child);
			linkCount++;
			if (child.isRepeat) continue;
			seen.add(dir);
			queue.push(child);
		}
	}
	return { tree, skillCount: seen.size, linkCount };
}

interface NodeCardProps {
	node: MapNode;
	isRoot: boolean;
	isDirty: boolean;
	isCollapsed: boolean;
	onToggle: () => void;
	onSelect: (dir: string, view?: SkillView) => void;
}

function NodeCard({ node, isRoot, isDirty, isCollapsed, onToggle, onSelect }: NodeCardProps) {
	const { skill, children } = node;
	const tone = isRoot && isDirty ? "unsaved" : skill.issues.length > 0 ? "issue" : "valid";
	return (
		<div
			className={`relative w-node rounded-node bg-card p-node-pad shadow-node motion-safe:animate-node-in ${
				isRoot ? "border-selected border-accent" : "border border-line-card"
			}`}
		>
			<button
				type="button"
				onClick={() => onSelect(skill.dir, isRoot ? "read" : undefined)}
				aria-label={isRoot ? `Read ${skill.name}` : `Open ${skill.name}`}
				className="flex w-full flex-col gap-stack text-left"
			>
				<span className="flex w-full items-start gap-stack">
					<span
						className={`flex size-tile shrink-0 items-center justify-center ${
							skill.files.length > 0 ? "bg-accent-soft text-accent-text" : "bg-tile text-tile-icon"
						}`}
					>
						<Icon name={skill.files.length > 0 ? "folder" : "file"} />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block break-words text-node font-medium text-ink">{skill.name || skill.dir}</span>
						<span className="block truncate text-meta text-muted">{skill.version ?? "No version"}</span>
					</span>
					<StatusPill tone={tone} />
				</span>
				<span className="line-clamp-2 text-body text-copy">{skill.description || "No description."}</span>
			</button>
			<div className="mt-stack flex h-chip-h items-center justify-between text-meta text-muted">
				<span>
					<span className="text-ink">{skill.lineCount} lines</span> · {skill.files.length}{" "}
					{skill.files.length === 1 ? "file" : "files"}
				</span>
				{children.length > 0 && (
					<button
						type="button"
						onClick={onToggle}
						aria-expanded={!isCollapsed}
						aria-label={`${isCollapsed ? "Show" : "Hide"} ${children.length} linked ${children.length === 1 ? "skill" : "skills"}`}
						className="inline-flex h-chip-h items-center gap-rail-gap rounded-full px-rail-gap hover:bg-field"
					>
						{isCollapsed ? `+${children.length}` : children.length}
						<Icon name={isCollapsed ? "chevron-right" : "chevron-down"} className="size-icon-sm" />
					</button>
				)}
			</div>
			{children.length > 0 && !isCollapsed && (
				<span
					className={`absolute bottom-0 size-port translate-y-1/2 rounded-full border-selected border-connector bg-canvas ${
						isRoot ? "left-1/2 -translate-x-1/2" : "left-port-x"
					}`}
				/>
			)}
		</div>
	);
}

interface MapEntryProps {
	node: MapNode;
	collapsed: Set<string>;
	onToggle: (key: string) => void;
	onSelect: (dir: string, view?: SkillView) => void;
}

function MapEntry({ node, collapsed, onToggle, onSelect }: MapEntryProps) {
	if (node.isRepeat) {
		return (
			<button
				type="button"
				onClick={() => onSelect(node.skill.dir)}
				className="inline-flex h-control items-center gap-rail-gap rounded-full border border-condition-line bg-condition px-card text-heading text-warning-text motion-safe:animate-node-in"
			>
				<Icon name="cycle" className="size-icon-sm" />
				{node.skill.name}
				<span className="text-meta">· already in map</span>
			</button>
		);
	}
	const isCollapsed = collapsed.has(node.key);
	return (
		<>
			<NodeCard
				node={node}
				isRoot={false}
				isDirty={false}
				isCollapsed={isCollapsed}
				onToggle={() => onToggle(node.key)}
				onSelect={onSelect}
			/>
			{!isCollapsed && node.children.length > 0 && (
				<div className="map-branch">
					{node.children.map((child) => (
						<div key={child.key} className="map-branch-item">
							<MapEntry node={child} collapsed={collapsed} onToggle={onToggle} onSelect={onSelect} />
						</div>
					))}
				</div>
			)}
		</>
	);
}

export function SkillMap({ skill, skills, isDirty, onSelect, onSave, onDiscard }: SkillMapProps) {
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const [zoom, setZoom] = useState<{ dir: string; scale: number } | null>(null);
	const [size, setSize] = useState({ viewportWidth: 0, contentWidth: 0, contentHeight: 0 });
	const scrollRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const { tree, skillCount, linkCount } = buildMap(skill, skills);
	const isRootCollapsed = collapsed.has(tree.key);
	const zoomScale = zoom?.dir === skill.dir ? zoom.scale : null;
	const fitScale = size.contentWidth > 0 ? Math.min(1, size.viewportWidth / size.contentWidth) : 1;
	const scale = zoomScale ?? fitScale;

	useEffect(() => {
		const scroller = scrollRef.current;
		const content = contentRef.current;
		if (!scroller || !content) return;
		const observer = new ResizeObserver(() => {
			const { paddingLeft, paddingRight } = getComputedStyle(scroller);
			setSize({
				viewportWidth: scroller.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight),
				contentWidth: content.offsetWidth,
				contentHeight: content.offsetHeight,
			});
		});
		observer.observe(scroller);
		observer.observe(content);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const scroller = scrollRef.current;
		if (scroller) scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
	}, [skill.dir, scale]);

	function changeZoom(change: MapZoomChange) {
		if (change === "fit") {
			setZoom(null);
			return;
		}
		const next = change === "in" ? Math.min(MAX_ZOOM, scale * ZOOM_STEP) : Math.max(MIN_ZOOM, scale / ZOOM_STEP);
		setZoom({ dir: skill.dir, scale: next });
	}

	function toggle(key: string) {
		const next = new Set(collapsed);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		setCollapsed(next);
	}

	return (
		<section aria-label="Skill map" className="flex h-full min-h-0 flex-col bg-canvas bg-dots">
			<MapToolbar
				skill={skill}
				skills={skills}
				skillCount={skillCount}
				linkCount={linkCount}
				isDirty={isDirty}
				onSelect={onSelect}
				onSave={onSave}
				onDiscard={onDiscard}
				scale={scale}
				isFitted={zoomScale === null}
				canZoomIn={scale < MAX_ZOOM}
				canZoomOut={scale > MIN_ZOOM}
				onZoom={changeZoom}
			/>
			<div ref={scrollRef} className="min-h-0 flex-1 overflow-auto p-header-x">
				<div
					className="mx-auto"
					style={{ width: size.contentWidth * scale, height: size.contentHeight * scale }}
				>
					<div
						ref={contentRef}
						className="flex w-max origin-top-left flex-col items-center"
						style={{ transform: `scale(${scale})` }}
					>
						<NodeCard
							key={tree.key}
							node={tree}
							isRoot
							isDirty={isDirty}
							isCollapsed={isRootCollapsed}
							onToggle={() => toggle(tree.key)}
							onSelect={onSelect}
						/>
						{!isRootCollapsed && tree.children.length > 0 && (
							<div className="map-row">
								{tree.children.map((child) => (
									<div key={child.key} className="map-column">
										<MapEntry node={child} collapsed={collapsed} onToggle={toggle} onSelect={onSelect} />
									</div>
								))}
							</div>
						)}
						{tree.children.length === 0 && (
							<p className="mt-level text-body text-muted">This skill does not mention any other skill.</p>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
