<div align="center">

<img src="assets/Cute%20Vibecode%20Developer%20Diorama.png" alt="Cute Vibecode Developer Diorama" width="280" />

# 🧠 Agent Skills Suite (Vibecode Ecosystem)

> **"Vibe coding that writes code like a thoughtful human—simple, clean, and effortless to read and maintain with AI."**

A collection of modular agent skills engineered for **Claude Code**, **Google Antigravity**, and **Cursor**.

</div>

---

## 🎯 What Our Skills Mean & What They Aim To Do

### The Meaning: Vibe Coding That Feels Human-Written
When developers "vibe code" with AI, two big problems usually happen:
1. **Sloppy AI Shortcuts**: The AI dumps duplicate functions, creates `_v2` files, patches symptoms with messy wrappers, or hallucinates styling.
2. **Robotic Over-Engineering**: The AI gets "too professional"—adding 10 layers of unnecessary abstraction, cryptic boilerplate, and complex enterprise patterns that make the code impossible for a human to quickly read, understand, or maintain.

**Our skills aim for the sweet spot: Code that looks and feels like a careful human wrote it by hand.**
- **Human-Readable First**: Code should be obvious, simple, and clean. A human should be able to open any file, understand what it does in 10 seconds, and edit it without fear.
- **Easy to Co-Maintain with AI**: Built so humans and AI agents can collaborate smoothly without fighting overly complex architecture or untangling messy spaghetti.
- **Minimal & In-Place**: Make the smallest, cleanest change in the files the project already uses. Delete what you replace. Don't add unnecessary layers.

### What Our Skills Aim To Achieve

| Core Aim | What We Want to Avoid | How Our Skills Achieve It | Key Skills |
|---|---|---|---|
| ✍️ **Human-Like, Readable Code** | Over-engineered abstractions, robotic boilerplate, or impenetrable patterns | Writes straightforward, natural code that reads like a human wrote it with care; keeps logic flat, obvious, and clean. | `vibecode`, `use-vibecode` |
| 🤝 **Effortless Human + AI Co-Maintenance** | Codebases only the AI understands (or that break the moment a human edits them) | Reuses existing project functions, constants, and patterns so human devs and AI stay completely in sync. | `vibecode-init`, `vibecode` |
| 🛡 **Zero Context Rot in Long Sessions** | AI forgetting rules, getting lazy, or degrading in quality over long chats | Breaks work into discrete tasks handled by fresh, ephemeral sub-agents that do one job cleanly and exit. | `vibecode-workflow` |
| 🎨 **Natural, Consistent UI & Tokens** | Eyeballed colors, random margins, or bloated CSS that doesn't match the design | Pulls clean, reusable design tokens directly from references; keeps layouts consistent, accessible, and simple to tweak. | `vibecode-design` |
| 📋 **No Guesswork: Automated Self-Checking** | AI claiming "done" without checking if the code actually follows project standards | Runs an automated checklist directly against project rules on disk before handing the work back to you. | `vibecode-review` |
| 🧠 **Learns Your Personal Style** | Having to repeat the same corrections over and over across sessions | Distills your feedback into simple, permanent rules so the AI naturally adapts to how you like to write code. | `vibecode-update`, `vibecode-design-update` |
| ⚖️ **Right Tool & Model for the Job** | Overkilling small edits with giant slow models or starving complex tasks | Automatically benchmarks and routes each task to the most proportional CLI tool and model tier. | `auto-mode-workflow`, `jev-assistance` |
| 👥 **Dual-Agent Operator / Coder Flow** | Human getting stuck waiting and watching text stream in terminal | Operator agent plans and reviews while external headless CLI agents do the writing. | `use-claude-code`, `use-antigravity`, `use-cursor` |

---

## 📑 Table of Contents

- [What Our Skills Mean & What They Aim To Do](#-what-our-skills-mean--what-they-aim-to-do)
- [System Architecture](#-system-architecture)
- [Skills Catalog](#-skills-catalog)
  - [Vibecode Engineering Lifecycle](#1-vibecode-engineering-lifecycle)
  - [Continuous Learning & Rule Updates](#2-continuous-learning--rule-updates)
  - [Decision Intelligence & Task Routing](#3-decision-intelligence--task-routing)
  - [Dual-Agent CLI Runners](#4-dual-agent-cli-runners)
- [Core Workflows & Philosophies](#-core-workflows--philosophies)
  - [The Vibecode Philosophy: Writing Code Like a Human, Not a Machine](#the-vibecode-philosophy-writing-code-like-a-human-not-a-machine)
  - [Ephemeral Sub-Agent Architecture](#ephemeral-sub-agent-architecture)
  - [Decision Layer: TypeSafe Jev Model](#decision-layer-typesafe-jev-model)
- [Installation & Setup](#-installation--setup)
  - [Agent Skill Paths](#agent-skill-paths)
  - [Link All Skills (Recommended)](#link-all-skills-recommended)
  - [Link by Agent](#link-by-agent)
  - [Link a Single Skill](#link-a-single-skill)
  - [Verification](#verification)
  - [Unlinking](#unlinking)
- [Project Onboarding Quickstart](#-project-onboarding-quickstart)
- [Repository Structure](#-repository-structure)

---

## 🏛 System Architecture

The following diagram illustrates how the skills interact across orchestrators, ephemeral sub-agents, decision gates, and CLI runners:

```mermaid
flowchart TD
    User([User Request / Task]) --> Router{Routing Method}

    %% Routing
    Router -->|Smart Auto-Dispatch| AutoMode["auto-mode-workflow\n(Jev Decision Engine)"]
    Router -->|Manual / Direct| Orchestrator["vibecode-workflow\n(Main Orchestrator)"]

    AutoMode -->|Discovers Available Models & Providers| JevGate["jev-assistance\n(TypeSafe Jev Scoring)"]
    JevGate -->|Selects Provider & Tier| Orchestrator
    JevGate -.->|Or Dispatches Direct CLI| CLIRunners["Dual-Agent CLI Runners\n(use-claude-code / use-antigravity / use-cursor)"]

    %% Vibecode Orchestration Loop
    subgraph VibecodeLifecycle ["Vibecode Task Orchestration"]
        Orchestrator -->|Decomposes Task & Spawns| SubAgent["Ephemeral Sub-Agent\n(Fresh Context)"]
        
        SubAgent -->|Activates Lifecycle| UseVibecode["use-vibecode"]
        
        subgraph ThreeStageExecution ["3-Stage Execution Pipeline"]
            UseVibecode --> Stage1["Stage 1: Preparation\nCheck .claude/project-rules.md\n(Run vibecode-init if missing)"]
            Stage1 --> Stage2["Stage 2: Implementation"]
            
            subgraph Implementation ["Implementation Disciplines"]
                Stage2 --> Code["Logic & Architecture:\nvibecode\n(+ framework rules)"]
                Stage2 --> UI["UI, Layout & Tokens:\nvibecode-design\n(+ reference extraction)"]
            end
            
            Code --> Stage3["Stage 3: Compliance Gate\nvibecode-review\n(Direct disk audit of all rules)"]
            UI --> Stage3
        end
        
        Stage3 -->|Pass Checklist & Report| SubAgent
        SubAgent -->|Deliver Result & Terminate| Orchestrator
    end

    %% Continuous Learning
    User -.->|Provides Feedback / Rule Corrections| UpdateLoop["Continuous Learning Loop\n(vibecode-update / vibecode-design-update)"]
    UpdateLoop -.->|Updates Persistent Rule Files| Code
    UpdateLoop -.->|Updates Persistent Design Files| UI
```

---

## 📦 Skills Catalog

### 1. Vibecode Engineering Lifecycle

| Skill | Trigger / Command | Description |
|---|---|---|
| **`vibecode-workflow`** | `/vibecode-workflow` | **Multi-task Orchestrator.** Decomposes complex engineering goals into modular tasks executed by isolated, ephemeral sub-agents. Prevents context degradation and skill decay over long sessions. |
| **`use-vibecode`** | `/use-vibecode` | **End-to-End Task Runner.** Glues the complete 3-stage lifecycle together: Stage 1 (Preparation & Rule Discovery) → Stage 2 (Implementation) → Stage 3 (Mandatory `vibecode-review` compliance audit). |
| **`vibecode-init`** | `/vibecode-init` | **Repository Profiler & Onboarding.** Inspects directory architecture, path aliases, code conventions, and test setups to generate `.claude/project-rules.md` and configure root `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`. |
| **`vibecode`** | `/vibecode` | **Clean Code Standards.** Enforces surgical, minimal changes that address root causes without code bloat, wrapper sprawl, or naming duplication. Includes language- and framework-specific rules (TypeScript, Angular, CSS, Firebase). |
| **`vibecode-design`** | `/vibecode-design` | **Pixel-Faithful UI Engineering.** Extracts measured design tokens (colors, spacing, typography, radii, blur) from reference images and designs. Enforces layout consistency, keyboard navigation, and accessibility standards. |
| **`vibecode-review`** | `/vibecode-review` | **Mandatory Post-Implementation Compliance Gate.** Audits session diffs directly against disk-loaded skill files. Evaluates every applicable rule with a pass/fail checklist before work is declared complete. |

---

### 2. Continuous Learning & Rule Updates

| Skill | Trigger / Command | Description |
|---|---|---|
| **`vibecode-update`** | `/vibecode-update [rule]` | **Distills User Coding Corrections.** Translates user complaints, feedback, or coding conventions into permanent, stack-agnostic checkable rules inside `vibecode/SKILL.md` or framework rules. |
| **`vibecode-design-update`** | `/vibecode-design-update [rule]` | **Distills User UI Corrections.** Captures UI and styling corrections (spacing, tokens, contrast, layout behaviors) into persistent checkable rules inside `vibecode-design/SKILL.md`. |

---

### 3. Decision Intelligence & Task Routing

| Skill | Trigger / Command | Description |
|---|---|---|
| **`auto-mode-workflow`** | `/auto-mode-workflow` | **Adaptive Provider & Model Router.** Discovers active CLI tools and model tiers (lightweight vs. deep reasoning), profiles task complexity, and routes the work via Jev to the most proportional, cost-effective provider. |
| **`jev-assistance`** | `/jev-assistance` | **Probabilistic Decision Gate.** Uses TypeSafe's Jev model (`scripts/choose.mts`) to score options on fit, simplicity, and safety. Decides whether to auto-select the best option or present a typed ranking to the user. |

---

### 4. Dual-Agent CLI Runners

These skills split complex tasks between an **Operator** (who plans, builds, reviews, and tests) and a headless **Coder** process running in an external CLI.

| Skill | Trigger / Command | Target CLI | Key Modes |
|---|---|---|---|
| **`use-claude-code`** | `/use-claude-code` | `claude -p` | Direct session, sub-agent runner, remote SSH host (`--host`) |
| **`use-antigravity`** | `/use-antigravity` | `agy` | Headless accept-edits mode (`--mode accept-edits`), streaming JSON |
| **`use-cursor`** | `/use-cursor` | `agent` | Cursor Agent CLI (`agent -p --force --trust`) with streaming JSON |

---

## 💡 Core Workflows & Philosophies

### The Vibecode Philosophy: Writing Code Like a Human, Not a Machine

When AI is asked to write code, it often swings between two extremes:
- **Sloppy AI Hacks**: Writing quick patches, duplicating logic, leaving commented-out code, or adding `_v2` files.
- **Robotic Over-Engineering**: Trying to be "too professional" by introducing 5 layers of abstraction, unnecessary factory patterns, verbose boilerplate, and convoluted architecture that make it painful for a human to read or maintain.

**Vibecode demands code that reads as if a careful, thoughtful human developer wrote it by hand:**
1. **Readable in 10 Seconds**: Logic should be flat, obvious, and natural. Any developer jumping in should understand it immediately.
2. **Find Before Creating**: Search the codebase for existing functions and helpers before inventing new ones. Edit what exists instead of adding duplicate layers.
3. **In-Place Surgery**: Change existing code directly and delete what it replaces. Never leave `_old`, `_new`, or commented-out ghosts beside it.
4. **Single Source of Truth**: Define each concept once with one clear name. Never add translation wrappers that just rename variables across layers.
5. **No Fake Fixes**: Never disable guards, types, validations, or tests just to make code run. Fix the real issue at the source.
6. **Token-Driven UI**: Measure real design tokens (colors, padding, radii) from references instead of guessing margins and colors by eye.

---

### Ephemeral Sub-Agent Architecture

Long-running agent conversations suffer from **context rot**: prompt context fills up, earlier instructions get diluted, and strict compliance rules are forgotten.

`vibecode-workflow` solves this with an ephemeral worker pattern:
1. The **Orchestrator (Main Agent)** maintains high-level awareness of the project plan.
2. Each sub-task is delegated to a **fresh, isolated Sub-Agent**.
3. The Sub-Agent loads `use-vibecode`, applies clean code and design guidelines, runs `vibecode-review`, and returns a structured completion report.
4. The Sub-Agent is **terminated immediately**, returning clean results without polluting parent context.

---

### Decision Layer: TypeSafe Jev Model

When multiple execution paths or scope decisions arise, `jev-assistance` steps in:
- Executes `scripts/choose.mts` against TypeSafe's System One (Jev) decision model.
- Analyzes candidate choices across simplicity, reversibility, and alignment.
- **Auto-executes** when the confidence margin is high and the operation is safe.
- **Surfaces a ranked recommendation** when high-stakes human approval is required.

---

## 🚀 Installation & Setup

Skills can be linked into your agent tools globally (available in every project) or locally (scoped to one repository).

### Agent Skill Paths

| Agent | Global Skills Directory | Project Skills Directory |
|---|---|---|
| **Claude Code** | `~/.claude/skills/` | `.claude/skills/` |
| **Google Antigravity** | `~/.gemini/config/skills/` | `.agents/skills/` |
| **Cursor** | `~/.cursor/skills/` | `.cursor/skills/` |

> [!CAUTION]
> For Cursor, link skills into `~/.cursor/skills/`. **Never** link into `~/.cursor/skills-cursor/`, which is reserved exclusively for Cursor's internal system skills.

---

### Link All Skills (Recommended)

Run this one-liner from the root of this repository to link all skills to Claude Code, Antigravity, and Cursor simultaneously:

```bash
for target in ~/.claude/skills ~/.gemini/config/skills ~/.cursor/skills; do
  mkdir -p "$target"
  for d in "$PWD"/.claude/skills/*/; do
    ln -s "${d%/}" "$target/"
  done
done
```

> [!NOTE]
> Re-running this command is completely safe. Existing symlinks will output `File exists` and will not be overwritten.

---

### Link by Agent

To link skills to a specific tool only:

```bash
# Claude Code
mkdir -p ~/.claude/skills
for d in "$PWD"/.claude/skills/*/; do ln -s "${d%/}" ~/.claude/skills/; done

# Antigravity
mkdir -p ~/.gemini/config/skills
for d in "$PWD"/.claude/skills/*/; do ln -s "${d%/}" ~/.gemini/config/skills/; done

# Cursor
mkdir -p ~/.cursor/skills
for d in "$PWD"/.claude/skills/*/; do ln -s "${d%/}" ~/.cursor/skills/; done
```

---

### Link a Single Skill

Replace `<skill-name>` with the directory name of the skill (e.g., `use-vibecode`):

```bash
# Claude Code
ln -s "$PWD/.claude/skills/<skill-name>" ~/.claude/skills/<skill-name>

# Antigravity
ln -s "$PWD/.claude/skills/<skill-name>" ~/.gemini/config/skills/<skill-name>

# Cursor
ln -s "$PWD/.claude/skills/<skill-name>" ~/.cursor/skills/<skill-name>
```

> [!IMPORTANT]
> The syntax order is `ln -s <source-in-this-repo> <target-link-in-agent-dir>`. Do not invert the arguments, or a circular symlink will be created inside the repository.

---

### Verification

Verify that your symlinks are active and pointing back to this repository:

```bash
# Verify Claude Code
ls -l ~/.claude/skills

# Verify Antigravity
ls -l ~/.gemini/config/skills

# Verify Cursor
ls -l ~/.cursor/skills
```

Each linked entry should show an arrow pointing to its absolute path inside this repository.

---

### Unlinking

To safely remove the symlinks from an agent (leaving this repository untouched):

```bash
# Remove all linked skills from all three agents
for target in ~/.claude/skills ~/.gemini/config/skills ~/.cursor/skills; do
  for d in "$PWD"/.claude/skills/*/; do
    rm -f "$target/$(basename "$d")"
  done
done
```

To remove a single linked skill:

```bash
rm ~/.claude/skills/<skill-name>
rm ~/.gemini/config/skills/<skill-name>
rm ~/.cursor/skills/<skill-name>
```

> [!NOTE]
> If you relocate or rename this repository, existing symlinks will break. Run the unlinking script, then re-run the linking script from the new repository directory.

---

## 🛠 Project Onboarding Quickstart

When onboarding a new or existing repository to the Vibecode ecosystem:

1. **Initialize the Project**:
   Open your agent in the target project and run:
   ```text
   /vibecode-init
   ```
   This performs an architectural scan and creates:
   - `.claude/project-rules.md`: Captures project structure, path aliases, test tooling, and local idioms.
   - `AGENTS.md`: Directs all AI agents to use `/vibecode-workflow` and abide by `.claude/project-rules.md`.
   - `CLAUDE.md` and `GEMINI.md`: Symlinks or pointers directly to `AGENTS.md` to guarantee cross-client consistency.

2. **Execute Tasks**:
   Start developing with:
   ```text
   /vibecode-workflow implement the user authentication modal using liquid design tokens
   ```

3. **Verify Compliance**:
   Before delivering work or merging, verify against the rules:
   ```text
   /vibecode-review
   ```

4. **Teach the Agent**:
   Whenever you correct the agent's code or UI style, save it permanently:
   ```text
   /vibecode-update always use named exports instead of default exports
   /vibecode-design-update always use 8px grid spacing for card headers
   ```

---

## 📁 Repository Structure

```text
skills/
├── .claude/
│   └── skills/
│       ├── auto-mode-workflow/     # Intelligent provider & model routing
│       │   ├── SKILL.md
│       │   └── config.json
│       ├── jev-assistance/         # Jev decision model integration
│       │   ├── SKILL.md
│       │   └── scripts/            # choose.mts, report.mts, cursor-session.mts
│       ├── use-antigravity/        # Operator/Coder separation for Antigravity (agy)
│       │   └── SKILL.md
│       ├── use-claude-code/        # Operator/Coder separation for Claude Code
│       │   └── SKILL.md
│       ├── use-cursor/             # Operator/Coder separation for Cursor agent
│       │   └── SKILL.md
│       ├── use-vibecode/           # End-to-end 3-stage Vibecode lifecycle
│       │   └── SKILL.md
│       ├── vibecode/               # Core coding hygiene & standards
│       │   ├── SKILL.md
│       │   ├── frameworks/         # Angular, CSS, Firebase, TypeScript rules
│       │   └── references/         # Cleanup, change-scope, naming, project-hygiene
│       ├── vibecode-design/        # UI, design tokens, layout & accessibility
│       │   └── SKILL.md
│       ├── vibecode-design-update/ # UI correction distillation
│       │   └── SKILL.md
│       ├── vibecode-init/          # Project profiling & onboarding rules
│       │   └── SKILL.md
│       ├── vibecode-review/        # Post-implementation disk compliance gate
│       │   └── SKILL.md
│       ├── vibecode-update/        # Code correction distillation
│       │   └── SKILL.md
│       └── vibecode-workflow/      # Ephemeral sub-agent multi-task orchestrator
│           └── SKILL.md
├── assets/
│   ├── Cute Vibecode Developer Diorama.png
│   └── Vibecode AI Coding Mascot Logo.png
└── README.md                       # Repository documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 SARI. Designed for rapid, reliable, and compliant AI-assisted software engineering.
