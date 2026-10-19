# Vibecode Skills

An Electrobun desktop app (React, Tailwind CSS, Vite) for browsing and managing the agent skills in this repository.

- **Library**: every `SKILL.md` found under the repository root (skipping `app/`, `node_modules/` and build folders), grouped by name prefix, with search, a folder filter and favourites (stored in the app's local storage, never in skill files).
- **Map**: the selected skill and the skills it links to, as a collapsible tree. Skills already shown appear as amber pills. Pills at the top list unsaved edits and skills with frontmatter issues. The linked skills wrap into rows that fit the panel width, so the tree shows at or near full size and is scaled down further only when a single branch is wider than the panel; the toolbar's zoom out, zoom in and Fit buttons change the scale.
- **Links**: a skill links to another only through an explicit reference to its name, on word boundaries: an inline code span (`` `vibecode-review` ``), a slash command (`/vibecode-review`), or a markdown link or path to its folder or `SKILL.md`. A plain word in the text is not a link. Linked code spans open the skill in Read and Edit.
- **Read**: the rendered `SKILL.md`, its frontmatter, issues, supporting files (click to preview) and the skills it links to or is linked from.
- **Edit**: frontmatter and body editors with a live preview. Unsaved edits show an "Unsaved changes" pill; save with the Save button or Cmd/Ctrl+S.
- **New / Rename / Delete**: create a skill from the template; rename its folder and `name` (optionally also rewriting the links to the old name in other skills' `SKILL.md`, on by default); or move its folder to the system Trash after confirmation.

All file access runs in the main (Bun) process through Electrobun RPC (`src/bun/skills.ts`) and rejects any path outside the repository root.

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
│   │   ├── index.ts        # Main process: window and RPC handlers
│   │   └── skills.ts       # Skill discovery and file I/O, restricted to the repo root
│   ├── shared/             # Skill and RPC types and the skill link rule, used by both processes
│   └── mainview/
│       ├── App.tsx         # App state and layout shell
│       ├── rpc.ts          # Electroview RPC client
│       ├── components/     # Rail, Header, Library, SkillMap, SkillDocument, SkillEditor, dialogs
│       ├── styles/         # Palette (light/dark colours), fonts, global styles
│       ├── main.tsx        # React entry point
│       ├── index.html      # HTML template
│       └── index.css       # Loads the styles and Tailwind
├── tests/                  # bun:test tests for the main process (bun/) and shared code (shared/)
├── electrobun.config.ts    # Electrobun configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
└── package.json
```

## Customizing

- **React components**: Edit files in `src/mainview/`
- **Design tokens**: Sizes, type and radii live in `tailwind.config.js`; colours live in `src/mainview/styles/palette.css`
- **Vite settings**: Edit `vite.config.ts`
- **Window settings**: Edit `src/bun/index.ts`
- **App metadata**: Edit `electrobun.config.ts` (display name "Vibecode Skills", identifier `io.github.lysari.vibecode-skills`)
