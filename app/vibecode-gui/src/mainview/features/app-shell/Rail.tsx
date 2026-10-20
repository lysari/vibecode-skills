import { Icon } from "../../components/Icon";

interface RailProps {
	isPanelOpen: boolean;
	isDark: boolean;
	onTogglePanel: () => void;
	onNewSession: () => void;
	onOpenSettings: () => void;
	onToggleTheme: () => void;
}

const ITEM_CLASS =
	"flex h-rail-item-h w-rail-item-w flex-col items-center justify-center gap-rail-gap rounded-rail text-rail text-muted hover:bg-field";
const CURRENT_ITEM_CLASS =
	"flex h-rail-item-h w-rail-item-w flex-col items-center justify-center gap-rail-gap rounded-rail bg-accent-soft text-rail text-accent-text";

export function Rail({ isPanelOpen, isDark, onTogglePanel, onNewSession, onOpenSettings, onToggleTheme }: RailProps) {
	return (
		<nav
			aria-label="App"
			className="flex w-rail shrink-0 flex-col items-center gap-rail-gap border-r border-line bg-surface py-node-pad"
		>
			<div className="mb-stack flex size-logo items-center justify-center rounded-logo bg-inverse text-on-inverse">
				<Icon name="logo" />
			</div>
			<button
				type="button"
				onClick={onTogglePanel}
				aria-pressed={isPanelOpen}
				title={isPanelOpen ? "Hide projects and sessions" : "Show projects and sessions"}
				className={isPanelOpen ? CURRENT_ITEM_CLASS : ITEM_CLASS}
			>
				<Icon name="projects" />
				Projects
			</button>
			<button type="button" onClick={onNewSession} className={ITEM_CLASS}>
				<Icon name="plus" />
				New
			</button>
			<button type="button" onClick={onOpenSettings} className={`mt-auto ${ITEM_CLASS}`}>
				<Icon name="settings" />
				Settings
			</button>
			<button type="button" onClick={onToggleTheme} aria-pressed={isDark} className={ITEM_CLASS}>
				<Icon name={isDark ? "sun" : "moon"} />
				{isDark ? "Light" : "Dark"}
			</button>
		</nav>
	);
}
