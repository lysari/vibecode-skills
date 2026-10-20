import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { SessionChoices } from "../../../shared/interfaces/session.interface";
import type { Skill } from "../../../shared/interfaces/skill.interface";
import type { AgentNode } from "../../../shared/interfaces/run-view.interface";
import { AgentPicker } from "./AgentPicker";
import { Icon } from "../../components/Icon";
import { SkillPicker } from "./SkillPicker";

interface ComposerProps {
	choices: SessionChoices;
	skills: Skill[];
	agents: Skill[];
	isRunning: boolean;
	replyTo: AgentNode | null;
	focusKey: number;
	onChoose: (choices: SessionChoices) => void;
	onSend: (text: string) => Promise<boolean>;
	onStop: () => void;
	onCancelReply: () => void;
}

export function Composer(props: ComposerProps) {
	const { choices, skills, agents, isRunning, replyTo, focusKey } = props;
	const [draft, setDraft] = useState("");
	const [isSending, setIsSending] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const canSend = draft.trim() !== "" && !isSending && (!isRunning || replyTo !== null);

	useEffect(() => {
		if (focusKey > 0) textareaRef.current?.focus();
	}, [focusKey]);

	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		textarea.style.height = "auto";
		textarea.style.height = `${textarea.scrollHeight}px`;
	}, [draft]);

	async function send() {
		if (!canSend) return;
		setIsSending(true);
		if (await props.onSend(draft)) setDraft("");
		setIsSending(false);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
		event.preventDefault();
		send();
	}

	return (
		<div className="shrink-0 px-header-x pb-header-x pt-stack">
			<div className="mx-auto flex max-w-thread flex-col gap-stack rounded-node border border-line-control bg-card p-card shadow-card focus-within:border-accent">
				{(replyTo || choices.skills.length > 0) && (
					<div className="flex flex-wrap items-center gap-rail-gap">
						{replyTo && (
							<span className="inline-flex h-chip-h min-w-0 max-w-full items-center gap-rail-gap rounded-full bg-warning-soft pl-stack pr-rail-gap text-meta text-warning-text">
								<Icon name="chat" className="size-icon-sm" />
								<span className="truncate">
									Replying to <span className="font-medium">{replyTo.name}</span>
									{replyTo.question && `: ${replyTo.question}`}
								</span>
								<button
									type="button"
									onClick={props.onCancelReply}
									aria-label="Cancel the reply"
									className="flex size-icon shrink-0 items-center justify-center rounded-full hover:bg-field"
								>
									<Icon name="close" className="size-icon-sm" />
								</button>
							</span>
						)}
						{choices.skills.map((name) => (
							<span
								key={name}
								className="inline-flex h-chip-h items-center gap-rail-gap rounded-full bg-accent-soft pl-stack pr-rail-gap font-mono text-code text-accent-text"
							>
								/{name}
								<button
									type="button"
									onClick={() => props.onChoose({ ...choices, skills: choices.skills.filter((other) => other !== name) })}
									aria-label={`Remove ${name}`}
									className="flex size-icon items-center justify-center rounded-full hover:bg-field"
								>
									<Icon name="close" className="size-icon-sm" />
								</button>
							</span>
						))}
					</div>
				)}
				<label className="block">
					<span className="sr-only">Message</span>
					<textarea
						ref={textareaRef}
						rows={1}
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={replyTo ? `Answer ${replyTo.name}…` : isRunning ? "The agents are working…" : "Describe the task. Enter sends, Shift+Enter adds a line."}
						className="block max-h-composer w-full resize-none bg-transparent px-rail-gap text-body text-ink outline-none placeholder:text-muted"
					/>
				</label>
				<div className="flex items-center gap-stack">
					<SkillPicker
						skills={skills}
						selected={choices.skills}
						onChange={(selected) => props.onChoose({ ...choices, skills: selected })}
					/>
					<AgentPicker agents={agents} agent={choices.agent} onChange={(agent) => props.onChoose({ ...choices, agent })} />
					<span className="ml-auto flex items-center gap-stack">
						{isRunning && (
							<button
								type="button"
								onClick={props.onStop}
								className="inline-flex h-control items-center gap-rail-gap rounded-full border border-line-control px-card text-body text-ink hover:bg-field"
							>
								<Icon name="stop" className="size-icon-sm" />
								Stop
							</button>
						)}
						{(!isRunning || replyTo) && (
							<button
								type="button"
								onClick={send}
								disabled={!canSend}
								className="inline-flex h-control items-center gap-rail-gap rounded-full bg-inverse px-card text-body text-on-inverse disabled:opacity-40"
							>
								<Icon name="send" className="size-icon-sm" />
								{replyTo ? "Reply" : "Send"}
							</button>
						)}
					</span>
				</div>
			</div>
		</div>
	);
}
