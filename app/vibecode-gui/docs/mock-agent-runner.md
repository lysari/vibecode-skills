# Mock agent runner

## `src/bun/mock-agent-runner.ts`

`MockAgentRunner` plays a realistic orchestration without starting any CLI: an orchestrator, a planner, two or three parallel coders each with its own test runner, and a reviewer per selected skill. A question in the prompt makes a coder ask the user; some seeds make a test runner fail until it is retried.

- `RunnerClock` is the time source of a mock run, injected so tests can step through a run without waiting.
- `MockAgentRunnerOptions.seed` fixes the run's random choices; by default they follow from the prompt, agent and skills (`hashText`).
- `PRICE_PER_TOKEN` holds mock prices per token, only so cost totals move like a real run's.
- `MockRun.replies` are the agents waiting in "needs-input", resolved by `reply`; `MockRun.retries` are the failed agents waiting for `retry`, resolved with their replacement.
- `MockFailure` is a failure the mock plays out: the agent fails and waits for a retry.
- `createRandom` is mulberry32, a small seeded generator, so a run with the same seed always plays out the same way.
- `readTask(prompt)` is the request without the slash commands in front, as the agents quote it.
- `sleep`: a stopped run's timers are cleared, so its scripts never resume.
- `runAgent` runs an agent's script to "done"; a failure waits for a retry, which runs the script again on the replacement.

## `tests/bun/mock-agent-runner.test.ts`

- Seeds are searched rather than hard-coded, so the tests keep working when the mock's script changes. `findSeed` returns a seed whose run fails (or not) once any question is answered; a "?" in the prompt always asks one.
- `ManualClock` only moves when the test steps it, firing due timers in order; `run(limitMs)` fires timers until none is left or `limitMs` has passed and awaits the scripts they resume.
