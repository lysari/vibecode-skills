export const GLOBAL_SKILL_FOLDERS = [
	".claude/skills",
	".agents/skills",
	".codex/skills",
	".cursor/skills",
	".gemini/config/skills",
	".gemini/antigravity/skills",
] as const;
export type GlobalSkillFolder = (typeof GLOBAL_SKILL_FOLDERS)[number];

export type SkillSource = "global" | "project";

export interface Skill {
	name: string;
	description: string;
	source: SkillSource;
	globalFolders: GlobalSkillFolder[];
}
