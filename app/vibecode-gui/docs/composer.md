# Composer

The message box pinned below both views, with its skill and agent pickers.

## `src/mainview/features/composer/Composer.tsx`

- `replyTo` is the agent waiting for the user that the next message answers.
- `focusKey` changes whenever the composer should take focus, e.g. after Reply.
- `onSend` resolves true when the message was sent, so the draft can be cleared.
- Enter sends, except while an input method is composing; Shift+Enter adds a line. The textarea grows with its text up to `max-h-composer`.
- While a run works, Stop replaces Send, unless the message is a reply; Stop pops in. Chips fade in, and the box's border fades to the accent on focus.

## `src/mainview/features/composer/SkillPicker.tsx`

The **Skills** popover, scaled from its bottom-left corner in and out (`usePresence`), its chevron rotating: the skills the session's agent can use, filtered by name and description, each with a checkbox and its `SkillSourceBadge`. A newly picked skill is added after the ones already picked. A new session starts with `vibecode-workflow` picked (`DEFAULT_SKILLS` in `src/bun/sessions.ts`); its chip is removed like any other.

## `src/mainview/features/composer/AgentPicker.tsx`

The agent popover opens and closes like the Skills popover. `agents` are the agent skills found in the project or in any agent's global folder: the `use-*` skills listed in `AGENT_CLIS`. The list offers **Default** (the built-in agent) and one entry per agent skill, with its CLI command.

## `src/mainview/features/composer/SkillSourceBadge.tsx`

Shows where a skill comes from: **Project** for the open project's own skill, **Global** for a skill in an agent's global folder. Its tooltip names the global folders, e.g. `In ~/.claude/skills, ~/.cursor/skills`, also for a project skill that has a global copy.
