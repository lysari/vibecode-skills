# Agent skills

The skills live in this repo under `.claude/skills/`. Claude Code loads them here automatically. To use them in every other project, link them into the global skills folder.

## Link the skills to global

Run from the repo root:

```sh
mkdir -p ~/.claude/skills
for d in "$PWD"/.claude/skills/*/; do
  ln -s "${d%/}" ~/.claude/skills/
done
```

To link one skill only:

```sh
ln -s "$PWD/.claude/skills/<name>" ~/.claude/skills/<name>
```

The order is `ln -s <real folder> <link>`: the real folder is in this repo, the link is in `~/.claude/skills/`. Do not swap them. The swapped form creates a broken link inside the skill folder (`.claude/skills/<name>/<name>`).

Rerunning the loop is safe. A skill that is already linked prints `File exists` and is left alone, so run it again after adding a new skill.

## Check the links

```sh
ls -l ~/.claude/skills
```

Each skill shows an arrow pointing back into this repo.

## Unlink

```sh
rm ~/.claude/skills/<name>
```

This removes only the link. The skill in this repo is untouched.

## After moving or renaming the repo

The links store the full path of this repo, so they break when it moves. Unlink each skill, then run the link loop again from the new location.
