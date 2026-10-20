import { useState } from "react";
import type { Project } from "../../../shared/interfaces/project.interface";
import type { SessionStatus, SessionSummary } from "../../../shared/interfaces/session.interface";
import { formatTimeAgo } from "./time-ago";
import { Icon } from "../../components/Icon";
import { AGENT_STATUS_STYLES } from "../../components/StatusPill";

const STATUS_DOTS: Partial<Record<SessionStatus, string>> = {
	running: "bg-info-text motion-safe:animate-pulse",
	"needs-input": "bg-warning-dot",
	failed: "bg-issue-text",
};
const ROW_ACTION_CLASS =
	"flex size-control shrink-0 items-center justify-center rounded-control text-muted opacity-0 hover:bg-field hover:text-ink focus-visible:opacity-100 group-hover:opacity-100";

interface ProjectsProps {
	projects: Project[] | null;
	sessions: Record<string, SessionSummary[]>;
	expanded: Set<string>;
	openRoot: string | null;
	sessionId: string | null;
	onChooseFolder: () => void;
	onOpenProject: (root: string) => void;
	onCollapseProject: (root: string) => void;
	onRemoveProject: (root: string) => void;
	onOpenSession: (root: string, id: string) => void;
	onNewSession: (root: string) => void;
	onDeleteSession: (session: SessionSummary) => void;
}

function statusLabel(status: SessionStatus): string | null {
	return status === "running" || status === "needs-input" || status === "failed" ? AGENT_STATUS_STYLES[status].label : null;
}

export function Projects(props: ProjectsProps) {
	const { projects, sessions, expanded, openRoot, sessionId } = props;
	const [query, setQuery] = useState("");
	const needle = query.trim().toLowerCase();
	const visible = (projects ?? []).flatMap((project) => {
		const projectSessions = sessions[project.root] ?? [];
		if (`${project.name} ${project.root}`.toLowerCase().includes(needle)) return [{ project, shown: projectSessions }];
		const matching = projectSessions.filter((session) => session.title.toLowerCase().includes(needle));
		return matching.length > 0 ? [{ project, shown: matching }] : [];
	});

	return (
		<aside aria-label="Projects and sessions" className="flex w-panel shrink-0 flex-col border-r border-line bg-surface">
			<div className="flex flex-col gap-card border-b border-line p-gutter">
				<div className="flex items-center justify-between gap-stack">
					<h2 className="text-heading font-medium text-ink">
						Projects <span className="font-normal text-muted">{projects?.length ?? ""}</span>
					</h2>
					<button
						type="button"
						onClick={props.onChooseFolder}
						className="inline-flex h-control shrink-0 items-center gap-rail-gap rounded-full bg-inverse px-card text-body text-on-inverse"
					>
						<Icon name="folder" className="size-icon-sm" />
						Open folder…
					</button>
				</div>
				<label className="flex h-field items-center gap-stack rounded-field border border-line bg-card px-card text-heading focus-within:border-accent">
					<Icon name="search" className="size-icon text-muted" />
					<span className="sr-only">Find a project or session</span>
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Find a project or session"
						className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
					/>
				</label>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto p-gutter">
				{projects?.length === 0 && <p className="text-body text-muted">No projects yet. Open a folder to start.</p>}
				{!projects && <p className="text-body text-muted">Reading projects…</p>}
				{projects && projects.length > 0 && visible.length === 0 && (
					<p className="text-body text-muted">Nothing matches “{query.trim()}”.</p>
				)}
				<ul className="flex flex-col gap-rail-gap">
					{visible.map(({ project, shown }) => {
						const isExpanded = project.isAvailable && (expanded.has(project.root) || (needle !== "" && shown.length > 0));
						const isOpen = project.root === openRoot;
						return (
							<li key={project.root}>
								<div className="group flex items-center gap-rail-gap">
									<button
										type="button"
										onClick={() => (isExpanded && isOpen ? props.onCollapseProject(project.root) : props.onOpenProject(project.root))}
										disabled={!project.isAvailable}
										aria-expanded={project.isAvailable ? isExpanded : undefined}
										title={project.root}
										className="flex h-group min-w-0 flex-1 items-center gap-stack rounded-control px-rail-gap text-left hover:bg-field disabled:hover:bg-transparent"
									>
										<Icon name={isExpanded ? "chevron-down" : "chevron-right"} className="size-icon-sm text-muted" />
										<Icon name="folder" className={`size-icon ${project.isAvailable ? "text-accent-text" : "text-muted"}`} />
										<span className={`min-w-0 flex-1 truncate text-heading font-medium ${project.isAvailable ? "text-ink" : "text-muted"}`}>
											{project.name}
										</span>
										{!project.isAvailable && (
											<span className="inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full bg-issue px-stack text-meta text-issue-text">
												<Icon name="alert" className="size-icon-sm" />
												Unavailable
											</span>
										)}
									</button>
									<button
										type="button"
										onClick={() => props.onRemoveProject(project.root)}
										aria-label={`Remove ${project.name} from the list`}
										title="Remove from list (the folder stays on disk)"
										className={ROW_ACTION_CLASS}
									>
										<Icon name="close" className="size-icon-sm" />
									</button>
								</div>
								{isExpanded && (
									<ul className="ml-header-x flex flex-col border-l border-line pl-rail-gap">
										{shown.map((session) => {
											const label = statusLabel(session.status);
											const isCurrent = session.id === sessionId;
											return (
												<li key={session.id} className="group flex items-center gap-rail-gap">
													<button
														type="button"
														onClick={() => props.onOpenSession(project.root, session.id)}
														aria-current={isCurrent}
														className={`flex h-control min-w-0 flex-1 items-center gap-stack rounded-control px-stack text-left ${
															isCurrent ? "bg-accent-soft text-accent-text" : "text-copy hover:bg-field"
														}`}
													>
														<span className={`size-port shrink-0 rounded-full ${STATUS_DOTS[session.status] ?? ""}`}>
															{label && <span className="sr-only">{label}</span>}
														</span>
														<span className="min-w-0 flex-1 truncate text-body">{session.title}</span>
														<span className="shrink-0 text-meta text-muted">{formatTimeAgo(session.updatedAt)}</span>
													</button>
													<button
														type="button"
														onClick={() => props.onDeleteSession(session)}
														aria-label={`Delete ${session.title}`}
														className={ROW_ACTION_CLASS}
													>
														<Icon name="trash" className="size-icon-sm" />
													</button>
												</li>
											);
										})}
										<li>
											<button
												type="button"
												onClick={() => props.onNewSession(project.root)}
												className="flex h-control w-full items-center gap-stack rounded-control px-stack text-body text-muted hover:bg-field hover:text-ink"
											>
												<Icon name="plus" className="size-icon-sm" />
												New session
											</button>
										</li>
									</ul>
								)}
							</li>
						);
					})}
				</ul>
			</div>
		</aside>
	);
}
