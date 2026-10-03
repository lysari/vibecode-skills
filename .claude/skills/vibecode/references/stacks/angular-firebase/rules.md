# Angular + Firebase Rules

Apply these on top of the generic rules when the project root has an `angular.json`.

## Pages
- One page = one folder under `pages/` with at most 4 files: `<name>.ts`, `<name>.html`, `<name>.scss`, `<name>.spec.ts`.
- Count the files in the page folder before adding one. If the folder would exceed 4, choose one of these instead of adding the file:
  - Put the code inside the existing file.
  - Move a distinct part of the UI into a reusable component in `shared/components/<name>/`.
  - Move code used by 2 or more pages into `shared/`.
- Keep one `.scss` per page. When it grows past 300 lines, move parts of the template into reusable components so each has its own small `.scss`.
- Keep a directive, helper, or service used by one page inside that page's file until a second consumer exists.

## Reusable components
- A reusable component lives in its own folder under `shared/components/<name>/`. The 4-file limit does not apply to it.
- Keep every file that belongs to that component in its folder (directive, types, specs), and keep unrelated code out of it.

## Constants and data
- Put constants, enums, and dummy data in `src/app/shared/constants/`, never in a page folder, even when only one page uses them.
- Put fake data used only for testing in `src/app/shared/constants/fake.ts`.
- Reserve the `.service.ts` suffix for injectable classes, so a constants file never carries it.

## Comments and docs
- Write code comments only in component files. For every other file, put the explanation in `docs/<file-name>.md`.
- In a component, comment why, not what: a hidden constraint, a workaround, a surprising choice.
- Documentation for a non-component file goes in `docs/<file-name>.md`; this is the one kind of doc you may add without being asked.

## Interfaces
- Read `interfaces.md` in this folder before writing or changing an interface or type.
