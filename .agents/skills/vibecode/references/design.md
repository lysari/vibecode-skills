# Design

Build UI that looks as if one careful designer and developer made every screen: reuse the components and design values the project already has, keep spacing, color, and type consistent, and make every screen usable by keyboard and screen reader.

## Reference images
- Make design tokens only for colours, font families and easing curves, each in the file the project's styling framework rules name, e.g. colours in the palette file and font families in the fonts file. Never create a token for a size, spacing, gap, padding, radius, font size, font weight, line height, letter spacing, border width, shadow or duration, e.g. `gap: 28` on the list, never a `space-lg = 28` token.
- Write every size, spacing, radius, type value, border width, shadow and duration on the element that shows it, and change it at a breakpoint inside that element's rule, e.g. a page heading writes `font-size: 18`, never reads an app-wide `heading-size` token.
- Write a shadow's colours from colour tokens, e.g. a card's two-layer shadow written on the card with each colour read from the palette.
- When the user gives a reference image, write every colour it shows into the project's colour tokens and every other value it shows (spacing, gaps, padding, radii, font sizes, weights, line heights, letter spacing, control and icon sizes, border widths, shadows, breakpoints) on the element that shows it, e.g. `gap: 32` measured between two stacked cards written on their list.
- Take each value from the reference's pixels: sample colours from flat fills and glyph cores, and measure edges and text boxes at the image's scale. Never estimate a value by eye, e.g. a heading colour sampled from the glyph core, never "dark grey".
- When a reference image shows a cropped or partial capture of a screen, expand the layout to the full screen and complete the cut-off grid with the same values; never crop the built screen to the image's pixel bounds, e.g. a half-cropped two-column grid builds as a full two-column grid.
- When a surface sits over a background with backdrop blur, define its colour token with an opacity below 100% so the blurred background shows through; never use the opaque composite colour sampled from the image, e.g. white at 70% opacity with blur, never solid white.
- Read every colour, font family and easing curve from its token in every component. Never write a colour literal inside a component, e.g. a heading reads `text`, never `#222222`.
- Read a design token directly in every component and feature. Never declare a component or feature token whose whole value is one other token, e.g. a panel edge reads `border`, never a `panel-edge` token set to `border`.
- Fix each colour mismatch found when comparing the render with the reference by changing the colour token, never by overriding the colour in one component, e.g. change `border`, never give one card its own border colour.
- Fix each size, spacing or type mismatch found when comparing the render with the reference on the element that shows it, e.g. raise the card's `border-radius` on the card rule.
- Use the colour tokens from the reference on every screen of the site. Add a new colour token only for a colour the reference does not show, e.g. a table row stripe on a site whose reference has no table.

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

## Icons
- Give each object type one icon and use it everywhere that type appears, at every size: toolbar, navigation tree, tab, list row and detail panel. Never draw a second icon for the same type, e.g. `the invoice icon in the sidebar, the tab and the detail header is one glyph at three sizes`.
- Draw object icons and action icons in two separate styles, and never mix the two styles inside one group, e.g. `filled folder and document icons in the tree, line edit and refresh icons in the action bar`.
- Show an object's state with a small badge on the icon's bottom-right corner and keep the base icon unchanged. Never swap in a different icon per state, e.g. `a server icon with a small green check when online, the same server icon with a small red cross when offline`.
- Draw a derived type as its base type's icon plus one modifier mark, never as an unrelated glyph, e.g. `a shared folder is the folder icon with a small person mark`.
- When the project has an icon set, draw every new icon in that set's style. Never add an icon from another set or style, e.g. `a new export icon drawn at the set's stroke width and grid, never one pasted from a different library`.
- When the project has no object icon style, draw object icons as filled, multi-colour glyphs built from simple geometric shapes, with a subtle shade over each fill and colours from the palette tokens, e.g. `a document as a blue page with a lighter folded corner, never a flat one-colour outline`.
- In that object icon style, draw each icon as the outline shape of the object it names. Never draw it as a filled rounded square or circle with a symbol cut out of it or laid on top, e.g. `a table as a grid sheet, a user as a head over shoulders, never a blue rounded square with two white bars`.
- In that object icon style, fill the object's own parts as separate shapes in at least two tints of its colour, or in a second colour. Never use one fill with white symbol marks on it, e.g. `a table with a darker header row above lighter cells, a query as a front sheet over an offset back sheet of another colour`.
- When the project has no icon style, draw action icons as thin, single-colour line glyphs, e.g. `an edit action as a one-colour line pencil, never a filled multi-colour pencil`.

## Corner radius
- Set the corner radius of an inner element nested inside a rounded container with padding to the outer radius minus the padding (`inner_radius = outer_radius - padding`). Never give the inner element the same radius as the outer container or an uncalculated radius, e.g. an inner element with padding `8` inside a container of radius `24` uses radius `16`, never `24`.
- Set the inner corner radius to `0` when the padding is greater than or equal to the outer radius, e.g. an inner element with padding `16` inside a container of radius `12` uses radius `0`.

## Apple design craftsmanship
- Research Apple Human Interface Guidelines and Apple design system conventions for the component or layout pattern before designing or styling UI; never construct UI elements without researching Apple design standards first, e.g. `research Apple modal sheet and navigation bar specifications before creating a dialog view`.
- Build gradients as subtle, low-contrast multi-stop vertical transitions that simulate delicate surface lighting; never apply harsh multi-hue, steep diagonal, or high-contrast linear gradients across UI surfaces, e.g. `a card surface with a 2% vertical luminance gradient from top to bottom, never a 45-degree neon purple-to-orange gradient`.
- Structure colors into a cohesive semantic palette with balanced light and dark mode appearance tokens and accessible contrast ratios; never apply arbitrary, uncalibrated high-saturation hex values directly to components, e.g. `a secondary label token defined with light and dark mode variants, never a raw #ff0000 hardcoded on a notice item`.
- Animate interactive state changes, view presentations, and layout transitions using fluid spring physics or gentle ease-out timing curves between 150ms and 350ms; never use linear timing functions or instantaneous jarring visual jumps, e.g. `a dropdown sheet animating with a spring curve over 300ms, never a linear transition`.

