import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { deleteSkill, listSkills, readSkillFile, renameSkill, repoRoot, saveSkill } from "../../src/bun/skills";

const TEMP_SOURCE = `.gui-test-${process.pid}`;
const tempRoot = join(repoRoot, TEMP_SOURCE);
const neverTrash = () => false;

async function writeTempSkill(name: string, body: string): Promise<void> {
	await mkdir(join(tempRoot, name), { recursive: true });
	await writeFile(join(tempRoot, name, "SKILL.md"), `---\nname: ${name}\ndescription: Temporary test skill.\n---\n${body}`);
}

afterEach(() => rm(tempRoot, { recursive: true, force: true }));

describe("listSkills", () => {
	test("finds the repo's skills with parsed frontmatter and links", async () => {
		const library = await listSkills();
		const vibecode = library.skills.find((skill) => skill.name === "vibecode");
		expect(library.sources).toContain(".claude/skills");
		expect(vibecode?.dir).toBe(".claude/skills/vibecode");
		expect(vibecode?.files.some((file) => file.path.startsWith("references/"))).toBe(true);
		expect(library.skills.every((skill) => !skill.dir.startsWith("app/"))).toBe(true);
		const review = library.skills.find((skill) => skill.name === "vibecode-review");
		expect(review?.references).toContain(".claude/skills/vibecode");
	});

	test("reports no frontmatter issues for the repo's skills", async () => {
		const library = await listSkills();
		expect(library.skills.filter((skill) => skill.issues.length > 0).map((skill) => skill.dir)).toEqual([]);
	});
});

describe("renameSkill", () => {
	test("renames the explicit mentions in other skills when asked", async () => {
		await writeTempSkill("gui-test-target", "# Target\n");
		await writeTempSkill("gui-test-caller", "Run `gui-test-target` or /gui-test-target. The gui-test-target word stays.\n");
		const library = await renameSkill({
			dir: `${TEMP_SOURCE}/gui-test-target`,
			name: "gui-test-renamed",
			shouldRenameMentions: true,
		});
		const caller = await readFile(join(tempRoot, "gui-test-caller", "SKILL.md"), "utf8");
		expect(caller).toContain("Run `gui-test-renamed` or /gui-test-renamed. The gui-test-target word stays.");
		expect(library.skills.find((skill) => skill.name === "gui-test-caller")?.references).toEqual([
			`${TEMP_SOURCE}/gui-test-renamed`,
		]);
		expect(existsSync(join(tempRoot, "gui-test-target"))).toBe(false);
	});

	test("leaves other skills unchanged when not asked", async () => {
		await writeTempSkill("gui-test-target", "# Target\n");
		await writeTempSkill("gui-test-caller", "Run `gui-test-target`.\n");
		await renameSkill({ dir: `${TEMP_SOURCE}/gui-test-target`, name: "gui-test-renamed", shouldRenameMentions: false });
		const renamed = await readFile(join(tempRoot, "gui-test-renamed", "SKILL.md"), "utf8");
		expect(renamed).toContain("name: gui-test-renamed");
		expect(await readFile(join(tempRoot, "gui-test-caller", "SKILL.md"), "utf8")).toContain("Run `gui-test-target`.");
	});
});

describe("deleteSkill", () => {
	test("moves the skill folder to the Trash", async () => {
		await writeTempSkill("gui-test-trash", "");
		const trashed: string[] = [];
		await deleteSkill({ dir: `${TEMP_SOURCE}/gui-test-trash` }, (path) => {
			trashed.push(path);
			return true;
		});
		expect(trashed).toEqual([join(tempRoot, "gui-test-trash")]);
	});

	test("reports a failed move to the Trash", async () => {
		await writeTempSkill("gui-test-trash", "");
		await expect(deleteSkill({ dir: `${TEMP_SOURCE}/gui-test-trash` }, neverTrash)).rejects.toThrow("Could not move");
		expect(existsSync(join(tempRoot, "gui-test-trash", "SKILL.md"))).toBe(true);
	});
});

describe("path guards", () => {
	test("rejects reading a file outside the skill folder", async () => {
		await expect(readSkillFile({ dir: ".claude/skills/vibecode", path: "../vibecode-review/SKILL.md" })).rejects.toThrow(
			"outside the skill folder",
		);
	});

	test("rejects skill folders outside the repository", async () => {
		await expect(deleteSkill({ dir: "../../" }, neverTrash)).rejects.toThrow("outside the skills repository");
		await expect(saveSkill({ dir: "/tmp", form: { frontmatter: "name: x", body: "" } })).rejects.toThrow(
			"outside the skills repository",
		);
	});

	test("rejects folders that are not skills", async () => {
		await expect(deleteSkill({ dir: ".claude/skills" }, neverTrash)).rejects.toThrow("No SKILL.md");
	});

	test("rejects names that could escape the folder", async () => {
		await expect(renameSkill({ dir: ".claude/skills/vibecode", name: "../escape", shouldRenameMentions: false })).rejects.toThrow("lowercase");
	});

	test("rejects invalid YAML before writing", async () => {
		await expect(
			saveSkill({ dir: ".claude/skills/vibecode", form: { frontmatter: "name: [unclosed", body: "" } }),
		).rejects.toThrow("not valid YAML");
	});
});
