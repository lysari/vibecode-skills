# Thread entry

## `src/mainview/components/ThreadEntry.tsx`

One entry of a transcript, shown in the chat (`ChatView`) and in the agent drawer (`AgentDrawer`): a message, a system note, assistant text, a tool call, a sub-agent, a question or an error.

- `UserBubble` shows the slash commands in front of a message as code chips, and "Reply to <agent>" above a reply.
- `isStreaming` is true for the last assistant text while its agent still writes; it adds the `streaming` class.
- `ToolBlock` is collapsed to the tool, its short input and a running, done or error icon; expanding it shows the result.
- A sub-agent block's one-line summary shows the agent's last text without markdown marks (`MARKDOWN_MARKS`), else its task.
- A question offers Reply and an error offers Retry while it is still open; a closed one shows Answered, Retried or Stopped, which fades in.
- The tool block's chevron rotates, its result fades in, and its done or error icon pops in. Colour changes (a sub-agent block's hover border, a status pill's state) transition; a status pill fades its new icon and label in.

## `.streaming` in `src/mainview/styles/_global.scss`

The caret after assistant text that is still streaming in, drawn after the last block of its `.markdown`.
