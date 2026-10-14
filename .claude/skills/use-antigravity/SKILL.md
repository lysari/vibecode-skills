---
name: use-antigravity
description: Use when a task should be split between two agents, one that operates (briefs, reviews, builds, tests) and Antigravity's agy CLI that writes the code
metadata:
  version: "0.0.1-20261014.1"
---

# Use Antigravity

## Overview

Split the work between two agents. The operator (you) briefs, reviews, builds, and verifies the result. Antigravity's `agy` command writes the code. This keeps the operator free to run and observe the real system while the coder works.

## When to use

- The change is small enough to state as one problem, and the code can be written without the operator watching.
- The operator has something else to do meanwhile: run the app, watch logs, test a previous change.

Do not use it for work that needs live back-and-forth with the running system, or when the fix is faster to write directly.

## Run the coder

```bash
agy --mode accept-edits --output-format stream-json -p "$(cat brief.txt)" > run.ndjson 2>&1   # one problem, one brief
agy --mode accept-edits --output-format stream-json --continue -p "$(cat review.txt)" >> run.ndjson 2>&1   # a review comment on it
```

- `-p` takes the next argument as the prompt, so it goes last, directly before the prompt. `agy -p --mode …` treats `--mode` as the prompt and the real prompt is ignored.
- `--continue` resumes the most recent conversation, so a review comment keeps the coder's context.
- `--mode accept-edits` lets the coder edit files but not run commands. In print mode a command that needs permission is auto-denied and the run ends with no output. To let it run tests or builds, add an allow-rule under `permissions.allow` in settings (for example `command(<target>)`), or use `--dangerously-skip-permissions` only when the brief's limits are tight and the working tree is safe to modify.
- `--model` and `--effort` pick the model and reasoning effort. Run `agy models` to list models.
- `--output-format stream-json` prints one JSON event per step as it happens, which is what makes progress visible. Use `text` only when no one is watching.
- Check `agy --help` first: flags change between versions.
- Keep `brief.txt`, `review.txt`, and `run.ndjson` outside the repo (a temp directory), so they do not show up in `git status` during review.

A brief can take from a few minutes to half an hour. Run it in the background and watch the log (next section).

## Watch progress

Waiting silently and reporting "it is running, I will review when it finishes" gives the user nothing to act on. Stream the coder's steps and relay them.

1. Run the coder in the background with `stream-json` into a log file, as above.
2. Follow the log through a filter that prints one line per tool step, and let each line reach you as it appears (the harness's monitor tool, or `tail -f`):

```bash
tail -f run.ndjson | jq -R -r --unbuffered 'fromjson? | select(.event=="step_update") | .step_update
  | select(.step_type=="tool" and .state=="ACTIVE") | "\(.tool_name): \(.tool_info.parameters | tostring | .[0:100])"'
```

   `fromjson?` skips the plain-text lines the CLI mixes in, such as a permission-denied notice. Watch for that notice too: it means the run ended early.
3. Check the working tree beside the log: `git status --short` and `git diff --stat` show which files the coder has touched so far.
4. Tell the user what is happening at each milestone, not once at the start. A useful update names: the step the coder is on, the files touched so far, whether tests or a build have run, and how long it has been going. Example: "Antigravity is editing `flow-panel.ts` (3 files changed, tests not run yet, 6 min in)."
5. If the log is silent for several minutes, say so, look at the last event, and decide whether the coder is stuck on a permission denial or a long command before waiting longer.
6. When the run ends, read the final events, then start the review. Do not rely on the last line of the log as the report.

Ask in the brief for the coder to say in one line what it is about to do before each step, so the log reads as a narrative.

## Write the brief

One problem per brief. A brief says:

1. Read the project's agent instructions first (`AGENTS.md`, `CLAUDE.md`, or the equivalent).
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
- **`--continue` takes the most recent conversation.** If another `agy` session ran in between, pass `--conversation <id>` instead.
