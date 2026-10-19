import type { ReactNode } from "react";

type RenderInline = (text: string) => ReactNode[];

const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const FENCE = /^\s*(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{3,}/;
const INLINE =
	/(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))|(\*[^*\s][^*]*\*|(?<!\w)_[^_\s][^_]*_(?!\w))/g;

interface MarkdownProps {
	source: string;
}

function isBlockStart(line: string): boolean {
	return (
		FENCE.test(line) ||
		HEADING.test(line) ||
		RULE.test(line) ||
		LIST_ITEM.test(line) ||
		line.startsWith(">") ||
		line.trim().startsWith("|")
	);
}

function splitRow(line: string): string[] {
	return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

const renderInline: RenderInline = (text) => {
	const nodes: ReactNode[] = [];
	let last = 0;
	for (const match of text.matchAll(INLINE)) {
		const token = match[0];
		const key = match.index;
		if (key > last) nodes.push(text.slice(last, key));
		if (match[1]) {
			nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
		} else if (match[2]) {
			nodes.push(<strong key={key}>{renderInline(token.slice(2, -2))}</strong>);
		} else if (match[3]) {
			const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token) ?? [];
			nodes.push(
				<span key={key} title={href} className="text-accent-text underline">
					{label}
				</span>,
			);
		} else {
			nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
		}
		last = key + token.length;
	}
	if (last < text.length) nodes.push(text.slice(last));
	return nodes;
};

function renderList(lines: string[], key: number): ReactNode {
	const first = LIST_ITEM.exec(lines[0]);
	const indent = first?.[1].length ?? 0;
	const items: { text: string; children: string[] }[] = [];
	for (const line of lines) {
		const match = LIST_ITEM.exec(line);
		const last = items[items.length - 1];
		if (match && match[1].length <= indent) items.push({ text: match[3], children: [] });
		else if (last && (match || last.children.length > 0)) last.children.push(line);
		else if (last) last.text += ` ${line.trim()}`;
	}
	const Tag = first && /\d/.test(first[2]) ? "ol" : "ul";
	return (
		<Tag key={key}>
			{items.map((item, index) => (
				<li key={index}>
					{renderInline(item.text)}
					{item.children.length > 0 && renderList(item.children, index)}
				</li>
			))}
		</Tag>
	);
}

function renderBlocks(lines: string[]): ReactNode[] {
	const blocks: ReactNode[] = [];
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		const key = blocks.length;
		const fence = FENCE.exec(line);
		const heading = HEADING.exec(line);
		if (!line.trim()) {
			i++;
		} else if (fence) {
			const code: string[] = [];
			for (i++; i < lines.length && !lines[i].trim().startsWith(fence[1]); i++) code.push(lines[i]);
			i++;
			blocks.push(
				<pre key={key}>
					<code>{code.join("\n")}</code>
				</pre>,
			);
		} else if (heading) {
			const Tag = `h${Math.min(heading[1].length, 4)}` as "h1" | "h2" | "h3" | "h4";
			blocks.push(<Tag key={key}>{renderInline(heading[2])}</Tag>);
			i++;
		} else if (RULE.test(line)) {
			blocks.push(<hr key={key} />);
			i++;
		} else if (line.startsWith(">")) {
			const quote: string[] = [];
			for (; i < lines.length && lines[i].startsWith(">"); i++) quote.push(lines[i].replace(/^>\s?/, ""));
			blocks.push(<blockquote key={key}>{renderBlocks(quote)}</blockquote>);
		} else if (line.trim().startsWith("|") && TABLE_DIVIDER.test(lines[i + 1] ?? "")) {
			const rows: string[][] = [];
			for (; i < lines.length && lines[i].trim().startsWith("|"); i++) rows.push(splitRow(lines[i]));
			const [head, , ...body] = rows;
			blocks.push(
				<div key={key} className="w-full overflow-x-auto">
					<table>
						<thead>
							<tr>
								{head.map((cell, index) => (
									<th key={index}>{renderInline(cell)}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{body.map((row, rowIndex) => (
								<tr key={rowIndex}>
									{row.map((cell, index) => (
										<td key={index}>{renderInline(cell)}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>,
			);
		} else if (LIST_ITEM.test(line)) {
			const items: string[] = [];
			for (; i < lines.length && (LIST_ITEM.test(lines[i]) || /^\s{2,}\S/.test(lines[i])); i++) {
				items.push(lines[i]);
			}
			blocks.push(renderList(items, key));
		} else {
			const paragraph = [line.trim()];
			for (i++; i < lines.length && lines[i].trim() && !isBlockStart(lines[i]); i++) {
				paragraph.push(lines[i].trim());
			}
			blocks.push(<p key={key}>{renderInline(paragraph.join(" "))}</p>);
		}
	}
	return blocks;
}

export function Markdown({ source }: MarkdownProps) {
	return <div className="markdown">{renderBlocks(source.replace(/\r\n/g, "\n").split("\n"))}</div>;
}
