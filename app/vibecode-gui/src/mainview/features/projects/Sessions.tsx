import type { Project } from "../../../shared/interfaces/project.interface";
import type { SessionStatus, SessionSummary } from "../../../shared/interfaces/session.interface";
import { formatTimeAgo } from "./time-ago";
import { Icon } from "../../components/Icon";
import { AGENT_STATUS_STYLES } from "../../components/StatusPill";
import { usePresence } from "../../hooks/use-presence";

const STATUS_DOTS: Partial<Record<SessionStatus, string>> = {
	running: "bg-info-text motion-safe:animate-pulse",
	"needs-input": "bg-warning-dot",
	failed: "bg-issue-text",
};
const ICON_BUTTON_CLASS =
	"size-control shrink-0 items-center justify-center rounded-control text-muted transition hover:bg-sidebar-hover hover:text-ink active:scale-press";

interface SessionsProps {
	project: Project | null;
	sessions: Record<string, SessionSummary[]>;
	sessionId: string | null;
	onOpenSession: (root: string, id: string) => void;
	onNewSession: (root: string) => void;
	onDeleteSession: (session: SessionSummary) => void;
}

function statusLabel(status: SessionStatus): string | null {
	return status === "running" || status === "needs-input" || status === "failed" ? AGENT_STATUS_STYLES[status].label : null;
}

export function Sessions({ project, sessions, sessionId, onOpenSession, onNewSession, onDeleteSession }: SessionsProps) {
	const panel = usePresence(project);
	if (!panel.shown) return null;
	const shown = panel.shown;
	const list = sessions[shown.root] ?? [];

	return (
		<aside
			{...panel.presence}
			aria-label={`Sessions in ${shown.name}`}
			className="flex w-panel shrink-0 justify-end overflow-hidden data-enter:animate-expand data-exit:pointer-events-none data-exit:animate-collapse"
		>
			<div className="flex w-panel shrink-0 flex-col border-r border-line bg-surface">
				<div className="electrobun-webkit-app-region-drag flex h-header shrink-0 items-center gap-stack pl-header-x pr-gutter">
					<h2 className="min-w-0 flex-1 truncate text-heading font-semibold text-ink">
						Sessions <span className="font-normal text-muted">{list.length}</span>
					</h2>
					<button
						type="button"
						onClick={() => onNewSession(shown.root)}
						aria-label="New session"
						title="New session"
						className={`electrobun-webkit-app-region-no-drag flex ${ICON_BUTTON_CLASS}`}
					>
						<Icon name="plus" />
					</button>
				</div>
				<nav aria-label="Sessions" className="min-h-0 flex-1 overflow-y-auto px-gutter pb-gutter">
					{list.length === 0 && <p className="animate-fade-in px-stack text-body text-muted">No sessions yet.</p>}
					<ul className="flex flex-col gap-rail-gap">
						{list.map((session) => {
							const label = statusLabel(session.status);
							const isCurrent = session.id === sessionId;
							return (
								<li
									key={session.id}
									className={`group flex animate-rise-in items-center rounded-item pr-rail-gap transition active:scale-press ${
										isCurrent ? "bg-sidebar-selected" : "hover:bg-sidebar-hover"
									}`}
								>
									<button
										type="button"
										onClick={() => onOpenSession(shown.root, session.id)}
										aria-current={isCurrent}
										className="flex h-group min-w-0 flex-1 items-center gap-item-gap rounded-item px-stack text-left"
									>
										<span className={`size-port shrink-0 rounded-full transition-colors ${STATUS_DOTS[session.status] ?? ""}`}>
											{label && <span className="sr-only">{label}</span>}
										</span>
										<span className="min-w-0 flex-1 truncate text-body text-ink">{session.title}</span>
										<span className="shrink-0 text-meta text-muted">{formatTimeAgo(session.updatedAt)}</span>
									</button>
									<button
										type="button"
										onClick={() => onDeleteSession(session)}
										aria-label={`Delete ${session.title}`}
										title="Delete session"
										className={`hidden animate-fade-in group-focus-within:flex group-hover:flex ${ICON_BUTTON_CLASS}`}
									>
										<Icon name="trash" className="size-icon-sm" />
									</button>
								</li>
							);
						})}
					</ul>
				</nav>
			</div>
		</aside>
	);
}
