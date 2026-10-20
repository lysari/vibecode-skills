import { useLayoutEffect, useRef, useState } from "react";
import type { RunView, ThreadItem } from "../../../shared/interfaces/run-view.interface";
import { Icon } from "../../components/Icon";
import { ThreadEntry } from "../../components/ThreadEntry";

const PIN_DISTANCE_PX = 48;

interface ChatViewProps {
	thread: ThreadItem[];
	view: RunView;
	isRunning: boolean;
	onOpenAgent: (agentId: string) => void;
	onReply: (agentId: string) => void;
	onRetry: (agentId: string) => void;
}

export function ChatView({ thread, view, isRunning, onOpenAgent, onReply, onRetry }: ChatViewProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [isPinned, setIsPinned] = useState(true);
	const last = thread[thread.length - 1];
	const streamingKey = isRunning && last?.kind === "text" ? last.key : null;

	useLayoutEffect(() => {
		const scroller = scrollRef.current;
		if (scroller && isPinned) scroller.scrollTop = scroller.scrollHeight;
	});

	function handleScroll() {
		const scroller = scrollRef.current;
		if (scroller) setIsPinned(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < PIN_DISTANCE_PX);
	}

	return (
		<div className="relative min-h-0 flex-1">
			<div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-header-x py-header-x">
				<ol aria-label="Messages" className="mx-auto flex max-w-thread flex-col gap-card">
					{thread.length === 0 && (
						<li className="flex flex-col items-center gap-stack py-level text-center">
							<span className="flex size-logo items-center justify-center rounded-logo bg-accent-soft text-accent-text">
								<Icon name="chat" />
							</span>
							<p className="text-heading font-medium text-ink">Start the session</p>
							<p className="text-body text-muted">
								Describe the task below, pick the skills the agents should follow and the agent to run it.
							</p>
						</li>
					)}
					{thread.map((item) => (
						<li key={item.key}>
							<ThreadEntry
								item={item}
								view={view}
								isStreaming={item.key === streamingKey}
								onOpenAgent={onOpenAgent}
								onReply={onReply}
								onRetry={onRetry}
							/>
						</li>
					))}
				</ol>
			</div>
			{!isPinned && (
				<button
					type="button"
					onClick={() => {
						setIsPinned(true);
						scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
					}}
					className="absolute bottom-card left-1/2 inline-flex h-control -translate-x-1/2 items-center gap-rail-gap rounded-full border border-line-control bg-card px-card text-body text-ink shadow-popover hover:bg-field"
				>
					<Icon name="chevron-down" className="size-icon-sm" />
					Jump to latest
				</button>
			)}
		</div>
	);
}
