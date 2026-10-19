export type SkillInstall = "available" | "installed" | "outdated";

export interface Skill {
	dir: string;
	name: string;
	description: string;
	version: string | null;
	install: SkillInstall;
}
