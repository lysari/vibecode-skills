---
name: use-cursor
description: Use when a task should be split between two agents, one that operates (briefs, reviews, builds, tests) and Cursor's agent CLI that writes the code
metadata:
  version: "0.0.1-20261014.1"
---

# Use Cursor

## Overview

Split the work between two agents. The operator (you) briefs, reviews, builds, and verifies the result. Cursor's `agent` command writes the code. This keeps the operator free to run and observe the real system while the coder works.

## When to use

- The change is small enough to state as one problem, and the code can be written without the operator watching.
- The operator has something else to do meanwhile: run the app, watch logs, test a previous change.

Do not use it for work that needs live back-and-forth with the running system, or when the fix is faster to write directly.

## Run the coder

```bash
agent -p --force --trust --output-format stream-json "$(cat brief.txt)" > run.ndjson 2>&1   # one problem, one brief
agent -p --force --trust --continue --output-format stream-json "$(cat review.txt)" >> run.ndjson 2>&1             # a review comment on it
```

- `--output-format stream-json` prints one JSON event per step as it happens, which is what makes progress visible. Use `text` only when no one is watching. Do not add `--stream-partial-output`: it splits text into many small events and the filter below expects whole steps.
- Keep `brief.txt`, `review.txt`, and `run.ndjson` outside the repo (a temp directory), so they do not show up in `git status` during review.

A brief can take from a few minutes to half an hour. Run it in the background and watch the log (next section).

## Watch progress

Waiting silently and reporting "it is running, I will review when it finishes" gives the user nothing to act on. Stream the coder's steps and relay them. The sub-agent does this by default; with `--direct`, the operator does it.

1. Run the coder in the background with `stream-json` into a log file, as above.
2. Follow the log through a filter that prints one line per step, and let each line reach you as it appears (the harness's monitor tool, or `tail -f`):

```bash
tail -f run.ndjson | jq -R -r --unbuffered 'fromjson? | if .type=="tool_call" and .subtype=="started" then
  (.tool_call | to_entries[0] | "\(.key | sub("ToolCall$";"")): \(.value.args | (.command // .path // .pattern // "") | tostring | .[0:100])")
  elif .type=="assistant" then (.message.content[]? | select(.type=="text") | "SAY: \(.text)") else empty end'
```

3. Check the working tree beside the log: `git status --short` and `git diff --stat` show which files the coder has touched so far.
4. Tell the user what is happening at each milestone, not once at the start. A useful update names: the step the coder is on, the files touched so far, whether tests or a build have run, and how long it has been going. Example: "Cursor is editing `flow-panel.ts` (3 files changed, tests not run yet, 6 min in)."
5. If the log is silent for several minutes, say so, look at the last event, and decide whether the coder is stuck on a long command before waiting longer.
6. When the run ends, read the `result` event (`jq 'select(.type=="result")' run.ndjson`), then start the review. Do not rely on the last line of the log as the report.

Ask in the brief for the coder to say in one line what it is about to do before each step, so the log reads as a narrative.

## Run through a sub-agent (default)

By default the operator does not start or tail the coder itself. It starts a background sub-agent (the Agent tool, on a cheap model such as haiku) that runs the coder and watches the log. The user can open the sub-agent's row to see each step, and the operator's own context stays free of log lines. With the `--direct` tag, skip the sub-agent: the operator runs the coder and tails the log itself, as in "Watch progress".

Give the sub-agent a prompt that stands alone, since it starts with no context:

1. The exact coder command, in the background, with the log path and the path of the brief file. Pass the path, not the brief text.
2. The progress filter from "Watch progress", and an instruction to check it and `git diff --stat` every few minutes instead of every line.
3. Limits: run only the coder command and read-only checks; do not edit code, fix problems, commit, stage, stash, reset, or checkout.
4. What to return: the final `result` event, the files changed, anything denied or stuck, and the elapsed time.

When the sub-agent finishes, the operator reads its report, then does the review as usual. Notes:

- The sub-agent uses its own model's tokens. They stay out of the main session but still count toward usage.
- It cannot message the user while it runs. The user sees progress only by opening its details, and the operator hears only when it finishes.
- It does not review. Judging the diff, building, and testing stay with the operator.
- For a review comment, start a new sub-agent with the `--continue` command.

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
