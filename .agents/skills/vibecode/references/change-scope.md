# Change Scope

## Core rule
Make the smallest change that fully solves the request. Every changed line should trace back to what the user asked for.

## Before editing
- Read the file and its neighbours first, then match their style, formatting, and idiom.
- Identify the exact lines that need to change.
- Spot edge cases before writing code: think of empty lists, missing values, network errors, or boundary values, and make sure the change handles them.

## While editing
- Edit in place. Do not rewrite or reformat a whole file to change a few lines.
- Do not mix in unrelated fixes, renames, or style cleanups. Mention them to the user instead.
- Do not upgrade dependencies, change config, or alter public interfaces unless the request requires it.
- Keep every behaviour that worked before your change working after it, inside and outside the request. Never remove or break one without the user's OK, e.g. a table whose rendering is rewritten still sorts on a header click and keeps its keyboard selection.
- Do not invent new helpers, services, or abstractions while implementing the request. Use what already exists or write the logic directly.
- If you feel the urge to create a new abstraction, stop and ask the user first.

## Ask first when
- The request needs a new dependency, a new top-level folder, or a change to a public API.
- The change runs a database migration, rollback, seed, or script that alters database schema or data.
- Two reasonable designs exist and the choice affects how the project is maintained.
- The change touches many files beyond what the request suggests.

## After editing
- Review your own diff. Remove anything not needed for the request.
- Run the project's existing tests, linter, or build, and report the result as it is.
- After changing a shared function or component, search for every caller that passes the option you changed and check each caller the same way you checked the change, e.g. a caller that sets the option explicitly never sees a new default.

## Updating existing code
- When the user asks to add a feature, keep the current behavior as the default and add the new behavior as an option beside it. Never retarget the existing behavior. Example: the control still fills from the start; `fill="end"` is the added option.
- When the user reports the current behavior as wrong, as a complaint or a "why does X…?" question, change the default so the fix shows where they saw the bug. Never ship the fix as an opt-in option. Example: "why does the list show the oldest first?" changes the default order; it does not add an `order="newest"` option for callers to set.
- When the user asks to change or replace a behavior, find the code that implements it and change that code. Delete the old lines in the same edit. Do not add the new code beside the old code.
- Before you replace a component, library, or implementation with another, write down every behaviour the old one gave the user: each input it handled (click, secondary click, key, gesture), each state it showed, and each setting it followed. After the swap, check each item again and report the list with each result, e.g. replacing a text field's widget keeps paste, undo, the clear button and submit on Enter.
- Fix a bug in the code where it starts, with the smallest change there. Never patch around it with extra checks or special cases in the code that calls it, e.g. fix the parser that drops a field, never re-add the field in each screen that reads it.
- When the fix needs a restructure beyond the request, tell the user and ask before refactoring.
- Decide the final shape first, then edit each file once. Do not write a first version and correct it afterwards.
- Change the existing function, class, or file. Do not add `fooNew`, `fooV2`, `fooSimple`, `foo2`, or an `_old` copy next to it.
- Express the new behaviour directly in the code. Add a fallback, flag, or compatibility branch only when the user asks for one.
- Delete superseded code instead of commenting it out. Git history keeps the old version.
- After the edit, search for the old function, class, or identifier names. Update every remaining reference.
- Update the tests and the docs that describe the changed behaviour in the same change.
