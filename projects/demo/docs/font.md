# Font

`src/styles/_font.scss` — the font stack, weights and type scale.

## How the values were made

Each size was found by rendering the text at 3× and changing the size until its text box (left, right, cap top, baseline) matched the same text in the reference within 0.7px. Line heights were set the same way, from the vertical gaps between lines.

## Type scale

| Role      | Size    | Line | Weight   | Tracking | Reference text                           |
| --------- | ------- | ---- | -------- | -------- | ---------------------------------------- |
| `display` | 29px    | 33px | bold     | −0.5px   | "Today"                                  |
| `title`   | 24px    | 31px | bold     | −0.3px   | "Power Sculpt"                           |
| `heading` | 18.5px  | 24px | bold     | −0.3px   | "Trainers you follow"                    |
| `button`  | 18.5px  | —    | semibold | —        | "Continue", "Change"                     |
| `action`  | 18px    | —    | semibold | —        | "Quick start", "Browse Classes"          |
| `body`    | 17px    | 27px | regular  | —        | "Coach Kathy • 20 min"                   |
| `label`   | 14.25px | 20px | regular  | —        | "Daily focus"                            |
| `caption` | 14px    | 18px | regular  | —        | Trainer card meta (not in the reference) |

Numbers in body text use `tabular-nums slashed-zero`; the reference shows a slashed zero in "20 min".
