import { useRef, useState } from "react";
import type { Skill } from "../../../shared/interfaces/skill.interface";
import { useDismiss } from "../../hooks/use-dismiss";
import { usePresence } from "../../hooks/use-presence";
import { Icon } from "../../components/Icon";
import { SkillSourceBadge } from "./SkillSourceBadge";

interface SkillPickerProps {
	skills: Skill[];
	selected: string[];
	onChange: (selected: string[]) => void;
}

export function SkillPicker({ skills, selected, onChange }: SkillPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const ref = useRef<HTMLDivElement>(null);
	useDismiss(ref, isOpen, () => setIsOpen(false));
	const popover = usePresence(isOpen);
	const needle = query.trim().toLowerCase();
	const visible = skills.filter((skill) => `${skill.name} ${skill.description}`.toLowerCase().includes(needle));

	function toggle(name: string) {
		onChange(selected.includes(name) ? selected.filter((other) => other !== name) : [...selected, name]);
	}

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-haspopup="dialog"
				className={`inline-flex h-control items-center gap-rail-gap rounded-full border px-card text-body transition active:scale-press ${
					isOpen ? "border-accent bg-accent-soft text-accent-text" : "border-line-control text-ink hover:bg-field"
				}`}
			>
				<Icon name="skills" className="size-icon-sm" />
				Skills
				{selected.length > 0 && (
					<span key={selected.length} className="animate-pop-in text-meta text-muted">
						{selected.length}
					</span>
				)}
				<Icon
					name="chevron-up"
					className={`size-icon-sm text-muted transition-transform duration-standard ease-standard ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>
			{popover.shown && (
				<div
					{...popover.presence}
					role="dialog"
					aria-label="Skills"
					className="absolute bottom-full left-0 z-10 mb-rail-gap flex w-dialog origin-bottom-left flex-col rounded-card border border-line bg-card shadow-popover data-enter:animate-pop-in data-exit:pointer-events-none data-exit:animate-pop-out"
				>
					<div className="border-b border-line p-stack">
						<label className="flex h-field items-center gap-stack rounded-field bg-field px-card text-heading">
							<Icon name="search" className="size-icon text-muted" />
							<span className="sr-only">Find a skill</span>
							<input
								autoFocus
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Find a skill"
								className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
							/>
						</label>
					</div>
					<ul className="max-h-picker overflow-y-auto p-rail-gap">
						{visible.length === 0 && (
							<li className="px-stack py-stack text-body text-muted">
								{skills.length === 0
									? "No skills for this agent in the project or your home folder."
									: `No skills match “${query.trim()}”.`}
							</li>
						)}
						{visible.map((skill) => {
							const isSelected = selected.includes(skill.name);
							return (
								<li key={skill.name} className="flex items-center gap-stack rounded-control px-stack py-rail-gap transition-colors hover:bg-field">
									<label className="flex min-w-0 flex-1 cursor-pointer items-start gap-stack">
										<input
											type="checkbox"
											checked={isSelected}
											onChange={() => toggle(skill.name)}
											className="mt-rail-gap size-icon-sm shrink-0 accent-accent"
										/>
										<span className="min-w-0">
											<span className="block truncate text-body font-medium text-ink">{skill.name}</span>
											<span className="line-clamp-2 text-meta text-muted">{skill.description}</span>
										</span>
									</label>
									<SkillSourceBadge skill={skill} />
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
}
