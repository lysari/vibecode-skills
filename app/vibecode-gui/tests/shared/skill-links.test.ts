import { describe, expect, test } from "bun:test";
import { codeMentionsSkill, mentionsSkill, renameSkillMentions } from "../../src/shared/skill-links";

describe("mentionsSkill", () => {
	test("counts explicit references", () => {
		expect(mentionsSkill("Run `vibecode-review` after.", "vibecode-review")).toBe(true);
		expect(mentionsSkill("Then run /vibecode-review on the diff.", "vibecode-review")).toBe(true);
		expect(mentionsSkill("Read `vibecode/SKILL.md` first.", "vibecode")).toBe(true);
		expect(mentionsSkill("See [the review](../vibecode-review/SKILL.md).", "vibecode-review")).toBe(true);
		expect(mentionsSkill("See [review](vibecode-review).", "vibecode-review")).toBe(true);
		expect(mentionsSkill("Rules live in .claude/skills/vibecode/references.", "vibecode")).toBe(true);
	});

	test("ignores plain words and partial names", () => {
		expect(mentionsSkill("Apply vibecode rules to the code.", "vibecode")).toBe(false);
		expect(mentionsSkill("Use `vibecode-design` here.", "vibecode")).toBe(false);
		expect(mentionsSkill("Run /vibecode-review now.", "vibecode")).toBe(false);
		expect(mentionsSkill("A `vibecoder` wrote it.", "vibecode")).toBe(false);
		expect(mentionsSkill("[vibecode](https://example.com/docs)", "vibecode")).toBe(false);
	});
});

describe("codeMentionsSkill", () => {
	test("matches the name on word boundaries inside a code span", () => {
		expect(codeMentionsSkill("vibecode-review", "vibecode-review")).toBe(true);
		expect(codeMentionsSkill("/vibecode-review <skill-name>", "vibecode-review")).toBe(true);
		expect(codeMentionsSkill(".claude/skills/vibecode/SKILL.md", "vibecode")).toBe(true);
		expect(codeMentionsSkill("vibecode-review", "vibecode")).toBe(false);
	});
});

describe("renameSkillMentions", () => {
	test("rewrites only explicit references", () => {
		const text = [
			"Use `old-skill` or /old-skill, see [it](../old-skill/SKILL.md).",
			"The old-skill word and `old-skill-extra` stay.",
		].join("\n");
		expect(renameSkillMentions(text, "old-skill", "new-skill")).toBe(
			[
				"Use `new-skill` or /new-skill, see [it](../new-skill/SKILL.md).",
				"The old-skill word and `old-skill-extra` stay.",
			].join("\n"),
		);
	});
});
