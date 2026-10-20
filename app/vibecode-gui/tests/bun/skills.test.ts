import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listSkills, type SkillRoots } from "../../src/bun/skills";

let tempRoot = "";
let roots: SkillRoots = { project: "", home: "" };

async function writeSkill(root: string, source: string, name: string, description = "Temporary test skill."): Promise<string> {
	const dir = join(root, source, name);
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: ${description}\n---\n`);
	return dir;
}

beforeEach(async () => {
	tempRoot = realpathSync(await mkdtemp(join(tmpdir(), "vibecode-gui-skills-")));
	roots = { project: join(tempRoot, "project"), home: join(tempRoot, "home") };
	await mkdir(roots.project);
	await mkdir(roots.home);
});

afterEach(() => rm(tempRoot, { recursive: true, force: true }));

describe("project skills", () => {
	test("finds skills in agent skill folders and nested packages, skipping dependency and build folders", async () => {
		await writeSkill(roots.project, ".claude/skills", "claude-skill");
		await writeSkill(roots.project, ".agents/skills", "agents-skill");
		await writeSkill(roots.project, "packages/web/.cursor/skills", "nested-skill");
		await writeSkill(roots.project, "node_modules/pkg/.claude/skills", "dependency-skill");
		await writeSkill(roots.project, "build/.claude/skills", "build-skill");
		await writeSkill(roots.project, "docs", "loose-skill");
		const skills = await listSkills(roots);
		expect(skills.map((skill) => skill.name)).toEqual(["agents-skill", "claude-skill", "nested-skill"]);
		expect(skills.every((skill) => skill.source === "project" && skill.globalFolders.length === 0)).toBe(true);
	});

	test("skips a skill reached through a symlink that leaves the project", async () => {
		const outside = await writeSkill(tempRoot, "outside", "foreign");
		await mkdir(join(roots.project, ".claude/skills"), { recursive: true });
		await symlink(outside, join(roots.project, ".claude/skills/foreign"));
		await writeSkill(roots.project, "shared", "inside");
		await symlink(join(roots.project, "shared/inside"), join(roots.project, ".claude/skills/inside"));
		expect((await listSkills(roots)).map((skill) => skill.name)).toEqual(["inside"]);
	});

	test("lists nothing when neither the project nor the home folder has skills", async () => {
		expect(await listSkills(roots)).toEqual([]);
	});
});

describe("global skills", () => {
	test("reads every agent's global folder through symlinks and lists each name once with all its folders", async () => {
		const repo = await writeSkill(tempRoot, "repo/.claude/skills", "vibecode", "From the repo.");
		await mkdir(join(roots.home, ".claude/skills"), { recursive: true });
		await mkdir(join(roots.home, ".cursor/skills"), { recursive: true });
		await symlink(repo, join(roots.home, ".claude/skills/vibecode"));
		await symlink(repo, join(roots.home, ".cursor/skills/vibecode"));
		await writeSkill(roots.home, ".gemini/config/skills", "agy-skill");
		await writeSkill(roots.home, ".codex/skills", "codex-skill");
		await writeSkill(roots.home, ".unknown/skills", "unknown-skill");
		expect(await listSkills(roots)).toEqual([
			{ name: "agy-skill", description: "Temporary test skill.", source: "global", globalFolders: [".gemini/config/skills"] },
			{ name: "codex-skill", description: "Temporary test skill.", source: "global", globalFolders: [".codex/skills"] },
			{ name: "vibecode", description: "From the repo.", source: "global", globalFolders: [".claude/skills", ".cursor/skills"] },
		]);
	});

	test("lets a project skill win over a global one with the same name", async () => {
		await writeSkill(roots.home, ".claude/skills", "review", "Global copy.");
		await writeSkill(roots.project, ".claude/skills", "review", "Project copy.");
		expect(await listSkills(roots)).toEqual([
			{ name: "review", description: "Project copy.", source: "project", globalFolders: [".claude/skills"] },
		]);
	});

	test("skips folders without a SKILL.md and dangling links", async () => {
		await mkdir(join(roots.home, ".claude/skills/.trash/old"), { recursive: true });
		await writeFile(join(roots.home, ".claude/skills/.trash/old/SKILL.md"), "---\nname: old\n---\n");
		await symlink(join(tempRoot, "missing"), join(roots.home, ".claude/skills/gone"));
		await writeSkill(roots.home, ".claude/skills", "kept");
		expect((await listSkills(roots)).map((skill) => skill.name)).toEqual(["kept"]);
	});

	test("only reads: the project and home folders are left unchanged", async () => {
		await writeSkill(roots.home, ".claude/skills", "global-skill");
		await writeSkill(roots.project, ".claude/skills", "project-skill");
		const before = await readdir(tempRoot, { recursive: true });
		await listSkills(roots);
		expect((await readdir(tempRoot, { recursive: true })).sort()).toEqual(before.sort());
	});
});
