import {
  backspaceRange,
  caretAfter,
  deleteRange,
  isMaskToken,
  maskCapacity,
  maskText,
  rawBefore,
  unmaskText,
} from '@app/shared/utils/input-mask';

const PHONE = '000 000 000';
const PASSPORT = 'A0000000';

describe('input-mask', () => {
  it('knows a slot from a literal', () => {
    expect(isMaskToken('0')).toBe(true);
    expect(isMaskToken('A')).toBe(true);
    expect(isMaskToken('*')).toBe(true);
    expect(isMaskToken(' ')).toBe(false);
    expect(isMaskToken('-')).toBe(false);
  });

  it('counts what a pattern can hold', () => {
    expect(maskCapacity(PHONE)).toBe(9);
    expect(maskCapacity(PASSPORT)).toBe(8);
    expect(maskCapacity('---')).toBe(0);
  });

  it('keeps what the pattern takes and drops the rest', () => {
    expect(unmaskText('012 345 678', PHONE)).toBe('012345678');
    expect(unmaskText('0123456789012', PHONE)).toBe('012345678');
    expect(unmaskText('N1234567', PASSPORT)).toBe('N1234567');
  });

  it('offers a character to the slot it lands in, never to a later one', () => {
    // The letter is refused by the digit slot rather than filling the one after
    // it, and the digit that follows is then offered that same first slot.
    expect(unmaskText('a1', '00')).toBe('1');
    expect(unmaskText('1a', PASSPORT)).toBe('a');
    expect(unmaskText('N1', PASSPORT)).toBe('N1');
  });

  it('takes a letter from any script, since a Khmer name is letters too', () => {
    expect(unmaskText('ស', 'AAA')).toBe('ស');
    expect(unmaskText('ស', '000')).toBe('');
  });

  it('takes a digit from any script, since ០១២ are digits', () => {
    expect(unmaskText('០១២', '000')).toBe('០១២');
    expect(maskText('០១២៣', PHONE)).toBe('០១២ ៣');
    expect(unmaskText('០១២', 'AAA')).toBe('');
  });

  it('lays the value into the pattern', () => {
    expect(maskText('012345678', PHONE)).toBe('012 345 678');
    expect(maskText('N1234567', PASSPORT)).toBe('N1234567');
    expect(maskText('', PHONE)).toBe('');
  });

  it('holds a separator back until the character it separates arrives', () => {
    expect(maskText('012', PHONE)).toBe('012');
    expect(maskText('0123', PHONE)).toBe('012 3');
    expect(maskText('012345', PHONE)).toBe('012 345');
  });

  it('counts the value standing before the caret', () => {
    expect(rawBefore('012 345 678', PHONE, 0)).toBe(0);
    expect(rawBefore('012 345 678', PHONE, 4)).toBe(3);
    expect(rawBefore('012 345 678', PHONE, 5)).toBe(4);
    expect(rawBefore('012 345 678', PHONE, 11)).toBe(9);
  });

  it('puts the caret past the separators that follow, so typing carries on', () => {
    expect(caretAfter(PHONE, 0, 11)).toBe(0);
    // The third digit ends a group: the caret waits after the space, not before it.
    expect(caretAfter(PHONE, 3, 11)).toBe(4);
    expect(caretAfter(PHONE, 4, 11)).toBe(5);
    expect(caretAfter(PHONE, 9, 11)).toBe(11);
  });

  it('never puts the caret past what is actually in the field', () => {
    expect(caretAfter(PHONE, 3, 3)).toBe(3);
  });

  it('makes a backspace eat a typed character rather than a separator', () => {
    // The caret sits after "012 " — the space is not what was typed, so the
    // digit in front of it goes with it.
    expect(backspaceRange(PHONE, 4)).toEqual([2, 4]);
    // After a digit, the browser's own deletion is already right.
    expect(backspaceRange(PHONE, 3)).toBeNull();
    expect(backspaceRange(PHONE, 0)).toBeNull();
  });

  it('does the same for a forward delete', () => {
    expect(deleteRange(PHONE, 3, 11)).toEqual([3, 5]);
    expect(deleteRange(PHONE, 4, 11)).toBeNull();
    expect(deleteRange(PHONE, 11, 11)).toBeNull();
  });
});
