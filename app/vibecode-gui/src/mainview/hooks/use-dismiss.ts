import { useEffect, type RefObject } from "react";

export function useDismiss(ref: RefObject<HTMLElement>, isOpen: boolean, onDismiss: () => void): void {
	useEffect(() => {
		if (!isOpen) return;
		const close = (event: MouseEvent | KeyboardEvent) => {
			const isOutside = event instanceof MouseEvent && !ref.current?.contains(event.target as Node);
			if (isOutside || (event instanceof KeyboardEvent && event.key === "Escape")) onDismiss();
		};
		document.addEventListener("mousedown", close);
		document.addEventListener("keydown", close);
		return () => {
			document.removeEventListener("mousedown", close);
			document.removeEventListener("keydown", close);
		};
	}, [ref, isOpen, onDismiss]);
}
