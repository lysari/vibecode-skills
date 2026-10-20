import { useEffect, useState } from "react";

const THEME_KEY = "vibecode-gui:theme";

function readStored(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStored(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {}
}

export function useTheme() {
	const [isDark, setIsDark] = useState(
		() => (readStored(THEME_KEY) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark",
	);

	useEffect(() => {
		const theme = isDark ? "dark" : "light";
		const root = document.documentElement;
		writeStored(THEME_KEY, theme);
		if (root.dataset.theme === theme) return;
		if (!root.dataset.theme || !("startViewTransition" in document)) {
			root.dataset.theme = theme;
			return;
		}
		document.startViewTransition(() => {
			root.dataset.theme = theme;
		});
	}, [isDark]);

	return { isDark, setIsDark };
}
