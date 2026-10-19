import { useEffect, useMemo, useState } from "react";
import type { Workspace } from "../shared/project.interface";
import { AGENT_CLIS, type RunEvent } from "../shared/run.interface";
import type { Session, SessionChoices, SessionSummary } from "../shared/session.interface";
import type { Skill } from "../shared/skill.interface";
import { AgentDrawer } from "./components/AgentDrawer";
import { AgentTree } from "./components/AgentTree";
import { ChatView } from "./components/ChatView";
import { Composer } from "./components/Composer";
import { Dialog } from "./components/Dialog";
import { Header } from "./components/Header";
import { Icon } from "./components/Icon";
import { Projects } from "./components/Projects";
import { Rail } from "./components/Rail";
import { SettingsDialog } from "./components/SettingsDialog";
import { onRunEvent, skillsApi } from "./rpc";
import { buildRunView, buildThread } from "./run-view";
import type { SessionView } from "./session-view";

const THEME_KEY = "vibecode-gui:theme";
const STATUS_EVENTS = new Set<RunEvent["type"]>(["run.started", "run.finished", "agent.status"]);

type DialogState =
	| { kind: "update"; skill: Skill }
	| { kind: "delete"; session: SessionSummary }
	| { kind: "settings" }
	| null;

function readStored(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStored(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {}
}

function errorMessage(cause: unknown): string {
	return cause instanceof Error ? cause.message : String(cause);
}

function App() {
	const [workspace, setWorkspace] = useState<Workspace | null>(null);
	const [sessions, setSessions] = useState<Record<string, SessionSummary[]>>({});
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [session, setSession] = useState<Session | null>(null);
	const [view, setView] = useState<SessionView>("chat");
	const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
	const [replyToId, setReplyToId] = useState<string | null>(null);
	const [focusKey, setFocusKey] = useState(0);
	const [isPanelOpen, setIsPanelOpen] = useState(true);
	const [isDark, setIsDark] = useState(
		() => (readStored(THEME_KEY) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark",
	);
	const [dialog, setDialog] = useState<DialogState>(null);
	const [error, setError] = useState<string | null>(null);

	const project = workspace?.project ?? null;
	const librarySkills = project?.skills ?? [];
	const agentSkills = librarySkills.filter((skill) => AGENT_CLIS[skill.name]);
	const pickableSkills = librarySkills.filter((skill) => !AGENT_CLIS[skill.name]);
	const runView = useMemo(() => buildRunView(session?.events ?? []), [session?.events]);
	const thread = useMemo(() => (session ? buildThread(session, runView, null) : []), [session, runView]);
	const latestRun = runView.runs[runView.runs.length - 1];
	const isRunning = latestRun?.status === "running";
	const selectedAgent = selectedAgentId ? (runView.agents.get(selectedAgentId) ?? null) : null;
	const treeRun = runView.runs.find((run) => run.id === selectedAgent?.runId) ?? latestRun;
	const treeRoot = treeRun?.rootId ? runView.agents.get(treeRun.rootId) : undefined;
	const replyTo = replyToId ? runView.agents.get(replyToId) : undefined;
	const replyTarget = replyTo?.status === "needs-input" ? replyTo : null;

	async function runRequest(failure: string, request: () => Promise<void>) {
		try {
			await request();
			setError(null);
		} catch (cause) {
			setError(`${failure}: ${errorMessage(cause)}`);
		}
	}

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

	useEffect(() => {
		document.documentElement.dataset.theme = isDark ? "dark" : "light";
		writeStored(THEME_KEY, isDark ? "dark" : "light");
	}, [isDark]);

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
		setDialog(null);
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

	async function send(text: string): Promise<boolean> {
		if (!session) return false;
		const ref = { projectRoot: session.projectRoot, id: session.id };
		try {
			if (replyTarget) {
				showSession(await skillsApi.replyToAgent({ ...ref, agentId: replyTarget.id, text }));
			} else {
				const sent = await skillsApi.sendMessage({ ...ref, text, agent: session.agent, skills: session.skills });
				setWorkspace(sent.workspace);
				setSession(sent.session);
				await refreshSessions(session.projectRoot);
			}
			setError(null);
			return true;
		} catch (cause) {
			setError(`Could not send the message: ${errorMessage(cause)}`);
			return false;
		}
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

	function openAgent(agentId: string) {
		setSelectedAgentId(agentId);
		setView("tree");
	}

	async function updateSkill(skill: Skill) {
		setWorkspace(await skillsApi.installSkill({ dir: skill.dir }));
		setDialog(null);
	}

	async function saveSettings(libraryRoot: string | null) {
		setWorkspace(await skillsApi.setLibraryRoot({ root: libraryRoot }));
		setDialog(null);
	}

	return (
		<div className="flex h-dvh w-full overflow-hidden bg-surface text-ink">
			<Rail
				isPanelOpen={isPanelOpen}
				isDark={isDark}
				onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
				onNewSession={() => newSession(project?.root ?? null)}
				onOpenSettings={() => setDialog({ kind: "settings" })}
				onToggleTheme={() => setIsDark(!isDark)}
			/>
			{isPanelOpen && (
				<Projects
					projects={workspace?.projects ?? null}
					sessions={sessions}
					expanded={expanded}
					openRoot={project?.root ?? null}
					sessionId={session?.id ?? null}
					onChooseFolder={chooseProject}
					onOpenProject={openProject}
					onCollapseProject={collapseProject}
					onRemoveProject={removeProject}
					onOpenSession={openSession}
					onNewSession={newSession}
					onDeleteSession={(target) => setDialog({ kind: "delete", session: target })}
				/>
			)}
			<div className="flex min-w-0 flex-1 flex-col">
				{session && (
					<Header
						projectName={project?.name ?? ""}
						title={session.title}
						view={view}
						onView={setView}
						onRename={renameSession}
					/>
				)}
				{error && (
					<p role="alert" className="flex items-center gap-stack bg-issue px-header-x py-rail-gap text-meta text-issue-text">
						{error}
						<button type="button" onClick={() => setError(null)} className="ml-auto underline">
							Dismiss
						</button>
					</p>
				)}
				{!session && (
					<div className="flex flex-1 flex-col items-center justify-center gap-card bg-canvas bg-dots text-body text-muted">
						<p>{project ? "No session open." : "Open a project folder to start a session."}</p>
						<button
							type="button"
							onClick={() => newSession(project?.root ?? null)}
							className="inline-flex h-control items-center gap-rail-gap rounded-full bg-inverse px-node-pad text-body text-on-inverse"
						>
							<Icon name={project ? "plus" : "folder"} className="size-icon-sm" />
							{project ? "New session" : "Open folder…"}
						</button>
					</div>
				)}
				{session && (
					<div className="flex min-h-0 flex-1">
						<main className={`flex min-h-0 min-w-0 flex-1 flex-col ${view === "tree" ? "bg-canvas" : "bg-surface"}`}>
							{view === "chat" && (
								<ChatView
									thread={thread}
									view={runView}
									isRunning={isRunning}
									onOpenAgent={openAgent}
									onReply={reply}
									onRetry={retry}
								/>
							)}
							{view === "tree" && treeRun && treeRoot && (
								<div className="min-h-0 flex-1">
									<AgentTree
										run={treeRun}
										root={treeRoot}
										selectedId={selectedAgentId}
										onSelect={setSelectedAgentId}
										onReply={reply}
										onRetry={retry}
									/>
								</div>
							)}
							{view === "tree" && !treeRoot && (
								<p className="flex flex-1 items-center justify-center bg-dots text-body text-muted">
									Send a message to start a run; its agents show here.
								</p>
							)}
							<Composer
								key={session.id}
								choices={{ agent: session.agent, skills: session.skills }}
								skills={pickableSkills}
								agents={agentSkills}
								isRunning={isRunning}
								replyTo={replyTarget}
								focusKey={focusKey}
								onChoose={chooseForSession}
								onSend={send}
								onStop={() => runAction("Could not stop the run", (ref) => skillsApi.stopRun(ref))}
								onCancelReply={() => setReplyToId(null)}
								onUpdateSkill={(skill) => setDialog({ kind: "update", skill })}
							/>
						</main>
						{view === "tree" && selectedAgent && (
							<AgentDrawer
								agent={selectedAgent}
								thread={buildThread(session, runView, selectedAgent.id)}
								view={runView}
								onClose={() => setSelectedAgentId(null)}
								onSelect={setSelectedAgentId}
								onReply={reply}
								onRetry={retry}
							/>
						)}
					</div>
				)}
			</div>
			{dialog?.kind === "update" && project && (
				<Dialog
					title={`Update ${dialog.skill.name} in ${project.name}?`}
					confirmLabel="Update skill"
					onConfirm={() => updateSkill(dialog.skill)}
					onCancel={() => setDialog(null)}
				>
					<p>
						The project&apos;s copy in{" "}
						<span className="break-all font-mono text-code text-ink">.claude/skills/{dialog.skill.dir.split("/").pop()}</span>{" "}
						differs from the library. Updating replaces it with the library version
						{dialog.skill.version && ` ${dialog.skill.version}`}.
					</p>
					<p>The current copy moves to the Trash first, so any local changes can be restored from there.</p>
				</Dialog>
			)}
			{dialog?.kind === "delete" && (
				<Dialog
					title={`Delete “${dialog.session.title}”?`}
					confirmLabel="Delete session"
					isDanger
					onConfirm={() => deleteSession(dialog.session)}
					onCancel={() => setDialog(null)}
				>
					<p>This deletes the session&apos;s messages and run history from the app. Files in the project are not changed.</p>
				</Dialog>
			)}
			{dialog?.kind === "settings" && workspace && (
				<SettingsDialog
					libraryRoot={workspace.libraryRoot}
					defaultLibraryRoot={workspace.defaultLibraryRoot}
					onChooseFolder={() => skillsApi.chooseFolder()}
					onSave={saveSettings}
					onCancel={() => setDialog(null)}
				/>
			)}
		</div>
	);
}

export default App;
