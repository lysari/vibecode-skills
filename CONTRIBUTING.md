# Contributing to Vibecode Skills

Thank you for your interest in contributing to **Vibecode Skills**! This repository hosts skills, rules, and decision workflows designed for AI-assisted software engineering.

---

## 🚀 How to Contribute

Because the `main` branch is locked and protected, all contributions must go through the Pull Request workflow:

1. **Fork** or create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-skill-name
   ```
2. **Make your changes** following the skill structure guidelines below.
3. **Audit compliance** using the `vibecode-review` skill.
4. **Submit a Pull Request** against `main`.

---

## 📁 Skill Structure Guidelines

Every skill must be located in `.agents/skills/<skill-name>/` and contain at least:

- **`SKILL.md`**: Must begin with standard YAML frontmatter:
  ```markdown
  ---
  name: your-skill-name
  description: Clear, action-oriented description of when and why to activate this skill
  ---
  ```
- **Instructions**: Clean, concise, and structured instructions. Avoid redundant wrapper files or boilerplate code.
- **Rules & References**: Place framework rules in `frameworks/<name>/rules.md` and reference materials in `references/`.

---

## 🔍 Code & Quality Standards

- Adhere to the core philosophies defined in `vibecode`: minimal, surgical changes that address root causes without code bloat.
- Keep documentation up to date. If adding or updating skills, ensure [README.md](README.md) reflects the additions.
- Ensure no sensitive credentials, secrets, or temporary logs are committed.
- When committing changes co-authored by AI assistants (such as Claude or Gemini), include standard `Co-authored-by:` trailers in the commit message to maintain contributor attribution.

---

## 📬 Reporting Issues

Found a bug or have a suggestion? Feel free to open an issue on GitHub!

