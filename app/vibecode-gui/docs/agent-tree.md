# Agent tree

## `AgentTree.tsx`

- The orchestrator's sub-agents wrap into rows only as far as needed to show the tree at `WRAP_MIN_SCALE` or larger, so a few pixels too wide never cost a column.
- A column stretches to its grid track, so the measured width of a column is that of its max-content child.

## `AgentTreeToolbar.tsx`

`agents` are every agent of the shown run, the orchestrator first.

## `AgentDrawer.tsx`

The selected agent's transcript beside the tree.
