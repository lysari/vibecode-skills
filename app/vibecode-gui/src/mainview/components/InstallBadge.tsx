import type { Skill } from "../../shared/skill.interface";
import { Icon } from "./Icon";

interface InstallBadgeProps {
	skill: Skill;
	onUpdate: (skill: Skill) => void;
}

export function InstallBadge({ skill, onUpdate }: InstallBadgeProps) {
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
			<button
				type="button"
				onClick={() => onUpdate(skill)}
				aria-label={`Update ${skill.name} in the project`}
				title="The project's copy differs from the library"
				className="inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full bg-unsaved px-stack text-meta text-unsaved-text hover:underline"
			>
				<Icon name="refresh" className="size-icon-sm" />
				Update
			</button>
		);
	}
	return (
		<span
			title="Installed into .claude/skills when you send"
			className="inline-flex h-chip-h shrink-0 items-center rounded-full border border-line-control px-stack text-meta text-muted"
		>
			Not installed
		</span>
	);
}
