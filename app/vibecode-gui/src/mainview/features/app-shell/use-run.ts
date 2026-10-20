import { useMemo, useState } from "react";
import type { Workspace } from "../../../shared/interfaces/project.interface";
import type { Session, SessionSummary } from "../../../shared/interfaces/session.interface";
import { skillsApi } from "../../services/rpc";
import { buildRunView, buildThread } from "../../utils/run-view";

interface RunOptions {
	session: Session | null;
	selectedAgentId: string | null;
	replyToId: string | null;
	setWorkspace: (workspace: Workspace) => void;
	setSession: (session: Session) => void;
	setReplyToId: (agentId: string | null) => void;
	showSession: (session: Session) => void;
	refreshSessions: (projectRoot: string) => Promise<SessionSummary[]>;
	runRequest: (failure: string, request: () => Promise<void>) => Promise<boolean>;
}

export function useRun({
	session,
	selectedAgentId,
	replyToId,
	setWorkspace,
	setSession,
	setReplyToId,
	showSession,
	refreshSessions,
	runRequest,
}: RunOptions) {
	const [focusKey, setFocusKey] = useState(0);
	const runView = useMemo(() => buildRunView(session?.events ?? []), [session?.events]);
	const thread = useMemo(() => (session ? buildThread(session, runView, null) : []), [session, runView]);
	const latestRun = runView.runs[runView.runs.length - 1];
	const isRunning = latestRun?.status === "running";
	const selectedAgent = selectedAgentId ? (runView.agents.get(selectedAgentId) ?? null) : null;
	const treeRun = runView.runs.find((run) => run.id === selectedAgent?.runId) ?? latestRun;
	const treeRoot = treeRun?.rootId ? runView.agents.get(treeRun.rootId) : undefined;
	const replyTo = replyToId ? runView.agents.get(replyToId) : undefined;
	const replyTarget = replyTo?.status === "needs-input" ? replyTo : null;

	async function send(text: string): Promise<boolean> {
		if (!session) return false;
		const ref = { projectRoot: session.projectRoot, id: session.id };
		return runRequest("Could not send the message", async () => {
			if (replyTarget) {
				showSession(await skillsApi.replyToAgent({ ...ref, agentId: replyTarget.id, text }));
				return;
			}
			const sent = await skillsApi.sendMessage({ ...ref, text, agent: session.agent, skills: session.skills });
			setWorkspace(sent.workspace);
			setSession(sent.session);
			await refreshSessions(session.projectRoot);
		});
	}

	function runAction(failure: string, action: (ref: { projectRoot: string; id: string }) => Promise<void>) {
		if (session) runRequest(failure, () => action({ projectRoot: session.projectRoot, id: session.id }));
	}

	function reply(agentId: string) {
		setReplyToId(agentId);
		setFocusKey(focusKey + 1);
	}

	function retry(agentId: string) {
		runAction("Could not retry the agent", (ref) => skillsApi.retryAgent({ ...ref, agentId }));
	}

	function stop() {
		runAction("Could not stop the run", (ref) => skillsApi.stopRun(ref));
	}

	return { runView, thread, isRunning, selectedAgent, treeRun, treeRoot, replyTarget, focusKey, send, reply, retry, stop };
}
