import { useEffect, useState } from "react";
import type { SkillCreate, SkillForm, SkillLibrary } from "../shared/skill.interface";
import { Dialog } from "./components/Dialog";
import { Header } from "./components/Header";
import { Library } from "./components/Library";
import { Rail } from "./components/Rail";
import { NewSkillDialog, RenameSkillDialog } from "./components/SkillDialogs";
import { SkillDocument } from "./components/SkillDocument";
import { SkillEditor } from "./components/SkillEditor";
import { SkillMap } from "./components/SkillMap";
import { skillsApi } from "./rpc";
import type { SkillView } from "./skill-view";

const FAVOURITES_KEY = "vibecode-gui:favourites";
const THEME_KEY = "vibecode-gui:theme";

type DialogState =
	| { kind: "new" }
	| { kind: "rename" }
	| { kind: "delete" }
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

function readFavourites(): Set<string> {
	try {
		const stored: unknown = JSON.parse(readStored(FAVOURITES_KEY) ?? "[]");
		return new Set(Array.isArray(stored) ? stored.filter((dir): dir is string => typeof dir === "string") : []);
	} catch {
		return new Set();
	}
}

function errorMessage(cause: unknown): string {
	return cause instanceof Error ? cause.message : String(cause);
}

function App() {
	const [library, setLibrary] = useState<SkillLibrary | null>(null);
	const [selectedDir, setSelectedDir] = useState<string | null>(null);
	const [history, setHistory] = useState<string[]>([]);
	const [view, setView] = useState<SkillView>("map");
	const [draft, setDraft] = useState<SkillForm | null>(null);
	const [favourites, setFavourites] = useState(readFavourites);
	const [isDark, setIsDark] = useState(
		() => (readStored(THEME_KEY) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark",
	);
	const [dialog, setDialog] = useState<DialogState>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const skills = library?.skills ?? [];
	const skill = skills.find((candidate) => candidate.dir === selectedDir) ?? null;
	const form = draft ?? (skill && { frontmatter: skill.frontmatter, body: skill.body });
	const isDirty = Boolean(skill && draft && (draft.frontmatter !== skill.frontmatter || draft.body !== skill.body));
	const skillNames = new Set(skills.map((candidate) => candidate.name).filter(Boolean));

	function applyLibrary(next: SkillLibrary, nextDir?: string) {
		setLibrary(next);
		setDraft(null);
		const dirs = new Set(next.skills.map((candidate) => candidate.dir));
		setHistory((previous) => previous.filter((dir) => dirs.has(dir)));
		setSelectedDir((current) => {
			const wanted = nextDir ?? current;
			return wanted && dirs.has(wanted) ? wanted : (next.skills[0]?.dir ?? null);
		});
	}

	async function load() {
		setIsScanning(true);
		try {
			applyLibrary(await skillsApi.listSkills());
			setError(null);
		} catch (cause) {
			setError(`Could not read skills: ${errorMessage(cause)}`);
		} finally {
			setIsScanning(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	useEffect(() => {
		document.documentElement.dataset.theme = isDark ? "dark" : "light";
		writeStored(THEME_KEY, isDark ? "dark" : "light");
	}, [isDark]);

	useEffect(() => {
		writeStored(FAVOURITES_KEY, JSON.stringify([...favourites]));
	}, [favourites]);

	async function save() {
		if (!skill || !draft) return;
		setIsSaving(true);
		try {
			applyLibrary(await skillsApi.saveSkill({ dir: skill.dir, form: draft }));
			setError(null);
		} catch (cause) {
			setError(`Could not save ${skill.name}: ${errorMessage(cause)}`);
		} finally {
			setIsSaving(false);
		}
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

	function selectSkill(dir: string, nextView?: SkillView) {
		guardUnsaved(() => {
			if (selectedDir && dir !== selectedDir) setHistory([...history, selectedDir]);
			setSelectedDir(dir);
			setDraft(null);
			if (nextView) setView(nextView);
		});
	}

	function openSkillByName(name: string) {
		const target = skills.find((candidate) => candidate.name === name);
		if (target) selectSkill(target.dir);
	}

	function goBack() {
		guardUnsaved(() => {
			setSelectedDir(history[history.length - 1]);
			setHistory(history.slice(0, -1));
			setDraft(null);
		});
	}

	function toggleFavourite(dir: string) {
		const next = new Set(favourites);
		if (next.has(dir)) next.delete(dir);
		else next.add(dir);
		setFavourites(next);
	}

	async function createSkill(create: SkillCreate) {
		const next = await skillsApi.createSkill(create);
		applyLibrary(next, [create.source, create.name].filter((part) => part !== ".").join("/"));
		setView("edit");
		setDialog(null);
	}

	async function renameSkill(name: string, shouldRenameMentions: boolean) {
		if (!skill) return;
		const renamedDir = skill.dir.replace(/[^/]+$/, name);
		const next = await skillsApi.renameSkill({ dir: skill.dir, name, shouldRenameMentions });
		if (favourites.has(skill.dir)) {
			const nextFavourites = new Set(favourites);
			nextFavourites.delete(skill.dir);
			setFavourites(nextFavourites.add(renamedDir));
		}
		applyLibrary(next, renamedDir);
		setDialog(null);
	}

	async function deleteSkill() {
		if (!skill) return;
		const next = await skillsApi.deleteSkill({ dir: skill.dir });
		const nextFavourites = new Set(favourites);
		nextFavourites.delete(skill.dir);
		setFavourites(nextFavourites);
		setSelectedDir(null);
		applyLibrary(next);
		setDialog(null);
	}

	return (
		<div className="flex h-dvh w-full overflow-hidden bg-surface text-ink">
			<Rail
				isDark={isDark}
				isScanning={isScanning}
				onNewSkill={() => guardUnsaved(() => setDialog({ kind: "new" }))}
				onRescan={() => guardUnsaved(load)}
				onToggleTheme={() => setIsDark(!isDark)}
			/>
			<div className="flex min-w-0 flex-1 flex-col">
				<Header
					skill={skill}
					view={view}
					isDirty={isDirty}
					isSaving={isSaving}
					canGoBack={history.length > 0}
					onBack={goBack}
					onView={setView}
					onSave={save}
					onDiscard={() => setDraft(null)}
					onRename={() => setDialog({ kind: "rename" })}
					onDelete={() => setDialog({ kind: "delete" })}
				/>
				{error && (
					<p role="alert" className="flex items-center gap-stack bg-issue px-header-x py-rail-gap text-meta text-issue-text">
						{error}
						<button type="button" onClick={() => setError(null)} className="ml-auto underline">
							Dismiss
						</button>
					</p>
				)}
				<div className="flex min-h-0 flex-1">
					{library && (
						<Library
							library={library}
							favourites={favourites}
							selectedDir={selectedDir}
							onSelect={(dir) => selectSkill(dir)}
							onToggleFavourite={toggleFavourite}
						/>
					)}
					<main className="min-h-0 min-w-0 flex-1">
						{!skill && (
							<div className="flex h-full items-center justify-center bg-canvas bg-dots text-body text-muted">
								{library ? "No skill selected. Create one with New." : "Reading skills…"}
							</div>
						)}
						{skill && view === "map" && (
							<SkillMap
								skill={skill}
								skills={skills}
								isDirty={isDirty}
								onSelect={selectSkill}
								onSave={save}
								onDiscard={() => setDraft(null)}
							/>
						)}
						{skill && view === "read" && (
							<SkillDocument
								key={skill.dir}
								skill={skill}
								skills={skills}
								skillNames={skillNames}
								onOpenSkill={openSkillByName}
								onSelect={(dir) => selectSkill(dir)}
							/>
						)}
						{skill && form && view === "edit" && (
							<SkillEditor form={form} skillNames={skillNames} onChange={setDraft} onOpenSkill={openSkillByName} />
						)}
					</main>
				</div>
			</div>
			{dialog?.kind === "new" && library && (
				<NewSkillDialog sources={library.sources} onCreate={createSkill} onCancel={() => setDialog(null)} />
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
						This moves <span className="font-mono text-code text-ink">{skill.dir}</span> with its SKILL.md and{" "}
						{skill.files.length} supporting {skill.files.length === 1 ? "file" : "files"} to the Trash. You can restore
						the folder from the Trash.
					</p>
				</Dialog>
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
