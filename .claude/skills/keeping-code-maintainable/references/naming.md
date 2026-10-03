# Naming

## Rules
- Match the naming style already used in the surrounding code (case style, prefixes, suffixes).
- Name by what a thing is or does, in domain words the project already uses.
- Functions are verbs (`parseConfig`), values and types are nouns (`userList`, `RetryPolicy`), booleans read as questions (`isReady`, `hasError`).
- Keep one term per concept across the whole project. If the code says `customer`, do not introduce `client` or `user` for the same thing.
- Make length match scope: short names in a few lines, descriptive names for anything exported or long-lived.

## Files and folders
- Use the project's file naming convention (kebab-case, snake_case, PascalCase) and keep it consistent in each folder.
- Name a file after the main thing it contains.

## Avoid as names
- Vague words: `data`, `info`, `temp`, `util`, `helper`, `manager`, `misc`, `new`, `final`.
- Numbered or dated suffixes: `handler2`, `config_new`.
- Abbreviations the project does not already use.

## Renaming
- When renaming, update every reference in the same change and re-run search to confirm no old name remains.
