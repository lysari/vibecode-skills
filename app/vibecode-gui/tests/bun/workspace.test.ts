import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	openProject,
	readRoots,
	readStore,
	readWorkspace,
	removeProject,
	saveFavourites,
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
			projects: [{ root: "/a", openedAt: 1, favourites: [] }],
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
		expect(reopened.projects.map((project) => [project.name, project.skillCount])).toEqual([
			["first", 2],
			["second", 0],
		]);
		const launch = await readWorkspace(storePath);
		expect(launch.project?.name).toBe("first");
		expect(launch.project?.skills.map((skill) => `${skill.scope}:${skill.name}`)).toEqual([
			"project:alpha",
			"project:beta",
			"library:ours",
		]);
		expect(launch.libraryRoot).toBe(libraryRoot);
		expect(JSON.parse(await readFile(storePath, "utf8")).openRoot).toBe(first);
	});

	test("shows a moved or deleted project as unavailable and opens nothing", async () => {
		const gone = await makeProject("gone", ["alpha"]);
		await openProject(storePath, gone);
		await rm(gone, { recursive: true });
		const workspace = await readWorkspace(storePath);
		expect(workspace.project).toBeNull();
		expect(workspace.projects).toEqual([expect.objectContaining({ root: gone, isAvailable: false, skillCount: 0 })]);
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

	test("keeps favourites per project", async () => {
		const first = await makeProject("first", ["alpha"]);
		const second = await makeProject("second");
		await openProject(storePath, first);
		await saveFavourites(storePath, [join(first, ".claude/skills/alpha")]);
		expect((await openProject(storePath, second)).project?.favourites).toEqual([]);
		expect((await openProject(storePath, first)).project?.favourites).toEqual([join(first, ".claude/skills/alpha")]);
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
