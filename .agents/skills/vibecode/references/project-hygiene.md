# Project Hygiene

## Config
- Keep each setting in one place. Do not copy the same config into a second file.
- Check that the production build uses production config. Run the build config or read it to confirm the swap happens.

## Safeguards
- Keep auth guards, input validation, permission rules, and tests switched on. When one blocks your change, tell the user instead of commenting it out.
- Follow `references/security.md` for secrets, input handling, access rules, auth, outbound data, and logging.

## Logging
- Fix logging where it happens. Do not mute the global logger or console to hide output.

## Repository
- Keep generated and local files out of git: build output, caches, logs, `.DS_Store`. Add them to `.gitignore`.
- Use the package manager and lockfile the project already has. Never add a second one.
- Use an existing dependency before adding a new one, and remove a dependency when your change stops using it.

## Tests
- Add or update a test for each behaviour you change, with a real assertion.
- Do not add empty or placeholder tests, such as generated stubs that only check the unit exists.
- Run the existing tests before finishing. Report failing tests with their output instead of leaving them silently red.

## Docs
- Keep the README accurate for what the project is, how to run it, its config and environment, and how to deploy. Update it when your change alters one of those.

## Lint and format
- Use the project's formatter and linter, and run them before finishing.
- When the project has none, tell the user. Do not add config files unasked.

## Commits
- Commit only when the user asks.
- Make one concern per commit.
- Write the subject as `type(scope): what changed` in under 72 characters, and add a body for the why when it is not obvious.
