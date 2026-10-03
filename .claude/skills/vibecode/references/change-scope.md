# Change Scope

## Core rule
Make the smallest change that fully solves the request. Every changed line should trace back to what the user asked for.

## Before editing
- Read the file and its neighbours first, then match their style, formatting, and idiom.
- Identify the exact lines that need to change.

## While editing
- Edit in place. Do not rewrite or reformat a whole file to change a few lines.
- Do not mix in unrelated fixes, renames, or style cleanups. Mention them to the user instead.
- Do not upgrade dependencies, change config, or alter public interfaces unless the request requires it.
- Keep existing behaviour for everything outside the request.

## Ask first when
- The request needs a new dependency, a new top-level folder, or a change to a public API.
- Two reasonable designs exist and the choice affects how the project is maintained.
- The change touches many files beyond what the request suggests.

## After editing
- Review your own diff. Remove anything not needed for the request.
- Run the project's existing tests, linter, or build, and report the result as it is.

## Updating existing code
- Find the code that implements the current behaviour and change that code to the new behaviour. Replace the old lines; do not add the new code beside them.
- When a new requirement replaces an old one, delete the old code in the same edit.
- Decide the final shape first, then edit each file once. Do not write a first version and correct it afterwards.
- Change the existing function, class, or file. Do not add `fooNew`, `fooV2`, `fooSimple`, `foo2`, or an `_old` copy next to it.
- Express the new behaviour directly in the code. Add a fallback, flag, or compatibility branch only when the user asks for one.
- Delete superseded code instead of commenting it out. Git history keeps the old version.
- After the edit, search for the old function, class, or identifier names. Update every remaining reference.
- Update the tests and the docs that describe the changed behaviour in the same change.
