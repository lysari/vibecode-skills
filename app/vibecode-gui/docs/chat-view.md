# Chat view

The Chat view of a session: its thread, entry by entry (see `thread-entry.md`).

## `src/mainview/features/chat/ChatView.tsx`

- The thread follows new output while it is scrolled to within `PIN_DISTANCE_PX` of the bottom; scrolling further up stops following and shows **Jump to latest**.
- Only the last item is marked as streaming, and only while it is assistant text and the run is still running.
- An empty session shows a "Start the session" prompt.
