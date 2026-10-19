import type { Skill } from "../../shared/skill.interface";
import { SKILL_VIEW_LABELS, type SkillView } from "../skill-view";
import { Icon, type IconName } from "./Icon";
import { InstallBadge } from "./InstallBadge";

interface HeaderProps {
	projectName: string;
	skill: Skill | null;
	view: SkillView;
	isDirty: boolean;
	isSaving: boolean;
	canGoBack: boolean;
	onBack: () => void;
	onView: (view: SkillView) => void;
	onSave: () => void;
	onDiscard: () => void;
	onRename: () => void;
	onDelete: () => void;
	onInstall: (skill: Skill) => void;
}

const ACTION_CLASS =
	"inline-flex h-control items-center gap-rail-gap rounded-full border border-line-control px-card text-body hover:bg-field";

function ViewButton({ view, icon, current, onView }: { view: SkillView; icon: IconName; current: SkillView; onView: (view: SkillView) => void }) {
	const isActive = view === current;
	return (
		<button
			type="button"
			aria-pressed={isActive}
			onClick={() => onView(view)}
			className={`inline-flex h-control items-center gap-rail-gap rounded-full px-card text-body ${
				isActive ? "bg-accent-soft text-accent-text" : "text-muted hover:bg-field"
			}`}
		>
			<Icon name={icon} className="size-icon-sm" />
			{SKILL_VIEW_LABELS[view]}
		</button>
	);
}

export function Header(props: HeaderProps) {
	const { projectName, skill, view, isDirty, isSaving, canGoBack, onBack, onView } = props;

	return (
		<header className="flex h-header shrink-0 items-center gap-card border-b border-line bg-surface px-header-x">
			<button
				type="button"
				onClick={onBack}
				disabled={!canGoBack}
				aria-label="Back to previous skill"
				className="flex size-control shrink-0 items-center justify-center rounded-control border border-line-control text-ink hover:bg-field disabled:opacity-40"
			>
				<Icon name="back" />
			</button>
			<div className="min-w-0">
				<p className="truncate text-meta text-muted">
					{projectName}
					{skill &&
						` · ${skill.scope === "project" ? skill.source : "Our library"} · ${SKILL_VIEW_LABELS[view]}`}
				</p>
				<h1 className="truncate text-title font-medium text-ink">{skill ? skill.name || skill.dir : projectName}</h1>
			</div>
			{isDirty && (
				<span className="inline-flex h-pill-h shrink-0 items-center gap-rail-gap rounded-full bg-warning-soft px-stack text-body text-warning-text">
					<span className="size-port rounded-full bg-warning-dot" />
					Unsaved changes
				</span>
			)}
			{skill?.scope === "library" && (
				<div className="ml-auto flex shrink-0 items-center gap-rail-gap">
					<ViewButton view="map" icon="map" current={view} onView={onView} />
					<ViewButton view="read" icon="read" current={view} onView={onView} />
					<span className="mx-rail-gap h-icon w-px bg-line" />
					<InstallBadge skill={skill} onInstall={props.onInstall} />
				</div>
			)}
			{skill?.scope === "project" && (
				<div className="ml-auto flex shrink-0 items-center gap-rail-gap">
					<ViewButton view="map" icon="map" current={view} onView={onView} />
					<ViewButton view="read" icon="read" current={view} onView={onView} />
					<ViewButton view="edit" icon="edit" current={view} onView={onView} />
					<span className="mx-rail-gap h-icon w-px bg-line" />
					{isDirty ? (
						<>
							<button type="button" onClick={props.onDiscard} className={`${ACTION_CLASS} text-ink`}>
								Discard
							</button>
							<button
								type="button"
								onClick={props.onSave}
								disabled={isSaving}
								className="inline-flex h-control items-center gap-rail-gap rounded-full bg-inverse px-node-pad text-body text-on-inverse disabled:opacity-60"
							>
								<Icon name="check" className="size-icon-sm" />
								{isSaving ? "Saving…" : "Save"}
							</button>
						</>
					) : (
						<>
							<button type="button" onClick={props.onRename} className={`${ACTION_CLASS} text-ink`}>
								<Icon name="rename" className="size-icon-sm" />
								Rename
							</button>
							<button type="button" onClick={props.onDelete} className={`${ACTION_CLASS} text-issue-text`}>
								<Icon name="trash" className="size-icon-sm" />
								Delete
							</button>
						</>
					)}
				</div>
			)}
		</header>
	);
}
