import type { Skill } from "./skill.interface";

/** A folder in the recent projects list. */
export interface Project {
	/** Absolute path of the project folder. */
	root: string;
	name: string;
	openedAt: number;
	skillCount: number;
	/** False when the folder was moved or deleted since it was last opened. */
	isAvailable: boolean;
}

export interface OpenProject extends Project {
	/** Skill folders of the project, relative to its root, e.g. `.claude/skills`. */
	sources: string[];
	/** The project's skills first, then the library's. */
	skills: Skill[];
	/** Folders of the skills starred in this project. */
	favourites: string[];
}

export interface Workspace {
	home: string;
	/** Most recently opened first. */
	projects: Project[];
	/** The library folder in use: the one chosen in Settings, else the default. */
	libraryRoot: string | null;
	defaultLibraryRoot: string | null;
	project: OpenProject | null;
}
