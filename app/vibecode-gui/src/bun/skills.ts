import { existsSync, realpathSync } from "node:fs";
import { cp, mkdir, readFile, readdir } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { Skill, SkillInstall } from "../shared/skill.interface";

const SKILL_FILE = "SKILL.md";
const DEFAULT_SOURCE = join(".claude", "skills");
// The folders agent tools read skills from, as `<folder>/<name>/SKILL.md`: Claude Code; Codex, Gemini CLI and
// OpenCode (`.agents`); then older Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode and Windsurf.
const SKILL_SOURCES = [
	DEFAULT_SOURCE,
	join(".agents", "skills"),
	join(".codex", "skills"),
	join(".cursor", "skills"),
	join(".github", "skills"),
	join(".gemini", "skills"),
	join(".opencode", "skills"),
	join(".windsurf", "skills"),
];
// Skill folders are also found in nested packages of a monorepo, down to this many folders below the root.
const MAX_SCAN_DEPTH = 3;
const SKIPPED_DIRS = new Set(["node_modules", ".git", ".devbox", ".hutch", "dist", "build"]);
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export interface SkillRoots {
	project: string;
	library: string | null;
}

function findRepoRoot(): string | null {
	for (const start of [import.meta.dir, process.cwd()]) {
		for (let dir = start; dirname(dir) !== dir; dir = dirname(dir)) {
			if (existsSync(join(dir, DEFAULT_SOURCE))) return realpathSync(dir);
		}
	}
	return null;
}

/** The skills repository the app runs from in development; a packaged app has none and uses the library folder from Settings. */
export const defaultLibraryRoot = findRepoRoot();

function isInside(parent: string, child: string): boolean {
	const rel = relative(parent, child);
	return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

// The nearest existing ancestor is resolved, so a symlink above a folder that does not exist yet is checked too.
function realPath(path: string): string {
	if (existsSync(path)) return realpathSync(path);
	const parent = dirname(path);
	return parent === path ? path : join(realPath(parent), basename(path));
}

function resolveInRoot(root: string, path: string): string {
	const real = realPath(resolve(root, path));
	if (!isInside(root, real)) throw new Error(`Path is outside ${root}: ${path}`);
	return real;
}

function resolveSkillDir(root: string, dir: string): string {
	const absolute = resolveInRoot(root, dir);
	if (!existsSync(join(absolute, SKILL_FILE))) throw new Error(`No ${SKILL_FILE} in ${dir}`);
	return absolute;
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

async function listSourceSkillDirs(root: string, sourceDir: string): Promise<string[]> {
	if (!existsSync(sourceDir) || !isInside(root, realpathSync(sourceDir))) return [];
	const entries = await readdir(sourceDir, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isDirectory() && existsSync(join(sourceDir, entry.name, SKILL_FILE)))
		.map((entry) => join(sourceDir, entry.name));
}

async function findSkillDirs(root: string, dir = root, depth = 0): Promise<string[]> {
	const found: string[] = [];
	for (const source of SKILL_SOURCES) found.push(...(await listSourceSkillDirs(root, join(dir, source))));
	if (depth === MAX_SCAN_DEPTH) return found;
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith(".") || SKIPPED_DIRS.has(entry.name)) continue;
		found.push(...(await findSkillDirs(root, join(dir, entry.name), depth + 1)));
	}
	return found;
}

/** Paths of every file in a skill folder, relative to it, in a stable order. */
async function listSkillFiles(skillDir: string, dir = skillDir): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory() && !SKIPPED_DIRS.has(entry.name)) files.push(...(await listSkillFiles(skillDir, path)));
		else if (entry.isFile()) files.push(relative(skillDir, path));
	}
	return files.sort();
}

/** The fields of a skill's SKILL.md frontmatter the app shows. */
interface SkillFrontmatter {
	name: string;
	description: string;
	version: string | null;
}

async function readFrontmatter(skillDir: string): Promise<SkillFrontmatter> {
	const text = await readFile(join(skillDir, SKILL_FILE), "utf8");
	const frontmatter = FRONTMATTER.exec(text)?.[1] ?? "";
	const fields = parseFrontmatter(frontmatter) ?? readTopLevelLines(frontmatter);
	const metadata = fields.metadata;
	const version =
		metadata && typeof metadata === "object" ? textField(metadata as Record<string, unknown>, "version") : "";
	return {
		name: textField(fields, "name") || basename(skillDir),
		description: textField(fields, "description"),
		version: version || null,
	};
}

async function hashSkillFolder(skillDir: string): Promise<string> {
	const hasher = new Bun.CryptoHasher("sha256");
	for (const path of await listSkillFiles(skillDir)) {
		hasher.update(`${path}\0`);
		hasher.update(await readFile(join(skillDir, path)));
		hasher.update("\0");
	}
	return hasher.digest("hex");
}

function installedCopyDir(projectRoot: string, librarySkillDir: string): string {
	return join(projectRoot, DEFAULT_SOURCE, basename(librarySkillDir));
}

/** Compares a library skill with its copy in the project's `.claude/skills`: by `metadata.version` when both have one, else by content. */
async function readInstall(skillDir: string, version: string | null, projectRoot: string): Promise<SkillInstall> {
	const copyDir = installedCopyDir(projectRoot, skillDir);
	// A copy reached through a symlink that leaves the project is not the project's own.
	if (!existsSync(join(copyDir, SKILL_FILE)) || !isInside(projectRoot, realpathSync(copyDir))) return "available";
	const realCopyDir = realpathSync(copyDir);
	const copyVersion = (await readFrontmatter(realCopyDir)).version;
	const isSame =
		version && copyVersion
			? version === copyVersion
			: (await hashSkillFolder(skillDir)) === (await hashSkillFolder(realCopyDir));
	return isSame ? "installed" : "outdated";
}

/** Reads the library's skills, each with its install state in the project. */
export async function listSkills({ project, library }: SkillRoots): Promise<Skill[]> {
	if (!library || !existsSync(library)) return [];
	const skills = await Promise.all(
		(await findSkillDirs(library)).map(async (dir): Promise<Skill> => {
			const frontmatter = await readFrontmatter(dir);
			return { dir, ...frontmatter, install: await readInstall(dir, frontmatter.version, project) };
		}),
	);
	return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/** Copies a library skill folder to the project's `.claude/skills`, moving an existing copy to the Trash first. */
export async function installSkill(
	{ project, library }: SkillRoots,
	{ dir }: { dir: string },
	moveToTrash: (path: string) => boolean,
): Promise<void> {
	if (!library) throw new Error("Choose a skill library folder in Settings first.");
	const source = resolveSkillDir(library, dir);
	const target = resolveInRoot(project, installedCopyDir(project, source));
	if (target === source) throw new Error("This project is the skill library.");
	if (existsSync(target) && !moveToTrash(target)) throw new Error(`Could not move ${target} to the Trash.`);
	await mkdir(dirname(target), { recursive: true });
	await cp(source, target, { recursive: true });
}
