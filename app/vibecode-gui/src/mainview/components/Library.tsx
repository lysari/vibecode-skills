import { useEffect, useRef, useState } from "react";
import type { Skill, SkillLibrary } from "../../shared/skill.interface";
import { Icon } from "./Icon";

const ALL_SOURCES = "all";
const FAVOURITES = "Favourites";
const OTHER = "Other";

interface LibraryProps {
	library: SkillLibrary;
	favourites: Set<string>;
	selectedDir: string | null;
	onSelect: (dir: string) => void;
	onToggleFavourite: (dir: string) => void;
}

function folderName(skill: Skill): string {
	return skill.dir.split("/").pop() ?? skill.dir;
}

function groupSkills(skills: Skill[], favourites: Set<string>): [string, Skill[]][] {
	const prefixCounts = new Map<string, number>();
	for (const skill of skills) {
		const prefix = folderName(skill).split("-")[0];
		prefixCounts.set(prefix, (prefixCounts.get(prefix) ?? 0) + 1);
	}
	const groups = new Map<string, Skill[]>();
	for (const skill of skills) {
		const prefix = folderName(skill).split("-")[0];
		const label = (prefixCounts.get(prefix) ?? 0) > 1 ? `${prefix}-*` : OTHER;
		groups.set(label, [...(groups.get(label) ?? []), skill]);
	}
	const families = [...groups.entries()].sort(([a], [b]) => (a === OTHER ? 1 : b === OTHER ? -1 : a.localeCompare(b)));
	return [[FAVOURITES, skills.filter((skill) => favourites.has(skill.dir))], ...families];
}

export function Library({ library, favourites, selectedDir, onSelect, onToggleFavourite }: LibraryProps) {
	const [source, setSource] = useState(ALL_SOURCES);
	const [query, setQuery] = useState("");
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
	}, [selectedDir]);

	const needle = query.trim().toLowerCase();
	const visible = library.skills.filter(
		(skill) =>
			(source === ALL_SOURCES || skill.source === source) &&
			`${skill.name} ${skill.description} ${skill.dir}`.toLowerCase().includes(needle),
	);
	const groups = groupSkills(visible, favourites);

	function toggleGroup(label: string) {
		const next = new Set(collapsed);
		if (next.has(label)) next.delete(label);
		else next.add(label);
		setCollapsed(next);
	}

	return (
		<aside aria-label="Skill library" className="flex w-panel shrink-0 flex-col border-r border-line bg-surface">
			<div className="flex flex-col gap-card border-b border-line p-gutter">
				<label className="flex h-field items-center gap-stack rounded-field bg-field px-card text-heading text-ink focus-within:outline focus-within:outline-2 focus-within:outline-accent">
					<Icon name="folder" className="size-icon text-muted" />
					<span className="sr-only">Skill folder</span>
					<select
						value={source}
						onChange={(event) => setSource(event.target.value)}
						className="min-w-0 flex-1 appearance-none bg-transparent outline-none"
					>
						<option value={ALL_SOURCES}>{library.root} / all folders</option>
						{library.sources.map((path) => (
							<option key={path} value={path}>
								{library.root} / {path}
							</option>
						))}
					</select>
					<Icon name="chevron-down" className="pointer-events-none size-icon-sm text-muted" />
				</label>
				<label className="flex h-field items-center gap-stack rounded-field border border-line bg-card px-card text-heading focus-within:border-accent">
					<Icon name="search" className="size-icon text-muted" />
					<span className="sr-only">Find a skill</span>
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Find a skill"
						className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
					/>
				</label>
			</div>
			<div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-gutter pb-gutter">
				{visible.length === 0 && (
					<p className="py-gutter text-body text-muted">
						{needle ? `No skills match “${query.trim()}”.` : "No skills in this folder."}
					</p>
				)}
				{groups.map(([label, skills]) => {
					const isOpen = !collapsed.has(label) && skills.length > 0;
					return (
						<section key={label}>
							<button
								type="button"
								onClick={() => toggleGroup(label)}
								aria-expanded={isOpen}
								className="flex h-group w-full items-center justify-between text-heading font-medium text-ink"
							>
								{label}
								<span className="flex items-center gap-stack text-meta font-normal text-muted">
									{skills.length}
									<Icon name={isOpen ? "chevron-up" : "chevron-down"} className="size-icon-sm" />
								</span>
							</button>
							{isOpen && (
								<ul className="flex flex-col gap-stack pb-stack">
									{skills.map((skill) => {
										const isFavourite = favourites.has(skill.dir);
										const isSelected = skill.dir === selectedDir;
										return (
											<li
												key={skill.dir}
												className={`flex items-center gap-stack rounded-card border bg-card p-card shadow-card ${
													isSelected ? "border-accent" : "border-line-card"
												}`}
											>
												<button
													type="button"
													onClick={() => onSelect(skill.dir)}
													aria-current={isSelected}
													className="flex min-w-0 flex-1 items-center gap-card text-left"
												>
													<span
														className={`flex size-tile shrink-0 items-center justify-center ${
															skill.files.length > 0 ? "bg-accent-soft text-accent-text" : "bg-tile text-tile-icon"
														}`}
													>
														<Icon name={skill.files.length > 0 ? "folder" : "file"} />
													</span>
													<span className="min-w-0">
														<span className="block truncate text-heading font-medium text-ink">
															{skill.name || folderName(skill)}
														</span>
														<span className="block truncate text-body text-muted">{skill.description}</span>
													</span>
												</button>
												{skill.issues.length > 0 && (
													<span title={skill.issues.join("\n")} className="text-issue-text">
														<Icon name="alert" className="size-icon-sm" />
														<span className="sr-only">{skill.issues.join(". ")}</span>
													</span>
												)}
												<button
													type="button"
													onClick={() => onToggleFavourite(skill.dir)}
													aria-pressed={isFavourite}
													aria-label={`${isFavourite ? "Remove" : "Add"} ${skill.name} ${isFavourite ? "from" : "to"} favourites`}
													className={isFavourite ? "text-star" : "text-star-empty hover:text-star"}
												>
													<Icon name="star" isFilled={isFavourite} />
												</button>
											</li>
										);
									})}
								</ul>
							)}
						</section>
					);
				})}
			</div>
		</aside>
	);
}
