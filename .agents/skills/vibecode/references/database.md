# Database

## Migrations
- Write every schema change as a new migration with a working rollback. Never edit a migration that has already run in any environment.
- Change a table that holds production data in steps that never lock it: add the column as nullable, backfill it, then add the constraint, e.g. three migrations for a new required column, never one that adds it as required.
- Create an index on a table that holds production data with the database's non-locking option.
- Add an index for each new column a query filters, joins, or sorts on, in the same change as the query.
- Run the new migration forward and back on a local database before finishing, and report the result.
