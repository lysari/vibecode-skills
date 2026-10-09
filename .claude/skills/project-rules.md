# Project Rules

This repo's own rules. `vibecode` reads this file after its framework files (Angular, TypeScript, Firebase, CSS), and where they differ this file wins. `AGENTS.md` wins over both.

## Pages
- One page = one folder under `src/app/pages/` with at most 3 files: `<name>.ts`, `<name>.html`, `<name>.scss`.
- Count the files in the page folder before adding one. If the folder would exceed 3, choose one of these instead of adding the file:
  - Put the code inside the existing file.
  - Move a distinct part of the UI into a reusable component in `src/app/shared/components/<name>/`.
  - Move code used by 2 or more pages into `src/app/shared/`.
- Keep one `.scss` per page. When it grows past 300 lines, move parts of the template into reusable components so each has its own small `.scss`.
- Keep a directive or service used by one page inside that page's file until a second consumer exists.

## Tests
- Never put a `.spec.ts` file under `src/app/`. Write every test in `src/specs/`, at the same path its source has under `src/app/`, e.g. `src/app/shared/utils/accent.ts` → `src/specs/shared/utils/accent.spec.ts`.
- Import the code under test through the `@app/` alias, never a relative path, e.g. `import { accentOf } from '@app/shared/utils/accent';`.

## Helpers
- Before writing a helper, search `src/app/shared/` for one that does the same job and call it.
- Put a helper that uses no page or domain type in `src/app/shared/utils/<topic>.ts`, even with one caller, e.g. `textControl()` in `form-controls.ts`.
- Keep a helper that reads or builds a page's own domain types in that page's file, e.g. `toPerson()` for `IRelatedPerson`.

## Reusable components
- A reusable component lives in its own folder under `src/app/shared/components/<name>/`. The 3-file limit does not apply to it.
- Keep every file that belongs to that component in its folder (directive, types), and keep unrelated code out of it.
- Build a new reusable component straight in `src/app/shared/components/<name>/` together with its `src/app/pages/components-docs/<name>-docs/` page. Never build it first as a copy under `.claude/demo/`.

## Constants, data and interfaces
- Put constants, enums, and dummy data in `src/app/shared/constants/`, never in a page folder, even when only one page uses them.
- Put fake data used only for testing in `src/app/shared/constants/fake.ts`.
- Put an interface used by 2 or more files in `src/app/shared/interfaces/<name>.interface.ts`, and the constant a literal union lists in `src/app/shared/constants/`.

## Style variables
- Declare every global style variable, a custom property on `:root` or a Sass `$` variable read by 2 or more files, in a partial under `src/styles/`. Never declare one in `src/styles.scss` or in a page or component `.scss`; `src/styles.scss` only `@use`s the partials.
- Put colours in `src/styles/_palette.scss`: first every base colour with its value, e.g. `--primary: #0066d6`, `--gray-200: #e3e7ed`, then every design colour as a `var()` of a base colour, e.g. `--border: var(--gray-200)`. Never give a design colour a literal value.
- Read only design colours outside `src/styles/_palette.scss`, e.g. `var(--brand)`, never `var(--primary)`. To change a colour for one part of the page, override the design colour there.
- Put every `@font-face` and every font variable in `src/styles/_font.scss`, e.g. `--font-sans`. Serve the font files from `public/fonts/`, never from a font CDN `<link>`.
- Put every other global variable (radius, shadow, layout size) in `src/styles/_variables.scss`, e.g. `--radius-lg`, `--page-width`.
- Put every global style rule (element defaults, form controls, shared classes such as `.eyebrow`) in `src/styles/_global.scss`, e.g. `body { margin: 0; }`.
- Keep a reusable component's own `--<component>-*` custom properties in that component's `.scss`.

## Firebase
- Pipe `pauseOnHidden()` from `@app/shared/services/visibility.service` into every observable that reads from Firebase, e.g. `docData(ref).pipe(pauseOnHidden())`.

## Comments and docs
- Write code comments only in reusable component files under `src/app/shared/components/`. For every other file, put the explanation in `docs/<file-name>.md`.
- Write no comments in a page folder under `src/app/pages/`: not in its `.ts`, `.html` or `.scss`, nor in its spec under `src/specs/pages/`, and no section banners. Put the page's explanation in `docs/<page-name>.md`, grouped by topic.
- When you edit a page file that has comments, move what they explain into `docs/<page-name>.md` and delete them from the file.
- Put no comments in interface files. Document them in `docs/<file-name>.md`.
- Documentation in `docs/<file-name>.md` or `docs/<page-name>.md` is the one kind of doc you may add without being asked.

## Component docs
- Give every page under `src/app/pages/components-docs/` a `Playground` section, listed in its `sections`, where one live instance is driven by a control for every input and output of the component and its directives and for every `--<component>-*` custom property, e.g. a select for `orientation`, a checkbox for `linear`, a range for `--liquid-stepper-gap`, and a status line that shows `blocked` when it fires.
- Print the markup for the current playground settings under the playground, e.g. `<pre class="docs-code">{{ playMarkup() }}</pre>`.
- When you add an input, output or custom property to a component, add its playground control and its API table row in the same change.
- Give every page whose component has size or shape custom properties (`--<component>-height`, `-radius`, `-gap`) a `Sizes` section, listed in its `sections`, that shows a compact, a default, a large and a narrow instance, e.g. `--liquid-slider-height: 36px`, `48px`, `60px` and one 220px wide.
- Label every demo button with the action it performs, in words, e.g. `Set Radius to 40`. Never label it with code such as `radius = 40`.

## Browser checks
- Before reporting a component done, measure it with the Chrome DevTools MCP at the smallest, default and largest value of each size custom property, at a narrow and a wide width, and, for a component that holds a value, at its lowest, middle and highest value. Fix every overlap, clipped text or misaligned part the measurements show.
- Before reporting a component or directive that animates done, interrupt it with the Chrome DevTools MCP: set a new value while it is still moving, set a new value every frame for half a second the way a fast slider drag does, hide its host with `display: none` mid-animation and show it again, and change each input mid-animation. Sample what is on screen each frame and fix every replay, jump, freeze or extra movement, e.g. a counter that never leaves its first value while values stream in.
- When matching a reference image, take the comparison screenshot with the Chrome DevTools MCP.

## Reviewing
- When reviewing a diff that touches a component, directive, template or style, open its `src/app/pages/components-docs/` page with the Chrome DevTools MCP and exercise the changed behaviour before reporting, e.g. drag the slider fast and time when the digits land.
- Reproduce every review finding about UI behaviour with the Chrome DevTools MCP before reporting it, e.g. hide the host mid-spin and read its classes. Drop a finding the browser disproves.
- Never report a UI finding as unverified or "not checked in a browser". When the Chrome DevTools MCP does not respond, stop and tell the user instead of reporting.
- Skip `src/app/pages/components-docs/` when reviewing, searching or counting the whole project.
