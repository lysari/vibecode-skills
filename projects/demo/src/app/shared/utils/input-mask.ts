/**
 * Fixed-width input masks, in the convention every masking library shares:
 *
 * | Token | Takes |
 * | --- | --- |
 * | `0` | a digit |
 * | `A` | a letter, in any script |
 * | `*` | either |
 *
 * Every other character of the pattern is a literal that types itself:
 * `'0000 000 000'` is a Cambodian phone number, `'A0000000'` a passport number,
 * `'0000-0000-0000'` a card.
 *
 * Kept apart from `x-liquid-input` because the interesting part is not the
 * drawing — it is deciding which characters a pattern accepts and where the
 * caret lands afterwards, and that is worth testing on its own.
 *
 * Nothing here knows about the DOM. The component reads the caret, asks these
 * functions what the field should hold, and writes it back.
 */

/**
 * What each token takes, in any script: a Khmer name is letters, and `០១២`
 * are digits. `\d` would have taken `0-9` and nothing else.
 */
const TOKENS: Readonly<Record<string, RegExp>> = {
  '0': /\p{Nd}/u,
  A: /\p{L}/u,
  '*': /[\p{L}\p{Nd}]/u,
};

/** Whether a character of a pattern is a slot rather than a literal. */
export function isMaskToken(character: string): boolean {
  return Object.prototype.hasOwnProperty.call(TOKENS, character);
}

/** How many characters a pattern can hold, literals aside. */
export function maskCapacity(mask: string): number {
  let count = 0;
  for (const character of mask) if (isMaskToken(character)) count++;
  return count;
}

/**
 * What the pattern would keep out of `text`: its own characters, in order,
 * with literals and anything a slot refuses dropped.
 *
 * A character is offered to the slot it would land in, not to any later one —
 * so a letter typed into `'0000'` is refused rather than quietly filling the
 * slot after it.
 */
export function unmaskText(text: string, mask: string): string {
  const slots = [...mask].filter(isMaskToken);
  let raw = '';
  let at = 0;
  for (const character of text) {
    if (at >= slots.length) break;
    if (TOKENS[slots[at]].test(character)) {
      raw += character;
      at++;
    }
  }
  return raw;
}

/**
 * `raw` laid into the pattern. Literals appear as the slots around them fill,
 * and a trailing one waits for the character it separates: `'012'` against
 * `'0000 000'` is `'012'`, and `'0123'` is `'0123'` — the space arrives with
 * the digit after it, rather than sitting at the end of a half-typed number.
 */
export function maskText(raw: string, mask: string): string {
  let text = '';
  let at = 0;
  for (const character of mask) {
    if (at >= raw.length) break;
    if (isMaskToken(character)) {
      text += raw[at++];
    } else {
      text += character;
    }
  }
  return text;
}

/** How many of the pattern's own characters stand before `caret`. */
export function rawBefore(text: string, mask: string, caret: number): number {
  return unmaskText(text.slice(0, caret), mask).length;
}

/**
 * Where the caret goes once `count` characters have been laid in: after the
 * `count`-th slot, and after any literal that follows it, so typing straight on
 * never has to step over a separator.
 */
export function caretAfter(mask: string, count: number, length: number): number {
  if (count <= 0) return 0;

  let seen = 0;
  let index = 0;
  for (const character of mask) {
    index++;
    if (isMaskToken(character) && ++seen === count) break;
  }
  // Past the separators that follow, but never past what is actually there.
  while (index < mask.length && !isMaskToken(mask[index])) index++;
  return Math.min(index, length);
}

/**
 * The range a backspace should take, given where the caret is: the character
 * before it, plus any literals in between, so deleting removes something the
 * person typed rather than a separator that would only type itself again.
 *
 * `null` when the character before the caret is one of their own, which the
 * browser already deletes correctly.
 */
export function backspaceRange(mask: string, caret: number): [number, number] | null {
  if (caret <= 0 || isMaskToken(mask[caret - 1] ?? '')) return null;

  let start = caret;
  while (start > 0 && !isMaskToken(mask[start - 1] ?? '')) start--;
  return [Math.max(0, start - 1), caret];
}

/** The same for a forward delete: the character after the caret, separators first. */
export function deleteRange(mask: string, caret: number, length: number): [number, number] | null {
  if (caret >= length || isMaskToken(mask[caret] ?? '')) return null;

  let end = caret;
  while (end < length && !isMaskToken(mask[end] ?? '')) end++;
  return [caret, Math.min(end + 1, length)];
}
