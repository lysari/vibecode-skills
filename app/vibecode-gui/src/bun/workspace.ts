import { existsSync, realpathSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import type { Project, Workspace } from "../shared/interfaces/project.interface";
import { listSkills, type SkillRoots } from "./skills";

interface StoredProject {
	root: string;
	openedAt: number;
}

interface ProjectsStore {
	openRoot: string | null;
	projects: StoredProject[];
}

const EMPTY_STORE: ProjectsStore = { openRoot: null, projects: [] };

function isFolder(path: string): boolean {
	return existsSync(path) && statSync(path).isDirectory();
}

function readText(value: unknown): string | null {
	return typeof value === "string" && value ? value : null;
}

function readStoredProject(value: unknown): StoredProject | null {
	if (!value || typeof value !== "object") return null;
	const { root, openedAt } = value as Record<string, unknown>;
	return typeof root === "string" && typeof openedAt === "number" ? { root, openedAt } : null;
}

export async function readStore(storePath: string): Promise<ProjectsStore> {
	if (!existsSync(storePath)) return EMPTY_STORE;
	const value: unknown = JSON.parse(await readFile(storePath, "utf8"));
	if (!value || typeof value !== "object") return EMPTY_STORE;
	const { openRoot, projects } = value as Record<string, unknown>;
	return {
		openRoot: readText(openRoot),
		projects: Array.isArray(projects)
			? projects.map(readStoredProject).filter((project): project is StoredProject => project !== null)
			: [],
	};
}

async function writeStore(storePath: string, store: ProjectsStore): Promise<void> {
	await mkdir(dirname(storePath), { recursive: true });
	await writeFile(storePath, `${JSON.stringify(store, null, "\t")}\n`);
}

export async function readRoots(storePath: string, home: string): Promise<SkillRoots> {
	const store = await readStore(storePath);
	if (!store.openRoot || !isFolder(store.openRoot)) throw new Error("Open a project folder first.");
	return { project: store.openRoot, home };
}

function summarize({ root, openedAt }: StoredProject): Project {
	return { root, name: basename(root), openedAt, isAvailable: isFolder(root) };
}

export async function assertRecentProject(storePath: string, root: string): Promise<void> {
	const store = await readStore(storePath);
	if (!store.projects.some((project) => project.root === root)) throw new Error(`Not a recent project: ${root}`);
}

export async function readWorkspace(storePath: string, home: string): Promise<Workspace> {
	const store = await readStore(storePath);
	const projects = store.projects.map(summarize);
	const open = projects.find((project) => project.root === store.openRoot && project.isAvailable);
	return {
		projects,
		project: open ? { ...open, skills: await listSkills({ project: open.root, home }) } : null,
	};
}

export async function openProject(storePath: string, home: string, root: string): Promise<Workspace> {
	if (!isFolder(root)) throw new Error(`Folder not found: ${root}`);
	const realRoot = realpathSync(root);
	const store = await readStore(storePath);
	await writeStore(storePath, {
		...store,
		openRoot: realRoot,
		projects: [{ root: realRoot, openedAt: Date.now() }, ...store.projects.filter((project) => project.root !== realRoot)],
	});
	return readWorkspace(storePath, home);
}

export async function removeProject(storePath: string, home: string, root: string): Promise<Workspace> {
	const store = await readStore(storePath);
	await writeStore(storePath, {
		...store,
		openRoot: store.openRoot === root ? null : store.openRoot,
		projects: store.projects.filter((project) => project.root !== root),
	});
	return readWorkspace(storePath, home);
}
