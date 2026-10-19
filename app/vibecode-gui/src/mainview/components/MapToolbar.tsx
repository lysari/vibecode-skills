import { useEffect, useRef, useState } from "react";
import type { Skill } from "../../shared/skill.interface";
import type { SkillView } from "../skill-view";
import { Icon } from "./Icon";

const MINUTE_MS = 60_000;
const HOUR_MINUTES = 60;
const DAY_HOURS = 24;

interface MapToolbarProps {
	skill: Skill;
	skills: Skill[];
	skillCount: number;
	linkCount: number;
	isDirty: boolean;
	onSelect: (dir: string, view?: SkillView) => void;
	onSave: () => void;
	onDiscard: () => void;
}

function formatEdited(modifiedAt: number): string {
	const minutes = Math.round((Date.now() - modifiedAt) / MINUTE_MS);
	if (minutes < 1) return "just now";
	if (minutes < HOUR_MINUTES) return `${minutes} min ago`;
	const hours = Math.round(minutes / HOUR_MINUTES);
	if (hours < DAY_HOURS) return `${hours} h ago`;
	return `${Math.round(hours / DAY_HOURS)} d ago`;
}

export function MapToolbar({ skill, skills, skillCount, linkCount, isDirty, onSelect, onSave, onDiscard }: MapToolbarProps) {
	const [dismissed, setDismissed] = useState<Set<string>>(new Set());
	const [openPopover, setOpenPopover] = useState<"issues" | "unsaved" | null>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const issueSkills = skills.filter((other) => other.issues.length > 0 && !dismissed.has(other.dir));

	useEffect(() => {
		if (!openPopover) return;
		const close = (event: MouseEvent | KeyboardEvent) => {
			const isOutside = event instanceof MouseEvent && !popoverRef.current?.contains(event.target as Node);
			if (isOutside || (event instanceof KeyboardEvent && event.key === "Escape")) setOpenPopover(null);
		};
		document.addEventListener("mousedown", close);
		document.addEventListener("keydown", close);
		return () => {
			document.removeEventListener("mousedown", close);
			document.removeEventListener("keydown", close);
		};
	}, [openPopover]);

	return (
		<div className="flex shrink-0 items-center justify-between gap-card px-header-x pt-header-x">
			<p className="inline-flex h-stat-h items-center gap-stack rounded-full border border-line bg-card px-node-pad text-meta text-chip">
				<Icon name="map" className="size-icon-sm" />
				{skillCount} {skillCount === 1 ? "skill" : "skills"}
				<span className="h-icon-sm w-px bg-line" />
				{linkCount} links
				<span className="h-icon-sm w-px bg-line" />
				Edited {formatEdited(skill.modifiedAt)}
			</p>
			<div ref={popoverRef} className="relative flex items-center gap-stack text-meta">
				<span className="text-muted">{skills.length} skills in library</span>
				{isDirty && (
					<button
						type="button"
						onClick={() => setOpenPopover(openPopover === "unsaved" ? null : "unsaved")}
						aria-expanded={openPopover === "unsaved"}
						className="inline-flex h-pill-h items-center gap-rail-gap rounded-full bg-unsaved px-stack text-unsaved-text"
					>
						1 unsaved
						<Icon name={openPopover === "unsaved" ? "chevron-up" : "chevron-down"} className="size-icon-sm" />
					</button>
				)}
				{issueSkills.length > 0 && (
					<button
						type="button"
						onClick={() => setOpenPopover(openPopover === "issues" ? null : "issues")}
						aria-expanded={openPopover === "issues"}
						className="inline-flex h-pill-h items-center gap-rail-gap rounded-full bg-issue px-stack text-issue-text"
					>
						{issueSkills.length} with issues
						<Icon name={openPopover === "issues" ? "chevron-up" : "chevron-down"} className="size-icon-sm" />
					</button>
				)}
				{(openPopover === "unsaved" ? isDirty : openPopover === "issues" && issueSkills.length > 0) && (
					<div className="absolute right-0 top-full z-10 mt-rail-gap flex w-dialog flex-col gap-card rounded-card border border-line bg-card p-card shadow-popover">
						{openPopover === "unsaved" ? (
							<div className="flex flex-col gap-stack">
								<p className="flex gap-stack text-body text-copy">
									<Icon name="clock" className="size-icon text-unsaved-text" />
									<span>
										<span className="font-medium text-ink">{skill.name}</span> has edits that are not saved to
										SKILL.md yet.
									</span>
								</p>
								<div className="flex justify-end gap-stack">
									<button
										type="button"
										onClick={() => {
											setOpenPopover(null);
											onDiscard();
										}}
										className="h-control rounded-full border border-line-control px-card text-body text-ink hover:bg-field"
									>
										Discard
									</button>
									<button
										type="button"
										onClick={() => {
											setOpenPopover(null);
											onSave();
										}}
										className="h-control rounded-full bg-inverse px-card text-body text-on-inverse"
									>
										Save
									</button>
								</div>
							</div>
						) : (
							issueSkills.map((other) => (
								<div key={other.dir} className="flex flex-col gap-stack">
									<p className="flex gap-stack text-body text-copy">
										<Icon name="alert" className="size-icon text-issue-text" />
										<span>
											<span className="font-medium text-ink">{other.name || other.dir}</span>{" "}
											{other.issues.join(". ")}
										</span>
									</p>
									<div className="flex justify-end gap-stack">
										<button
											type="button"
											onClick={() => setDismissed(new Set(dismissed).add(other.dir))}
											className="h-control rounded-full border border-line-control px-card text-body text-ink hover:bg-field"
										>
											Dismiss
										</button>
										<button
											type="button"
											onClick={() => {
												setOpenPopover(null);
												onSelect(other.dir, "edit");
											}}
											className="h-control rounded-full bg-inverse px-card text-body text-on-inverse"
										>
											Fix in editor
										</button>
									</div>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}
