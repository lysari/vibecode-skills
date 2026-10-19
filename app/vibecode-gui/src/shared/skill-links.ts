// A skill links to another only through an explicit reference to its name: inside an inline code span
// (`vibecode-review`) or a markdown link target, or as a path segment or slash command (/vibecode-review).
// A plain word in the prose is never a link.
const CODE_OR_LINK_TARGET = /`[^`\n]+`|\]\([^)\s]+\)/g;

function escapeName(name: string): string {
	return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordPattern(name: string, flags = ""): RegExp {
	return new RegExp(`(?<![\\w-])${escapeName(name)}(?![\\w-])`, flags);
}

function pathPattern(name: string): RegExp {
	const escaped = escapeName(name);
	return new RegExp(`(?<=/)${escaped}(?![\\w-])|(?<![\\w-])${escaped}(?=/)`, "g");
}

export function codeMentionsSkill(code: string, name: string): boolean {
	return wordPattern(name).test(code);
}

function replaceMentions(text: string, name: string, replacement: () => string): string {
	const inCode = wordPattern(name, "g");
	const inPath = pathPattern(name);
	let result = "";
	let last = 0;
	for (const match of text.matchAll(CODE_OR_LINK_TARGET)) {
		result += text.slice(last, match.index).replace(inPath, replacement) + match[0].replace(inCode, replacement);
		last = match.index + match[0].length;
	}
	return result + text.slice(last).replace(inPath, replacement);
}

export function mentionsSkill(text: string, name: string): boolean {
	let isFound = false;
	replaceMentions(text, name, () => {
		isFound = true;
		return name;
	});
	return isFound;
}

export function renameSkillMentions(text: string, name: string, nextName: string): string {
	return replaceMentions(text, name, () => nextName);
}
