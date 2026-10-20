import type { Skill } from "../../../shared/interfaces/skill.interface";
import { Icon } from "../../components/Icon";

interface SkillSourceBadgeProps {
	skill: Skill;
}

export function SkillSourceBadge({ skill }: SkillSourceBadgeProps) {
	const globalPaths = skill.globalFolders.map((folder) => `~/${folder}`).join(", ");
	if (skill.source === "project") {
		return (
			<span
				title={globalPaths ? `In this project, also in ${globalPaths}` : "In this project"}
				className="inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full bg-accent-soft px-stack text-meta text-accent-text"
			>
				<Icon name="folder" className="size-icon-sm" />
				Project
			</span>
		);
	}
	return (
		<span
			title={`In ${globalPaths}`}
			className="inline-flex h-chip-h shrink-0 items-center rounded-full border border-line-control px-stack text-meta text-muted"
		>
			Global
		</span>
	);
}
