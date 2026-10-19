import { Icon } from "./Icon";

interface ProjectsHeaderProps {
	onChoose: () => void;
}

export function ProjectsHeader({ onChoose }: ProjectsHeaderProps) {
	return (
		<header className="flex h-header shrink-0 items-center gap-card border-b border-line bg-surface px-header-x">
			<div className="min-w-0">
				<p className="truncate text-meta text-muted">Open a folder to use its skills and add ours</p>
				<h1 className="truncate text-title font-medium text-ink">Projects</h1>
			</div>
			<button
				type="button"
				onClick={onChoose}
				className="ml-auto inline-flex h-control shrink-0 items-center gap-rail-gap rounded-full bg-inverse px-node-pad text-body text-on-inverse"
			>
				<Icon name="folder" className="size-icon-sm" />
				Open folder…
			</button>
		</header>
	);
}
