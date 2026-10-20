import { useState } from "react";
import { AGENT_CLIS } from "../../../shared/interfaces/run.interface";
import type { SessionSummary } from "../../../shared/interfaces/session.interface";
import { GLOBAL_SKILL_FOLDERS } from "../../../shared/interfaces/skill.interface";
import { AgentDrawer } from "../agent-tree/AgentDrawer";
import { AgentTree } from "../agent-tree/AgentTree";
import { ChatView } from "../chat/ChatView";
import { Composer } from "../composer/Composer";
import { Dialog } from "../../components/Dialog";
import { Header } from "./Header";
import { Icon } from "../../components/Icon";
import { Projects } from "../projects/Projects";
import { Rail } from "./Rail";
import { buildThread } from "../../utils/run-view";
import type { SessionView } from "./session-view";
import { useError } from "./use-error";
import { useRun } from "./use-run";
import { useTheme } from "./use-theme";
import { useWorkspace } from "./use-workspace";

type DialogState = { kind: "delete"; session: SessionSummary } | null;

export function App() {
	const { error, setError, runRequest } = useError();
	const {
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
	} = useWorkspace(runRequest);
	const { runView, thread, isRunning, selectedAgent, treeRun, treeRoot, replyTarget, focusKey, send, reply, retry, stop } = useRun({
		session,
		selectedAgentId,
		replyToId,
		setWorkspace,
		setSession,
		setReplyToId,
		showSession,
		refreshSessions,
		runRequest,
	});
	const { isDark, setIsDark } = useTheme();
	const [view, setView] = useState<SessionView>("chat");
	const [isPanelOpen, setIsPanelOpen] = useState(true);
	const [dialog, setDialog] = useState<DialogState>(null);

	const project = workspace?.project ?? null;
	const skills = project?.skills ?? [];
	const agentSkills = skills.filter((skill) => AGENT_CLIS[skill.name]);
	const agentCli = session?.agent ? AGENT_CLIS[session.agent] : undefined;
	const agentFolders = agentCli?.skillFolders ?? GLOBAL_SKILL_FOLDERS;
	const pickableSkills = skills.filter(
		(skill) =>
			!AGENT_CLIS[skill.name] &&
			(skill.source === "project" || skill.globalFolders.some((folder) => agentFolders.includes(folder))),
	);

	function openAgent(agentId: string) {
		setSelectedAgentId(agentId);
		setView("tree");
	}

	async function confirmDelete(target: SessionSummary) {
		await deleteSession(target);
		setDialog(null);
	}

	return (
		<div className="flex h-dvh w-full overflow-hidden bg-surface text-ink">
			<Rail
				isPanelOpen={isPanelOpen}
				isDark={isDark}
				onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
				onNewSession={() => newSession(project?.root ?? null)}
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
								onStop={stop}
								onCancelReply={() => setReplyToId(null)}
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
			{dialog?.kind === "delete" && (
				<Dialog
					title={`Delete “${dialog.session.title}”?`}
					confirmLabel="Delete session"
					isDanger
					onConfirm={() => confirmDelete(dialog.session)}
					onCancel={() => setDialog(null)}
				>
					<p>This deletes the session&apos;s messages and run history from the app. Files in the project are not changed.</p>
				</Dialog>
			)}
		</div>
	);
}
