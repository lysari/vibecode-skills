import type { Skill } from "../../shared/skill.interface";
import { Icon } from "./Icon";

const ACTION_CLASS =
	"inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full border border-line-control bg-card px-stack text-meta text-ink hover:bg-field";

interface InstallBadgeProps {
	skill: Skill;
	onInstall: (skill: Skill) => void;
}

/** How a library skill relates to the open project, with the action that adds or updates its copy there. */
export function InstallBadge({ skill, onInstall }: InstallBadgeProps) {
	if (skill.install === "installed") {
		return (
			<span className="inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full bg-valid px-stack text-meta text-valid-text">
				<Icon name="check" className="size-icon-sm" />
				Installed
			</span>
		);
	}
	if (skill.install === "outdated") {
		return (
			<span className="flex shrink-0 items-center gap-stack">
				<span className="inline-flex h-chip-h items-center gap-rail-gap rounded-full bg-unsaved px-stack text-meta text-unsaved-text">
					<Icon name="refresh" className="size-icon-sm" />
					Update available
				</span>
				<button
					type="button"
					onClick={() => onInstall(skill)}
					aria-label={`Update ${skill.name} in the project`}
					className={ACTION_CLASS}
				>
					Update
				</button>
			</span>
		);
	}
	return (
		<button
			type="button"
			onClick={() => onInstall(skill)}
			aria-label={`Add ${skill.name} to the project`}
			className={ACTION_CLASS}
		>
			<Icon name="plus" className="size-icon-sm" />
			Add to project
		</button>
	);
}
