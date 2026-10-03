# Interfaces

## Before writing one
- Search `src/app/shared/interfaces/` and the project for an interface that already describes this data. Edit it instead of adding another.
- Never add a second version of an interface (`foo2.interface.ts`, `FooV2`, `FooNew`). Change the existing one and update every user of it.

## Where it lives
- An interface used by one file is declared in that file.
- An interface used by 2 or more files goes in `src/app/shared/interfaces/<name>.interface.ts`.
- One domain concept per interface file (`passport.interface.ts` holds passport types only). Split a file when it passes 150 lines.
- Use `interface` for object shapes. Use `type` for unions, aliases, and tuples.

## One interface per use
- Give each entity 2 to 3 interfaces, one for each way its data is used, and keep them together in the same `<name>.interface.ts`.
- Always write the first two: retrieved data and form data. Add a third only when a use has a shape of its own (list row, update payload, request body). A fourth means the entity is two concepts, so split it.

| Use | Name | Date fields | Other fields |
|-----|------|-------------|--------------|
| Retrieved data (read from Firestore or the API) | `Passport` | `Timestamp` | Includes `id` and every server-set field, all required |
| Form data (user input, written to Firestore) | `PassportForm` | `FieldValue \| Date` | No `id`; server-set fields left out |

- Give each field the one type it has in that use. Never write `Timestamp | FieldValue | Date` on a single field to serve both.
- Convert between the uses in one function at the read or write boundary, in the store or service. Components never convert.
- Derive the form interface from the retrieved one with `Omit` plus the fields that differ, in the same file, when most fields match. Write the fields out in full when most differ.
- For any other use (create payload, update payload, list row, request body), add an interface named `<Name><Use>` in the same file.

## Naming
- Use a PascalCase noun for the name (`DeviceLog`, `ServiceStep`).
- Count the project's existing interfaces. When most start with `I`, start yours with `I`. Otherwise use no prefix.
- Use the same name for the same concept in every interface. If the data says `service` and `step`, never `app` or `child`.
- Name fields in the style the interface or collection already uses (snake_case or camelCase). Do not mix both styles in one interface.

## Fields
- List every field explicitly. Do not write `any`; use a specific type, or `unknown` and narrow it at the boundary.
- Mark a field optional (`?`) only when the stored data can lack it. Use `T | null` when the field exists and can be empty. Do not wrap a whole interface in `Partial<>` to avoid choosing.
- Use a literal union for a fixed set of values (`status: 'draft' | 'submitted'`) and declare it next to the constant that lists them in `src/app/shared/constants/`.
- Keep nesting to two levels. Give a third level its own named interface.
- Split an interface with more than 15 fields into named sub-interfaces grouped by meaning.
- Extend another interface with `extends` only when both live in the same file or in `shared/interfaces/`. Use `Omit`, `Pick`, and `Partial` only on a base type in the same file.

## Data from outside
- Treat data from Firestore, the network, and storage as `unknown` until it is checked where it enters the app. Type it once at that point.

## Documentation
- Put no comments in interface files. Document them in `docs/<file-name>.md`.
