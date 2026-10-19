import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	countSkills,
	createSkill,
	defaultLibraryRoot,
	deleteSkill,
	installSkill,
	listSkills,
	readSkillFile,
	renameSkill,
	saveSkill,
	type SkillRoots,
} from "../../src/bun/skills";

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
	test("finds the repo's own skills when it is opened as a project, without issues", async () => {
		if (!defaultLibraryRoot) throw new Error("The tests run inside the skills repository.");
		const { skills } = await listSkills({ project: defaultLibraryRoot, library: defaultLibraryRoot });
		const vibecode = skills.find((skill) => skill.name === "vibecode");
		expect(vibecode?.dir).toBe(join(defaultLibraryRoot, ".claude/skills/vibecode"));
		expect(vibecode?.scope).toBe("project");
		expect(vibecode?.files.some((file) => file.path.startsWith("references/"))).toBe(true);
		expect(skills.find((skill) => skill.name === "vibecode-review")?.references).toContain(vibecode?.dir);
		expect(skills.filter((skill) => skill.issues.length > 0).map((skill) => skill.dir)).toEqual([]);
		expect(skills.every((skill) => skill.scope === "project")).toBe(true);
	});

	test("finds project skills in agent skill folders and nested packages, skipping dependency and build folders", async () => {
		await writeSkill(roots.project, ".claude/skills", "claude-skill", "");
		await writeSkill(roots.project, ".agents/skills", "agents-skill", "");
		await writeSkill(roots.project, "packages/web/.cursor/skills", "nested-skill", "");
		await writeSkill(roots.project, "node_modules/pkg/.claude/skills", "dependency-skill", "");
		await writeSkill(roots.project, "build/.claude/skills", "build-skill", "");
		await writeSkill(roots.project, "docs", "loose-skill", "");
		const { sources, skills } = await listSkills(roots);
		expect(skills.map((skill) => skill.name)).toEqual(["agents-skill", "claude-skill", "nested-skill"]);
		expect(sources).toEqual([".agents/skills", ".claude/skills", "packages/web/.cursor/skills"]);
		expect(await countSkills(roots.project)).toBe(3);
	});

	test("links project skills to each other and to library skills the project does not have", async () => {
		await writeSkill(roots.project, ".claude/skills", "caller", "Run `helper`, `shared` and `library-only`.");
		await writeSkill(roots.project, ".claude/skills", "helper", "");
		await writeSkill(roots.project, ".claude/skills", "shared", "");
		await writeSkill(roots.library ?? "", ".claude/skills", "shared", "Run `library-only`.");
		await writeSkill(roots.library ?? "", ".claude/skills", "library-only", "");
		const { skills } = await listSkills(roots);
		const caller = skills.find((skill) => skill.name === "caller");
		expect(caller?.references.sort()).toEqual([librarySkill("library-only"), projectSkill("helper"), projectSkill("shared")]);
		const libraryShared = skills.find((skill) => skill.scope === "library" && skill.name === "shared");
		expect(libraryShared?.references).toEqual([librarySkill("library-only")]);
	});

	test("lists no library skills when the project is the library", async () => {
		await writeSkill(roots.project, ".claude/skills", "own", "");
		const { skills } = await listSkills({ project: roots.project, library: roots.project });
		expect(skills.map((skill) => skill.scope)).toEqual(["project"]);
	});
});

describe("install status", () => {
	test("compares metadata versions when both copies have one", async () => {
		await writeSkill(roots.library ?? "", ".claude/skills", "same", "Library text.", "1.0.0");
		await writeSkill(roots.project, ".claude/skills", "same", "Edited text.", "1.0.0");
		await writeSkill(roots.library ?? "", ".claude/skills", "newer", "", "2.0.0");
		await writeSkill(roots.project, ".claude/skills", "newer", "", "1.0.0");
		await writeSkill(roots.library ?? "", ".claude/skills", "missing", "", "1.0.0");
		const { skills } = await listSkills(roots);
		const install = (name: string) => skills.find((skill) => skill.scope === "library" && skill.name === name)?.install;
		expect(install("same")).toBe("installed");
		expect(install("newer")).toBe("outdated");
		expect(install("missing")).toBe("available");
		expect(skills.find((skill) => skill.scope === "project")?.install).toBeNull();
	});

	test("compares the folder contents when a copy has no version", async () => {
		await writeSkill(roots.library ?? "", ".claude/skills", "plain", "Text.");
		await writeSkill(roots.project, ".claude/skills", "plain", "Text.");
		await writeFile(join(librarySkill("plain"), "notes.md"), "Notes");
		await writeFile(join(projectSkill("plain"), "notes.md"), "Notes");
		const read = async () => (await listSkills(roots)).skills.find((skill) => skill.scope === "library")?.install;
		expect(await read()).toBe("installed");
		await writeFile(join(projectSkill("plain"), "notes.md"), "Changed notes");
		expect(await read()).toBe("outdated");
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
		expect((await listSkills(roots)).skills.find((skill) => skill.scope === "library")?.install).toBe("installed");
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

describe("renameSkill", () => {
	test("renames the explicit mentions in other project skills when asked", async () => {
		await writeSkill(roots.project, ".claude/skills", "gui-test-target", "# Target\n");
		await writeSkill(roots.project, ".claude/skills", "gui-test-caller", "Run `gui-test-target` or /gui-test-target. The gui-test-target word stays.\n");
		await renameSkill(roots, { dir: projectSkill("gui-test-target"), name: "gui-test-renamed", shouldRenameMentions: true });
		const caller = await readFile(join(projectSkill("gui-test-caller"), "SKILL.md"), "utf8");
		expect(caller).toContain("Run `gui-test-renamed` or /gui-test-renamed. The gui-test-target word stays.");
		const { skills } = await listSkills(roots);
		expect(skills.find((skill) => skill.name === "gui-test-caller")?.references).toEqual([projectSkill("gui-test-renamed")]);
		expect(existsSync(projectSkill("gui-test-target"))).toBe(false);
	});

	test("leaves other skills unchanged when not asked", async () => {
		await writeSkill(roots.project, ".claude/skills", "gui-test-target", "# Target\n");
		await writeSkill(roots.project, ".claude/skills", "gui-test-caller", "Run `gui-test-target`.\n");
		await renameSkill(roots, { dir: projectSkill("gui-test-target"), name: "gui-test-renamed", shouldRenameMentions: false });
		expect(await readFile(join(projectSkill("gui-test-renamed"), "SKILL.md"), "utf8")).toContain("name: gui-test-renamed");
		expect(await readFile(join(projectSkill("gui-test-caller"), "SKILL.md"), "utf8")).toContain("Run `gui-test-target`.");
	});
});

describe("createSkill and deleteSkill", () => {
	test("creates a skill from the template in a project skill folder", async () => {
		await createSkill(roots.project, { source: ".claude/skills", name: "fresh", description: "Use when testing." });
		expect(await readFile(join(projectSkill("fresh"), "SKILL.md"), "utf8")).toContain("name: fresh");
	});

	test("moves the skill folder to the Trash", async () => {
		await writeSkill(roots.project, ".claude/skills", "gui-test-trash", "");
		const trashed: string[] = [];
		await deleteSkill(roots.project, { dir: projectSkill("gui-test-trash") }, (path) => trashed.push(path) > 0);
		expect(trashed).toEqual([projectSkill("gui-test-trash")]);
	});

	test("reports a failed move to the Trash", async () => {
		await writeSkill(roots.project, ".claude/skills", "gui-test-trash", "");
		await expect(deleteSkill(roots.project, { dir: projectSkill("gui-test-trash") }, neverTrash)).rejects.toThrow("Could not move");
		expect(existsSync(join(projectSkill("gui-test-trash"), "SKILL.md"))).toBe(true);
	});
});

describe("path guards", () => {
	test("reads files of project and library skills, but nothing outside the skill folder", async () => {
		await writeSkill(roots.project, ".claude/skills", "own", "");
		await writeFile(join(projectSkill("own"), "notes.md"), "Project notes");
		await writeSkill(roots.library ?? "", ".claude/skills", "ours", "");
		await writeFile(join(librarySkill("ours"), "notes.md"), "Library notes");
		expect(await readSkillFile(roots, { dir: projectSkill("own"), path: "notes.md" })).toBe("Project notes");
		expect(await readSkillFile(roots, { dir: librarySkill("ours"), path: "notes.md" })).toBe("Library notes");
		await expect(readSkillFile(roots, { dir: projectSkill("own"), path: "../../../../library/.claude/skills/ours/notes.md" })).rejects.toThrow(
			"outside the skill folder",
		);
	});

	test("rejects reading a skill outside the project and the library", async () => {
		const other = await writeSkill(tempRoot, "other/.claude/skills", "foreign", "");
		await expect(readSkillFile(roots, { dir: other, path: "SKILL.md" })).rejects.toThrow("outside the project and the skill library");
	});

	test("rejects writing to library skills and to folders outside the project", async () => {
		const ours = await writeSkill(roots.library ?? "", ".claude/skills", "ours", "");
		const form = { frontmatter: "name: ours", body: "" };
		await expect(saveSkill(roots.project, { dir: ours, form })).rejects.toThrow("outside");
		await expect(deleteSkill(roots.project, { dir: ours }, neverTrash)).rejects.toThrow("outside");
		await expect(renameSkill(roots, { dir: ours, name: "renamed", shouldRenameMentions: false })).rejects.toThrow("outside");
		await expect(createSkill(roots.project, { source: "../library/.claude/skills", name: "x", description: "y" })).rejects.toThrow("outside");
		await expect(saveSkill(roots.project, { dir: "/tmp", form })).rejects.toThrow("outside");
		expect(await readFile(join(ours, "SKILL.md"), "utf8")).toContain("Temporary test skill.");
	});

	test("rejects writing through a symlink that leaves the project", async () => {
		await mkdir(join(tempRoot, "outside"));
		await symlink(join(tempRoot, "outside"), join(roots.project, ".claude"));
		await expect(createSkill(roots.project, { source: ".claude/skills", name: "escape", description: "y" })).rejects.toThrow("outside");
		const source = await writeSkill(roots.library ?? "", ".claude/skills", "tool", "");
		await expect(installSkill(roots, { dir: source }, neverTrash)).rejects.toThrow("outside");
		expect(existsSync(join(tempRoot, "outside", "skills"))).toBe(false);
	});

	test("installs only from the library", async () => {
		await writeSkill(roots.project, ".claude/skills", "own", "");
		await expect(installSkill(roots, { dir: projectSkill("own") }, neverTrash)).rejects.toThrow("outside");
	});

	test("rejects folders that are not skills", async () => {
		await mkdir(join(roots.project, ".claude/skills"), { recursive: true });
		await expect(deleteSkill(roots.project, { dir: join(roots.project, ".claude/skills") }, neverTrash)).rejects.toThrow("No SKILL.md");
	});

	test("rejects names that could escape the folder", async () => {
		await writeSkill(roots.project, ".claude/skills", "own", "");
		await expect(renameSkill(roots, { dir: projectSkill("own"), name: "../escape", shouldRenameMentions: false })).rejects.toThrow("lowercase");
	});

	test("rejects invalid YAML before writing", async () => {
		await writeSkill(roots.project, ".claude/skills", "own", "");
		await expect(saveSkill(roots.project, { dir: projectSkill("own"), form: { frontmatter: "name: [unclosed", body: "" } })).rejects.toThrow(
			"not valid YAML",
		);
	});
});
