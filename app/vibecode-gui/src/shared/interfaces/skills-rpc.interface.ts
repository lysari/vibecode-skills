import type { RPCSchema } from "electrobun/rpc";
import type { Workspace } from "./project.interface";
import type { RunEvent } from "./run.interface";
import type { Session, SessionChoices, SessionSummary } from "./session.interface";

interface SessionRef {
	projectRoot: string;
	id: string;
}

export interface RunEventMessage {
	projectRoot: string;
	sessionId: string;
	event: RunEvent;
}

export interface SkillsRPC {
	bun: RPCSchema<{
		requests: {
			chooseFolder: { params: undefined; response: string | null };
			readWorkspace: { params: undefined; response: Workspace };
			openProject: { params: { root: string }; response: Workspace };
			removeProject: { params: { root: string }; response: Workspace };
			listSessions: { params: { projectRoot: string }; response: SessionSummary[] };
			createSession: { params: { projectRoot: string }; response: Session };
			readSession: { params: SessionRef; response: Session };
			renameSession: { params: SessionRef & { title: string }; response: void };
			deleteSession: { params: SessionRef; response: void };
			saveSessionChoices: { params: SessionRef & SessionChoices; response: void };
			sendMessage: { params: SessionRef & SessionChoices & { text: string }; response: { session: Session; workspace: Workspace } };
			replyToAgent: { params: SessionRef & { agentId: string; text: string }; response: Session };
			retryAgent: { params: SessionRef & { agentId: string }; response: void };
			stopRun: { params: SessionRef; response: void };
		};
	}>;
	webview: RPCSchema<{
		messages: {
			runEvent: RunEventMessage;
		};
	}>;
}
