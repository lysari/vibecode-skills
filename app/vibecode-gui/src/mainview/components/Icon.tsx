const ICON_PATHS = {
	logo: (
		<>
			<rect x="3" y="3" width="8" height="6" rx="1.5" />
			<rect x="13" y="15" width="8" height="6" rx="1.5" />
			<path d="M7 9v3a3 3 0 0 0 3 3h3" />
			<path d="M17 15v-3a3 3 0 0 0-3-3h-3" />
		</>
	),
	sidebar: (
		<>
			<rect x="3" y="4" width="18" height="16" rx="2" />
			<path d="M9 4v16" />
		</>
	),
	skills: (
		<>
			<path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z" />
			<path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
		</>
	),
	chat: <path d="M4 5h16v11H9l-5 4z" />,
	send: <path d="M12 19V5M6 11l6-6 6 6" />,
	stop: <rect x="7" y="7" width="10" height="10" rx="1.5" />,
	agent: (
		<>
			<rect x="4" y="8" width="16" height="12" rx="3" />
			<path d="M12 4v4M9 13v2M15 13v2" />
		</>
	),
	tool: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.3-5.3a4 4 0 0 0 5.1-5.4l-2.5 2.5-2.5-2.5z" />,
	loader: <path d="M12 3a9 9 0 1 0 9 9" />,
	plus: <path d="M12 5v14M5 12h14" />,
	minus: <path d="M5 12h14" />,
	sun: (
		<>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
		</>
	),
	moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
	"chevron-down": <path d="M6 9l6 6 6-6" />,
	"chevron-up": <path d="M18 15l-6-6-6 6" />,
	search: (
		<>
			<circle cx="11" cy="11" r="7" />
			<path d="M20 20l-3.5-3.5" />
		</>
	),
	folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
	"folder-plus": (
		<>
			<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
			<path d="M12 10v6M9 13h6" />
		</>
	),
	map: (
		<>
			<rect x="9" y="3" width="6" height="5" rx="1" />
			<rect x="3" y="16" width="6" height="5" rx="1" />
			<rect x="15" y="16" width="6" height="5" rx="1" />
			<path d="M12 8v4M6 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
		</>
	),
	edit: (
		<>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
		</>
	),
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
	close: <path d="M18 6L6 18M6 6l12 12" />,
};

export type IconName = keyof typeof ICON_PATHS;

interface IconProps {
	name: IconName;
	className?: string;
}

export function Icon({ name, className = "size-icon" }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
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
