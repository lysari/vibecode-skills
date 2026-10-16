import { describe, expect, it } from 'vitest';
import { Box, pourKeyframes } from '@app/shared/utils/liquid-pour';

const box = (x: number, width: number): Box => ({ x, y: 0, width, height: 30 });
const lefts = (frames: Keyframe[]) => frames.map((frame) => parseFloat(String(frame['translate'])));
const rights = (frames: Keyframe[]) =>
  frames.map((frame) => parseFloat(String(frame['translate'])) + parseFloat(String(frame['width'])));

describe('pourKeyframes', () => {
  it('reaches ahead with the leading edge when the whole box moves', () => {
    const frames = pourKeyframes(box(0, 100), box(200, 100), { axis: 'x', pull: 10 })!;

    expect(rights(frames)[1]).toBe(110);
    expect(lefts(frames)[1]).toBe(0);
  });

  it('holds the start still while a box grows from it', () => {
    const frames = pourKeyframes(box(4, 160), box(4, 480), { axis: 'x', pull: 10 })!;

    expect(lefts(frames).every((left) => left === 4)).toBe(true);
    expect(rights(frames)).toEqual([164, 174, 487.5, 484]);
  });

  it('holds the start still while a box shrinks back to it', () => {
    const frames = pourKeyframes(box(4, 480), box(4, 160), { axis: 'x', pull: 10 })!;

    expect(lefts(frames).every((left) => left === 4)).toBe(true);
    expect(rights(frames)).toEqual([484, 474, 160.5, 164]);
  });

  it('holds the end still while the start moves', () => {
    const frames = pourKeyframes(box(300, 100), box(0, 400), { axis: 'x', pull: 10 })!;

    expect(rights(frames).every((right) => right === 400)).toBe(true);
    expect(lefts(frames)).toEqual([300, 290, -3.5, 0]);
  });
});
