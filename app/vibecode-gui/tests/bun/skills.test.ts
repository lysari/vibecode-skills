import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultLibraryRoot, installSkill, listSkills, type SkillRoots } from "../../src/bun/skills";

const neverTrash = () => false;
let tempRoot = "";
let roots: SkillRoots = { project: "", library: null };

async function writeSkill(root: string, source: string, name: string, body: string, version = ""): Promise<string> {
	const dir = join(root, source, name);
	await mkdir(dir, { recursive: true });
	const metadata = version ? `\nmetadata:\n  version: "${version}"` : "";
	await writeFile(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: Temporary test skill.${metadata}\n---\n${body}`);
	return dir;
}

function projectSkill(name: string): string {
	return join(roots.project, ".claude/skills", name);
}

function librarySkill(name: string): string {
	return join(roots.library ?? "", ".claude/skills", name);
}

beforeEach(async () => {
	tempRoot = realpathSync(await mkdtemp(join(tmpdir(), "vibecode-gui-skills-")));
	roots = { project: join(tempRoot, "project"), library: join(tempRoot, "library") };
	await mkdir(roots.project);
	await mkdir(join(roots.library ?? "", ".claude/skills"), { recursive: true });
});

afterEach(() => rm(tempRoot, { recursive: true, force: true }));

describe("listSkills", () => {
	test("reads the repo's own skills as the library, all installed when the repo is the project", async () => {
		if (!defaultLibraryRoot) throw new Error("The tests run inside the skills repository.");
		const skills = await listSkills({ project: defaultLibraryRoot, library: defaultLibraryRoot });
		const vibecode = skills.find((skill) => skill.name === "vibecode");
		expect(vibecode?.dir).toBe(join(defaultLibraryRoot, ".claude/skills/vibecode"));
		expect(skills.map((skill) => skill.name)).toContain("use-claude-code");
		expect(skills.every((skill) => skill.install === "installed")).toBe(true);
	});

	test("finds library skills in agent skill folders and nested packages, skipping dependency and build folders", async () => {
		const library = roots.library ?? "";
		await writeSkill(library, ".claude/skills", "claude-skill", "");
		await writeSkill(library, ".agents/skills", "agents-skill", "");
		await writeSkill(library, "packages/web/.cursor/skills", "nested-skill", "");
		await writeSkill(library, "node_modules/pkg/.claude/skills", "dependency-skill", "");
		await writeSkill(library, "build/.claude/skills", "build-skill", "");
		await writeSkill(library, "docs", "loose-skill", "");
		const skills = await listSkills(roots);
		expect(skills.map((skill) => skill.name)).toEqual(["agents-skill", "claude-skill", "nested-skill"]);
	});

	test("lists nothing without a library folder", async () => {
		expect(await listSkills({ project: roots.project, library: null })).toEqual([]);
		expect(await listSkills({ project: roots.project, library: join(tempRoot, "missing") })).toEqual([]);
	});
});

describe("install status", () => {
	const install = async (name: string) => (await listSkills(roots)).find((skill) => skill.name === name)?.install;

	test("compares metadata versions when both copies have one", async () => {
		await writeSkill(roots.library ?? "", ".claude/skills", "same", "Library text.", "1.0.0");
		await writeSkill(roots.project, ".claude/skills", "same", "Edited text.", "1.0.0");
		await writeSkill(roots.library ?? "", ".claude/skills", "newer", "", "2.0.0");
		await writeSkill(roots.project, ".claude/skills", "newer", "", "1.0.0");
		await writeSkill(roots.library ?? "", ".claude/skills", "missing", "", "1.0.0");
		expect(await install("same")).toBe("installed");
		expect(await install("newer")).toBe("outdated");
		expect(await install("missing")).toBe("available");
	});

	test("compares the folder contents when a copy has no version", async () => {
		await writeSkill(roots.library ?? "", ".claude/skills", "plain", "Text.");
		await writeSkill(roots.project, ".claude/skills", "plain", "Text.");
		await writeFile(join(librarySkill("plain"), "notes.md"), "Notes");
		await writeFile(join(projectSkill("plain"), "notes.md"), "Notes");
		expect(await install("plain")).toBe("installed");
		await writeFile(join(projectSkill("plain"), "notes.md"), "Changed notes");
		expect(await install("plain")).toBe("outdated");
	});

	test("does not count a copy reached through a symlink that leaves the project", async () => {
		await writeSkill(roots.library ?? "", ".claude/skills", "tool", "", "1.0.0");
		await writeSkill(tempRoot, "outside/skills", "tool", "", "1.0.0");
		await mkdir(join(roots.project, ".claude"));
		await symlink(join(tempRoot, "outside/skills"), join(roots.project, ".claude/skills"));
		expect(await install("tool")).toBe("available");
	});
});

describe("installSkill", () => {
	test("copies the whole library skill folder to the project's .claude/skills", async () => {
		const source = await writeSkill(roots.library ?? "", ".claude/skills", "tool", "", "1.0.0");
		await mkdir(join(source, "references"));
		await writeFile(join(source, "references", "guide.md"), "Guide");
		const trashed: string[] = [];
		await installSkill(roots, { dir: source }, (path) => trashed.push(path) > 0);
		expect(await readFile(join(projectSkill("tool"), "references", "guide.md"), "utf8")).toBe("Guide");
		expect(trashed).toEqual([]);
		expect((await listSkills(roots)).find((skill) => skill.name === "tool")?.install).toBe("installed");
	});

	test("moves an existing copy to the Trash before updating it", async () => {
		const source = await writeSkill(roots.library ?? "", ".claude/skills", "tool", "New text.", "2.0.0");
		await writeSkill(roots.project, ".claude/skills", "tool", "Old text.", "1.0.0");
		const trashed: string[] = [];
		await installSkill(roots, { dir: source }, (path) => {
			trashed.push(path);
			return true;
		});
		expect(trashed).toEqual([projectSkill("tool")]);
		expect(await readFile(join(projectSkill("tool"), "SKILL.md"), "utf8")).toContain("New text.");
	});

	test("keeps the existing copy when it cannot be moved to the Trash", async () => {
		const source = await writeSkill(roots.library ?? "", ".claude/skills", "tool", "New text.", "2.0.0");
		await writeSkill(roots.project, ".claude/skills", "tool", "Old text.", "1.0.0");
		await expect(installSkill(roots, { dir: source }, neverTrash)).rejects.toThrow("Could not move");
		expect(await readFile(join(projectSkill("tool"), "SKILL.md"), "utf8")).toContain("Old text.");
	});
});

describe("path guards", () => {
	test("rejects installing through a symlink that leaves the project", async () => {
		await mkdir(join(tempRoot, "outside"));
		await symlink(join(tempRoot, "outside"), join(roots.project, ".claude"));
		const source = await writeSkill(roots.library ?? "", ".claude/skills", "tool", "");
		await expect(installSkill(roots, { dir: source }, neverTrash)).rejects.toThrow("outside");
		expect(existsSync(join(tempRoot, "outside", "skills"))).toBe(false);
	});

	test("installs only from the library", async () => {
		await writeSkill(roots.project, ".claude/skills", "own", "");
		const other = await writeSkill(tempRoot, "other/.claude/skills", "foreign", "");
		await expect(installSkill(roots, { dir: projectSkill("own") }, neverTrash)).rejects.toThrow("outside");
		await expect(installSkill(roots, { dir: other }, neverTrash)).rejects.toThrow("outside");
		await expect(installSkill(roots, { dir: join(librarySkill("x"), "../../../../other/.claude/skills/foreign") }, neverTrash)).rejects.toThrow(
			"outside",
		);
	});

	test("rejects folders that are not skills", async () => {
		await expect(installSkill(roots, { dir: join(roots.library ?? "", ".claude/skills") }, neverTrash)).rejects.toThrow("No SKILL.md");
	});

	test("rejects installing when the project is the library", async () => {
		const source = await writeSkill(roots.library ?? "", ".claude/skills", "tool", "");
		await expect(installSkill({ project: roots.library ?? "", library: roots.library }, { dir: source }, neverTrash)).rejects.toThrow(
			"This project is the skill library",
		);
	});
});
