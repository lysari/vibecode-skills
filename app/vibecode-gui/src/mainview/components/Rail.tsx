import { Icon } from "./Icon";

interface RailProps {
	isProjectsOpen: boolean;
	hasProject: boolean;
	isDark: boolean;
	isScanning: boolean;
	onShowProjects: () => void;
	onShowSkills: () => void;
	onNewSkill: () => void;
	onRescan: () => void;
	onOpenSettings: () => void;
	onToggleTheme: () => void;
}

const ITEM_CLASS =
	"flex h-rail-item-h w-rail-item-w flex-col items-center justify-center gap-rail-gap rounded-rail text-rail text-muted hover:bg-field disabled:opacity-60";
const CURRENT_ITEM_CLASS =
	"flex h-rail-item-h w-rail-item-w flex-col items-center justify-center gap-rail-gap rounded-rail bg-accent-soft text-rail text-accent-text";

export function Rail(props: RailProps) {
	const { isProjectsOpen, hasProject, isDark, isScanning } = props;
	const isSkillsOpen = hasProject && !isProjectsOpen;
	return (
		<nav
			aria-label="App"
			className="flex w-rail shrink-0 flex-col items-center gap-rail-gap border-r border-line bg-surface py-node-pad"
		>
			<div className="mb-stack flex size-logo items-center justify-center rounded-logo bg-inverse text-on-inverse">
				<Icon name="logo" />
			</div>
			<button
				type="button"
				onClick={props.onShowProjects}
				aria-current={isProjectsOpen ? "page" : undefined}
				className={isProjectsOpen ? CURRENT_ITEM_CLASS : ITEM_CLASS}
			>
				<Icon name="projects" />
				Projects
			</button>
			<button
				type="button"
				onClick={props.onShowSkills}
				disabled={!hasProject}
				aria-current={isSkillsOpen ? "page" : undefined}
				className={isSkillsOpen ? CURRENT_ITEM_CLASS : ITEM_CLASS}
			>
				<Icon name="skills" />
				Skills
			</button>
			<button type="button" onClick={props.onNewSkill} disabled={!hasProject} className={ITEM_CLASS}>
				<Icon name="plus" />
				New
			</button>
			<button type="button" onClick={props.onRescan} disabled={isScanning} className={ITEM_CLASS}>
				<Icon name="refresh" className={`size-icon ${isScanning ? "motion-safe:animate-spin" : ""}`} />
				Rescan
			</button>
			<button type="button" onClick={props.onOpenSettings} className={`mt-auto ${ITEM_CLASS}`}>
				<Icon name="settings" />
				Settings
			</button>
			<button type="button" onClick={props.onToggleTheme} aria-pressed={isDark} className={ITEM_CLASS}>
				<Icon name={isDark ? "sun" : "moon"} />
				{isDark ? "Light" : "Dark"}
			</button>
		</nav>
	);
}
