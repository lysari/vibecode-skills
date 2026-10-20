import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { PresenceAttributes } from "../hooks/use-presence";

interface DialogProps {
	title: string;
	confirmLabel: string;
	isDanger?: boolean;
	children: ReactNode;
	presence: PresenceAttributes;
	onConfirm: () => Promise<void> | void;
	onCancel: () => void;
}

export function Dialog({ title, confirmLabel, isDanger = false, children, presence, onConfirm, onCancel }: DialogProps) {
	const titleId = useId();
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		formRef.current?.querySelector<HTMLElement>("input, textarea, select, [type=submit]")?.focus();
	}, []);

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setIsBusy(true);
		setError(null);
		try {
			await onConfirm();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : String(cause));
			setIsBusy(false);
		}
	}

	return (
		<div
			{...presence}
			className="group fixed inset-0 z-20 flex items-center justify-center bg-scrim data-enter:animate-fade-in data-exit:pointer-events-none data-exit:animate-fade-out"
			onKeyDown={(event) => event.key === "Escape" && onCancel()}
		>
			<form
				ref={formRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				onSubmit={handleSubmit}
				className="flex w-dialog flex-col gap-card rounded-node bg-card p-header-x shadow-popover group-data-enter:animate-pop-in group-data-exit:animate-pop-out"
			>
				<h2 id={titleId} className="text-node font-semibold text-ink">
					{title}
				</h2>
				<div className="flex flex-col gap-card text-body text-copy">{children}</div>
				{error && (
					<p role="alert" className="animate-drop-in bg-issue px-stack py-rail-gap text-meta text-issue-text">
						{error}
					</p>
				)}
				<div className="flex justify-end gap-stack">
					<button
						type="button"
						onClick={onCancel}
						className="h-control rounded-full border border-line-control px-node-pad text-body text-ink transition hover:bg-field active:scale-press"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isBusy}
						className={`h-control rounded-full px-node-pad text-body transition active:scale-press disabled:opacity-60 ${
							isDanger ? "bg-issue-text text-on-inverse" : "bg-inverse text-on-inverse"
						}`}
					>
						{confirmLabel}
					</button>
				</div>
			</form>
		</div>
	);
}
