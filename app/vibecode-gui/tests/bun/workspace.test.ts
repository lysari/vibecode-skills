import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	assertRecentProject,
	openProject,
	readRoots,
	readStore,
	readWorkspace,
	removeProject,
	setLibraryRoot,
} from "../../src/bun/workspace";

let tempRoot = "";
let storePath = "";
let libraryRoot = "";

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
	libraryRoot = await makeProject("library", ["ours"]);
	await setLibraryRoot(storePath, libraryRoot);
});

afterEach(() => rm(tempRoot, { recursive: true, force: true }));

describe("projects store", () => {
	test("reads a missing store file as empty", async () => {
		expect(await readStore(join(tempRoot, "none.json"))).toEqual({ libraryRoot: null, openRoot: null, projects: [] });
	});

	test("ignores malformed entries in the store file", async () => {
		await writeFile(storePath, JSON.stringify({ libraryRoot: 3, openRoot: "/x", projects: [{ root: "/a", openedAt: 1 }, { root: 2 }] }));
		expect(await readStore(storePath)).toEqual({
			libraryRoot: null,
			openRoot: "/x",
			projects: [{ root: "/a", openedAt: 1 }],
		});
	});

	test("opening a project adds it to the top of the recents and reopens it on the next launch", async () => {
		const first = await makeProject("first", ["alpha", "beta"]);
		const second = await makeProject("second");
		await openProject(storePath, first);
		const workspace = await openProject(storePath, second);
		expect(workspace.projects.map((project) => project.root)).toEqual([second, first]);
		expect(workspace.project?.root).toBe(second);
		const reopened = await openProject(storePath, first);
		expect(reopened.projects.map((project) => project.name)).toEqual(["first", "second"]);
		const launch = await readWorkspace(storePath);
		expect(launch.project?.name).toBe("first");
		expect(launch.project?.skills.map((skill) => `${skill.name}:${skill.install}`)).toEqual(["ours:available"]);
		expect(launch.libraryRoot).toBe(libraryRoot);
		expect(JSON.parse(await readFile(storePath, "utf8")).openRoot).toBe(first);
	});

	test("shows a moved or deleted project as unavailable and opens nothing", async () => {
		const gone = await makeProject("gone", ["alpha"]);
		await openProject(storePath, gone);
		await rm(gone, { recursive: true });
		const workspace = await readWorkspace(storePath);
		expect(workspace.project).toBeNull();
		expect(workspace.projects).toEqual([expect.objectContaining({ root: gone, isAvailable: false })]);
		await expect(readRoots(storePath)).rejects.toThrow("Open a project folder first");
		await expect(openProject(storePath, gone)).rejects.toThrow("Folder not found");
	});

	test("removing a project only drops it from the list", async () => {
		const project = await makeProject("project", ["alpha"]);
		await openProject(storePath, project);
		const workspace = await removeProject(storePath, project);
		expect(workspace.projects).toEqual([]);
		expect(workspace.project).toBeNull();
		expect(existsSync(join(project, ".claude/skills/alpha/SKILL.md"))).toBe(true);
	});

	test("accepts sessions only for projects in the recent list", async () => {
		const project = await makeProject("project");
		await expect(assertRecentProject(storePath, project)).rejects.toThrow("Not a recent project");
		await openProject(storePath, project);
		await assertRecentProject(storePath, project);
	});

	test("stores the library folder and falls back to the default", async () => {
		const project = await makeProject("project");
		await openProject(storePath, project);
		expect(await readRoots(storePath)).toEqual({ project, library: libraryRoot });
		const workspace = await setLibraryRoot(storePath, null);
		expect(workspace.libraryRoot).toBe(workspace.defaultLibraryRoot);
		await expect(setLibraryRoot(storePath, join(tempRoot, "missing"))).rejects.toThrow("Folder not found");
	});
});
