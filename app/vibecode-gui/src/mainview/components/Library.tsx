import { useEffect, useRef, useState, type ReactNode } from "react";
import type { OpenProject, Project } from "../../shared/project.interface";
import type { Skill } from "../../shared/skill.interface";
import { Icon } from "./Icon";
import { InstallBadge } from "./InstallBadge";

const OPEN_FOLDER = "open-folder";
const ALL_PROJECTS = "all-projects";
const FAVOURITES = "Favourites";
const PROJECT_SKILLS = "Project skills";
const OUR_LIBRARY = "Our library";

interface LibraryProps {
	project: OpenProject;
	projects: Project[];
	libraryRoot: string | null;
	selectedDir: string | null;
	onSelect: (dir: string) => void;
	onToggleFavourite: (dir: string) => void;
	onInstall: (skill: Skill) => void;
	onOpenProject: (root: string) => void;
	onChooseProject: () => void;
	onShowProjects: () => void;
}

function folderName(skill: Skill): string {
	return skill.dir.split("/").pop() ?? skill.dir;
}

interface SkillRowProps {
	skill: Skill;
	isFavourite: boolean;
	isSelected: boolean;
	onSelect: (dir: string) => void;
	onToggleFavourite: (dir: string) => void;
	onInstall: (skill: Skill) => void;
}

function SkillRow({ skill, isFavourite, isSelected, onSelect, onToggleFavourite, onInstall }: SkillRowProps) {
	return (
		<li
			className={`flex flex-col gap-stack rounded-card border bg-card p-card shadow-card ${
				isSelected ? "border-accent" : "border-line-card"
			}`}
		>
			<div className="flex items-center gap-stack">
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
						<span className="block truncate text-heading font-medium text-ink">{skill.name || folderName(skill)}</span>
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
					className={`flex size-control shrink-0 items-center justify-center ${
						isFavourite ? "text-star" : "text-star-empty hover:text-star"
					}`}
				>
					<Icon name="star" isFilled={isFavourite} />
				</button>
			</div>
			{skill.install && (
				<div className="flex">
					<InstallBadge skill={skill} onInstall={onInstall} />
				</div>
			)}
		</li>
	);
}

interface SkillSectionProps {
	label: string;
	count: number;
	emptyText: string;
	isOpen: boolean;
	onToggle: () => void;
	children: ReactNode;
}

function SkillSection({ label, count, emptyText, isOpen, onToggle, children }: SkillSectionProps) {
	return (
		<section>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={isOpen}
				className="flex h-group w-full items-center justify-between text-heading font-medium text-ink"
			>
				{label}
				<span className="flex items-center gap-stack text-meta font-normal text-muted">
					{count}
					<Icon name={isOpen ? "chevron-up" : "chevron-down"} className="size-icon-sm" />
				</span>
			</button>
			{isOpen && count === 0 && <p className="pb-stack text-meta text-muted">{emptyText}</p>}
			{isOpen && count > 0 && <ul className="flex flex-col gap-stack pb-stack">{children}</ul>}
		</section>
	);
}

export function Library(props: LibraryProps) {
	const { project, projects, libraryRoot, selectedDir } = props;
	const [query, setQuery] = useState("");
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
	}, [selectedDir]);

	const favourites = new Set(project.favourites);
	const needle = query.trim().toLowerCase();
	const noMatchText = `No skills match “${query.trim()}”.`;
	const visible = project.skills.filter((skill) =>
		`${skill.name} ${skill.description} ${skill.source}`.toLowerCase().includes(needle),
	);
	const favouriteSkills = visible.filter((skill) => favourites.has(skill.dir));
	const projectSkills = visible.filter((skill) => skill.scope === "project");
	const librarySkills = visible.filter((skill) => skill.scope === "library");
	const noLibraryText =
		libraryRoot === project.root
			? "This project is the skill library, so its skills are listed above."
			: libraryRoot
				? `No skills found in ${libraryRoot}.`
				: "Choose the skill library folder in Settings.";

	function toggleSection(label: string) {
		const next = new Set(collapsed);
		if (next.has(label)) next.delete(label);
		else next.add(label);
		setCollapsed(next);
	}

	function switchProject(value: string) {
		if (value === OPEN_FOLDER) props.onChooseProject();
		else if (value === ALL_PROJECTS) props.onShowProjects();
		else props.onOpenProject(value);
	}

	function renderRows(skills: Skill[]) {
		return skills.map((skill) => (
			<SkillRow
				key={skill.dir}
				skill={skill}
				isFavourite={favourites.has(skill.dir)}
				isSelected={skill.dir === selectedDir}
				onSelect={props.onSelect}
				onToggleFavourite={props.onToggleFavourite}
				onInstall={props.onInstall}
			/>
		));
	}

	return (
		<aside aria-label="Skill library" className="flex w-panel shrink-0 flex-col border-r border-line bg-surface">
			<div className="flex flex-col gap-card border-b border-line p-gutter">
				<label className="flex h-field items-center gap-stack rounded-field bg-field px-card text-heading text-ink focus-within:outline focus-within:outline-2 focus-within:outline-accent">
					<Icon name="folder" className="size-icon text-muted" />
					<span className="sr-only">Project</span>
					<select
						value={project.root}
						onChange={(event) => switchProject(event.target.value)}
						className="min-w-0 flex-1 appearance-none bg-transparent outline-none"
					>
						<optgroup label="Recent projects">
							{projects
								.filter((recent) => recent.isAvailable)
								.map((recent) => (
									<option key={recent.root} value={recent.root}>
										{recent.name}
									</option>
								))}
						</optgroup>
						<option value={OPEN_FOLDER}>Open folder…</option>
						<option value={ALL_PROJECTS}>All projects</option>
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
				<SkillSection
					label={FAVOURITES}
					count={favouriteSkills.length}
					emptyText={needle ? noMatchText : "Star a skill to keep it here."}
					isOpen={!collapsed.has(FAVOURITES)}
					onToggle={() => toggleSection(FAVOURITES)}
				>
					{renderRows(favouriteSkills)}
				</SkillSection>
				<SkillSection
					label={PROJECT_SKILLS}
					count={projectSkills.length}
					emptyText={needle ? noMatchText : "No skills in this project yet. Create one with New or add one from the library."}
					isOpen={!collapsed.has(PROJECT_SKILLS)}
					onToggle={() => toggleSection(PROJECT_SKILLS)}
				>
					{renderRows(projectSkills)}
				</SkillSection>
				<SkillSection
					label={OUR_LIBRARY}
					count={librarySkills.length}
					emptyText={needle ? noMatchText : noLibraryText}
					isOpen={!collapsed.has(OUR_LIBRARY)}
					onToggle={() => toggleSection(OUR_LIBRARY)}
				>
					{renderRows(librarySkills)}
				</SkillSection>
			</div>
		</aside>
	);
}
