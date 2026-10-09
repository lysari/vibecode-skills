# Angular Rules

Apply these on top of the generic rules when the project root has an `angular.json`.

## Forms
- Write every fixed form field as its own control in the template and its own entry in the form definition. Do not generate fixed fields from a config array with `@for`.
- Use `@for` only over a `FormArray` whose rows the user adds or removes.
- Give each field its own label, validators, and error text where it is written, so changing one field touches one place.

## File names
- Reserve the `.service.ts` suffix for injectable classes, so a constants file never carries it.

## Template text
Apply this section when the project uses `@angular/localize`.
- Write fixed UI text inline in the `.html` with `i18n="@@id"` on the element, or `i18n-<attr>="@@id"` beside a plain `<attr>="Text"` input, such as `i18n-label` with `label="Occupation"`.
- Never give the template a labels map to read from, such as `protected readonly t = LABELS` with `{{ t['key'] }}` or `[label]="t['key']"`.
- Keep `$localize` in TypeScript only for text the code itself builds or passes along: option lists, error messages, labels looked up by key at runtime.
- When template text reuses an ID that also exists in `$localize`, the text must match exactly, whitespace included. If the formatter wraps it across lines, wrap the text in `<ng-container i18n="@@id">Text</ng-container>`. Run `ng extract-i18n` and confirm it reports no duplicate-message warnings.
