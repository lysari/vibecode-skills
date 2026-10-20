export const SESSION_VIEW_LABELS = { chat: "Chat", tree: "Tree" } as const;

export type SessionView = keyof typeof SESSION_VIEW_LABELS;
