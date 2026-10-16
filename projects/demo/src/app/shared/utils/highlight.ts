/** A text split around the part of it that matched a query. */
export interface Highlight {
  before: string;
  match: string;
  after: string;
}

/** Khmer subscript sign: it and the consonant after it belong to the one before. */
const COENG = '្';
const MARK = /\p{M}/u;

/** Whether a cut at `index` would land inside a cluster rather than between two. */
function splitsCluster(text: string, index: number): boolean {
  return MARK.test(text[index] ?? '') || text[index - 1] === COENG;
}

/**
 * Splits `text` around the first occurrence of `term` (already lower-cased), so
 * the match can be wrapped in a `<mark>`.
 *
 * The match is widened to whole clusters. Khmer writes vowels, signs and
 * subscript consonants as marks on a base letter, and an element boundary
 * between a base and its mark stops the shaper joining them: searching "ព្រ" in
 * "ព្រះវិហារ" left "ះ" on its own, which the browser draws on a dotted circle.
 * The same goes for any combining accent in Latin text.
 */
export function highlight(text: string, term: string): Highlight {
  const at = term ? text.toLocaleLowerCase().indexOf(term) : -1;
  if (at < 0) return { before: text, match: '', after: '' };

  let start = at;
  let end = at + term.length;
  while (start > 0 && splitsCluster(text, start)) start--;
  while (end < text.length && splitsCluster(text, end)) end++;

  return { before: text.slice(0, start), match: text.slice(start, end), after: text.slice(end) };
}
