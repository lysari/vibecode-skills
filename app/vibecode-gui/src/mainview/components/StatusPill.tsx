import type { AgentStatus } from "../../shared/interfaces/run.interface";
import { Icon, type IconName } from "./Icon";

interface StatusStyle {
	label: string;
	icon: IconName;
	className: string;
}

export const AGENT_STATUS_STYLES: Record<AgentStatus, StatusStyle> = {
	running: { label: "Running", icon: "loader", className: "bg-info text-info-text" },
	done: { label: "Done", icon: "check", className: "bg-valid text-valid-text" },
	"needs-input": { label: "Needs you", icon: "chat", className: "bg-warning-soft text-warning-text" },
	failed: { label: "Failed", icon: "alert", className: "bg-issue text-issue-text" },
	stopped: { label: "Stopped", icon: "stop", className: "bg-tile text-tile-icon" },
};

interface StatusPillProps {
	status: AgentStatus;
}

export function StatusPill({ status }: StatusPillProps) {
	const { label, icon, className } = AGENT_STATUS_STYLES[status];
	return (
		<span
			className={`inline-flex h-chip-h shrink-0 items-center rounded-full px-stack text-meta transition-colors duration-standard ease-standard ${className}`}
		>
			<span key={status} className="inline-flex animate-fade-in items-center gap-rail-gap">
				<Icon name={icon} className={`size-icon-sm ${status === "running" ? "motion-safe:animate-spin" : ""}`} />
				{label}
			</span>
		</span>
	);
}
