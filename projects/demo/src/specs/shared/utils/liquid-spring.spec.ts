import {
  SpringState,
  settlingSpring,
  springAtRest,
  springTo,
} from '@app/shared/utils/liquid-spring';

const run = (state: SpringState, target: number, seconds: number, spring = settlingSpring(340, 0.75)) => {
  const frames: number[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    springTo(state, target, spring, 1 / 60);
    frames.push(state.position);
  }
  return frames;
};

describe('liquid spring', () => {
  it('overshoots a little, then settles on the target', () => {
    const frames = run({ position: 0, velocity: 0 }, 1, 1.2);
    const peak = Math.max(...frames);
    expect(peak).toBeGreaterThan(1.01);
    expect(peak).toBeLessThan(1.05);
    expect(frames.at(-1)).toBeCloseTo(1, 3);
  });

  it('is fastest early and nearly still by the duration it was built for', () => {
    const frames = run({ position: 0, velocity: 0 }, 1, 0.34);
    const speeds = frames.slice(1).map((x, i) => x - frames[i]);
    const peakAt = speeds.indexOf(Math.max(...speeds)) / speeds.length;
    expect(peakAt).toBeLessThan(0.5);
    expect(Math.abs(speeds.at(-1)!)).toBeLessThan(Math.max(...speeds) * 0.1);
  });

  it('keeps its speed when the target changes mid-flight', () => {
    const state = { position: 0, velocity: 0 };
    run(state, 1, 0.1);
    const before = state.velocity;
    springTo(state, -1, settlingSpring(340, 0.75), 1 / 240);
    expect(state.velocity).toBeGreaterThan(0);
    expect(state.velocity).toBeLessThan(before);
  });

  it('reports rest only when both distance and speed are spent', () => {
    expect(springAtRest({ position: 1, velocity: 0 }, 1)).toBe(true);
    expect(springAtRest({ position: 1, velocity: 0.5 }, 1)).toBe(false);
    expect(springAtRest({ position: 0.9, velocity: 0 }, 1)).toBe(false);
  });
});
