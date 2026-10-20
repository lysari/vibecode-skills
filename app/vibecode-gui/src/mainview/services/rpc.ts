import { Electroview } from "electrobun/view";
import type { RunEventMessage, SkillsRPC } from "../../shared/interfaces/skills-rpc.interface";

const MAX_REQUEST_MS = 15_000;

const runEventListeners = new Set<(message: RunEventMessage) => void>();

const rpc = Electroview.defineRPC<SkillsRPC>({
	maxRequestTime: MAX_REQUEST_MS,
	handlers: {
		requests: {},
		messages: {
			runEvent: (message) => {
				for (const listener of runEventListeners) listener(message);
			},
		},
	},
});

new Electroview({ rpc });

export const skillsApi = rpc.request;

export function onRunEvent(listener: (message: RunEventMessage) => void): () => void {
	runEventListeners.add(listener);
	return () => runEventListeners.delete(listener);
}
