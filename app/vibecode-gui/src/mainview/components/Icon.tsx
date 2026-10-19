const ICON_PATHS = {
	logo: (
		<>
			<rect x="3" y="3" width="8" height="6" rx="1.5" />
			<rect x="13" y="15" width="8" height="6" rx="1.5" />
			<path d="M7 9v3a3 3 0 0 0 3 3h3" />
			<path d="M17 15v-3a3 3 0 0 0-3-3h-3" />
		</>
	),
	skills: (
		<>
			<path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z" />
			<path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
		</>
	),
	plus: <path d="M12 5v14M5 12h14" />,
	refresh: (
		<>
			<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
			<path d="M3 12A9 9 0 0 1 18.5 5.8L21 8" />
			<path d="M21 3v5h-5M3 21v-5h5" />
		</>
	),
	sun: (
		<>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
		</>
	),
	moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
	back: <path d="M15 18l-6-6 6-6" />,
	"chevron-down": <path d="M6 9l6 6 6-6" />,
	"chevron-up": <path d="M18 15l-6-6-6 6" />,
	"chevron-right": <path d="M9 18l6-6-6-6" />,
	search: (
		<>
			<circle cx="11" cy="11" r="7" />
			<path d="M20 20l-3.5-3.5" />
		</>
	),
	folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
	file: (
		<>
			<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
			<path d="M14 3v5h5M9 13h6M9 17h4" />
		</>
	),
	star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
	map: (
		<>
			<rect x="9" y="3" width="6" height="5" rx="1" />
			<rect x="3" y="16" width="6" height="5" rx="1" />
			<rect x="15" y="16" width="6" height="5" rx="1" />
			<path d="M12 8v4M6 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
		</>
	),
	read: (
		<>
			<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z" />
			<path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z" />
		</>
	),
	edit: (
		<>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
		</>
	),
	rename: <path d="M4 7V5h10v2M9 5v14M7 19h4M15 13h6M18 10v9" />,
	trash: (
		<>
			<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
			<path d="M10 11v5M14 11v5" />
		</>
	),
	check: <path d="M5 12l5 5L20 7" />,
	alert: (
		<>
			<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
			<path d="M12 9v4M12 17h.01" />
		</>
	),
	clock: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</>
	),
	cycle: (
		<>
			<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
			<path d="M21 3v5h-5" />
		</>
	),
	link: (
		<>
			<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
			<path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
		</>
	),
	close: <path d="M18 6L6 18M6 6l12 12" />,
};

export type IconName = keyof typeof ICON_PATHS;

interface IconProps {
	name: IconName;
	className?: string;
	isFilled?: boolean;
}

export function Icon({ name, className = "size-icon", isFilled = false }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill={isFilled ? "currentColor" : "none"}
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`shrink-0 ${className}`}
			aria-hidden="true"
		>
			{ICON_PATHS[name]}
		</svg>
	);
}
