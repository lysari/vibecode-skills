# Chat

## `src/bun/chat.ts`

`Chat` holds a project's chat sessions and the runs started from them.

- `ChatOptions`: `sessionsRoot` is the folder of the sessions store, e.g. `<user data>/sessions`; `onEvent` receives every run event after it is added to its session.
- `LiveSession` is a session held in memory while a run streams into it, until its last change is written. `runId` is the run in progress, null once it finished.
- `stopInterruptedRun(session)` adds the stop events for a run that a quit interrupted (its running and waiting agents become "stopped", the run finishes as "stopped"); it returns false when the last run had finished. `load` writes the session back when it did.
- `send` adds the user's message with the selected skills as slash commands in front, titles a new session from it, saves the agent and the selected skills in the session, and starts a run for it. Only the selected skills the agent can use go in front of the message: the project's own skills and the skills in the agent's global folders (`AGENT_CLIS` `skillFolders`, every folder of `GLOBAL_SKILL_FOLDERS` for the default agent); an unknown skill is left out. Nothing is copied into the project. The skills keep the order the user picked them in, so the slash commands read as chosen.
- `remove` drops the live session before stopping its run, so the stop events are not written back into the deleted file.
- `flush` resolves when every pending session write is on disk.
- `save` writes a session one write at a time; changes made during a write are written right after it. A live session is dropped from memory once its run finished and its last change is written.

## `tests/bun/chat.test.ts`

`StubRunner` records what the chat asks of the runner; each test emits the run's events itself (`emit`). The tests use temporary project and home folders. They cover the slash commands on send for a CLI agent and for the default agent, with nothing copied into the project, refusing an empty message or a second run, recording and streaming events, passing replies, retries and stops to the runner, stopping a run a quit interrupted, deleting a session during a run, rejecting an unknown agent, and a new session's default skill (removing it is saved, and it goes in the prompt only when the agent can use it).
