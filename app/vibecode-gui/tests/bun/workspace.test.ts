import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertRecentProject, openProject, readRoots, readStore, readWorkspace, removeProject } from "../../src/bun/workspace";

let tempRoot = "";
let storePath = "";
let home = "";

async function makeProject(name: string, skillNames: string[] = []): Promise<string> {
	const root = join(tempRoot, name);
	for (const skill of skillNames) {
		await mkdir(join(root, ".claude/skills", skill), { recursive: true });
		await writeFile(join(root, ".claude/skills", skill, "SKILL.md"), `---\nname: ${skill}\ndescription: Test.\n---\n`);
	}
	await mkdir(root, { recursive: true });
	return root;
}

beforeEach(async () => {
	tempRoot = realpathSync(await mkdtemp(join(tmpdir(), "vibecode-gui-store-")));
	storePath = join(tempRoot, "user-data", "projects.json");
	home = await makeProject("home");
	await mkdir(join(home, ".claude/skills/ours"), { recursive: true });
	await writeFile(join(home, ".claude/skills/ours/SKILL.md"), "---\nname: ours\ndescription: Test.\n---\n");
});

afterEach(() => rm(tempRoot, { recursive: true, force: true }));

describe("projects store", () => {
	test("reads a missing store file as empty", async () => {
		expect(await readStore(join(tempRoot, "none.json"))).toEqual({ openRoot: null, projects: [] });
	});

	test("ignores malformed entries and the old library folder setting in the store file", async () => {
		await mkdir(join(tempRoot, "user-data"));
		await writeFile(storePath, JSON.stringify({ libraryRoot: "/lib", openRoot: "/x", projects: [{ root: "/a", openedAt: 1 }, { root: 2 }] }));
		expect(await readStore(storePath)).toEqual({
			openRoot: "/x",
			projects: [{ root: "/a", openedAt: 1 }],
		});
	});

	test("opening a project adds it to the top of the recents and reopens it on the next launch", async () => {
		const first = await makeProject("first", ["alpha", "beta"]);
		const second = await makeProject("second");
		await openProject(storePath, home, first);
		const workspace = await openProject(storePath, home, second);
		expect(workspace.projects.map((project) => project.root)).toEqual([second, first]);
		expect(workspace.project?.root).toBe(second);
		const reopened = await openProject(storePath, home, first);
		expect(reopened.projects.map((project) => project.name)).toEqual(["first", "second"]);
		const launch = await readWorkspace(storePath, home);
		expect(launch.project?.name).toBe("first");
		expect(launch.project?.skills.map((skill) => `${skill.name}:${skill.source}`)).toEqual(["alpha:project", "beta:project", "ours:global"]);
		expect(JSON.parse(await readFile(storePath, "utf8")).openRoot).toBe(first);
	});

	test("shows a moved or deleted project as unavailable and opens nothing", async () => {
		const gone = await makeProject("gone", ["alpha"]);
		await openProject(storePath, home, gone);
		await rm(gone, { recursive: true });
		const workspace = await readWorkspace(storePath, home);
		expect(workspace.project).toBeNull();
		expect(workspace.projects).toEqual([expect.objectContaining({ root: gone, isAvailable: false })]);
		await expect(readRoots(storePath, home)).rejects.toThrow("Open a project folder first");
		await expect(openProject(storePath, home, gone)).rejects.toThrow("Folder not found");
	});

	test("removing a project only drops it from the list", async () => {
		const project = await makeProject("project", ["alpha"]);
		await openProject(storePath, home, project);
		const workspace = await removeProject(storePath, home, project);
		expect(workspace.projects).toEqual([]);
		expect(workspace.project).toBeNull();
		expect(existsSync(join(project, ".claude/skills/alpha/SKILL.md"))).toBe(true);
	});

	test("accepts sessions only for projects in the recent list", async () => {
		const project = await makeProject("project");
		await expect(assertRecentProject(storePath, project)).rejects.toThrow("Not a recent project");
		await openProject(storePath, home, project);
		await assertRecentProject(storePath, project);
	});

	test("drops the old library folder setting on the next write and reads skills from the open project and the home folder", async () => {
		const project = await makeProject("project");
		await mkdir(join(tempRoot, "user-data"));
		await writeFile(storePath, JSON.stringify({ libraryRoot: "/lib", openRoot: null, projects: [] }));
		await openProject(storePath, home, project);
		expect(JSON.parse(await readFile(storePath, "utf8"))).not.toHaveProperty("libraryRoot");
		expect(await readRoots(storePath, home)).toEqual({ project, home });
	});
});
