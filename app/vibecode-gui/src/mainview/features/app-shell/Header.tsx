import { useState } from "react";
import { SESSION_VIEW_LABELS, type SessionView } from "./session-view";
import { Icon, type IconName } from "../../components/Icon";
import { usePresence } from "../../hooks/use-presence";

interface HeaderProps {
	projectName: string | null;
	title: string | null;
	view: SessionView;
	isSidebarOpen: boolean;
	onShowSidebar: () => void;
	onView: (view: SessionView) => void;
	onRename: (title: string) => void;
}

function ViewButton({ view, icon, current, onView }: { view: SessionView; icon: IconName; current: SessionView; onView: (view: SessionView) => void }) {
	const isActive = view === current;
	return (
		<button
			type="button"
			aria-pressed={isActive}
			onClick={() => onView(view)}
			className={`relative inline-flex h-control items-center justify-center gap-rail-gap rounded-full px-card text-body transition active:scale-press ${
				isActive ? "text-accent-text" : "text-muted hover:bg-field hover:text-ink"
			}`}
		>
			<Icon name={icon} className="size-icon-sm" />
			{SESSION_VIEW_LABELS[view]}
		</button>
	);
}

export function Header({ projectName, title, view, isSidebarOpen, onShowSidebar, onView, onRename }: HeaderProps) {
	const [draft, setDraft] = useState<string | null>(null);
	const sidebarToggle = usePresence(!isSidebarOpen);

	function commit() {
		if (draft !== null && draft.trim() && draft.trim() !== title) onRename(draft.trim());
		setDraft(null);
	}

	return (
		<header
			className={`electrobun-webkit-app-region-drag relative flex h-header shrink-0 items-center gap-card border-b border-line bg-surface pr-header-x transition-padding duration-panel ease-standard ${
				isSidebarOpen ? "pl-header-x" : "pl-traffic-lights-toggle"
			}`}
		>
			{sidebarToggle.shown && (
				<div
					{...sidebarToggle.presence}
					className="absolute inset-y-0 left-traffic-lights flex items-center data-enter:animate-pop-in data-exit:pointer-events-none data-exit:animate-pop-out"
				>
					<button
						type="button"
						onClick={onShowSidebar}
						aria-label="Show sidebar"
						title="Show sidebar"
						className="electrobun-webkit-app-region-no-drag flex size-control shrink-0 items-center justify-center rounded-control text-muted transition hover:bg-field hover:text-ink active:scale-press"
					>
						<Icon name="sidebar" />
					</button>
				</div>
			)}
			<h1 className="flex min-w-0 flex-1 items-center gap-stack text-crumb font-semibold text-ink">
				{projectName && (
					<span key={projectName} className="min-w-0 animate-fade-in truncate">
						{projectName}
					</span>
				)}
				{projectName && title !== null && <span aria-hidden="true">/</span>}
				{title !== null && draft === null && (
					<button
						type="button"
						onClick={() => setDraft(title)}
						title="Rename session"
						className="electrobun-webkit-app-region-no-drag group flex min-w-0 items-center gap-stack text-left"
					>
						<span key={title} className="animate-fade-in truncate">
							{title}
						</span>
						<Icon
							name="edit"
							className="size-icon-sm text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
						/>
					</button>
				)}
				{title !== null && draft !== null && (
					<label className="electrobun-webkit-app-region-no-drag block min-w-0 flex-1">
						<span className="sr-only">Session title</span>
						<input
							autoFocus
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onBlur={commit}
							onKeyDown={(event) => {
								if (event.key === "Enter") commit();
								if (event.key === "Escape") setDraft(null);
							}}
							className="w-full rounded-field bg-field px-rail-gap text-crumb font-semibold text-ink outline-none"
						/>
					</label>
				)}
			</h1>
			{title !== null && (
				<div className="electrobun-webkit-app-region-no-drag relative grid shrink-0 animate-fade-in grid-cols-2">
					<span
						aria-hidden="true"
						className={`absolute inset-y-0 left-0 w-1/2 rounded-full bg-accent-soft transition-transform duration-standard ease-spring ${
							view === "tree" ? "translate-x-full" : ""
						}`}
					/>
					<ViewButton view="chat" icon="chat" current={view} onView={onView} />
					<ViewButton view="tree" icon="map" current={view} onView={onView} />
				</div>
			)}
		</header>
	);
}
