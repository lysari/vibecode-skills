# Session types

## `src/shared/interfaces/session.interface.ts`

Used by both the main process and the webview.

- `Session`: a chat session of a project, stored as one JSON file in the app's user data folder. `agent` is a key of `AGENT_CLIS`, or null for the default agent; `skills` holds the names of the skills selected in the composer, kept even while the chosen agent cannot use one; `events` are the run events of every run started from it.
- `UserMessage`: `text` is what the agent received, with the selected skills as slash commands in front; `runId` is the run it started or answers; `replyTo` is the agent the message answers, for a reply to a "needs you" question.
- `SystemNote`: a line from the app itself. The app no longer writes any; sessions saved by earlier versions hold notes such as "Installed vibecode-review into .claude/skills", which still show in their thread.
- `SessionStatus`: how the session's latest run stands; `idle` before the first message.
- `SessionSummary`: a row of a project's session list.
- `SessionChoices`: the composer choices kept per session.
