import { BrowserView, BrowserWindow, Updater, Utils } from "electrobun/main";
import type { SkillsRPC } from "../shared/skills-rpc.interface";
import {
	createSkill,
	deleteSkill,
	listSkills,
	readSkillFile,
	renameSkill,
	saveSkill,
} from "./skills";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

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

const rpc = BrowserView.defineRPC<SkillsRPC>({
	handlers: {
		requests: {
			listSkills,
			readSkillFile,
			saveSkill,
			createSkill,
			renameSkill,
			deleteSkill: (params) => deleteSkill(params, Utils.moveToTrash),
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
