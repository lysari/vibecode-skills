import { join } from "node:path";
import { BrowserView, BrowserWindow, Updater, Utils } from "electrobun/main";
import type { Workspace } from "../shared/project.interface";
import type { SkillsRPC } from "../shared/skills-rpc.interface";
import { createSkill, deleteSkill, installSkill, readSkillFile, renameSkill, saveSkill, type SkillRoots } from "./skills";
import { openProject, readRoots, readWorkspace, removeProject, saveFavourites, setLibraryRoot } from "./workspace";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const STORE_PATH = join(Utils.paths.userData, "projects.json");

// Check if Vite dev server is running for HMR
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

async function changeProject(change: (roots: SkillRoots) => Promise<void>): Promise<Workspace> {
	await change(await readRoots(STORE_PATH));
	return readWorkspace(STORE_PATH);
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
			readWorkspace: () => readWorkspace(STORE_PATH),
			openProject: ({ root }) => openProject(STORE_PATH, root),
			removeProject: ({ root }) => removeProject(STORE_PATH, root),
			setLibraryRoot: ({ root }) => setLibraryRoot(STORE_PATH, root),
			saveFavourites: ({ favourites }) => saveFavourites(STORE_PATH, favourites),
			readSkillFile: async (params) => readSkillFile(await readRoots(STORE_PATH), params),
			saveSkill: (params) => changeProject((roots) => saveSkill(roots.project, params)),
			createSkill: (params) => changeProject((roots) => createSkill(roots.project, params)),
			renameSkill: (params) => changeProject((roots) => renameSkill(roots, params)),
			deleteSkill: (params) => changeProject((roots) => deleteSkill(roots.project, params, Utils.moveToTrash)),
			installSkill: (params) => changeProject((roots) => installSkill(roots, params, Utils.moveToTrash)),
		},
	},
});

// Create the main application window
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
