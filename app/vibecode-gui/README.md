# Vibecode Skills

An Electrobun desktop app (React, Tailwind CSS, Sass, Vite) for running coding agents on your projects in chat sessions, like the Claude desktop and Codex apps, with the skills the agents already have: the project's own and the ones installed globally in your home folder (e.g. `~/.claude/skills`, linked to this repository's `.claude/skills`). **Agent runs are mocked for now**: a `MockAgentRunner` plays a realistic orchestration without starting any CLI; real runners for `claude`, Cursor's `agent` and `agy` plug into the same interface later.

## Using the app

- **Projects sidebar**: every project you opened, most recent first, under **Projects** (a folder that was moved or deleted is listed under **Unavailable**), with a search (⌘F) that matches project names and paths, the sidebar toggle in the top row, and **Open folder…** (the native folder picker) and the light/dark toggle in the footer. Clicking a project opens it and its latest session, or a new one when it has none. The × button removes a project from the list without touching its folder. The last open project reopens on launch.
- **Sessions panel**: opens to the right of the projects sidebar for the open project: its sessions (title, age, and a dot while the latest run is running, needs you or failed) and **New session** (+). Clicking a session opens it; the trash button deletes a session after confirmation.
- **Header**: a `Project / Session` breadcrumb (click the session title to rename it; the first message titles a new session) and the **Chat | Tree** toggle.
- **Chat**: the thread of the session, like Claude Code: your messages (with the selected skills as slash commands in front, e.g. `/vibecode-review fix the header`), the orchestrator's streaming text, collapsible tool calls (tool, short input, result), sub-agent blocks (name, model, status, last line, cost and time; click to see the agent in the tree), questions ("needs you", with Reply), failures (with Retry) and the run's end. The thread follows new output until you scroll up; **Jump to latest** scrolls back down.
- **Tree**: the run's agents as a tree: the orchestrator on top and its sub-agents on trunk, bus and elbow connectors, wrapped into rows that fit the panel. Each card shows the agent's name, model or CLI, status (Running, Done, Needs you, Failed, Stopped), task, cost and duration, and a toggle for its sub-agents. The toolbar shows the agent and running counts and the cost, **N needs you** and **N failed** pills whose popovers offer Reply or Retry (and Dismiss), and zoom out, zoom in and Fit. Selecting a card opens that agent's transcript beside the tree.
- **Composer** (pinned below both views): Enter sends, Shift+Enter adds a line. **Skills** lists the skills the selected agent can already use, each marked **Project** (in the open project's skill folders, e.g. `.claude/skills` or `.agents/skills`) or **Global** (in the agent's global folder; a project skill wins over a global one with the same name); selected skills show as removable chips. A new session starts with `vibecode-workflow` selected; remove its chip to send without it. **Agent** offers Default and the agent skills found in the project or the global folders (`use-claude-code`, `use-cursor`, `use-antigravity`). Both choices are kept per session. While a run works, **Stop** replaces Send; after Reply the composer answers the waiting agent.
- **On send**, the selected skills the agent can use go in front of the message as slash commands, the selection is kept with the session, and the run starts. The app never installs or copies a skill.

| Agent | Global skill folders read |
|-------|---------------------------|
| Claude Code (`use-claude-code`) | `~/.claude/skills` |
| Cursor (`use-cursor`) | `~/.cursor/skills`, `~/.claude/skills`, `~/.codex/skills` |
| Antigravity (`use-antigravity`) | `~/.gemini/config/skills`, `~/.gemini/antigravity/skills` |
| Default | all of the above and `~/.agents/skills` |

All file access runs in the main (Bun) process through Electrobun RPC; run events stream from the main process to the webview as RPC messages. Skills are only read, never written: the `SKILL.md` files of the open project's skill folders (a link that leads outside the project is skipped) and of the agents' global folders, through their symlinks. Session requests are accepted only for projects in the recent list, and session ids must be UUIDs, so no request reaches a file outside the sessions store.

### Stores

Both live in the app's user data folder (Electrobun's `Utils.paths.userData`), e.g. `~/Library/Application Support/io.github.lysari.vibecode-skills/dev/` for `hutch run dev` on macOS (the last folder is the build channel: `dev`, `canary` or `stable`):

- `projects.json`: the recent projects and the open project. Deleting it resets the project list. A `libraryRoot` left by an earlier version is ignored and dropped on the next write.
- `sessions/<project hash>/<session id>.json`: one file per session (the hash is the first 16 hex digits of the SHA-256 of the project path) with its title, timestamps, selected agent and skills, messages (user messages and system notes) and every run event. Files are written through a temporary file and read back as untrusted JSON: a malformed session is skipped, malformed messages or events are dropped. A run that was interrupted by quitting the app is marked Stopped when its session opens again.

### Agent runner

`src/shared/interfaces/run.interface.ts` defines the contract a runner implements:

```ts
interface AgentRunner {
	start(request: RunRequest, emit: (event: RunEvent) => void): void; // RunRequest: runId, projectRoot, prompt, agent, skills
	stop(runId: string): void; // running and waiting agents become "stopped", the run finishes as "stopped"
	reply(runId: string, agentId: string, text: string): void; // answers an agent in "needs-input"
	retry(runId: string, agentId: string): void; // replaces a failed agent; the failed one becomes "stopped"
}
```

A run emits `run.started`, then `agent.spawned` (id, parent id, name, model, task, and the agent it replaces after a retry; the first agent without a parent is the orchestrator), `agent.status` (`running`, `done`, `needs-input`, `failed`, `stopped`), `agent.usage` (cost and duration totals), `text.delta` (joined by message id), `tool.started` / `tool.finished`, `input.needed`, `error`, and finally `run.finished` (`done`, `stopped` or `failed`). Every event carries its run id and time. `src/bun/chat.ts` records the user's message with the selected skills in front, starts the run, appends each event to the session (writing it to disk one write at a time) and forwards it to the webview; the renderer plays the events into both views (`src/mainview/utils/run-view.ts`). `AGENT_CLIS` in the same interface file maps each agent skill to the command a real runner starts (`claude`, `agent`, `agy`); a real runner is constructed in `src/bun/index.ts` in place of `MockAgentRunner`.

`MockAgentRunner` (`src/bun/mock-agent-runner.ts`) plays an orchestrator that looks at the project, a planner, two or three coders working in parallel (each with its own test runner) and a reviewer per selected skill, with timed text streaming, tool calls, costs and durations. A question mark in the prompt, or some seeds, make a coder ask the user and wait for the reply; some seeds make a test runner fail until it is retried. Its random choices follow from the prompt, agent and skills, or from an injected seed, and its timers come from an injectable clock, so tests step through a run deterministically.

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
│   │   ├── index.ts             # Main process: window, folder picker and RPC handlers
│   │   ├── chat.ts              # Sessions and their runs: send with skills as slash commands, event recording, reply, retry, stop
│   │   ├── sessions.ts          # Sessions store: one JSON file per session, validated when read
│   │   ├── mock-agent-runner.ts # The mocked AgentRunner
│   │   ├── skills.ts            # Skill discovery, read-only: the project's skill folders and the agents' global folders
│   │   └── workspace.ts         # Projects store: recent projects, open project
│   ├── shared/
│   │   └── interfaces/          # Project, skill, session, run and RPC types used by both processes; run-view types used by the webview's views
│   └── mainview/
│       ├── features/            # One folder per feature with its own components and helpers
│       │   ├── app-shell/       # App (layout shell), Header, the session views and the app state hooks (workspace, run, error, theme)
│       │   ├── projects/        # The projects sidebar, the sessions panel and its age labels
│       │   ├── chat/            # ChatView, the session thread
│       │   ├── agent-tree/      # AgentTree, its toolbar, the agent drawer and the row wrapping
│       │   └── composer/        # Composer, SkillPicker, AgentPicker, SkillSourceBadge
│       ├── components/          # Shared by 2 or more features: Icon, Dialog, StatusPill, ThreadEntry, Markdown
│       ├── hooks/               # Shared hooks: useDismiss for popovers and pickers, usePresence for exit animations
│       ├── services/            # App-wide services: rpc, the Electroview RPC client
│       ├── utils/               # Shared helpers: run-view plays run events into agent trees and transcripts
│       ├── styles/              # Palette (light/dark colours), fonts, global styles
│       ├── main.tsx             # React entry point
│       ├── index.html           # HTML template
│       ├── vite-env.d.ts        # Vite client types for stylesheet and asset imports
│       └── index.scss           # Loads the styles and Tailwind
├── docs/                        # One doc per page (e.g. agent-tree.md) or file (e.g. sessions.md, run.interface.md) with its tests; code comments live only in reusable files shared across features
├── tests/                       # bun:test tests for the main process (bun/) and renderer helpers (mainview/); they write to temporary folders only
├── electrobun.config.ts         # Electrobun configuration
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── package.json
```

## Customizing

- **React components**: Edit files in `src/mainview/`
- **Design tokens**: Sizes, type, radii and motion (easing, durations, animations) live in `tailwind.config.js`; colours live in `src/mainview/styles/_palette.scss`
- **Vite settings**: Edit `vite.config.ts`
- **Window settings**: Edit `src/bun/index.ts`
- **App metadata**: Edit `electrobun.config.ts` (display name "Vibecode Skills", identifier `io.github.lysari.vibecode-skills`)
