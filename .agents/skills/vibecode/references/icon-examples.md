# Icon examples

Worked examples for the rules in `design.md` → "Icons". Each object icon is drawn on one 32 × 32 grid and lit from the top. A state badge sits in one fixed slot at the bottom-right. Colours are read from palette tokens: the `var(--…)` names stand for the project's own colour tokens, never literal values. Copy the construction, not the colours or the object.

## 1. Base object icon

A document, drawn as the outline shape of the object, with its parts as separate shapes in three tints of one colour.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="document-page" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--object-blue-light)"/>
      <stop offset="1" stop-color="var(--object-blue)"/>
    </linearGradient>
  </defs>
  <path d="M8 3h11l7 7v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="url(#document-page)"/>
  <path d="M19 3v5a2 2 0 0 0 2 2h5Z" fill="var(--object-blue-pale)"/>
  <rect x="10" y="15" width="12" height="2" rx="1" fill="var(--object-blue-dark)"/>
  <rect x="10" y="20" width="8" height="2" rx="1" fill="var(--object-blue-dark)"/>
</svg>
```

- The page shape is the object's silhouette, not a rounded square with a symbol on it.
- The fill is a top-to-bottom gradient from a light tint to the base tint, which gives the subtle shade.
- The folded corner and the text lines are their own shapes in a paler and a darker tint. They are never white marks cut into one fill.
- Each gradient id starts with the icon's name (`document-page`), so two icons inlined on one page never share an id.

## 2. The same object with a state badge

The base icon stays unchanged, and the state is a badge in the fixed bottom-right slot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="document-approved-page" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--object-blue-light)"/>
      <stop offset="1" stop-color="var(--object-blue)"/>
    </linearGradient>
  </defs>
  <path d="M8 3h11l7 7v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="url(#document-approved-page)"/>
  <path d="M19 3v5a2 2 0 0 0 2 2h5Z" fill="var(--object-blue-pale)"/>
  <rect x="10" y="15" width="12" height="2" rx="1" fill="var(--object-blue-dark)"/>
  <rect x="10" y="20" width="8" height="2" rx="1" fill="var(--object-blue-dark)"/>
  <circle cx="24.5" cy="24.5" r="7" fill="var(--surface)"/>
  <circle cx="24.5" cy="24.5" r="5.5" fill="var(--state-success)"/>
  <path d="M21.9 24.6l1.8 1.8 3.4-3.6" fill="none" stroke="var(--surface)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- The badge is a filled circle on a ring in the surface colour. The ring separates it from the object at small sizes.
- Every badge in the set uses the same centre (24.5, 24.5), radius and ring width. Only its colour and mark change: a check for done, a cross for removed, a plus for new.

## 3. A derived type

A shared document is the base document plus one modifier mark. It is never a different glyph.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="document-shared-page" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--object-blue-light)"/>
      <stop offset="1" stop-color="var(--object-blue)"/>
    </linearGradient>
  </defs>
  <path d="M8 3h11l7 7v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="url(#document-shared-page)"/>
  <path d="M19 3v5a2 2 0 0 0 2 2h5Z" fill="var(--object-blue-pale)"/>
  <rect x="10" y="15" width="12" height="2" rx="1" fill="var(--object-blue-dark)"/>
  <path d="M17.5 30a6 6 0 0 1 12 0Z" fill="var(--object-green)" stroke="var(--surface)" stroke-width="1.5"/>
  <circle cx="23.5" cy="20.5" r="3.5" fill="var(--object-green-light)" stroke="var(--surface)" stroke-width="1.5"/>
</svg>
```

- The modifier, a head over shoulders, is a small object in a second colour. Its surface-coloured edge cuts it cleanly out of the base.
- The base keeps its silhouette and tints, so the eye still reads "document".

## 4. An action icon

An action is a thin line glyph in one colour that follows the text colour. It is never a filled, multi-colour shape.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 20h4L19 9l-4-4L4 16Z"/>
  <path d="M13.5 6.5l4 4"/>
</svg>
```

- Every action icon in the set shares the same grid, stroke width, caps and joins.
- If the project already uses a line-glyph library for actions, pick from that library instead of drawing one.

## 5. What not to draw

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="3" y="3" width="26" height="26" rx="7" fill="var(--object-blue)"/>
  <rect x="9" y="11" width="14" height="3" rx="1.5" fill="var(--surface)"/>
  <rect x="9" y="18" width="10" height="3" rx="1.5" fill="var(--surface)"/>
</svg>
```

- This is a rounded square with white bars laid on one fill. It names no object's shape and has no tints, so it breaks the object icon rules. Draw the object's own outline (example 1) instead.
