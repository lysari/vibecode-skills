# Chat

## `src/bun/chat.ts`

`Chat` holds a project's chat sessions and the runs started from them.

- `ChatOptions`: `sessionsRoot` is the folder of the sessions store, e.g. `<user data>/sessions`; `onEvent` receives every run event after it is added to its session.
- `LiveSession` is a session held in memory while a run streams into it, until its last change is written. `runId` is the run in progress, null once it finished.
- `stopInterruptedRun(session)` adds the stop events for a run that a quit interrupted (its running and waiting agents become "stopped", the run finishes as "stopped"); it returns false when the last run had finished. `load` writes the session back when it did.
- `send` installs the selected library skills the project does not have yet (a differing copy is left as it is) and notes each install in the session, adds the user's message with the skills as slash commands in front, titles a new session from it, and starts a run for it. The skills keep the order the user picked them in, so the slash commands read as chosen.
- `remove` drops the live session before stopping its run, so the stop events are not written back into the deleted file.
- `flush` resolves when every pending session write is on disk.
- `save` writes a session one write at a time; changes made during a write are written right after it. A live session is dropped from memory once its run finished and its last change is written.

## `tests/bun/chat.test.ts`

`StubRunner` records what the chat asks of the runner; each test emits the run's events itself (`emit`). The tests cover installing on send, refusing an empty message or a second run, recording and streaming events, passing replies, retries and stops to the runner, stopping a run a quit interrupted, deleting a session during a run, and rejecting an unknown agent.
