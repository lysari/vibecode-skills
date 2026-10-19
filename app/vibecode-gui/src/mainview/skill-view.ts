export const SKILL_VIEW_LABELS = { map: "Map", read: "Read", edit: "Edit" } as const;

export type SkillView = keyof typeof SKILL_VIEW_LABELS;
