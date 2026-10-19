import type { RPCSchema } from "electrobun/rpc";
import type { SkillCreate, SkillForm, SkillLibrary } from "./skill.interface";

export interface SkillsRPC {
	bun: RPCSchema<{
		requests: {
			listSkills: { params: undefined; response: SkillLibrary };
			readSkillFile: { params: { dir: string; path: string }; response: string };
			saveSkill: { params: { dir: string; form: SkillForm }; response: SkillLibrary };
			createSkill: { params: SkillCreate; response: SkillLibrary };
			renameSkill: { params: { dir: string; name: string }; response: SkillLibrary };
			deleteSkill: { params: { dir: string }; response: SkillLibrary };
		};
	}>;
	webview: RPCSchema;
}
