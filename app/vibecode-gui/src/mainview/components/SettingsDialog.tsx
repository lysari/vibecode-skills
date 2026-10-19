import { useState } from "react";
import { Dialog } from "./Dialog";

const BUTTON_CLASS = "h-control rounded-full border border-line-control px-node-pad text-body text-ink hover:bg-field";

interface SettingsDialogProps {
	libraryRoot: string | null;
	defaultLibraryRoot: string | null;
	onChooseFolder: () => Promise<string | null>;
	onSave: (libraryRoot: string | null) => Promise<void>;
	onCancel: () => void;
}

export function SettingsDialog({ libraryRoot, defaultLibraryRoot, onChooseFolder, onSave, onCancel }: SettingsDialogProps) {
	const [chosenRoot, setChosenRoot] = useState(libraryRoot === defaultLibraryRoot ? null : libraryRoot);
	const shownRoot = chosenRoot ?? defaultLibraryRoot;

	async function chooseFolder() {
		const root = await onChooseFolder();
		if (root) setChosenRoot(root);
	}

	return (
		<Dialog title="Settings" confirmLabel="Save" onConfirm={() => onSave(chosenRoot)} onCancel={onCancel}>
			<div className="flex flex-col gap-rail-gap">
				<p className="text-meta text-muted">Skill library folder</p>
				<p className="break-all bg-field px-stack py-rail-gap font-mono text-code text-ink">
					{shownRoot ?? "No folder chosen"}
				</p>
				<p className="text-meta text-muted">
					{chosenRoot
						? "Chosen folder."
						: defaultLibraryRoot
							? "Default: the skills repository the app runs from."
							: "No default library was found next to the app. Choose the folder of your skills repository."}{" "}
					Skills are read from its <span className="font-mono text-code">.claude/skills</span> and other agent skill
					folders and are never changed by the app.
				</p>
			</div>
			<div className="flex gap-stack">
				<button type="button" onClick={chooseFolder} className={BUTTON_CLASS}>
					Choose folder…
				</button>
				{chosenRoot && (
					<button type="button" onClick={() => setChosenRoot(null)} className={BUTTON_CLASS}>
						Use default
					</button>
				)}
			</div>
		</Dialog>
	);
}
