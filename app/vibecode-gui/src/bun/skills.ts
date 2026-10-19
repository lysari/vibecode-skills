import { existsSync, realpathSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { Skill, SkillCreate, SkillFile, SkillForm, SkillLibrary } from "../shared/skill.interface";

const SKILL_FILE = "SKILL.md";
const DEFAULT_SOURCE = join(".claude", "skills");
const SKIPPED_DIRS = new Set(["node_modules", ".git", ".devbox", ".hutch", "dist", "build"]);
const SKIPPED_ROOT_DIRS = new Set(["app"]);
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/;
const MAX_PREVIEW_BYTES = 512 * 1024;

function findRepoRoot(): string {
	for (const start of [import.meta.dir, process.cwd()]) {
		for (let dir = start; dirname(dir) !== dir; dir = dirname(dir)) {
			if (existsSync(join(dir, DEFAULT_SOURCE))) return realpathSync(dir);
		}
	}
	throw new Error(`No ${DEFAULT_SOURCE} folder found above the app.`);
}

export const repoRoot = findRepoRoot();

function isInside(parent: string, child: string): boolean {
	const rel = relative(parent, child);
	return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function resolveInRoot(path: string): string {
	const absolute = resolve(repoRoot, path);
	const real = existsSync(absolute) ? realpathSync(absolute) : absolute;
	if (!isInside(repoRoot, real)) {
		throw new Error(`Path is outside the skills repository: ${path}`);
	}
	return real;
}

function resolveSkillDir(dir: string): string {
	const absolute = resolveInRoot(dir);
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

async function findSkillDirs(dir: string, found: string[]): Promise<void> {
	const entries = await readdir(dir, { withFileTypes: true });
	if (entries.some((entry) => entry.isFile() && entry.name === SKILL_FILE)) {
		found.push(dir);
		return;
	}
	for (const entry of entries) {
		if (!entry.isDirectory() || SKIPPED_DIRS.has(entry.name)) continue;
		if (dir === repoRoot && SKIPPED_ROOT_DIRS.has(entry.name)) continue;
		await findSkillDirs(join(dir, entry.name), found);
	}
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

async function readSkill(skillDir: string): Promise<Skill> {
	const path = join(skillDir, SKILL_FILE);
	const text = await readFile(path, "utf8");
	const { frontmatter, body } = splitSkillFile(text);
	const fields = parseFrontmatter(frontmatter) ?? readTopLevelLines(frontmatter);
	const metadata = fields.metadata;
	const version =
		metadata && typeof metadata === "object" ? textField(metadata as Record<string, unknown>, "version") : "";
	return {
		dir: relative(repoRoot, skillDir),
		source: relative(repoRoot, dirname(skillDir)) || ".",
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
	};
}

function mentionsSkill(text: string, name: string): boolean {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`).test(text);
}

export async function listSkills(): Promise<SkillLibrary> {
	const dirs: string[] = [];
	await findSkillDirs(repoRoot, dirs);
	const skills = await Promise.all(dirs.map(readSkill));
	for (const skill of skills) {
		const text = `${skill.description}\n${skill.body}`;
		skill.references = skills
			.filter((other) => other !== skill && other.name && mentionsSkill(text, other.name))
			.map((other) => other.dir);
	}
	skills.sort((a, b) => (a.name || a.dir).localeCompare(b.name || b.dir));
	const sources = [...new Set([DEFAULT_SOURCE, ...skills.map((skill) => skill.source)])].sort();
	return { root: basename(repoRoot), sources, skills };
}

export async function readSkillFile({ dir, path }: { dir: string; path: string }): Promise<string> {
	const skillDir = resolveSkillDir(dir);
	const file = resolve(skillDir, path);
	const real = existsSync(file) ? realpathSync(file) : file;
	if (!isInside(skillDir, real)) throw new Error(`File is outside the skill folder: ${path}`);
	if ((await stat(real)).size > MAX_PREVIEW_BYTES) throw new Error("File is too large to preview.");
	return readFile(real, "utf8");
}

export async function saveSkill({ dir, form }: { dir: string; form: SkillForm }): Promise<SkillLibrary> {
	const skillDir = resolveSkillDir(dir);
	if (!parseFrontmatter(form.frontmatter)) throw new Error("Frontmatter is not valid YAML.");
	await writeFile(join(skillDir, SKILL_FILE), joinSkillFile(form));
	return listSkills();
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

export async function createSkill(create: SkillCreate): Promise<SkillLibrary> {
	assertSkillName(create.name);
	const description = create.description.trim();
	if (!description) throw new Error("Add a description so agents know when to use the skill.");
	const sourceDir = create.source === "." ? repoRoot : resolveInRoot(create.source);
	const skillDir = join(sourceDir, create.name);
	if (existsSync(skillDir)) throw new Error(`A folder named ${create.name} already exists.`);
	await mkdir(skillDir, { recursive: true });
	await writeFile(join(skillDir, SKILL_FILE), joinSkillFile(skillTemplate({ ...create, description })));
	return listSkills();
}

export async function renameSkill({ dir, name }: { dir: string; name: string }): Promise<SkillLibrary> {
	assertSkillName(name);
	const skillDir = resolveSkillDir(dir);
	const target = join(dirname(skillDir), name);
	if (existsSync(target)) throw new Error(`A folder named ${name} already exists.`);
	await rename(skillDir, target);
	const { frontmatter, body } = splitSkillFile(await readFile(join(target, SKILL_FILE), "utf8"));
	const renamed = /^name:.*$/m.test(frontmatter)
		? frontmatter.replace(/^name:.*$/m, `name: ${name}`)
		: `name: ${name}\n${frontmatter}`;
	await writeFile(join(target, SKILL_FILE), joinSkillFile({ frontmatter: renamed, body }));
	return listSkills();
}

export async function deleteSkill({ dir }: { dir: string }): Promise<SkillLibrary> {
	await rm(resolveSkillDir(dir), { recursive: true });
	return listSkills();
}
