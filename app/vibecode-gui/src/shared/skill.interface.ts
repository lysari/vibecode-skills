export interface SkillFile {
	path: string;
	size: number;
}

export interface Skill {
	dir: string;
	source: string;
	name: string;
	description: string;
	version: string | null;
	frontmatter: string;
	body: string;
	files: SkillFile[];
	lineCount: number;
	modifiedAt: number;
	references: string[];
	issues: string[];
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

export interface SkillLibrary {
	root: string;
	sources: string[];
	skills: Skill[];
}
