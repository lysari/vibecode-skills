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
		document.documentElement.dataset.theme = isDark ? "dark" : "light";
		writeStored(THEME_KEY, isDark ? "dark" : "light");
	}, [isDark]);

	return { isDark, setIsDark };
}
