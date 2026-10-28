# Database

## Migrations
- Write every schema change as a new migration with a working rollback. Never edit a migration that has already run in any environment.
- Change a table that holds production data in steps that never lock it: add the column as nullable, backfill it, then add the constraint, e.g. three migrations for a new required column, never one that adds it as required.
- Create an index on a table that holds production data with the database's non-locking option.
- Add an index for each new column a query filters, joins, or sorts on, in the same change as the query.
- Ask the user before running any migration, rollback, seed, or script that alters database schema or data. Never execute database changes without explicit user confirmation, e.g. ask before running a migration command or data backfill script.
- Test the new migration forward and back only after the user approves running it, and report the result.
