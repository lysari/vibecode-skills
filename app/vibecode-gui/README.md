# Vibecode Skills

An Electrobun desktop app (React, Tailwind CSS, Sass, Vite) for browsing and managing agent skills in your projects, and for adding the skills of this repository's library to them.

- **Projects**: like other agent desktop apps, you open a project folder first. The Projects screen (shown on launch when no project is open, and from the rail's Projects item) has an **Open folder…** button (the native folder picker) and the recent projects with their path, skill count and when they were last opened. Search filters the list; the × button removes a project from the list without touching its folder; a folder that was moved or deleted shows as **Unavailable**. The last open project reopens on launch. In a project, the library panel's dropdown switches between recent projects, opens another folder, or goes back to all projects.
- **Project skills**: every `<folder>/<name>/SKILL.md` in the agent skill folders of the project: `.claude/skills` (Claude Code), `.agents/skills` (Codex, Gemini CLI, OpenCode), `.codex/skills`, `.cursor/skills`, `.github/skills` (GitHub Copilot), `.gemini/skills`, `.opencode/skills` and `.windsurf/skills`. These folders are also found in nested packages up to three folders deep, skipping hidden folders, `node_modules/` and build folders. Project skills can be edited, created, renamed and deleted.
- **Our library**: the skills of the skill library folder (by default this repository, found next to the app when it runs from a checkout; change it in **Settings**, which a packaged app needs). Library skills are read-only (Map and Read). Each one shows **Installed** when the project's `.claude/skills/<name>` copy matches it, **Update available** when the copy differs (compared by `metadata.version` when both have one, otherwise by the content of every file in the folder), or an **Add to project** button. Adding copies the whole skill folder to `<project>/.claude/skills/<name>/`; updating asks first and moves the old copy to the system Trash.
- **Favourites**: starred skills are kept per project in the projects store, never in skill files.
- **Map**: the selected skill and the skills it links to, as a collapsible tree. Skills already shown appear as amber pills; a project skill's links to library skills are marked "From library". Pills at the top list unsaved edits and project skills with frontmatter issues. The linked skills wrap into rows that fit the panel width, so the tree shows at or near full size and is scaled down further only when a single branch is wider than the panel; the toolbar's zoom out, zoom in and Fit buttons change the scale.
- **Links**: a skill links to another only through an explicit reference to its name, on word boundaries: an inline code span (`` `vibecode-review` ``), a slash command (`/vibecode-review`), or a markdown link or path to its folder or `SKILL.md`. A plain word in the text is not a link. A project skill links to the project's own skill of that name, else to the library's; a library skill links only within the library. Linked code spans open the skill in Read and Edit.
- **Read**: the rendered `SKILL.md`, its frontmatter, issues, supporting files (click to preview) and the skills it links to or is linked from.
- **Edit**: frontmatter and body editors with a live preview. Unsaved edits show an "Unsaved changes" pill; save with the Save button or Cmd/Ctrl+S.
- **New / Rename / Delete**: create a project skill from the template; rename its folder and `name` (optionally also rewriting the links to the old name in the project's other skills, on by default); or move its folder to the system Trash after confirmation.

All file access runs in the main (Bun) process through Electrobun RPC (`src/bun/skills.ts`, `src/bun/workspace.ts`). Writes are allowed only inside the open project's folder and reads only inside the project or the library folder; paths are resolved through symlinks first, so a link that leads outside is rejected.

### Projects store

The recent projects, the open project, the per-project favourites and the library folder setting are kept in `projects.json` in the app's user data folder (Electrobun's `Utils.paths.userData`), e.g. `~/Library/Application Support/io.github.lysari.vibecode-skills/dev/projects.json` for `hutch run dev` on macOS (the last folder is the build channel: `dev`, `canary` or `stable`). Deleting the file resets the app to an empty project list.

## Getting Started

```bash
# Install dependencies
hutch run install

# Development without HMR (uses bundled assets)
hutch run dev

# Development with HMR (recommended)
hutch run dev:hmr

# Build for production
hutch run build:canary

# Run the tests
hutch test
```

With [Devbox](https://www.jetify.com/devbox), `devbox shell` provides the pinned Bun toolchain, and every script above is also available as `devbox run <script>` (for example `devbox run dev:hmr`). The `hutch` CLI must be installed on your machine.

`hutch run build` writes the `Vibecode Skills.app` bundle to `build/stable-macos-arm64/` and the release files to `artifacts/` (`macos-arm64-VibecodeSkills.dmg`, `stable-macos-arm64-VibecodeSkills.app.tar.zst`, `stable-macos-arm64-update.json`). `hutch run build:canary` builds the canary channel the same way.

## How HMR Works

When you run `hutch run dev:hmr`:

1. **Vite dev server** starts on `http://localhost:5173` with HMR enabled
2. **Electrobun** starts and detects the running Vite server
3. The app loads from the Vite dev server instead of bundled assets
4. Changes to React components update instantly without full page reload

When you run `hutch run dev` (without HMR):

1. Electrobun starts and loads from `views://mainview/index.html`
2. Vite rebuilds the bundled assets before Electrobun starts

## Project Structure

```
├── src/
│   ├── bun/
│   │   ├── index.ts        # Main process: window, folder picker and RPC handlers
│   │   ├── skills.ts       # Skill discovery, install status and file I/O, restricted to the project and library folders
│   │   └── workspace.ts    # Projects store: recent projects, open project, favourites, library folder
│   ├── shared/             # Project, skill and RPC types and the skill link rule, used by both processes
│   └── mainview/
│       ├── App.tsx         # App state and layout shell
│       ├── rpc.ts          # Electroview RPC client
│       ├── components/     # Rail, Projects, ProjectsHeader, Header, Library, SkillMap, SkillDocument, SkillEditor, dialogs
│       ├── styles/         # Palette (light/dark colours), fonts, global styles
│       ├── main.tsx        # React entry point
│       ├── index.html      # HTML template
│       └── index.scss      # Loads the styles and Tailwind
├── tests/                  # bun:test tests for the main process (bun/), renderer helpers (mainview/) and shared code (shared/); they write to temporary folders only
├── electrobun.config.ts    # Electrobun configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
└── package.json
```

## Customizing

- **React components**: Edit files in `src/mainview/`
- **Design tokens**: Sizes, type and radii live in `tailwind.config.js`; colours live in `src/mainview/styles/_palette.scss`
- **Vite settings**: Edit `vite.config.ts`
- **Window settings**: Edit `src/bun/index.ts`
- **App metadata**: Edit `electrobun.config.ts` (display name "Vibecode Skills", identifier `io.github.lysari.vibecode-skills`)
