# Tests

## `tests/bun/chat.test.ts`

`StubRunner` records what the chat asks of the runner; each test emits the run's events itself.

## `tests/bun/mock-agent-runner.test.ts`

- Seeds are searched rather than hard-coded, so the tests keep working when the mock's script changes. `findSeed` returns a seed whose run fails (or not) once any question is answered; a "?" in the prompt always asks one.
- `ManualClock` only moves when the test steps it, firing due timers in order; `run(limitMs)` fires timers until none is left or `limitMs` has passed and awaits the scripts they resume.
