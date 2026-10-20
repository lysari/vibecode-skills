# usePresence

## `src/mainview/hooks/use-presence.ts`

`usePresence(value)` keeps an element mounted until its exit animation ends, without an animation library. A value is open unless it is `null` or `false`.

- `shown` is the open value, or the last open value while it animates out, then `null`. Render from `shown`, not from the value, so a closing dialog or panel keeps its content.
- `presence` is spread on the animated element: `data-presence` (`idle`, `enter` or `exit`) and `onAnimationEnd`. Style it with the `data-enter:` and `data-exit:` variants from `tailwind.config.js`, e.g. `data-enter:animate-pop-in data-exit:animate-pop-out`, or `group-data-exit:` on a child. Add `data-exit:pointer-events-none` so a closing element takes no clicks.
- A value already open on the first render is `idle`, so nothing animates on the initial paint; a value opened later is `enter`.
- Only the element's own `animationend` unmounts it, since the event bubbles from animated children. The exit class must run an animation, which it always does: reduced motion shortens animations to `instant` rather than removing them.
- An open value is compared by identity, so pass state or a memoized value. Switching from one open value to another shows the new one at once.
- The state steps are pure functions (`startPresence`, `nextPresence`, `finishPresence`, `readPresencePhase`), so they are tested without a DOM.

Used by the projects sidebar and sessions panel (`Projects`, `Sessions`), the agent drawer, the delete dialog and the error banner (`App`), the Show sidebar button (`Header`), **Jump to latest** (`ChatView`) and the popovers (`SkillPicker`, `AgentPicker`, `AgentTreeToolbar`).

## `tests/mainview/hooks/use-presence.test.ts`

Checks that a value open on the first render is idle and a later one enters, that a closed value stays shown in its exit until `finishPresence`, that switching between open values neither re-enters nor exits, that reopening during an exit enters again, that `false` counts as closed, and that an unchanged value keeps the same state object.
