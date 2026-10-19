import { useState } from "react";
import type { Skill, SkillCreate } from "../../shared/skill.interface";
import { Dialog } from "./Dialog";

const FIELD_CLASS =
	"h-field w-full border border-line bg-card px-card text-body text-ink outline-none focus:border-accent";

interface NewSkillDialogProps {
	sources: string[];
	onCreate: (create: SkillCreate) => Promise<void>;
	onCancel: () => void;
}

export function NewSkillDialog({ sources, onCreate, onCancel }: NewSkillDialogProps) {
	const [create, setCreate] = useState<SkillCreate>({ source: sources[0] ?? ".", name: "", description: "" });

	return (
		<Dialog title="New skill" confirmLabel="Create skill" onConfirm={() => onCreate(create)} onCancel={onCancel}>
			<p>Creates a folder with a SKILL.md from the skill template, then opens it in the editor.</p>
			<label className="flex flex-col gap-rail-gap text-meta text-muted">
				Folder
				<select
					value={create.source}
					onChange={(event) => setCreate({ ...create, source: event.target.value })}
					className={FIELD_CLASS}
				>
					{sources.map((source) => (
						<option key={source} value={source}>
							{source}
						</option>
					))}
				</select>
			</label>
			<label className="flex flex-col gap-rail-gap text-meta text-muted">
				Name
				<input
					value={create.name}
					onChange={(event) => setCreate({ ...create, name: event.target.value })}
					placeholder="my-skill"
					spellCheck={false}
					className={FIELD_CLASS}
				/>
			</label>
			<label className="flex flex-col gap-rail-gap text-meta text-muted">
				Description
				<input
					value={create.description}
					onChange={(event) => setCreate({ ...create, description: event.target.value })}
					placeholder="Use when…"
					className={FIELD_CLASS}
				/>
			</label>
		</Dialog>
	);
}

interface RenameSkillDialogProps {
	skill: Skill;
	mentionCount: number;
	onRename: (name: string) => Promise<void>;
	onCancel: () => void;
}

export function RenameSkillDialog({ skill, mentionCount, onRename, onCancel }: RenameSkillDialogProps) {
	const [name, setName] = useState(skill.name);

	return (
		<Dialog title={`Rename ${skill.name}`} confirmLabel="Rename" onConfirm={() => onRename(name)} onCancel={onCancel}>
			<p>Renames the skill folder and the name in its frontmatter.</p>
			{mentionCount > 0 && (
				<p className="bg-warning-soft px-stack py-rail-gap text-meta text-warning-text">
					{mentionCount} other {mentionCount === 1 ? "skill mentions" : "skills mention"} this name. Their text is
					not changed.
				</p>
			)}
			<label className="flex flex-col gap-rail-gap text-meta text-muted">
				New name
				<input
					value={name}
					onChange={(event) => setName(event.target.value)}
					spellCheck={false}
					className={FIELD_CLASS}
				/>
			</label>
		</Dialog>
	);
}
