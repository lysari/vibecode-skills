import { Icon } from "./Icon";

interface RailProps {
	isDark: boolean;
	isScanning: boolean;
	onNewSkill: () => void;
	onRescan: () => void;
	onToggleTheme: () => void;
}

const ITEM_CLASS =
	"flex h-rail-item-h w-rail-item-w flex-col items-center justify-center gap-rail-gap rounded-rail text-rail text-muted hover:bg-field disabled:opacity-60";

export function Rail({ isDark, isScanning, onNewSkill, onRescan, onToggleTheme }: RailProps) {
	return (
		<nav
			aria-label="App"
			className="flex w-rail shrink-0 flex-col items-center gap-rail-gap border-r border-line bg-surface py-node-pad"
		>
			<div className="mb-stack flex size-logo items-center justify-center rounded-logo bg-inverse text-on-inverse">
				<Icon name="logo" />
			</div>
			<div
				aria-current="page"
				className="flex h-rail-item-h w-rail-item-w flex-col items-center justify-center gap-rail-gap rounded-rail bg-accent-soft text-rail text-accent-text"
			>
				<Icon name="skills" />
				Skills
			</div>
			<button type="button" onClick={onNewSkill} className={ITEM_CLASS}>
				<Icon name="plus" />
				New
			</button>
			<button type="button" onClick={onRescan} disabled={isScanning} className={ITEM_CLASS}>
				<Icon name="refresh" className={`size-icon ${isScanning ? "motion-safe:animate-spin" : ""}`} />
				Rescan
			</button>
			<button type="button" onClick={onToggleTheme} aria-pressed={isDark} className={`mt-auto ${ITEM_CLASS}`}>
				<Icon name={isDark ? "sun" : "moon"} />
				{isDark ? "Light" : "Dark"}
			</button>
		</nav>
	);
}
