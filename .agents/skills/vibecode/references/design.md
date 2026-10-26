# Design

Build UI that looks as if one careful designer and developer made every screen: reuse the components and design values the project already has, keep spacing, color, and type consistent, and make every screen usable by keyboard and screen reader.

## Reference images
- When the user gives a reference image, write every design value it shows into the project's design tokens before building any screen: colours, spacing and gaps, padding, radii, font sizes, weights, line heights, letter spacing, control and icon sizes, border widths, shadows and breakpoints, e.g. `space-section = 32` measured between two stacked cards.
- Partition design tokens into the specific files required by the project's styling framework rules; never combine colors, spacing, radii, and global rules into a single unpartitioned token file, e.g. store colors in the palette file and spacing in the variables file, never in a catch-all tokens file.
- Take each value from the reference's pixels: sample colours from flat fills and glyph cores, and measure edges and text boxes at the image's scale. Never estimate a value by eye, e.g. a heading colour sampled from the glyph core, never "dark grey".
- When a reference image shows a cropped or partial capture of a screen, expand the layout to the full screen and complete the cut-off grid with the same tokens; never crop the built screen to the image's pixel bounds, e.g. a half-cropped two-column grid builds as a full two-column grid.
- When a surface sits over a background with backdrop blur, define its colour token with an opacity below 100% so the blurred background shows through; never use the opaque composite colour sampled from the image, e.g. white at 70% opacity with blur, never solid white.
- Build every screen from those tokens. Never write a colour, spacing, radius, type, border or shadow value inside a component, e.g. a list gap reads `space-section`, never a literal `32`.
- Fix each mismatch found when comparing the render with the reference by changing the token, never by overriding the value in one component, e.g. raise `radius-card`, never give one card its own radius.
- Use the tokens from the reference on every screen of the site. Add a new token only for a value the reference does not show, e.g. a table row height on a site whose reference has no table.

## Layout and scrolling
- Stretch a full-screen application layout across the full viewport width and height; never cap the outer shell at a fixed maximum width that leaves empty margins on wider monitors.
- Lock the outer application shell to the viewport height on desktop and make the content pane and sidebar navigation list each scroll on their own; never let the whole page scroll the header or sidebar off-screen.
- Place subsection or directory navigation in a layout-level secondary sidebar or split pane within the window shell; never embed a navigation rail or column inside the scrollable content panel, e.g. a desktop shell with a secondary sidebar beside the content pane, never a sidebar inside the page body.
- Never position content below application headers or toolbars with a hardcoded offset or fixed position; let the parent layout give the main panel the remaining space, e.g. a column layout where the main panel fills the height left under the header, never an `86` offset from the top.
- Wrap data tables and multi-column grids in a full-width container that scrolls horizontally; never let a table wider than the viewport scroll the whole page or clip its columns.
- When creating a screen within an existing project or module, inherit the sibling views' layout container hierarchy and design structure; never invent detached wrapper markup or custom positioning that conflicts with the module's layout system.

## Navigation and controls
- Never squeeze a horizontal tab strip or segmented control into a narrow column or sidebar where tab labels cannot fit without clipping or overlapping; use a vertical navigation list, a dropdown selector, or horizontally scrollable pills instead, e.g. a vertical list of category links in a narrow sidebar, never five horizontal tab buttons stretched across a 240-wide column.
- Never wrap a toolbar, header bar, or breadcrumb row of individual pill buttons or badges inside an enclosing pill-shaped container or bordered box; keep the container transparent and let the individual control pills define the interactive surfaces, e.g. a row of pill buttons on a transparent header strip, never an outer pill box enclosing pill buttons.

## Corner radius
- Set the corner radius of an inner element nested inside a rounded container with padding to the outer radius minus the padding (`inner_radius = outer_radius - padding`). Never give the inner element the same radius as the outer container or an uncalculated radius, e.g. an inner element with padding `8` inside a container of radius `24` uses radius `16`, never `24`.
- Set the inner corner radius to `0` when the padding is greater than or equal to the outer radius, e.g. an inner element with padding `16` inside a container of radius `12` uses radius `0`.

## Apple design craftsmanship
- Research Apple Human Interface Guidelines and Apple design system conventions for the component or layout pattern before designing or styling UI; never construct UI elements without researching Apple design standards first, e.g. `research Apple modal sheet and navigation bar specifications before creating a dialog view`.
- Build gradients as subtle, low-contrast multi-stop vertical transitions that simulate delicate surface lighting; never apply harsh multi-hue, steep diagonal, or high-contrast linear gradients across UI surfaces, e.g. `a card surface with a 2% vertical luminance gradient from top to bottom, never a 45-degree neon purple-to-orange gradient`.
- Structure colors into a cohesive semantic palette with balanced light and dark mode appearance tokens and accessible contrast ratios; never apply arbitrary, uncalibrated high-saturation hex values directly to components, e.g. `a secondary label token defined with light and dark mode variants, never a raw #ff0000 hardcoded on a notice item`.
- Animate interactive state changes, view presentations, and layout transitions using fluid spring physics or gentle ease-out timing curves between 150ms and 350ms; never use linear timing functions or instantaneous jarring visual jumps, e.g. `a dropdown sheet animating with a spring curve over 300ms, never a linear transition`.

