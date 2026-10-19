import { useEffect, useState } from "react";
import type { Workspace } from "../shared/project.interface";
import type { Skill, SkillCreate, SkillForm } from "../shared/skill.interface";
import { Dialog } from "./components/Dialog";
import { Header } from "./components/Header";
import { Library } from "./components/Library";
import { Projects } from "./components/Projects";
import { Rail } from "./components/Rail";
import { SettingsDialog } from "./components/SettingsDialog";
import { NewSkillDialog, RenameSkillDialog } from "./components/SkillDialogs";
import { SkillDocument } from "./components/SkillDocument";
import { SkillEditor } from "./components/SkillEditor";
import { SkillMap } from "./components/SkillMap";
import { skillsApi } from "./rpc";
import type { SkillView } from "./skill-view";

const THEME_KEY = "vibecode-gui:theme";

type DialogState =
	| { kind: "new" }
	| { kind: "rename" }
	| { kind: "delete" }
	| { kind: "update"; skill: Skill }
	| { kind: "settings" }
	| { kind: "discard"; next: () => void }
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
	} catch {
		// Storage can be unavailable in private or sandboxed webviews; the app still works without it.
	}
}

function errorMessage(cause: unknown): string {
	return cause instanceof Error ? cause.message : String(cause);
}

function App() {
	const [workspace, setWorkspace] = useState<Workspace | null>(null);
	const [isProjectsOpen, setIsProjectsOpen] = useState(false);
	const [selectedDir, setSelectedDir] = useState<string | null>(null);
	const [history, setHistory] = useState<string[]>([]);
	const [view, setView] = useState<SkillView>("map");
	const [draft, setDraft] = useState<SkillForm | null>(null);
	const [isDark, setIsDark] = useState(
		() => (readStored(THEME_KEY) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark",
	);
	const [dialog, setDialog] = useState<DialogState>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const project = workspace?.project ?? null;
	const skills = project?.skills ?? [];
	const favourites = new Set(project?.favourites);
	const skill = skills.find((candidate) => candidate.dir === selectedDir) ?? null;
	// Library skills are read-only, so they open in Read where a project skill would open in Edit.
	const shownView = skill?.scope === "library" && view === "edit" ? "read" : view;
	const form = draft ?? (skill && { frontmatter: skill.frontmatter, body: skill.body });
	const isDirty = Boolean(skill && draft && (draft.frontmatter !== skill.frontmatter || draft.body !== skill.body));
	const skillNames = new Set(skills.map((candidate) => candidate.name).filter(Boolean));

	function applyWorkspace(next: Workspace, nextDir?: string) {
		setWorkspace(next);
		setDraft(null);
		const nextSkills = next.project?.skills ?? [];
		const dirs = new Set(nextSkills.map((candidate) => candidate.dir));
		setHistory((previous) => previous.filter((dir) => dirs.has(dir)));
		setSelectedDir((current) => {
			const wanted = nextDir ?? current;
			return wanted && dirs.has(wanted) ? wanted : (nextSkills[0]?.dir ?? null);
		});
	}

	async function runRequest(failure: string, request: () => Promise<void>) {
		try {
			await request();
			setError(null);
		} catch (cause) {
			setError(`${failure}: ${errorMessage(cause)}`);
		}
	}

	async function load() {
		setIsScanning(true);
		await runRequest("Could not read skills", async () => applyWorkspace(await skillsApi.readWorkspace()));
		setIsScanning(false);
	}

	useEffect(() => {
		load();
	}, []);

	useEffect(() => {
		document.documentElement.dataset.theme = isDark ? "dark" : "light";
		writeStored(THEME_KEY, isDark ? "dark" : "light");
	}, [isDark]);

	async function save() {
		if (!skill || !draft) return;
		setIsSaving(true);
		await runRequest(`Could not save ${skill.name}`, async () =>
			applyWorkspace(await skillsApi.saveSkill({ dir: skill.dir, form: draft })),
		);
		setIsSaving(false);
	}

	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === "s") {
				event.preventDefault();
				if (isDirty) save();
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	});

	function guardUnsaved(next: () => void) {
		if (isDirty) setDialog({ kind: "discard", next });
		else next();
	}

	function openProject(root: string) {
		guardUnsaved(() =>
			runRequest("Could not open the project", async () => {
				applyWorkspace(await skillsApi.openProject({ root }));
				setIsProjectsOpen(false);
			}),
		);
	}

	async function chooseProject() {
		await runRequest("Could not open the folder picker", async () => {
			const root = await skillsApi.chooseFolder();
			if (root) openProject(root);
		});
	}

	function removeProject(root: string) {
		guardUnsaved(() =>
			runRequest("Could not remove the project", async () => applyWorkspace(await skillsApi.removeProject({ root }))),
		);
	}

	function selectSkill(dir: string, nextView?: SkillView) {
		guardUnsaved(() => {
			if (selectedDir && dir !== selectedDir) setHistory([...history, selectedDir]);
			setSelectedDir(dir);
			setDraft(null);
			if (nextView) setView(nextView);
		});
	}

	function openSkillByName(name: string) {
		const target =
			skills.find((candidate) => candidate.name === name && candidate.scope === skill?.scope) ??
			skills.find((candidate) => candidate.name === name);
		if (target) selectSkill(target.dir);
	}

	function goBack() {
		guardUnsaved(() => {
			setSelectedDir(history[history.length - 1]);
			setHistory(history.slice(0, -1));
			setDraft(null);
		});
	}

	function saveFavourites(base: Workspace, next: string[]) {
		if (!base.project) return;
		setWorkspace({ ...base, project: { ...base.project, favourites: next } });
		runRequest("Could not save favourites", () => skillsApi.saveFavourites({ favourites: next }));
	}

	function toggleFavourite(dir: string) {
		if (!workspace) return;
		saveFavourites(workspace, favourites.has(dir) ? [...favourites].filter((other) => other !== dir) : [...favourites, dir]);
	}

	async function createSkill(create: SkillCreate) {
		if (!project) return;
		const next = await skillsApi.createSkill(create);
		applyWorkspace(next, `${project.root}/${create.source}/${create.name}`);
		setView("edit");
		setDialog(null);
	}

	async function renameSkill(name: string, shouldRenameMentions: boolean) {
		if (!skill) return;
		const renamedDir = skill.dir.replace(/[^/]+$/, name);
		const next = await skillsApi.renameSkill({ dir: skill.dir, name, shouldRenameMentions });
		applyWorkspace(next, renamedDir);
		if (favourites.has(skill.dir)) {
			saveFavourites(next, [...[...favourites].filter((dir) => dir !== skill.dir), renamedDir]);
		}
		setDialog(null);
	}

	async function deleteSkill() {
		if (!skill) return;
		const next = await skillsApi.deleteSkill({ dir: skill.dir });
		setSelectedDir(null);
		applyWorkspace(next);
		if (favourites.has(skill.dir)) saveFavourites(next, [...favourites].filter((dir) => dir !== skill.dir));
		setDialog(null);
	}

	async function installSkill(target: Skill) {
		applyWorkspace(await skillsApi.installSkill({ dir: target.dir }));
		setDialog(null);
	}

	function requestInstall(target: Skill) {
		guardUnsaved(() => {
			if (target.install === "outdated") setDialog({ kind: "update", skill: target });
			else runRequest(`Could not add ${target.name}`, () => installSkill(target));
		});
	}

	async function saveSettings(libraryRoot: string | null) {
		applyWorkspace(await skillsApi.setLibraryRoot({ root: libraryRoot }));
		setDialog(null);
	}

	const errorBanner = error && (
		<p role="alert" className="flex items-center gap-stack bg-issue px-header-x py-rail-gap text-meta text-issue-text">
			{error}
			<button type="button" onClick={() => setError(null)} className="ml-auto underline">
				Dismiss
			</button>
		</p>
	);

	return (
		<div className="flex h-dvh w-full overflow-hidden bg-surface text-ink">
			<Rail
				isProjectsOpen={!project || isProjectsOpen}
				hasProject={Boolean(project)}
				isDark={isDark}
				isScanning={isScanning}
				onShowProjects={() => setIsProjectsOpen(true)}
				onShowSkills={() => setIsProjectsOpen(false)}
				onNewSkill={() => guardUnsaved(() => setDialog({ kind: "new" }))}
				onRescan={() => guardUnsaved(load)}
				onOpenSettings={() => guardUnsaved(() => setDialog({ kind: "settings" }))}
				onToggleTheme={() => setIsDark(!isDark)}
			/>
			{(!project || isProjectsOpen) && (
				<Projects
					workspace={workspace}
					banner={errorBanner}
					onOpen={openProject}
					onChoose={chooseProject}
					onRemove={removeProject}
				/>
			)}
			{project && !isProjectsOpen && (
				<div className="flex min-w-0 flex-1 flex-col">
					<Header
						projectName={project.name}
						skill={skill}
						view={shownView}
						isDirty={isDirty}
						isSaving={isSaving}
						canGoBack={history.length > 0}
						onBack={goBack}
						onView={setView}
						onSave={save}
						onDiscard={() => setDraft(null)}
						onRename={() => setDialog({ kind: "rename" })}
						onDelete={() => setDialog({ kind: "delete" })}
						onInstall={requestInstall}
					/>
					{errorBanner}
					<div className="flex min-h-0 flex-1">
						<Library
							project={project}
							projects={workspace?.projects ?? []}
							libraryRoot={workspace?.libraryRoot ?? null}
							selectedDir={selectedDir}
							onSelect={(dir) => selectSkill(dir)}
							onToggleFavourite={toggleFavourite}
							onInstall={requestInstall}
							onOpenProject={openProject}
							onChooseProject={chooseProject}
							onShowProjects={() => setIsProjectsOpen(true)}
						/>
						<main className="min-h-0 min-w-0 flex-1">
							{!skill && (
								<div className="flex h-full items-center justify-center bg-canvas bg-dots text-body text-muted">
									No skill selected. Create one with New or add one from the library.
								</div>
							)}
							{skill && shownView === "map" && (
								<SkillMap
									skill={skill}
									skills={skills}
									isDirty={isDirty}
									onSelect={selectSkill}
									onSave={save}
									onDiscard={() => setDraft(null)}
								/>
							)}
							{skill && shownView === "read" && (
								<SkillDocument
									key={skill.dir}
									skill={skill}
									skills={skills}
									skillNames={skillNames}
									onOpenSkill={openSkillByName}
									onSelect={(dir) => selectSkill(dir)}
								/>
							)}
							{skill && form && shownView === "edit" && (
								<SkillEditor form={form} skillNames={skillNames} onChange={setDraft} onOpenSkill={openSkillByName} />
							)}
						</main>
					</div>
				</div>
			)}
			{dialog?.kind === "new" && project && (
				<NewSkillDialog sources={project.sources} onCreate={createSkill} onCancel={() => setDialog(null)} />
			)}
			{dialog?.kind === "rename" && skill && (
				<RenameSkillDialog
					skill={skill}
					mentionCount={skills.filter((other) => other.references.includes(skill.dir)).length}
					onRename={renameSkill}
					onCancel={() => setDialog(null)}
				/>
			)}
			{dialog?.kind === "delete" && skill && (
				<Dialog title={`Move ${skill.name} to the Trash?`} confirmLabel="Move to Trash" isDanger onConfirm={deleteSkill} onCancel={() => setDialog(null)}>
					<p>
						This moves <span className="break-all font-mono text-code text-ink">{skill.dir}</span> with its SKILL.md and{" "}
						{skill.files.length} supporting {skill.files.length === 1 ? "file" : "files"} to the Trash. You can restore
						the folder from the Trash.
					</p>
				</Dialog>
			)}
			{dialog?.kind === "update" && project && (
				<Dialog
					title={`Update ${dialog.skill.name} in ${project.name}?`}
					confirmLabel="Update skill"
					onConfirm={() => installSkill(dialog.skill)}
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
			{dialog?.kind === "settings" && workspace && (
				<SettingsDialog
					libraryRoot={workspace.libraryRoot}
					defaultLibraryRoot={workspace.defaultLibraryRoot}
					onChooseFolder={() => skillsApi.chooseFolder()}
					onSave={saveSettings}
					onCancel={() => setDialog(null)}
				/>
			)}
			{dialog?.kind === "discard" && (
				<Dialog
					title="Discard unsaved changes?"
					confirmLabel="Discard changes"
					isDanger
					onConfirm={() => {
						setDialog(null);
						setDraft(null);
						dialog.next();
					}}
					onCancel={() => setDialog(null)}
				>
					<p>Your edits to {skill?.name} are not saved to disk yet.</p>
				</Dialog>
			)}
		</div>
	);
}

export default App;
