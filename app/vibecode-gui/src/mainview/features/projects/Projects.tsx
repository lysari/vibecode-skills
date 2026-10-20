import { useEffect, useRef, useState } from "react";
import type { Project } from "../../../shared/interfaces/project.interface";
import { Icon } from "../../components/Icon";
import { usePresence } from "../../hooks/use-presence";

const ICON_BUTTON_CLASS =
	"size-control shrink-0 items-center justify-center rounded-control text-sidebar-muted transition hover:bg-sidebar-hover hover:text-sidebar-ink active:scale-press";

interface ProjectsProps {
	isSidebarOpen: boolean;
	projects: Project[] | null;
	openRoot: string | null;
	isDark: boolean;
	onHideSidebar: () => void;
	onToggleTheme: () => void;
	onChooseFolder: () => void;
	onOpenProject: (root: string) => void;
	onRemoveProject: (root: string) => void;
}

interface ProjectSectionProps {
	title: string;
	projects: Project[];
	openRoot: string | null;
	onOpenProject: (root: string) => void;
	onRemoveProject: (root: string) => void;
}

function ProjectSection({ title, projects, openRoot, onOpenProject, onRemoveProject }: ProjectSectionProps) {
	return (
		<section className="flex flex-col gap-rail-gap pt-card">
			<h3 className="px-stack text-section font-semibold text-sidebar-muted">{title}</h3>
			<ul className="flex flex-col gap-rail-gap">
				{projects.map((project) => {
					const isOpen = project.root === openRoot;
					return (
						<li
							key={project.root}
							className={`group flex animate-rise-in items-center rounded-item pr-rail-gap transition active:scale-press ${
								isOpen ? "bg-sidebar-selected" : project.isAvailable ? "hover:bg-sidebar-hover" : ""
							}`}
						>
							<button
								type="button"
								onClick={() => onOpenProject(project.root)}
								disabled={!project.isAvailable}
								aria-current={isOpen}
								title={project.isAvailable ? project.root : `${project.root} was moved or deleted`}
								className="flex h-group min-w-0 flex-1 items-center gap-item-gap rounded-item px-stack text-left text-heading"
							>
								<Icon name="folder" className={`size-icon ${project.isAvailable ? "text-sidebar-icon" : "text-sidebar-muted"}`} />
								<span className={`min-w-0 flex-1 truncate ${project.isAvailable ? "text-sidebar-ink" : "text-sidebar-muted"}`}>
									{project.name}
								</span>
							</button>
							<button
								type="button"
								onClick={() => onRemoveProject(project.root)}
								aria-label={`Remove ${project.name} from the list`}
								title="Remove from list (the folder stays on disk)"
								className={`hidden animate-fade-in group-focus-within:flex group-hover:flex ${ICON_BUTTON_CLASS}`}
							>
								<Icon name="close" className="size-icon-sm" />
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

export function Projects(props: ProjectsProps) {
	const { isSidebarOpen, projects, openRoot, isDark } = props;
	const sidebar = usePresence(isSidebarOpen);
	const [query, setQuery] = useState("");
	const searchRef = useRef<HTMLInputElement>(null);
	const needle = query.trim().toLowerCase();
	const shown = (projects ?? []).filter((project) => `${project.name} ${project.root}`.toLowerCase().includes(needle));
	const available = shown.filter((project) => project.isAvailable);
	const unavailable = shown.filter((project) => !project.isAvailable);

	useEffect(() => {
		function focusSearch(event: KeyboardEvent) {
			if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "f") return;
			event.preventDefault();
			searchRef.current?.focus();
		}
		window.addEventListener("keydown", focusSearch);
		return () => window.removeEventListener("keydown", focusSearch);
	}, []);

	if (!sidebar.shown) return null;

	return (
		<aside
			{...sidebar.presence}
			aria-label="Sidebar"
			className="flex w-sidebar shrink-0 justify-end overflow-hidden data-enter:animate-expand data-exit:pointer-events-none data-exit:animate-collapse"
		>
			<div className="flex w-sidebar shrink-0 flex-col border-r border-line-sidebar bg-sidebar text-sidebar-ink">
				<div className="electrobun-webkit-app-region-drag flex h-header shrink-0 items-center pl-traffic-lights pr-gutter">
					<button
						type="button"
						onClick={props.onHideSidebar}
						aria-label="Hide sidebar"
						title="Hide sidebar"
						className={`electrobun-webkit-app-region-no-drag flex ${ICON_BUTTON_CLASS}`}
					>
						<Icon name="sidebar" />
					</button>
				</div>
				<div className="shrink-0 px-gutter">
					<label className="flex h-search-h items-center gap-stack rounded-item border border-line-sidebar-field bg-sidebar-field px-card text-body transition-colors focus-within:border-accent">
						<Icon name="search" className="size-icon text-sidebar-muted" />
						<span className="sr-only">Search projects</span>
						<input
							ref={searchRef}
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search…"
							aria-keyshortcuts="Meta+F Control+F"
							className="min-w-0 flex-1 bg-transparent text-sidebar-ink outline-none placeholder:text-sidebar-muted"
						/>
						<kbd aria-hidden="true" className="shrink-0 font-sans text-section text-sidebar-muted">
							⌘F
						</kbd>
					</label>
				</div>
				<nav aria-label="Projects" className="min-h-0 flex-1 overflow-y-auto px-gutter pb-gutter">
					{!projects && <p className="px-stack pt-card text-body text-sidebar-muted">Reading projects…</p>}
					{projects?.length === 0 && <p className="px-stack pt-card text-body text-sidebar-muted">No projects yet. Open a folder to start.</p>}
					{projects && projects.length > 0 && shown.length === 0 && (
						<p className="px-stack pt-card text-body text-sidebar-muted">Nothing matches “{query.trim()}”.</p>
					)}
					<div className="flex flex-col gap-rail-gap">
						{available.length > 0 && (
							<ProjectSection
								title="Projects"
								projects={available}
								openRoot={openRoot}
								onOpenProject={props.onOpenProject}
								onRemoveProject={props.onRemoveProject}
							/>
						)}
						{unavailable.length > 0 && (
							<ProjectSection
								title="Unavailable"
								projects={unavailable}
								openRoot={openRoot}
								onOpenProject={props.onOpenProject}
								onRemoveProject={props.onRemoveProject}
							/>
						)}
					</div>
				</nav>
				<div className="flex h-header shrink-0 items-center justify-between px-footer-x">
					<button type="button" onClick={props.onChooseFolder} aria-label="Open folder…" title="Open folder…" className={`flex ${ICON_BUTTON_CLASS}`}>
						<Icon name="folder-plus" />
					</button>
					<button
						type="button"
						onClick={props.onToggleTheme}
						aria-label="Dark theme"
						aria-pressed={isDark}
						title={isDark ? "Switch to the light theme" : "Switch to the dark theme"}
						className={`flex ${ICON_BUTTON_CLASS}`}
					>
						<Icon name={isDark ? "sun" : "moon"} />
					</button>
				</div>
			</div>
		</aside>
	);
}
