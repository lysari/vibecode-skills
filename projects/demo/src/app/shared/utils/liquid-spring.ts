export interface Spring {
  stiffness: number;
  damping: number;
}

export interface SpringState {
  position: number;
  velocity: number;
}

const SUBSTEP = 1 / 240;
const REST = 5e-4;

export function springTo(state: SpringState, target: number, spring: Spring, seconds: number): void {
  const friction = 2 * spring.damping * Math.sqrt(spring.stiffness);
  for (let elapsed = 0; elapsed < seconds; elapsed += SUBSTEP) {
    const step = Math.min(SUBSTEP, seconds - elapsed);
    const force = -spring.stiffness * (state.position - target) - friction * state.velocity;
    state.velocity += force * step;
    state.position += state.velocity * step;
  }
}

export function springAtRest(state: SpringState, target: number): boolean {
  return Math.abs(state.position - target) < REST && Math.abs(state.velocity) < REST * 10;
}

export function settlingSpring(milliseconds: number, damping: number): Spring {
  const frequency = 4 / (damping * (milliseconds / 1000));
  return { stiffness: frequency * frequency, damping };
}
