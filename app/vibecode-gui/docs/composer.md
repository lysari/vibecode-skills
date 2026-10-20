# Composer

The message box pinned below both views, with its skill and agent pickers.

## `src/mainview/components/Composer.tsx`

- `replyTo` is the agent waiting for the user that the next message answers.
- `focusKey` changes whenever the composer should take focus, e.g. after Reply.
- `onSend` resolves true when the message was sent, so the draft can be cleared.
- Enter sends, except while an input method is composing; Shift+Enter adds a line. The textarea grows with its text up to `max-h-composer`.
- While a run works, Stop replaces Send, unless the message is a reply.

## `src/mainview/components/SkillPicker.tsx`

The **Skills** popover: the library's skills, filtered by name and description, each with a checkbox and its `InstallBadge`. A newly picked skill is added after the ones already picked.

## `src/mainview/components/AgentPicker.tsx`

`agents` are the library's agent skills: the `use-*` skills listed in `AGENT_CLIS`. The list offers **Default** (the built-in agent) and one entry per agent skill, with its CLI command.

## `src/mainview/components/InstallBadge.tsx`

Shows how a library skill relates to the open project: **Installed**, **Update** when the project's copy differs (the badge opens the update confirmation), or **Not installed** (it is installed into `.claude/skills` on send).
