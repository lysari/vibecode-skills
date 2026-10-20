import { useRef, useState } from "react";
import { AGENT_CLIS } from "../../../shared/interfaces/run.interface";
import type { Skill } from "../../../shared/interfaces/skill.interface";
import { useDismiss } from "../../hooks/use-dismiss";
import { usePresence } from "../../hooks/use-presence";
import { Icon } from "../../components/Icon";

const DEFAULT_LABEL = "Default";

interface AgentPickerProps {
	agents: Skill[];
	agent: string | null;
	onChange: (agent: string | null) => void;
}

export function AgentPicker({ agents, agent, onChange }: AgentPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	useDismiss(ref, isOpen, () => setIsOpen(false));
	const menu = usePresence(isOpen);
	const options = [
		{ value: null, label: DEFAULT_LABEL, detail: "Built-in agent" },
		...agents.map((skill) => ({ value: skill.name, label: AGENT_CLIS[skill.name].label, detail: `${AGENT_CLIS[skill.name].command} · ${skill.name}` })),
	];
	const current = options.find((option) => option.value === agent) ?? options[0];

	function choose(value: string | null) {
		onChange(value);
		setIsOpen(false);
	}

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				className={`inline-flex h-control items-center gap-rail-gap rounded-full border px-card text-body transition active:scale-press ${
					isOpen ? "border-accent bg-accent-soft text-accent-text" : "border-line-control text-ink hover:bg-field"
				}`}
			>
				<Icon name="agent" className="size-icon-sm" />
				<span className="sr-only">Agent:</span>
				{current.label}
				<Icon
					name="chevron-up"
					className={`size-icon-sm text-muted transition-transform duration-standard ease-standard ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>
			{menu.shown && (
				<ul
					{...menu.presence}
					role="listbox"
					aria-label="Agent"
					className="absolute bottom-full left-0 z-10 mb-rail-gap flex w-panel origin-bottom-left flex-col rounded-card border border-line bg-card p-rail-gap shadow-popover data-enter:animate-pop-in data-exit:pointer-events-none data-exit:animate-pop-out"
				>
					{options.map((option) => {
						const isSelected = option.value === current.value;
						return (
							<li key={option.label} role="none">
								<button
									type="button"
									role="option"
									aria-selected={isSelected}
									onClick={() => choose(option.value)}
									className="flex w-full items-center gap-stack rounded-control px-stack py-rail-gap text-left transition-colors hover:bg-field"
								>
									<span className="flex size-tile shrink-0 items-center justify-center bg-tile text-tile-icon">
										<Icon name="agent" className="size-icon-sm" />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-body font-medium text-ink">{option.label}</span>
										<span className="block truncate font-mono text-code text-muted">{option.detail}</span>
									</span>
									{isSelected && <Icon name="check" className="size-icon-sm animate-pop-in text-accent-text" />}
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
