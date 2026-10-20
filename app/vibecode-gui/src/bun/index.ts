import { join } from "node:path";
import { BrowserView, BrowserWindow, Updater, Utils } from "electrobun/main";
import type { SkillsRPC } from "../shared/interfaces/skills-rpc.interface";
import { Chat } from "./chat";
import { MockAgentRunner } from "./mock-agent-runner";
import { assertRecentProject, openProject, readRoots, readWorkspace, removeProject } from "./workspace";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const STORE_PATH = join(Utils.paths.userData, "projects.json");
const SESSIONS_ROOT = join(Utils.paths.userData, "sessions");
const HOME = Utils.paths.home;

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'hutch run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

const chat = new Chat({
	sessionsRoot: SESSIONS_ROOT,
	runner: new MockAgentRunner(),
	onEvent: (message) => rpc.send.runEvent(message),
});

async function inRecentProject<T>(projectRoot: string, request: () => T | Promise<T>): Promise<T> {
	await assertRecentProject(STORE_PATH, projectRoot);
	return request();
}

const rpc = BrowserView.defineRPC<SkillsRPC>({
	handlers: {
		requests: {
			chooseFolder: async () => {
				const paths = await Utils.openFileDialog({
					canChooseFiles: false,
					canChooseDirectory: true,
					allowsMultipleSelection: false,
				});
				return paths.find(Boolean) ?? null;
			},
			readWorkspace: () => readWorkspace(STORE_PATH, HOME),
			openProject: ({ root }) => openProject(STORE_PATH, HOME, root),
			removeProject: ({ root }) => removeProject(STORE_PATH, HOME, root),
			listSessions: ({ projectRoot }) => inRecentProject(projectRoot, () => chat.list(projectRoot)),
			createSession: ({ projectRoot }) => inRecentProject(projectRoot, () => chat.create(projectRoot)),
			readSession: ({ projectRoot, id }) => inRecentProject(projectRoot, () => chat.load(projectRoot, id)),
			renameSession: ({ projectRoot, id, title }) => inRecentProject(projectRoot, () => chat.rename(projectRoot, id, title)),
			deleteSession: ({ projectRoot, id }) => inRecentProject(projectRoot, () => chat.remove(projectRoot, id)),
			saveSessionChoices: ({ projectRoot, id, ...choices }) =>
				inRecentProject(projectRoot, () => chat.choose(projectRoot, id, choices)),
			sendMessage: async ({ projectRoot, id, ...message }) => {
				const roots = await readRoots(STORE_PATH, HOME);
				if (roots.project !== projectRoot) throw new Error("Open the session's project first.");
				const session = await chat.send(roots, id, message);
				return { session, workspace: await readWorkspace(STORE_PATH, HOME) };
			},
			replyToAgent: ({ projectRoot, id, agentId, text }) =>
				inRecentProject(projectRoot, () => chat.reply(projectRoot, id, agentId, text)),
			retryAgent: ({ projectRoot, id, agentId }) => inRecentProject(projectRoot, () => chat.retry(projectRoot, id, agentId)),
			stopRun: ({ projectRoot, id }) => inRecentProject(projectRoot, () => chat.stop(projectRoot, id)),
		},
	},
});

const url = await getMainViewUrl();

new BrowserWindow({
	title: "Vibecode Skills",
	url,
	rpc,
	frame: {
		width: 1440,
		height: 900,
		x: 120,
		y: 80,
	},
});
