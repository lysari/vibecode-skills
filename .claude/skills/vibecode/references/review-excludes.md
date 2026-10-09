# Review Excludes

The list lives in `references/review-excludes.json`. Edit that file to change it.

## Keys
| Key | Meaning |
|-----|---------|
| `directories` | Directories to skip, grouped by kind. |
| `files` | File names and globs to skip. Read a lockfile only to learn which package manager the project uses. |
| `countOnly` | Globs to count but never read (fonts, images). |
| `keep` | Paths inside an excluded directory that stay in scope. |
| `frameworks` | Extra `directories` and `files` for one technology. Apply its entries only when that technology's row in `SKILL.md` matches the project. |

## Matching
- `node_modules/` (a name with only a trailing slash) matches a directory with that name anywhere in the project.
- `docs/generated/` (a name containing a slash) matches only that path from the project root.

## Rules
- Read the JSON before you review, search, or count files in a project, and apply every entry to every `find` and `grep`.
- Take the project's `.gitignore` as the base list and add the JSON entries.
- When an excluded path is tracked in git, report it as a finding: generated or local files do not belong in the repository.
- Review read-only. Do not install, build, or run scripts inside the project being reviewed.
