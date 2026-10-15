# Agent skills

The skills live in this repo under `.claude/skills/`. To use them across all your projects, link them into the global skills folder of your agent tool(s): **Claude Code**, **Antigravity**, or **Cursor**.

## Skills locations

| Agent | Global skills folder | Project skills folder |
|-------|----------------------|-----------------------|
| **Claude Code** | `~/.claude/skills/` | `.claude/skills/` |
| **Antigravity** | `~/.gemini/config/skills/` | `.agents/skills/` |
| **Cursor** | `~/.cursor/skills/` | `.cursor/skills/` |

> [!NOTE]
> For Cursor, personal skills are placed in `~/.cursor/skills/`. Do not link into `~/.cursor/skills-cursor/`, which is reserved for Cursor's internal built-in skills.

---

## Link all skills to global

### All agents (Claude Code, Antigravity, Cursor)

Run from the repo root to link all skills to all three agents at once:

```sh
for target in ~/.claude/skills ~/.gemini/config/skills ~/.cursor/skills; do
  mkdir -p "$target"
  for d in "$PWD"/.claude/skills/*/; do
    ln -s "${d%/}" "$target/"
  done
done
```

### Individual agents

Run the command for your specific agent:

```sh
# Claude Code
mkdir -p ~/.claude/skills
for d in "$PWD"/.claude/skills/*/; do ln -s "${d%/}" ~/.claude/skills/; done

# Antigravity
mkdir -p ~/.gemini/config/skills
for d in "$PWD"/.claude/skills/*/; do ln -s "${d%/}" ~/.gemini/config/skills/; done

# Cursor
mkdir -p ~/.cursor/skills
for d in "$PWD"/.claude/skills/*/; do ln -s "${d%/}" ~/.cursor/skills/; done
```

---

## Link one skill only

Replace `<name>` with the skill folder name (e.g. `vibecode`):

```sh
# Claude Code
ln -s "$PWD/.claude/skills/<name>" ~/.claude/skills/<name>

# Antigravity
ln -s "$PWD/.claude/skills/<name>" ~/.gemini/config/skills/<name>

# Cursor
ln -s "$PWD/.claude/skills/<name>" ~/.cursor/skills/<name>
```

> [!IMPORTANT]
> The order is `ln -s <real folder> <link>`: the real folder is in this repo, the link is in the global agent folder. Do not swap them. The swapped form creates a broken link inside the skill folder (`.claude/skills/<name>/<name>`).
>
> Rerunning the loop is safe. A skill that is already linked prints `File exists` and is left alone, so run it again after adding a new skill.

---

## Check the links

```sh
# Claude Code
ls -l ~/.claude/skills

# Antigravity
ls -l ~/.gemini/config/skills

# Cursor
ls -l ~/.cursor/skills
```

Each skill shows an arrow pointing back into this repo.

---

## Unlink

To remove a linked skill from global:

```sh
# Claude Code
rm ~/.claude/skills/<name>

# Antigravity
rm ~/.gemini/config/skills/<name>

# Cursor
rm ~/.cursor/skills/<name>
```

This removes only the link. The skill in this repo is untouched.

To unlink all skills from all agents:

```sh
for target in ~/.claude/skills ~/.gemini/config/skills ~/.cursor/skills; do
  for d in "$PWD"/.claude/skills/*/; do
    rm -f "$target/$(basename "$d")"
  done
done
```

---

## After moving or renaming the repo

The links store the full path of this repo, so they break when it moves. Unlink each skill (or remove the broken symlinks), then run the link loop again from the new location.
