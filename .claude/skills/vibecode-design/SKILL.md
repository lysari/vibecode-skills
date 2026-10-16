---
name: vibecode-design
description: Use when building or changing user interface screens, components, layouts, or styles, so the UI reuses the project's existing components and design values, looks consistent across screens, and stays accessible
metadata:
  version: "0.0.1-20261015.1"
---

# Vibecode design

## Overview

Build UI that looks as if one careful designer and developer made every screen: reuse the components and design values the project already has, keep spacing, color, and type consistent, and make every screen usable by keyboard and screen reader. This skill adds to `vibecode`; read `vibecode/SKILL.md` first. Where the two conflict, `vibecode` wins.

## Reference images

- When the user gives a reference image, write every design value it shows into the project's design tokens before building any screen: colours, spacing and gaps, padding, radii, font sizes, weights, line heights, letter spacing, control and icon sizes, border widths, shadows and breakpoints, e.g. `space-section = 32` measured between two stacked cards.
- Take each value from the reference's pixels: sample colours from flat fills and glyph cores, and measure edges and text boxes at the image's scale. Never estimate a value by eye, e.g. a heading colour sampled from the glyph core, never "dark grey".
- Build every screen from those tokens. Never write a colour, spacing, radius, type, border or shadow value inside a component, e.g. a list gap reads `space-section`, never a literal `32`.
- Fix each mismatch found when comparing the render with the reference by changing the token, never by overriding the value in one component, e.g. raise `radius-card`, never give one card its own radius.
- Use the tokens from the reference on every screen of the site. Add a new token only for a value the reference does not show, e.g. a table row height on a site whose reference has no table.

## Corner radius

- Set the corner radius of an inner element nested inside a rounded container with padding to the outer radius minus the padding (`inner_radius = outer_radius - padding`). Never give the inner element the same radius as the outer container or an uncalculated radius, e.g. an inner element with padding `8` inside a container of radius `24` uses radius `16`, never `24`.
- Set the inner corner radius to `0` when the padding is greater than or equal to the outer radius, e.g. an inner element with padding `16` inside a container of radius `12` uses radius `0`.
