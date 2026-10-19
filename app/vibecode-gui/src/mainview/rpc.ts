import { Electroview } from "electrobun/view";
import type { SkillsRPC } from "../shared/skills-rpc.interface";

const MAX_REQUEST_MS = 15_000;

const rpc = Electroview.defineRPC<SkillsRPC>({
	maxRequestTime: MAX_REQUEST_MS,
	handlers: { requests: {}, messages: {} },
});

new Electroview({ rpc });

export const skillsApi = rpc.request;
