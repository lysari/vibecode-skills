---
name: use-claude-code
description: Use when a task should be split between two agents, one that operates (briefs, reviews, builds, tests) and Claude Code's claude CLI that writes the code
metadata:
  version: "0.0.1-20261014.1"
---

# Use Claude Code

## Overview

Split the work between two agents. The operator (you) briefs, reviews, builds, and verifies the result. Claude Code's `claude` command, run in print mode as a separate session, writes the code. This keeps the operator free to run and observe the real system while the coder works.

## When to use

- The change is small enough to state as one problem, and the code can be written without the operator watching.
- The operator has something else to do meanwhile: run the app, watch logs, test a previous change.

Do not use it for work that needs live back-and-forth with the running system, or when the fix is faster to write directly. A coder session is a fresh context: it knows only the brief and the project's instruction files.

## Where the coder runs

The skill takes one optional tag:

| Tag | Where | Command |
| --- | --- | --- |
| none (default) | Docker sandbox | `claude` (a shell function that points to `sbx`) |
| `--host` | The host machine | `command claude` (skips the function and runs the real binary) |

The default isolates the coder from the host: it sees only the mounted workspace. Use `--host` when the coder needs host tools, files outside the workspace, or host services the sandbox cannot reach. With no tag, use the sandbox.

In the examples below, `claude` is the default command. With `--host`, write `command claude` in its place.

## Run the coder

```bash
claude -p --permission-mode acceptEdits --output-format stream-json --verbose "$(cat brief.txt)" > run.ndjson 2>&1   # one problem, one brief
claude -p --permission-mode acceptEdits --output-format stream-json --verbose --continue "$(cat review.txt)" >> run.ndjson 2>&1   # a review comment on it
```

With `--host`, write `command claude` in place of `claude`.

Use the same mode for a brief and its review comments: a sandbox session and a host session do not share history, so `--continue` only finds the coder's session in the mode that started it.

- `-p` runs one prompt non-interactively. `--continue` resumes the most recent conversation in the directory, so a review comment keeps the coder's context.
- `--output-format stream-json --verbose` prints one JSON event per step as it happens, which is what makes progress visible. Print mode needs `--verbose` for it. Use `text` only when no one is watching.
- `--permission-mode acceptEdits` lets the coder edit files without asking. Shell commands it needs (tests, build) must be allowed with `--allowedTools "Bash(npm test:*)"` or the project's settings. Use `--disallowedTools` to block commands the limits forbid, such as `"Bash(git commit:*)"`.
- `--dangerously-skip-permissions` is a last resort, only when the brief's limits are tight and the working tree is safe to modify.
- `--model` and `--effort` pick the model and reasoning effort.
- Check `claude --help` first: flags change between versions. If `claude` is not a sandbox function on the machine in use, there is no difference between the two modes: `command claude` and `claude` run the same binary.
- Keep `brief.txt`, `review.txt`, and `run.ndjson` outside the repo (a temp directory), so they do not show up in `git status` during review.

A brief can take from a few minutes to half an hour. Run it in the background and watch the log (next section).

## Watch progress

Waiting silently and reporting "it is running, I will review when it finishes" gives the user nothing to act on. Stream the coder's steps and relay them.

1. Run the coder in the background with `stream-json` into a log file, as above.
2. Follow the log through a filter that prints one line per step, and let each line reach you as it appears (the harness's monitor tool, or `tail -f`):

```bash
tail -f run.ndjson | jq -R -r --unbuffered 'fromjson? | select(.type=="assistant") | .message.content[]?
  | if .type=="text" then "SAY: \(.text)" elif .type=="tool_use" then "\(.name): \(.input | tostring | .[0:100])" else empty end'
```

3. Check the working tree beside the log: `git status --short` and `git diff --stat` show which files the coder has touched so far.
4. Tell the user what is happening at each milestone, not once at the start. A useful update names: the step the coder is on, the files touched so far, whether tests or a build have run, and how long it has been going. Example: "The coder is editing `flow-panel.ts` (3 files changed, tests not run yet, 6 min in)."
5. If the log is silent for several minutes, say so, look at the last event, and decide whether the coder is stuck on a permission denial or a long command before waiting longer.
6. When the run ends, read the `result` event (`jq 'select(.type=="result")' run.ndjson`), then start the review. Do not rely on the last line of the log as the report.

Ask in the brief for the coder to say in one line what it is about to do before each step, so the log reads as a narrative.

## Write the brief

One problem per brief. A brief says:

1. Read the project's agent instructions first (`CLAUDE.md`, `AGENTS.md`, or the equivalent).
2. The problem, with the evidence: error text, log lines, times, how to reproduce.
3. Where in the code to look.
4. What to do, as rules and outcomes, not as code to paste.
5. The tests and any visible output expected.
6. The limits (below).
7. What to report back: files changed, what was decided, what was not done.

## Limits in every brief

- Change only what the problem needs.
- Do not start or run the application.
- Do not commit, stage, stash, reset, or checkout.
- Do not edit docs, status files, agent instruction files, or generated and run output.
- Say whether the coder may build. If the operator is running the application or holds a lock on the build, the coder writes code and tests only and the operator builds afterward.

## Review

1. Review the diff, not the report: list touched files (`git status --short`), read the change (`git diff`).
2. Run the full build and tests.
3. Verify the behavior in the real system. A change is done when it has been seen working, not when the report says so.
4. Send each finding back with `--continue` as a review comment that includes the evidence that shows it.

## Pitfalls

- **Prefer natural use to a staged test.** Hand-staging a hard-to-reach state often costs more than reaching it by running the system normally.
- **A fix that turns a failure into "keep going" needs a loop check.** Removing a failure can leave two rules that read the same fact and disagree, so the system retries forever or flips state repeatedly. Ask in review: what ends this now, and can the rules disagree? Ask the coder for a test that walks the whole sequence, not only the single step.
- **Do not trust a report that reads well.** Confirm it against the diff and a real run.
- **`--continue` takes the most recent conversation in the directory.** If another `claude` session ran there in between, use `--resume <session-id>` instead.
- **Do not call the coder from inside the operator's own session by accident.** Run it as a separate process with its own prompt, never by typing into the operator's session.
