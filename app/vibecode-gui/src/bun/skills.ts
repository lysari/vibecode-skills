import { existsSync, realpathSync } from "node:fs";
import { cp, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { Skill, SkillCreate, SkillFile, SkillForm, SkillInstall, SkillRename, SkillScope } from "../shared/skill.interface";
import { mentionsSkill, renameSkillMentions } from "../shared/skill-links";

const SKILL_FILE = "SKILL.md";
const DEFAULT_SOURCE = join(".claude", "skills");
// The folders agent tools read project skills from, as `<folder>/<name>/SKILL.md`: Claude Code; Codex, Gemini CLI and
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
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/;
const MAX_PREVIEW_BYTES = 512 * 1024;

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

function assertSkillName(name: string): void {
	if (!SKILL_NAME.test(name)) {
		throw new Error("Use lowercase letters, digits and single hyphens, e.g. my-skill.");
	}
}

function splitSkillFile(text: string): { frontmatter: string; body: string } {
	const match = FRONTMATTER.exec(text);
	return match ? { frontmatter: match[1], body: match[2] } : { frontmatter: "", body: text };
}

function joinSkillFile(form: SkillForm): string {
	return `---\n${form.frontmatter}\n---\n${form.body}`;
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

async function listSkillFiles(skillDir: string, dir = skillDir): Promise<SkillFile[]> {
	const files: SkillFile[] = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory() && !SKIPPED_DIRS.has(entry.name)) {
			files.push(...(await listSkillFiles(skillDir, path)));
		} else if (entry.isFile() && path !== join(skillDir, SKILL_FILE)) {
			files.push({ path: relative(skillDir, path), size: (await stat(path)).size });
		}
	}
	return files.sort((a, b) => a.path.localeCompare(b.path));
}

function findIssues(skillDir: string, frontmatter: string, fields: Record<string, unknown>): string[] {
	const issues: string[] = [];
	const name = textField(fields, "name");
	if (!frontmatter) issues.push("Missing YAML frontmatter");
	else if (!parseFrontmatter(frontmatter)) issues.push("Frontmatter is not valid YAML");
	if (!name) issues.push("Missing name");
	else if (name !== basename(skillDir)) {
		issues.push(`Name "${name}" does not match folder "${basename(skillDir)}"`);
	}
	if (!textField(fields, "description")) issues.push("Missing description");
	return issues;
}

async function readSkill(root: string, scope: SkillScope, skillDir: string): Promise<Skill> {
	const path = join(skillDir, SKILL_FILE);
	const text = await readFile(path, "utf8");
	const { frontmatter, body } = splitSkillFile(text);
	const fields = parseFrontmatter(frontmatter) ?? readTopLevelLines(frontmatter);
	const metadata = fields.metadata;
	const version =
		metadata && typeof metadata === "object" ? textField(metadata as Record<string, unknown>, "version") : "";
	return {
		dir: skillDir,
		scope,
		source: relative(root, dirname(skillDir)),
		name: textField(fields, "name"),
		description: textField(fields, "description"),
		version: version || null,
		frontmatter,
		body,
		files: await listSkillFiles(skillDir),
		lineCount: text.split("\n").length,
		modifiedAt: (await stat(path)).mtimeMs,
		references: [],
		issues: findIssues(skillDir, frontmatter, fields),
		install: null,
	};
}

async function readSkills(root: string, scope: SkillScope): Promise<Skill[]> {
	const skills = await Promise.all((await findSkillDirs(root)).map((dir) => readSkill(root, scope, dir)));
	return skills.sort((a, b) => (a.name || a.dir).localeCompare(b.name || b.dir));
}

function linkSkills(skills: Skill[], targets: Skill[]): void {
	for (const skill of skills) {
		const text = `${skill.description}\n${skill.body}`;
		skill.references = targets
			.filter((other) => other !== skill && other.name && mentionsSkill(text, other.name))
			.map((other) => other.dir);
	}
}

async function hashSkillFolder(skillDir: string): Promise<string> {
	const hasher = new Bun.CryptoHasher("sha256");
	for (const path of [SKILL_FILE, ...(await listSkillFiles(skillDir)).map((file) => file.path)]) {
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
async function readInstall(librarySkill: Skill, projectSkills: Skill[], projectRoot: string): Promise<SkillInstall> {
	const copyDir = installedCopyDir(projectRoot, librarySkill.dir);
	const copy = projectSkills.find((skill) => skill.dir === copyDir);
	if (!copy) return "available";
	const isSame =
		librarySkill.version && copy.version
			? librarySkill.version === copy.version
			: (await hashSkillFolder(librarySkill.dir)) === (await hashSkillFolder(copy.dir));
	return isSame ? "installed" : "outdated";
}

/** Reads the project's skills and, unless the project is the library itself, the library's skills after them. */
export async function listSkills({ project, library }: SkillRoots): Promise<{ sources: string[]; skills: Skill[] }> {
	const projectSkills = await readSkills(project, "project");
	const hasLibrary = library !== null && library !== project && existsSync(library);
	const librarySkills = hasLibrary ? await readSkills(library, "library") : [];
	const projectNames = new Set(projectSkills.map((skill) => skill.name));
	// A name links to the project's own skill first and to the library's only when the project has none by that name.
	linkSkills(projectSkills, [...projectSkills, ...librarySkills.filter((skill) => !projectNames.has(skill.name))]);
	linkSkills(librarySkills, librarySkills);
	for (const skill of librarySkills) skill.install = await readInstall(skill, projectSkills, project);
	const sources = [...new Set([DEFAULT_SOURCE, ...projectSkills.map((skill) => skill.source)])].sort();
	return { sources, skills: [...projectSkills, ...librarySkills] };
}

export async function countSkills(root: string): Promise<number> {
	return (await findSkillDirs(root)).length;
}

export async function readSkillFile({ project, library }: SkillRoots, { dir, path }: { dir: string; path: string }): Promise<string> {
	const root = [project, library].find((candidate) => candidate && isInside(candidate, realPath(dir)));
	if (!root) throw new Error(`Path is outside the project and the skill library: ${dir}`);
	const skillDir = resolveSkillDir(root, dir);
	const file = resolve(skillDir, path);
	const real = existsSync(file) ? realpathSync(file) : file;
	if (!isInside(skillDir, real)) throw new Error(`File is outside the skill folder: ${path}`);
	if ((await stat(real)).size > MAX_PREVIEW_BYTES) throw new Error("File is too large to preview.");
	return readFile(real, "utf8");
}

export async function saveSkill(projectRoot: string, { dir, form }: { dir: string; form: SkillForm }): Promise<void> {
	const skillFile = resolveInRoot(projectRoot, join(resolveSkillDir(projectRoot, dir), SKILL_FILE));
	if (!parseFrontmatter(form.frontmatter)) throw new Error("Frontmatter is not valid YAML.");
	await writeFile(skillFile, joinSkillFile(form));
}

function skillTemplate({ name, description }: SkillCreate): SkillForm {
	const title = name
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
	const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
	return {
		frontmatter: [
			`name: ${name}`,
			`description: ${JSON.stringify(description)}`,
			"metadata:",
			`  version: "0.0.1-${today}.1"`,
		].join("\n"),
		body: `\n# ${title}\n\n## Overview\n\n${description}\n\n## When to use\n\n- \n\n## Steps\n\n1. \n`,
	};
}

export async function createSkill(projectRoot: string, create: SkillCreate): Promise<void> {
	assertSkillName(create.name);
	const description = create.description.trim();
	if (!description) throw new Error("Add a description so agents know when to use the skill.");
	const skillDir = join(resolveInRoot(projectRoot, create.source), create.name);
	if (existsSync(skillDir)) throw new Error(`A folder named ${create.name} already exists.`);
	await mkdir(skillDir, { recursive: true });
	await writeFile(join(skillDir, SKILL_FILE), joinSkillFile(skillTemplate({ ...create, description })));
}

export async function renameSkill(roots: SkillRoots, { dir, name, shouldRenameMentions }: SkillRename): Promise<void> {
	assertSkillName(name);
	const skillDir = resolveSkillDir(roots.project, dir);
	const target = join(dirname(skillDir), name);
	if (existsSync(target)) throw new Error(`A folder named ${name} already exists.`);
	const { skills } = await listSkills(roots);
	const oldName = skills.find((skill) => skill.dir === skillDir)?.name ?? "";
	const mentioning =
		shouldRenameMentions && oldName
			? skills.filter((skill) => skill.scope === "project" && skill.references.includes(skillDir))
			: [];
	await rename(skillDir, target);
	const { frontmatter, body } = splitSkillFile(await readFile(join(target, SKILL_FILE), "utf8"));
	const renamed = /^name:.*$/m.test(frontmatter)
		? frontmatter.replace(/^name:.*$/m, `name: ${name}`)
		: `name: ${name}\n${frontmatter}`;
	await writeFile(join(target, SKILL_FILE), joinSkillFile({ frontmatter: renamed, body }));
	for (const other of mentioning) {
		const path = join(resolveSkillDir(roots.project, other.dir), SKILL_FILE);
		await writeFile(path, renameSkillMentions(await readFile(path, "utf8"), oldName, name));
	}
}

export async function deleteSkill(
	projectRoot: string,
	{ dir }: { dir: string },
	moveToTrash: (path: string) => boolean,
): Promise<void> {
	if (!moveToTrash(resolveSkillDir(projectRoot, dir))) throw new Error(`Could not move ${dir} to the Trash.`);
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
