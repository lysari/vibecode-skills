import { existsSync, realpathSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { basename, isAbsolute, join, relative, sep } from "node:path";
import { GLOBAL_SKILL_FOLDERS, type Skill } from "../shared/interfaces/skill.interface";

const SKILL_FILE = "SKILL.md";
const SKILL_SOURCES = [
	join(".claude", "skills"),
	join(".agents", "skills"),
	join(".codex", "skills"),
	join(".cursor", "skills"),
	join(".github", "skills"),
	join(".gemini", "skills"),
	join(".opencode", "skills"),
	join(".windsurf", "skills"),
];
const MAX_SCAN_DEPTH = 3;
const SKIPPED_DIRS = new Set(["node_modules", ".git", ".devbox", ".hutch", "dist", "build"]);
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export interface SkillRoots {
	project: string;
	home: string;
}

function isInside(parent: string, child: string): boolean {
	const rel = relative(parent, child);
	return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function parseFrontmatter(frontmatter: string): Record<string, unknown> | null {
	try {
		const value: unknown = Bun.YAML.parse(frontmatter);
		return value && typeof value === "object" && !Array.isArray(value)
			? (value as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

function readTopLevelLines(frontmatter: string): Record<string, unknown> {
	return Object.fromEntries([...frontmatter.matchAll(/^([\w-]+):[ \t]*(.+)$/gm)].map((match) => [match[1], match[2]]));
}

function textField(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	return typeof value === "string" ? value.trim() : "";
}

// Skill folders are often symlinks (e.g. ~/.claude/skills/<name> into a skills repository), which a Dirent reports as links, not folders.
async function listSourceSkillDirs(sourceDir: string): Promise<string[]> {
	if (!existsSync(sourceDir)) return [];
	const entries = await readdir(sourceDir, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
		.map((entry) => join(sourceDir, entry.name))
		.filter((dir) => existsSync(join(dir, SKILL_FILE)));
}

// A project skill reached through a symlink that leaves the project is not the project's own, so it is skipped.
async function findProjectSkillDirs(root: string, dir = root, depth = 0): Promise<string[]> {
	const found: string[] = [];
	for (const source of SKILL_SOURCES) {
		found.push(...(await listSourceSkillDirs(join(dir, source))).filter((skillDir) => isInside(root, realpathSync(skillDir))));
	}
	if (depth === MAX_SCAN_DEPTH) return found;
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith(".") || SKIPPED_DIRS.has(entry.name)) continue;
		found.push(...(await findProjectSkillDirs(root, join(dir, entry.name), depth + 1)));
	}
	return found;
}

interface SkillFrontmatter {
	name: string;
	description: string;
}

async function readFrontmatter(skillDir: string): Promise<SkillFrontmatter> {
	const text = await readFile(join(skillDir, SKILL_FILE), "utf8");
	const frontmatter = FRONTMATTER.exec(text)?.[1] ?? "";
	const fields = parseFrontmatter(frontmatter) ?? readTopLevelLines(frontmatter);
	return {
		name: textField(fields, "name") || basename(skillDir),
		description: textField(fields, "description"),
	};
}

export async function listSkills({ project, home }: SkillRoots): Promise<Skill[]> {
	const skills = new Map<string, Skill>();
	for (const dir of await findProjectSkillDirs(project)) {
		const { name, description } = await readFrontmatter(dir);
		if (!skills.has(name)) skills.set(name, { name, description, source: "project", globalFolders: [] });
	}
	for (const folder of GLOBAL_SKILL_FOLDERS) {
		for (const dir of await listSourceSkillDirs(join(home, folder))) {
			const { name, description } = await readFrontmatter(dir);
			const known = skills.get(name);
			if (!known) skills.set(name, { name, description, source: "global", globalFolders: [folder] });
			else if (!known.globalFolders.includes(folder)) known.globalFolders.push(folder);
		}
	}
	return [...skills.values()].sort((a, b) => a.name.localeCompare(b.name));
}
