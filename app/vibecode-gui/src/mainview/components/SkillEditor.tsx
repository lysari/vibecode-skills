import { useId } from "react";
import type { SkillForm } from "../../shared/skill.interface";
import { Markdown } from "./Markdown";

const EDITOR_CLASS =
	"w-full resize-none rounded-field border border-line bg-card p-card font-mono text-code text-ink outline-none focus:border-accent";

interface SkillEditorProps {
	form: SkillForm;
	skillNames: Set<string>;
	onChange: (form: SkillForm) => void;
	onOpenSkill: (name: string) => void;
}

export function SkillEditor({ form, skillNames, onChange, onOpenSkill }: SkillEditorProps) {
	const frontmatterId = useId();
	const bodyId = useId();

	return (
		<div className="flex h-full min-h-0">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col gap-stack bg-canvas p-header-x">
				<label htmlFor={frontmatterId} className="text-meta text-muted">
					Frontmatter (YAML)
				</label>
				<textarea
					id={frontmatterId}
					value={form.frontmatter}
					onChange={(event) => onChange({ ...form, frontmatter: event.target.value })}
					rows={6}
					spellCheck={false}
					className={`shrink-0 ${EDITOR_CLASS}`}
				/>
				<label htmlFor={bodyId} className="text-meta text-muted">
					Body (Markdown)
				</label>
				<textarea
					id={bodyId}
					value={form.body}
					onChange={(event) => onChange({ ...form, body: event.target.value })}
					spellCheck={false}
					className={`min-h-0 flex-1 ${EDITOR_CLASS}`}
				/>
			</div>
			<section
				aria-label="Preview"
				className="min-h-0 min-w-0 flex-1 overflow-y-auto border-l border-line bg-surface p-header-x"
			>
				<p className="mb-card text-meta text-muted">Preview</p>
				<Markdown source={form.body} skillNames={skillNames} onOpenSkill={onOpenSkill} />
			</section>
		</div>
	);
}
