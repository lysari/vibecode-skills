import { useEffect, useState } from "react";
import type { Skill } from "../../shared/skill.interface";
import { skillsApi } from "../rpc";
import { Icon } from "./Icon";
import { Markdown } from "./Markdown";

const KILOBYTE = 1024;

interface SkillDocumentProps {
	skill: Skill;
	skills: Skill[];
	skillNames: Set<string>;
	onOpenSkill: (name: string) => void;
	onSelect: (dir: string) => void;
}

function SkillChip({ skill, showsScope, onSelect }: { skill: Skill; showsScope: boolean; onSelect: (dir: string) => void }) {
	return (
		<button
			type="button"
			onClick={() => onSelect(skill.dir)}
			className="inline-flex h-chip-h items-center gap-rail-gap rounded-full border border-line-control px-stack text-meta text-chip hover:bg-field"
		>
			<Icon name="link" className="size-icon-sm" />
			{skill.name}
			{showsScope && <span className="text-muted">· {skill.scope}</span>}
		</button>
	);
}

export function SkillDocument({ skill, skills, skillNames, onOpenSkill, onSelect }: SkillDocumentProps) {
	const [openFile, setOpenFile] = useState<string | null>(null);
	const [fileText, setFileText] = useState<string | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const references = skills.filter((other) => skill.references.includes(other.dir));
	const referencedBy = skills.filter((other) => other.references.includes(skill.dir));

	useEffect(() => {
		if (!openFile) return;
		let isCurrent = true;
		setFileText(null);
		setFileError(null);
		skillsApi
			.readSkillFile({ dir: skill.dir, path: openFile })
			.then((text) => isCurrent && setFileText(text))
			.catch((cause: unknown) => isCurrent && setFileError(cause instanceof Error ? cause.message : String(cause)));
		return () => {
			isCurrent = false;
		};
	}, [skill.dir, openFile]);

	return (
		<div className="flex h-full min-h-0">
			<div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-header-x">
				<article className="rounded-node border border-line-card bg-card p-header-x shadow-card">
					{openFile ? (
						<>
							<div className="mb-card flex items-center justify-between gap-card border-b border-line pb-card">
								<p className="truncate font-mono text-code text-ink">{openFile}</p>
								<button
									type="button"
									onClick={() => setOpenFile(null)}
									className="inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full border border-line-control px-stack text-meta text-ink hover:bg-field"
								>
									<Icon name="back" className="size-icon-sm" />
									SKILL.md
								</button>
							</div>
							{fileError && <p className="text-body text-issue-text">{fileError}</p>}
							{fileText === null && !fileError && <p className="text-body text-muted">Loading…</p>}
							{fileText !== null &&
								(openFile.endsWith(".md") ? (
									<Markdown source={fileText} skillNames={skillNames} onOpenSkill={onOpenSkill} />
								) : (
									<pre className="overflow-x-auto bg-field p-card font-mono text-code text-ink">{fileText}</pre>
								))}
						</>
					) : (
						<Markdown source={skill.body} skillNames={skillNames} onOpenSkill={onOpenSkill} />
					)}
				</article>
			</div>
			<aside
				aria-label="Skill details"
				className="flex w-inspector shrink-0 flex-col gap-gutter overflow-y-auto border-l border-line bg-surface p-gutter"
			>
				<section className="flex flex-col gap-stack">
					<h2 className="text-heading font-medium text-ink">Frontmatter</h2>
					<dl className="grid grid-cols-[auto_1fr] gap-x-card gap-y-rail-gap text-meta">
						<dt className="text-muted">name</dt>
						<dd className="break-words text-ink">{skill.name || "—"}</dd>
						<dt className="text-muted">version</dt>
						<dd className="break-words text-ink">{skill.version ?? "—"}</dd>
						<dt className="text-muted">folder</dt>
						<dd className="break-all font-mono text-code text-ink">{skill.dir}</dd>
						<dt className="text-muted">edited</dt>
						<dd className="text-ink">{new Date(skill.modifiedAt).toLocaleString()}</dd>
					</dl>
					<p className="text-meta text-copy">{skill.description || "No description."}</p>
				</section>
				{skill.issues.length > 0 && (
					<section className="flex flex-col gap-stack">
						<h2 className="text-heading font-medium text-ink">Issues</h2>
						<ul className="flex flex-col gap-rail-gap">
							{skill.issues.map((issue) => (
								<li key={issue} className="flex gap-rail-gap bg-issue px-stack py-rail-gap text-meta text-issue-text">
									<Icon name="alert" className="size-icon-sm" />
									{issue}
								</li>
							))}
						</ul>
					</section>
				)}
				<section className="flex flex-col gap-stack">
					<h2 className="flex items-center justify-between text-heading font-medium text-ink">
						Files
						<span className="text-meta font-normal text-muted">{skill.files.length + 1}</span>
					</h2>
					<ul className="flex flex-col">
						<li>
							<button
								type="button"
								onClick={() => setOpenFile(null)}
								aria-current={openFile === null}
								className={`flex w-full items-center gap-stack px-stack py-rail-gap text-left text-meta ${
									openFile === null ? "bg-accent-soft text-accent-text" : "text-ink hover:bg-field"
								}`}
							>
								<Icon name="file" className="size-icon-sm" />
								SKILL.md
								<span className="ml-auto text-muted">{skill.lineCount} lines</span>
							</button>
						</li>
						{skill.files.map((file) => (
							<li key={file.path}>
								<button
									type="button"
									onClick={() => setOpenFile(file.path)}
									aria-current={openFile === file.path}
									className={`flex w-full items-center gap-stack px-stack py-rail-gap text-left text-meta ${
										openFile === file.path ? "bg-accent-soft text-accent-text" : "text-ink hover:bg-field"
									}`}
								>
									<Icon name="file" className="size-icon-sm" />
									<span className="min-w-0 truncate">{file.path}</span>
									<span className="ml-auto shrink-0 text-muted">{Math.max(1, Math.round(file.size / KILOBYTE))} KB</span>
								</button>
							</li>
						))}
					</ul>
				</section>
				<section className="flex flex-col gap-stack">
					<h2 className="text-heading font-medium text-ink">Mentions</h2>
					<div className="flex flex-wrap gap-rail-gap">
						{references.length === 0 && <p className="text-meta text-muted">No other skills.</p>}
						{references.map((other) => (
							<SkillChip key={other.dir} skill={other} showsScope={other.scope !== skill.scope} onSelect={onSelect} />
						))}
					</div>
					<h2 className="text-heading font-medium text-ink">Mentioned by</h2>
					<div className="flex flex-wrap gap-rail-gap">
						{referencedBy.length === 0 && <p className="text-meta text-muted">No other skills.</p>}
						{referencedBy.map((other) => (
							<SkillChip key={other.dir} skill={other} showsScope={other.scope !== skill.scope} onSelect={onSelect} />
						))}
					</div>
				</section>
			</aside>
		</div>
	);
}
