const MINUTE_MS = 60_000;
const HOUR_MINUTES = 60;
const DAY_HOURS = 24;

/** A compact age for narrow lists, e.g. `now`, `5m`, `3h`, `2d`. */
export function formatTimeAgo(time: number): string {
	const minutes = Math.round((Date.now() - time) / MINUTE_MS);
	if (minutes < 1) return "now";
	if (minutes < HOUR_MINUTES) return `${minutes}m`;
	const hours = Math.round(minutes / HOUR_MINUTES);
	if (hours < DAY_HOURS) return `${hours}h`;
	return `${Math.round(hours / DAY_HOURS)}d`;
}
