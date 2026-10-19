const MINUTE_MS = 60_000;
const HOUR_MINUTES = 60;
const DAY_HOURS = 24;

export function formatTimeAgo(time: number): string {
	const minutes = Math.round((Date.now() - time) / MINUTE_MS);
	if (minutes < 1) return "just now";
	if (minutes < HOUR_MINUTES) return `${minutes} min ago`;
	const hours = Math.round(minutes / HOUR_MINUTES);
	if (hours < DAY_HOURS) return `${hours} h ago`;
	return `${Math.round(hours / DAY_HOURS)} d ago`;
}
