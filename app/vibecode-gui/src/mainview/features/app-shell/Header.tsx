import { useState } from "react";
import { SESSION_VIEW_LABELS, type SessionView } from "./session-view";
import { Icon, type IconName } from "../../components/Icon";

interface HeaderProps {
	projectName: string;
	title: string;
	view: SessionView;
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
			className={`inline-flex h-control items-center gap-rail-gap rounded-full px-card text-body ${
				isActive ? "bg-accent-soft text-accent-text" : "text-muted hover:bg-field"
			}`}
		>
			<Icon name={icon} className="size-icon-sm" />
			{SESSION_VIEW_LABELS[view]}
		</button>
	);
}

export function Header({ projectName, title, view, onView, onRename }: HeaderProps) {
	const [draft, setDraft] = useState<string | null>(null);

	function commit() {
		if (draft !== null && draft.trim() && draft.trim() !== title) onRename(draft.trim());
		setDraft(null);
	}

	return (
		<header className="flex h-header shrink-0 items-center gap-card border-b border-line bg-surface px-header-x">
			<div className="min-w-0 flex-1">
				<p className="truncate text-meta text-muted">{projectName}</p>
				{draft === null ? (
					<h1 className="flex min-w-0 items-center gap-rail-gap">
						<button
							type="button"
							onClick={() => setDraft(title)}
							title="Rename session"
							className="group flex min-w-0 items-center gap-stack text-left text-title font-medium text-ink"
						>
							<span className="truncate">{title}</span>
							<Icon name="edit" className="size-icon-sm text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
						</button>
					</h1>
				) : (
					<label className="block">
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
							className="w-full rounded-field bg-field px-rail-gap text-title font-medium text-ink outline-none"
						/>
					</label>
				)}
			</div>
			<div className="flex shrink-0 items-center gap-rail-gap">
				<ViewButton view="chat" icon="chat" current={view} onView={onView} />
				<ViewButton view="tree" icon="map" current={view} onView={onView} />
			</div>
		</header>
	);
}
