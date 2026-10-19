export interface SkillFile {
	path: string;
	size: number;
}

/** A project skill lives in the open project and can be edited; a library skill is read-only and can be added to the project. */
export type SkillScope = "project" | "library";

/** A library skill is not in the project yet, has an identical copy there, or has a copy that differs. */
export type SkillInstall = "available" | "installed" | "outdated";

export interface Skill {
	/** Absolute path of the skill folder. */
	dir: string;
	scope: SkillScope;
	/** Folder holding the skill, relative to the project or library root, e.g. `.claude/skills`. */
	source: string;
	name: string;
	description: string;
	version: string | null;
	frontmatter: string;
	body: string;
	files: SkillFile[];
	lineCount: number;
	modifiedAt: number;
	/** Folders of the skills this one links to. */
	references: string[];
	issues: string[];
	/** Set for library skills only. */
	install: SkillInstall | null;
}

export interface SkillForm {
	frontmatter: string;
	body: string;
}

export interface SkillCreate {
	source: string;
	name: string;
	description: string;
}

export interface SkillRename {
	dir: string;
	name: string;
	shouldRenameMentions: boolean;
}
