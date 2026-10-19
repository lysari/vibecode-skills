---
name: vibecode-design
description: Use when building or changing user interface screens, components, layouts, or styles, so the UI reuses the project's existing components and design values, looks consistent across screens, and stays accessible
metadata:
  version: "0.0.1-20261019.1"
---

# Vibecode design

## Overview

Build UI that looks as if one careful designer and developer made every screen: reuse the components and design values the project already has, keep spacing, color, and type consistent, and make every screen usable by keyboard and screen reader. This skill adds to `vibecode`; read `vibecode/SKILL.md` first. Where the two conflict, `vibecode` wins.

## Reference images

- When the user gives a reference image, write every design value it shows into the project's design tokens before building any screen: colours, spacing and gaps, padding, radii, font sizes, weights, line heights, letter spacing, control and icon sizes, border widths, shadows and breakpoints, e.g. `space-section = 32` measured between two stacked cards.
- Take each value from the reference's pixels: sample colours from flat fills and glyph cores, and measure edges and text boxes at the image's scale. Never estimate a value by eye, e.g. a heading colour sampled from the glyph core, never "dark grey".
- When a reference image shows a cropped or partial capture of a screen, expand the layout to the full screen and complete the cut-off grid with the same tokens; never crop the built screen to the image's pixel bounds, e.g. a half-cropped two-column grid builds as a full two-column grid.
- When a surface sits over a background with backdrop blur, define its colour token with alpha below `1` so the blurred background shows through; never use the opaque composite RGB sampled from the image, e.g. `rgb(255 255 255 / 0.7)` with blur, never `#ffffff`.
- Build every screen from those tokens. Never write a colour, spacing, radius, type, border or shadow value inside a component, e.g. a list gap reads `space-section`, never a literal `32`.
- Fix each mismatch found when comparing the render with the reference by changing the token, never by overriding the value in one component, e.g. raise `radius-card`, never give one card its own radius.
- Use the tokens from the reference on every screen of the site. Add a new token only for a value the reference does not show, e.g. a table row height on a site whose reference has no table.

## Layout and scrolling

- Stretch a full-screen application layout across `100%` of the viewport width and height; never cap the outer shell with a fixed pixel `max-width` that leaves dead margins on wider monitors, e.g. `width: 100%`, never `max-width: 1200px`.
- Lock the outer application shell to the viewport height on desktop (`height: 100dvh; overflow: hidden`) and make the content pane and sidebar navigation list scroll independently (`min-height: 0; overflow-y: auto`); never let the document body scroll the header or sidebar off-screen.
- Place subsection or directory navigation in a layout-level secondary sidebar or split pane within the window shell; never embed a navigation rail or column inside the scrollable content panel, e.g. a desktop shell grid with a secondary sidebar beside the content pane, never a sidebar inside the page body.
- Never position content below application headers or toolbars using hardcoded pixel offsets or fixed positioning; use flexbox or grid parent containers with `flex: 1; min-height: 0; overflow-y: auto`, e.g. a flex column where the main panel fills remaining vertical space, never `margin-top: 86px` or `top: 69px`.
- Wrap data tables and multi-column grids in a container with horizontal scroll (`overflow-x: auto`) and full width (`width: 100%`); never let a table with more columns than the viewport width force horizontal scroll on the outer page or clip its columns.
- When creating a screen within an existing project or module, inherit the sibling views' layout container hierarchy and design structure; never invent detached wrapper markup or custom positioning that conflicts with the module's layout system.

## Navigation and controls

- Never squeeze a horizontal tab strip or segmented control into a narrow column or sidebar where tab labels cannot fit without clipping or overlapping; use a vertical navigation list, a dropdown selector, or horizontally scrollable pills instead, e.g. a vertical list of category links in a narrow sidebar, never five horizontal tab buttons stretched across a 240px column.
- Never wrap a toolbar, header bar, or breadcrumb row of individual pill buttons or badges inside an enclosing pill-shaped container or bordered box; keep the container transparent and let the individual control pills define the interactive surfaces, e.g. a row of pill buttons on a transparent header strip, never an outer pill box enclosing pill buttons.

## Corner radius

- Set the corner radius of an inner element nested inside a rounded container with padding to the outer radius minus the padding (`inner_radius = outer_radius - padding`). Never give the inner element the same radius as the outer container or an uncalculated radius, e.g. an inner element with padding `8` inside a container of radius `24` uses radius `16`, never `24`.
- Set the inner corner radius to `0` when the padding is greater than or equal to the outer radius, e.g. an inner element with padding `16` inside a container of radius `12` uses radius `0`.
