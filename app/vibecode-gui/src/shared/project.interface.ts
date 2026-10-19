import type { Skill } from "./skill.interface";

export interface Project {
	root: string;
	name: string;
	openedAt: number;
	isAvailable: boolean;
}

export interface OpenProject extends Project {
	skills: Skill[];
}

export interface Workspace {
	projects: Project[];
	libraryRoot: string | null;
	defaultLibraryRoot: string | null;
	project: OpenProject | null;
}
