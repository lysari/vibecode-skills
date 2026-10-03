# Cleanup

## Before finishing a change
- Delete code your change made unused: functions, imports, variables, parameters, files.
- Delete debug output (`console.log`, `print`), commented-out code, and stray TODOs you added.
- Delete scratch files, test output, and backups you created.
- Remove any dependency or config entry your change made unnecessary.

## Leave alone
- Dead code that existed before your change. Report it to the user instead of deleting it.

## Final check
1. List the files you created or modified and confirm each one is needed.
2. Search the project for the names you removed or renamed to confirm no references remain.
3. Run the formatter and linter the project already uses.
4. Run the existing tests or build.
