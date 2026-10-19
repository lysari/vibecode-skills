# Chat

## `ChatView.tsx`

The thread follows new output while it is scrolled to within `PIN_DISTANCE_PX` of the bottom; scrolling further up stops following and shows **Jump to latest**.

## `ThreadEntry.tsx`

One entry of a transcript: a message, assistant text, a tool call, a sub-agent, a question or an error. `isStreaming` is true for the last assistant text while its agent still writes. A sub-agent block's one-line summary shows the agent's last text without markdown marks.

## `Composer.tsx`

- `replyTo` is the agent waiting for the user that the next message answers.
- `focusKey` changes whenever the composer should take focus, e.g. after Reply.
- `onSend` resolves true when the message was sent, so the draft can be cleared.

## `AgentPicker.tsx`

`agents` are the library's agent skills: the `use-*` skills listed in `AGENT_CLIS`.

## `InstallBadge.tsx`

Shows how a library skill relates to the open project; an outdated copy can be updated from the badge.
