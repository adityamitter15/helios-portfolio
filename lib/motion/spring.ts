/**
 * A real spring integrator, parameterised the way Apple parameterises motion (damping ratio and
 * response), not the raw mass/stiffness/damping triplet, and not CSS easing. See
 * docs/DESIGN-SPEC.md section 4.1 and the apple-design skill.
 *
 *   k = (2*PI / response) ** 2      angular frequency squared: stiffness at unit mass
 *   c = 2 * dampingRatio * sqrt(k)  damping coefficient
 *
 * `response` is roughly "seconds to reach the target", but it is not a fixed animation duration:
 * the settle time emerges from these two numbers plus the spring's current velocity, which is
 * exactly what makes it re-targetable mid-flight without a visible seam.
 *
 * damping 1.0 = critically damped, no overshoot. Below 1.0 overshoots and oscillates before
 * settling, useful only where a user gesture actually carried momentum (see use-spring.ts).
 */

export interface SpringConfig {
  /** 1.0 = critically damped (no overshoot). Lower = bouncier. */
  damping: number;
  /** Seconds to (approximately) reach the target. Not a fixed duration. */
  response: number;
  /** Velocity below which the spring is considered at rest. */
  restSpeed?: number;
  /** Distance-to-target below which the spring is considered at rest. */
  restDisplacement?: number;
}

export interface SpringState {
  value: number;
  velocity: number;
}

const DEFAULT_REST_SPEED = 0.01;
const DEFAULT_REST_DISPLACEMENT = 0.01;

/** Substep length used by the integrator. Fixed-step, so a big `dt` (a dropped frame, a tab that
 *  just regained focus) is walked in several small steps instead of one huge unstable one. */
const MAX_SUBSTEP = 1 / 120;

/** Stiffness (k) and damping coefficient (c) for a unit-mass spring at this damping + response. */
export function springCoefficients(config: Pick<SpringConfig, "damping" | "response">) {
  const response = Math.max(config.response, 1e-4);
  const k = (2 * Math.PI / response) ** 2;
  const c = 2 * config.damping * Math.sqrt(k);
  return { k, c };
}

/**
 * Advance a spring `state` toward `target` by `dt` seconds and return the new state.
 *
 * Always call this with the *live, on-screen* value already sitting in `state.value`, never a
 * value reset to the target on retarget: because this function only ever reads the state you
 * hand it, an interrupted spring that keeps getting fed its own last output continues seamlessly
 * from wherever it actually is, carrying whatever velocity it already had into the new target.
 * That carry-through is what avoids the "brick wall" a hard velocity cut produces on reversal.
 *
 * Integrated with fixed-step semi-implicit (symplectic) Euler: velocity updates first, then the
 * new velocity moves the value. Cheap, and stable for the stiff springs UI motion tends to need
 * (explicit Euler blows up at the same stiffness values).
 */
export function stepSpring(
  state: SpringState,
  target: number,
  dt: number,
  config: SpringConfig,
): SpringState {
  const { k, c } = springCoefficients(config);
  const mass = 1;

  let remaining = Math.max(dt, 0);
  let { value, velocity } = state;

  while (remaining > 0) {
    const step = Math.min(remaining, MAX_SUBSTEP);
    const displacement = value - target;
    const springForce = -k * displacement;
    const dampingForce = -c * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    velocity += acceleration * step;
    value += velocity * step;

    remaining -= step;
  }

  const restVelocity = config.restSpeed ?? DEFAULT_REST_SPEED;
  const restDisplacement = config.restDisplacement ?? DEFAULT_REST_DISPLACEMENT;
  if (Math.abs(velocity) < restVelocity && Math.abs(value - target) < restDisplacement) {
    return { value: target, velocity: 0 };
  }

  return { value, velocity };
}

/** Whether a spring has settled at `target` under this config's rest thresholds. */
export function isSettled(state: SpringState, target: number, config: SpringConfig): boolean {
  const restVelocity = config.restSpeed ?? DEFAULT_REST_SPEED;
  const restDisplacement = config.restDisplacement ?? DEFAULT_REST_DISPLACEMENT;
  return Math.abs(state.velocity) < restVelocity && Math.abs(state.value - target) < restDisplacement;
}
