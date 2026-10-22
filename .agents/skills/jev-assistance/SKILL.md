---
name: jev-assistance
description: Use whenever a choice between options is about to reach the user — a subagent or other agent returns options to pick from, a plan lists alternative approaches, a review or finding offers an either/or, your reply is about to end with "want me to fix X?" where a smaller or larger scope is also reasonable, the user pastes options from another agent and asks which one, or you are about to call AskUserQuestion, or an agent asks the user to confirm its plan, spec or design ("Does this look right?", "Shall I proceed?"). Runs the options through TypeSafe's Jev model for a typed, probability-backed recommendation, then picks automatically when Jev is confident and the pick is safe, or asks the user with the ranking shown.
---

# Jev Assistance

A decision layer between "an agent offers options" and "the user picks one". Jev (TypeSafe's System One model) judges the options; code in `scripts/choose.mts` turns the judgments into a ranking and an `auto` or `ask` decision.

## When to use

- A subagent, another agent, or a tool result hands back 2+ options for the user to choose from.
- You are about to call `AskUserQuestion` with options.
- The user pastes options from another agent and asks which to take.
- Your own message is about to end with an offer of work that has more than one reasonable scope, e.g. "Want me to fix #1–3 and #5?" after a review. That is a choice: list the real scopes as options (`Fix #1 only`, `Fix #1–3 and #5`, `Fix everything`) and run them before you send the message.
- Your review, plan, or finding gives the user an either/or to decide, e.g. "either press only the icon, or keep scaling the face". Run it before you send the message.
- An agent asks the user to confirm its plan, spec, or design ("Does this host look right so far?", "Shall I proceed with this?"). That is a choice between two options: `Approve as written`, and `Revise first`, whose description lists every gap you found by checking the proposal against its spec (roadmap entry, project rules, settled decisions), e.g. "Add keyboard handling with roving tabindex and the three custom properties from the roadmap". Put the spec and the proposal in `context`. When you find no gap, describe `Revise first` as "Send it back for changes not named here". When Jev picks `Revise first`, answer the agent with the gaps listed in that description.

Skip it for a single option, free-text questions, and questions only the user can answer from private knowledge (their name, their account, which file they mean). An offer is a single option only when the sole alternative is doing nothing. When fewer or more of the work would also be reasonable, run it.

## Never auto-pick

Always ask the user, and show Jev's ranking as the recommendation, when the question:

- is one the user's `CLAUDE.md`, `AGENTS.md` or project rules require you to ask (Devbox setup, access outside the project, `.env` access);
- grants permissions, spends money, deletes, publishes, pushes, or sends anything;
- would be answered with an option that weakens security: exposes or hard-codes secrets, bypasses auth, validation or sanitization, or runs untrusted input. Hand it to the user even when the script says `auto`, and name the risk in the question;
- comes back with `decision: "ask"` from the script.

## Steps

1. Collect the input. Write the user's real goal and the constraints you know (stack, project rules, preferences stated in this session) — Jev judges only what you put in `state`.

   ```json
   {
     "goal": "What the user is trying to achieve, in one or two sentences",
     "context": "Project facts, constraints, and stated preferences that bear on the choice",
     "question": "The question exactly as the agent asked it",
     "options": [
       { "label": "Short option name", "description": "What choosing it does" }
     ],
     "agentPick": "Label of the option the agent recommended, or omit"
   }
   ```

   Jev judges independently and never sees the agent's recommendation. Put it only in `agentPick`. Leave it out of `goal`, `context`, `question` and the option descriptions, and drop wording like "I recommend…" or "best option". The script also strips markers such as `(Recommended)` and `Recommended:` from labels and descriptions, and uses the marked option as `agentPick` when the field is missing.

2. Run the script from the project root (Node 24+, no install needed):

   ```bash
   node .agents/skills/jev-assistance/scripts/choose.mts <<'JSON'
   { ...the input above... }
   JSON
   ```

3. Act on the result:
   - `decision: "auto"` and no rule in **Never auto-pick** applies → proceed with `pick` and tell the user in one line: `Jev picked "<pick>" (confidence 0.82) — <reason>`. When `agreesWithAgent` is `false`, say so: `Jev picked "<pick>" over the agent's recommended "<agentPick>"`.
   - `decision: "ask"` → call `AskUserQuestion` with Jev's `pick` (or the top of `ranking` when `pick` is null) as the first option, labelled `(Recommended by Jev)`, and put the `reason` in its description. After the user answers, run the `afterAnswer` command from the result with their answer, so the report shows it as theirs. Do the same when a **Never auto-pick** rule made you ask on an `auto` result.

4. When the script fails (no key, network, 4xx/5xx), say so in one line and ask the user the original question unchanged. Never invent a Jev result. Log their answer with the `--user-pick` command the script prints with the error.

5. When the task is implemented, follow the `afterTask` field of your last Jev result: run the report command it names, with the session id already filled in, and paste its output unchanged at the end of your final message, under the heading `Jev picks`. The report lists every run in the session's log, so it covers all your picks, however many there were. Below it, name every answer marked ⚠️ and say what you did with it. A subagent that ran Jev puts its `afterTask` command in its result, so the agent that ends the task runs it.

## What Jev is asked

All questions go in one request over the same `state`, so they run in parallel:

| Question | Primitive | Meaning |
|----------|-----------|---------|
| `best` | Choice | Which option best serves `goal` within `context`, preferring the stack's current approach when several fit, with a `none_fit` catch-all |
| `fit_<i>` | Score (3 levels) | How well option *i* reaches the goal and respects constraints |
| `usability_<i>` | Score (3 levels) | How good option *i*'s result feels to use for end users or calling developers |
| `modern_<i>` | Score (3 levels) | How current option *i*'s APIs and patterns are for the stack and version in `context` |
| `safety_<i>` | Score (3 levels) | How local and undoable option *i* is |
| `reliability_<i>` | Score (3 levels) | How dependably option *i* works across inputs, states and environments |
| `simplicity_<i>` | Score (3 levels) | How little ongoing complexity option *i* adds |
| `irreversible_<i>` | Noul | Whether option *i* deletes, publishes, pushes, sends, spends, or reaches outside the project |
| `security_<i>` | Noul | Whether option *i* weakens security: secrets, auth, validation, sanitization, untrusted code, broad permissions, untrusted dependencies |

Code normalizes each Score to 0–1 and ranks by `0.30·fit + 0.18·usability + 0.15·modern + 0.13·safety + 0.12·reliability + 0.12·simplicity`. Name the stack and its version in `context` (for example "Angular 22, signals available") so `modern` has something to judge against. Code then compares Jev's pick with `agentPick`; the agent's recommendation never changes the decision. The decision is `auto` only when all hold:

- `best` is not `none_fit`;
- `best.confidence ≥ 0.6`;
- the pick's `securityRisk` probability is `≤ 0.2` (checked first; above it the reason starts with `Security risk:`);
- the pick's `irreversible` probability is `≤ 0.3`;
- the pick is also first in the scored ranking.

Weights and thresholds are constants at the top of `scripts/choose.mts`. They are starting values: tune them when Jev's picks stop matching what the user would choose.

## Output

```json
{
  "decision": "auto",
  "pick": "Signal in an injectable service",
  "agentPick": "NgModule + BehaviorSubject service",
  "agreesWithAgent": false,
  "confidence": 0.99,
  "reason": "Confident, reversible, and top of the scored ranking. Jev disagrees with the agent's recommended \"NgModule + BehaviorSubject service\".",
  "ranking": [
    { "label": "Signal in an injectable service", "composite": 0.84, "choiceProbability": 0.99, "fit": 0.81, "usability": 0.9, "modern": 0.91, "safety": 0.94, "reliability": 0.88, "simplicity": 0.57, "irreversible": 0.03, "securityRisk": 0.02 }
  ],
  "afterAnswer": "When you ask the user instead of taking the pick, log their answer with `JEV_SESSION_ID=42ce77e3-8979-4c10-99dd-f7af38787756 node .agents/skills/jev-assistance/scripts/choose.mts --user-pick \"<their answer>\"`.",
  "afterTask": "When the task is implemented, run `node .agents/skills/jev-assistance/scripts/report.mts 42ce77e3-8979-4c10-99dd-f7af38787756` and paste its output under \"Jev picks\" at the end of your final message."
}
```

`afterAnswer` and `afterTask` are printed only, never logged. `choose.mts --user-pick "<answer>"` appends `{ at, userPick }` to the log, and the report credits it to the run just before it.

## Logs

Every run, failed or not, appends one JSON line to `.agents/skills/jev-assistance/logs/<session-id>.jsonl` (git-ignored), one file per session. The session id is the first one set of `JEV_SESSION_ID`, Claude Code's `CLAUDE_CODE_SESSION_ID`, Codex's `CODEX_THREAD_ID` and OpenCode's `OPENCODE_RUN_ID`, else `no-session-<YYYY-MM-DD>`. Cursor exposes no session variable, so `.cursor/hooks.json` runs `scripts/cursor-session.mts` on `sessionStart`, which sets `JEV_SESSION_ID` to the chat's `conversation_id` and tells the agent to pass it as a prefix. Any other caller passes its own id, e.g. `JEV_SESSION_ID=<id> node .agents/skills/jev-assistance/scripts/choose.mts`. Each line holds `at`, `request`, then either `verdict`, `model`, `usage` and `ms`, or `error` and `ms`. The API key is never logged.

```bash
tail -n 20 ".agents/skills/jev-assistance/logs/$CLAUDE_CODE_SESSION_ID.jsonl"
```

`scripts/report.mts` turns the session's log into Markdown: one `**Q:**` bullet per run with its `*A:*` answer in italics as a sub-bullet (pairs alternate `-` and `*` bullets, so each renders as its own list with a small gap), ending `by Jev` for an auto pick, `by user` when a `userPick` follows the run, `Jev suggested, answer not logged` when it does not, or reading `Jev failed`. A ⚠️ before Jev's pick marks one the script held back for security. It reads the same session id as `choose.mts`; pass another id as its first argument to see an earlier session, e.g. `node .agents/skills/jev-assistance/scripts/report.mts 42ce77e3-8979-4c10-99dd-f7af38787756`.

## Setup

- Export the key in your shell profile: `export TYPESAFE_API_KEY=...`. The script reads only that variable and never logs it.
- API reference: https://docs.typesafe.ai/api.md
