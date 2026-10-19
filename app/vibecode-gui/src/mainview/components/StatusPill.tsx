import { Icon } from "./Icon";

export type StatusTone = "valid" | "issue" | "unsaved";

interface StatusPillProps {
	tone: StatusTone;
}

export function StatusPill({ tone }: StatusPillProps) {
	if (tone === "issue") {
		return (
			<span className="inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full bg-issue px-stack text-meta text-issue-text">
				<Icon name="alert" className="size-icon-sm" />
				Issues
			</span>
		);
	}
	if (tone === "unsaved") {
		return (
			<span className="inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full bg-unsaved px-stack text-meta text-unsaved-text">
				<Icon name="clock" className="size-icon-sm" />
				Unsaved
			</span>
		);
	}
	return (
		<span className="inline-flex h-chip-h shrink-0 items-center gap-rail-gap rounded-full bg-valid px-stack text-meta text-valid-text">
			<Icon name="check" className="size-icon-sm" />
			Valid
		</span>
	);
}
