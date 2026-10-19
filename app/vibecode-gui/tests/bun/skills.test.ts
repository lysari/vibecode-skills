import { describe, expect, test } from "bun:test";
import { deleteSkill, listSkills, readSkillFile, renameSkill, saveSkill } from "../../src/bun/skills";

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
});

describe("path guards", () => {
	test("rejects reading a file outside the skill folder", async () => {
		await expect(readSkillFile({ dir: ".claude/skills/vibecode", path: "../vibecode-review/SKILL.md" })).rejects.toThrow(
			"outside the skill folder",
		);
	});

	test("rejects skill folders outside the repository", async () => {
		await expect(deleteSkill({ dir: "../../" })).rejects.toThrow("outside the skills repository");
		await expect(saveSkill({ dir: "/tmp", form: { frontmatter: "name: x", body: "" } })).rejects.toThrow(
			"outside the skills repository",
		);
	});

	test("rejects folders that are not skills", async () => {
		await expect(deleteSkill({ dir: ".claude/skills" })).rejects.toThrow("No SKILL.md");
	});

	test("rejects names that could escape the folder", async () => {
		await expect(renameSkill({ dir: ".claude/skills/vibecode", name: "../escape" })).rejects.toThrow("lowercase");
	});

	test("rejects invalid YAML before writing", async () => {
		await expect(
			saveSkill({ dir: ".claude/skills/vibecode", form: { frontmatter: "name: [unclosed", body: "" } }),
		).rejects.toThrow("not valid YAML");
	});
});
