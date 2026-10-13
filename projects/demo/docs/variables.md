# Variables

`src/styles/_variables.scss` — layout, spacing, control, radius, border and shadow values, and the `$compact` breakpoint.

## Using the breakpoint

Media queries cannot read custom properties, so the breakpoint is the Sass variable `$compact` (480px). Load it in a component without re-emitting the `:root` block:

```scss
@use 'styles/variables' as v with (
  $emit-custom-properties: false
);

.thing {
  @media (max-width: v.$compact) { … }
}
```

`angular.json` adds `src` to `stylePreprocessorOptions.includePaths`, so `styles/variables` resolves from any component.

## Values and where they come from

All values were measured in the reference at 3× and confirmed by rendering the page and comparing the same edges.

| Token                              | Value                              | Reference measurement                          |
| ---------------------------------- | ---------------------------------- | ---------------------------------------------- |
| `--rail-width`                     | 56px                               | Side rail, including its 1px white edge        |
| `--page-gutter`                    | 24px (16px compact)                | Rail edge to card and pills                    |
| `--page-top`                       | 16px                               | Top of page to the "Today" line box            |
| `--space-10`                       | 10px                               | Between buttons, between pills, label to title |
| `--space-16`                       | 16px                               | Section heading to its content                 |
| `--space-20`                       | 20px                               | "Today" to card, card to quick actions         |
| `--space-26`                       | 26px                               | Card padding; meta line to buttons             |
| `--space-34`                       | 34px                               | Quick actions to section heading               |
| `--control-height`                 | 46px                               | Buttons and pills                              |
| `--control-padding-x`              | 17.5px                             | Button side padding                            |
| `--control-padding-start` / `-end` | 16px / 24px                        | Pill padding before the icon / after the text  |
| `--control-icon-gap`               | 8px                                | Pill icon to text                              |
| `--icon-size` / `--icon-stroke`    | 24px / 2.2                         | Pill icons                                     |
| `--radius-card`                    | 35px                               | Card corner                                    |
| `--radius-pill`                    | 999px                              | Buttons and pills (fully round)                |
| `--shadow-card`                    | bluish 1px line + flat soft shadow | Pixel column under the card                    |
| `--shadow-pill`                    | tight neutral 1px shadow           | Pixel column under a pill                      |

`--rail-item-size`, `--rail-bar-height`, `--radius-item` and `--page-width` are not visible in the reference and were chosen to fit the measured values.
