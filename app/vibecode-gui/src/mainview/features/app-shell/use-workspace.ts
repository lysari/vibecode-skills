import { useEffect, useState } from "react";
import type { Workspace } from "../../../shared/interfaces/project.interface";
import type { RunEvent } from "../../../shared/interfaces/run.interface";
import type { Session, SessionChoices, SessionSummary } from "../../../shared/interfaces/session.interface";
import { onRunEvent, skillsApi } from "../../services/rpc";

const STATUS_EVENTS = new Set<RunEvent["type"]>(["run.started", "run.finished", "agent.status"]);

export function useWorkspace(runRequest: (failure: string, request: () => Promise<void>) => Promise<boolean>) {
	const [workspace, setWorkspace] = useState<Workspace | null>(null);
	const [sessions, setSessions] = useState<Record<string, SessionSummary[]>>({});
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [session, setSession] = useState<Session | null>(null);
	const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
	const [replyToId, setReplyToId] = useState<string | null>(null);

	async function refreshSessions(projectRoot: string): Promise<SessionSummary[]> {
		const list = await skillsApi.listSessions({ projectRoot });
		setSessions((current) => ({ ...current, [projectRoot]: list }));
		return list;
	}

	function showSession(next: Session) {
		setSession(next);
		setSelectedAgentId(null);
		setReplyToId(null);
	}

	async function enterProject(root: string) {
		setExpanded((current) => new Set(current).add(root));
		const [latest] = await refreshSessions(root);
		showSession(latest ? await skillsApi.readSession({ projectRoot: root, id: latest.id }) : await skillsApi.createSession({ projectRoot: root }));
		if (!latest) await refreshSessions(root);
	}

	async function switchProject(root: string) {
		if (workspace?.project?.root !== root) setWorkspace(await skillsApi.openProject({ root }));
	}

	useEffect(() => {
		runRequest("Could not read the projects", async () => {
			const next = await skillsApi.readWorkspace();
			setWorkspace(next);
			if (next.project) await enterProject(next.project.root);
		});
	}, []);

	useEffect(
		() =>
			onRunEvent(({ projectRoot, sessionId, event }) => {
				setSession((current) =>
					current?.id === sessionId ? { ...current, events: [...current.events, event], updatedAt: event.at } : current,
				);
				if (STATUS_EVENTS.has(event.type)) refreshSessions(projectRoot).catch(() => undefined);
			}),
		[],
	);

	function openProject(root: string) {
		runRequest("Could not open the project", async () => {
			setWorkspace(await skillsApi.openProject({ root }));
			await enterProject(root);
		});
	}

	function chooseProject() {
		runRequest("Could not open the folder picker", async () => {
			const root = await skillsApi.chooseFolder();
			if (root) openProject(root);
		});
	}

	function removeProject(root: string) {
		runRequest("Could not remove the project", async () => {
			setWorkspace(await skillsApi.removeProject({ root }));
			if (session?.projectRoot === root) setSession(null);
		});
	}

	function collapseProject(root: string) {
		const next = new Set(expanded);
		next.delete(root);
		setExpanded(next);
	}

	function openSession(root: string, id: string) {
		runRequest("Could not open the session", async () => {
			await switchProject(root);
			showSession(await skillsApi.readSession({ projectRoot: root, id }));
		});
	}

	function newSession(root: string | null) {
		if (!root) {
			chooseProject();
			return;
		}
		runRequest("Could not start a session", async () => {
			await switchProject(root);
			setExpanded((current) => new Set(current).add(root));
			showSession(await skillsApi.createSession({ projectRoot: root }));
			await refreshSessions(root);
		});
	}

	async function deleteSession(target: SessionSummary) {
		await skillsApi.deleteSession({ projectRoot: target.projectRoot, id: target.id });
		if (session?.id === target.id) setSession(null);
		await refreshSessions(target.projectRoot);
	}

	function renameSession(title: string) {
		if (!session) return;
		setSession({ ...session, title });
		runRequest("Could not rename the session", async () => {
			await skillsApi.renameSession({ projectRoot: session.projectRoot, id: session.id, title });
			await refreshSessions(session.projectRoot);
		});
	}

	function chooseForSession(choices: SessionChoices) {
		if (!session) return;
		setSession({ ...session, ...choices });
		runRequest("Could not save the session's skills and agent", () =>
			skillsApi.saveSessionChoices({ projectRoot: session.projectRoot, id: session.id, ...choices }),
		);
	}

	return {
		workspace,
		sessions,
		expanded,
		session,
		selectedAgentId,
		replyToId,
		setWorkspace,
		setSession,
		setSelectedAgentId,
		setReplyToId,
		refreshSessions,
		showSession,
		openProject,
		chooseProject,
		removeProject,
		collapseProject,
		openSession,
		newSession,
		deleteSession,
		renameSession,
		chooseForSession,
	};
}
