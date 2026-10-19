import type { RPCSchema } from "electrobun/rpc";
import type { Workspace } from "./project.interface";
import type { SkillCreate, SkillForm, SkillRename } from "./skill.interface";

export interface SkillsRPC {
	bun: RPCSchema<{
		requests: {
			chooseFolder: { params: undefined; response: string | null };
			readWorkspace: { params: undefined; response: Workspace };
			openProject: { params: { root: string }; response: Workspace };
			removeProject: { params: { root: string }; response: Workspace };
			setLibraryRoot: { params: { root: string | null }; response: Workspace };
			saveFavourites: { params: { favourites: string[] }; response: void };
			readSkillFile: { params: { dir: string; path: string }; response: string };
			saveSkill: { params: { dir: string; form: SkillForm }; response: Workspace };
			createSkill: { params: SkillCreate; response: Workspace };
			renameSkill: { params: SkillRename; response: Workspace };
			deleteSkill: { params: { dir: string }; response: Workspace };
			installSkill: { params: { dir: string }; response: Workspace };
		};
	}>;
	webview: RPCSchema;
}
