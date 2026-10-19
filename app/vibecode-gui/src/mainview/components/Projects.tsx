import { useState, type ReactNode } from "react";
import type { Workspace } from "../../shared/project.interface";
import { formatTimeAgo } from "../time-ago";
import { Icon } from "./Icon";
import { ProjectsHeader } from "./ProjectsHeader";

interface ProjectsProps {
	workspace: Workspace | null;
	banner: ReactNode;
	onOpen: (root: string) => void;
	onChoose: () => void;
	onRemove: (root: string) => void;
}

function shortenPath(path: string, home: string): string {
	return path === home || path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

export function Projects({ workspace, banner, onOpen, onChoose, onRemove }: ProjectsProps) {
	const [query, setQuery] = useState("");
	const projects = workspace?.projects ?? [];
	const openRoot = workspace?.project?.root ?? null;
	const needle = query.trim().toLowerCase();
	const visible = projects.filter((project) => `${project.name} ${project.root}`.toLowerCase().includes(needle));

	return (
		<div className="flex min-w-0 flex-1 flex-col">
			<ProjectsHeader onChoose={onChoose} />
			{banner}
			<main className="flex min-h-0 flex-1 flex-col gap-card overflow-y-auto bg-canvas p-header-x">
				<div className="flex items-center justify-between gap-card">
					<h2 className="text-heading font-medium text-ink">
						Recent projects <span className="font-normal text-muted">{projects.length}</span>
					</h2>
					<label className="flex h-field w-panel items-center gap-stack rounded-field border border-line bg-card px-card text-heading focus-within:border-accent">
						<Icon name="search" className="size-icon text-muted" />
						<span className="sr-only">Find a project</span>
						<input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Find a project"
							className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
						/>
					</label>
				</div>
				{projects.length === 0 && (
					<p className="text-body text-muted">
						{workspace ? "No recent projects yet. Open a folder to start." : "Reading projects…"}
					</p>
				)}
				{projects.length > 0 && visible.length === 0 && (
					<p className="text-body text-muted">No projects match “{query.trim()}”.</p>
				)}
				<ul className="flex flex-col gap-stack">
					{visible.map((project) => (
						<li
							key={project.root}
							className={`flex items-center gap-stack rounded-card border bg-card p-card shadow-card ${
								project.root === openRoot ? "border-accent" : "border-line-card"
							}`}
						>
							<button
								type="button"
								onClick={() => onOpen(project.root)}
								disabled={!project.isAvailable}
								aria-current={project.root === openRoot}
								className="flex min-w-0 flex-1 items-center gap-card text-left"
							>
								<span
									className={`flex size-tile shrink-0 items-center justify-center ${
										project.isAvailable ? "bg-accent-soft text-accent-text" : "bg-tile text-tile-icon"
									}`}
								>
									<Icon name="folder" />
								</span>
								<span className="min-w-0 flex-1">
									<span className={`block truncate text-heading font-medium ${project.isAvailable ? "text-ink" : "text-muted"}`}>
										{project.name}
									</span>
									<span className="block truncate font-mono text-code text-muted">{shortenPath(project.root, workspace?.home ?? "")}</span>
								</span>
								{project.isAvailable ? (
									<span className="shrink-0 text-meta text-muted">
										{project.skillCount} {project.skillCount === 1 ? "skill" : "skills"} · Opened{" "}
										{formatTimeAgo(project.openedAt)}
									</span>
								) : (
									<span className="inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full bg-issue px-stack text-meta text-issue-text">
										<Icon name="alert" className="size-icon-sm" />
										Unavailable
									</span>
								)}
							</button>
							<button
								type="button"
								onClick={() => onRemove(project.root)}
								aria-label={`Remove ${project.name} from recent projects`}
								title="Remove from list (the folder stays on disk)"
								className="flex size-control shrink-0 items-center justify-center rounded-control text-muted hover:bg-field hover:text-ink"
							>
								<Icon name="close" className="size-icon-sm" />
							</button>
						</li>
					))}
				</ul>
			</main>
		</div>
	);
}
