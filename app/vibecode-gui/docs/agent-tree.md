# Agent tree

The Tree view of a session: the run's agents as a tree, its toolbar, and the transcript drawer of the selected agent.

## `src/mainview/features/agent-tree/AgentTree.tsx`

- The orchestrator's card sits on top. Its sub-agents wrap into rows (`wrapMapRows`) only as far as needed to show the tree at `WRAP_MIN_SCALE` or larger, so a few pixels too wide never cost a column. Deeper sub-agents hang below their parent (`TreeEntry`), and each card's toggle shows or hides its sub-agents.
- A column stretches to its grid track, so the measured width of a column is that of its max-content child (`column.firstElementChild`).
- A `ResizeObserver` measures the viewport, the unscaled content, the column widths, the column gap and the first column's indent.
- Fit scales the tree down to the viewport width, never above 100%. Zoom in and out step by `ZOOM_STEP` between `MIN_ZOOM` and `MAX_ZOOM`, and a zoom applies only to the run it was set on.
- The tree is centred horizontally when the run or the scale changes, and the selected card is scrolled into view.

## `src/mainview/features/agent-tree/AgentTreeToolbar.tsx`

`agents` are every agent of the shown run, the orchestrator first. The toolbar shows the agent and running counts and the total cost; **N needs you** and **N failed** pills whose popovers offer Reply or Retry, and Dismiss, which hides that agent from the pill; and zoom out, zoom in and Fit.

## `src/mainview/features/agent-tree/AgentDrawer.tsx`

The selected agent's transcript beside the tree, with its model, status, cost, duration and task.

## `src/mainview/features/agent-tree/map-rows.ts`

`wrapMapRows(items, space)` splits items into rows of equal length, using the most columns whose shared column widths fit the space. `MapRowSpace`:

- `widths`: the rendered width of each item, in item order; unmeasured items count as zero, so they start in one row.
- `gap`: the space between two columns.
- `available`: the width the rows may take.

## Connectors in `src/mainview/styles/_global.scss`

- `.map-branch`: a card's port drops a trunk, and its sub-agents (`.map-branch-item`) hang off the trunk on elbow connectors. The port sits inside the card's border, so the trunk is offset by that border too: the default border on a sub-agent card, the selected border on the orchestrator.
- `.map-rows`: the orchestrator's sub-agents, wrapped into rows that share column widths.
- `.map-row`: a row's elbow runs on as a bus along the top of its columns and across the gaps; each card (`.map-column`) drops from it, and the last column ends the bus in a rounded corner.

## `tests/mainview/features/agent-tree/map-rows.test.ts`

Checks that `wrapMapRows` keeps items in one row when they fit, wraps into the most columns whose widest items and gaps fit, sizes each column by its widest item, puts an item wider than the space in a single column, starts unmeasured items in one row, and returns no rows for no items.
