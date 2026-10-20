# Vibecode Skills

An Electrobun desktop app (React, Tailwind CSS, Sass, Vite) for running coding agents on your projects in chat sessions, like the Claude desktop and Codex apps, with the skills of this repository's library. **Agent runs are mocked for now**: a `MockAgentRunner` plays a realistic orchestration without starting any CLI; real runners for `claude`, Cursor's `agent` and `agy` plug into the same interface later.

## Using the app

- **Rail**: Projects (shows or hides the projects panel), New (a new session in the open project, or the folder picker when none is open), Settings (the skill library folder) and the light/dark toggle.
- **Projects panel**: every project you opened, most recent first, with **Open folder…** (the native folder picker) and a search that matches project names, paths and session titles. A project row expands to its sessions (title, age, and a dot while the latest run is running, needs you or failed) and **New session**. Clicking a project opens it and its latest session, or a new one when it has none. The × button removes a project from the list without touching its folder, the trash button deletes a session after confirmation, and a folder that was moved or deleted shows as **Unavailable**. The last open project reopens on launch.
- **Header**: the project, the session title (click it to rename; the first message titles a new session) and the **Chat | Tree** toggle.
- **Chat**: the thread of the session, like Claude Code: your messages (with the selected skills as slash commands in front, e.g. `/vibecode-review fix the header`), the orchestrator's streaming text, collapsible tool calls (tool, short input, result), sub-agent blocks (name, model, status, last line, cost and time; click to see the agent in the tree), questions ("needs you", with Reply), failures (with Retry) and notes such as "Installed vibecode-review into .claude/skills". The thread follows new output until you scroll up; **Jump to latest** scrolls back down.
- **Tree**: the run's agents as a tree: the orchestrator on top and its sub-agents on trunk, bus and elbow connectors, wrapped into rows that fit the panel. Each card shows the agent's name, model or CLI, status (Running, Done, Needs you, Failed, Stopped), task, cost and duration, and a toggle for its sub-agents. The toolbar shows the agent and running counts and the cost, **N needs you** and **N failed** pills whose popovers offer Reply or Retry (and Dismiss), and zoom out, zoom in and Fit. Selecting a card opens that agent's transcript beside the tree.
- **Composer** (pinned below both views): Enter sends, Shift+Enter adds a line. **Skills** lists the library's skills with their state in the project (**Installed**, **Update** when the project's copy differs, **Not installed**); selected skills show as removable chips. **Agent** offers Default and the library's agent skills (`use-claude-code`, `use-cursor`, `use-antigravity`). Both choices are kept per session. While a run works, **Stop** replaces Send; after Reply the composer answers the waiting agent.
- **On send**, every selected skill the project does not have yet is copied from the library to `<project>/.claude/skills/<name>/` (a copy that differs from the library is left as it is; its Update button replaces it after confirmation, moving the old copy to the system Trash), then the run starts.

All file access runs in the main (Bun) process through Electrobun RPC; run events stream from the main process to the webview as RPC messages. Skills are installed only inside the open project and read only from the library folder; paths are resolved through symlinks first, so a link that leads outside is rejected. Session requests are accepted only for projects in the recent list, and session ids must be UUIDs, so no request reaches a file outside the sessions store.

### Stores

Both live in the app's user data folder (Electrobun's `Utils.paths.userData`), e.g. `~/Library/Application Support/io.github.lysari.vibecode-skills/dev/` for `hutch run dev` on macOS (the last folder is the build channel: `dev`, `canary` or `stable`):

- `projects.json`: the recent projects, the open project and the library folder setting. Deleting it resets the project list.
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

A run emits `run.started`, then `agent.spawned` (id, parent id, name, model, task, and the agent it replaces after a retry; the first agent without a parent is the orchestrator), `agent.status` (`running`, `done`, `needs-input`, `failed`, `stopped`), `agent.usage` (cost and duration totals), `text.delta` (joined by message id), `tool.started` / `tool.finished`, `input.needed`, `error`, and finally `run.finished` (`done`, `stopped` or `failed`). Every event carries its run id and time. `src/bun/chat.ts` installs the selected skills, records the user's message, starts the run, appends each event to the session (writing it to disk one write at a time) and forwards it to the webview; the renderer plays the events into both views (`src/mainview/run-view.ts`). `AGENT_CLIS` in the same interface file maps each agent skill to the command a real runner starts (`claude`, `agent`, `agy`); a real runner is constructed in `src/bun/index.ts` in place of `MockAgentRunner`.

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
│   │   ├── chat.ts              # Sessions and their runs: install on send, event recording, reply, retry, stop
│   │   ├── sessions.ts          # Sessions store: one JSON file per session, validated when read
│   │   ├── mock-agent-runner.ts # The mocked AgentRunner
│   │   ├── skills.ts            # Library skill discovery, install status and install, restricted to the project and library folders
│   │   └── workspace.ts         # Projects store: recent projects, open project, library folder
│   ├── shared/
│   │   └── interfaces/          # Project, skill, session, run and RPC types, used by both processes
│   └── mainview/
│       ├── App.tsx              # App state and layout shell
│       ├── rpc.ts               # Electroview RPC client and the run event subscription
│       ├── run-view.ts          # Plays run events into agent trees and transcripts
│       ├── components/          # Rail, Projects, Header, ChatView, ThreadEntry, Composer, SkillPicker, AgentPicker, AgentTree, AgentTreeToolbar, AgentDrawer, dialogs
│       ├── styles/              # Palette (light/dark colours), fonts, global styles
│       ├── main.tsx             # React entry point
│       ├── index.html           # HTML template
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
- **Design tokens**: Sizes, type and radii live in `tailwind.config.js`; colours live in `src/mainview/styles/_palette.scss`
- **Vite settings**: Edit `vite.config.ts`
- **Window settings**: Edit `src/bun/index.ts`
- **App metadata**: Edit `electrobun.config.ts` (display name "Vibecode Skills", identifier `io.github.lysari.vibecode-skills`)
