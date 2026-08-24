"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { isSettled, stepSpring, type SpringConfig, type SpringState } from "./spring";

export interface UseSpringOptions extends SpringConfig {
  /** Skip the physics and jump straight to the target. Wire this to useReducedMotion(). */
  immediate?: boolean;
}

export interface UseSpringResult {
  /** The live, on-screen value. Always read this, never the target, when animating from it. */
  value: number;
  /** The spring's current velocity, in units/second. Useful for handing off into another spring. */
  velocity: number;
  /** Snap to a value with zero velocity, bypassing the spring (e.g. on mount, or a hard reset). */
  jumpTo: (value: number) => void;
}

const CLAMP_DT = 1 / 30; // clamp huge gaps (tab switches, slow devices) to avoid a stiff jolt

/**
 * The mutable, external-to-React state a single useSpring instance owns: the live physics state,
 * the requestAnimationFrame loop driving it, and the listeners React's useSyncExternalStore
 * subscribes with. Modelling this as a plain external store (rather than component state updated
 * imperatively from inside effects) is the React-documented way to synchronise with a mutable
 * outside system: every render-reachable read goes through useSyncExternalStore's snapshot, and
 * the ref itself is only ever dereferenced from inside effects and callbacks below, never at the
 * top level of the component function.
 */
interface SpringStore {
  state: SpringState;
  target: number;
  config: SpringConfig;
  frameId: number | null;
  lastTime: number | null;
  listeners: Set<() => void>;
}

function createStore(initial: number): SpringStore {
  return {
    state: { value: initial, velocity: 0 },
    target: initial,
    config: { damping: 1, response: 0.4 },
    frameId: null,
    lastTime: null,
    listeners: new Set(),
  };
}

function notify(store: SpringStore) {
  for (const listener of store.listeners) listener();
}

function stopLoop(store: SpringStore) {
  if (store.frameId !== null) {
    cancelAnimationFrame(store.frameId);
    store.frameId = null;
  }
  store.lastTime = null;
}

function startLoop(store: SpringStore) {
  if (store.frameId !== null) return; // already running, the new target is picked up next frame

  const tick = (time: number) => {
    if (store.lastTime === null) store.lastTime = time;
    const dt = Math.min((time - store.lastTime) / 1000, CLAMP_DT);
    store.lastTime = time;

    const next = stepSpring(store.state, store.target, dt, store.config);
    store.state = next;
    notify(store);

    if (!isSettled(next, store.target, store.config)) {
      store.frameId = requestAnimationFrame(tick);
    } else {
      store.frameId = null;
      store.lastTime = null;
    }
  };

  store.frameId = requestAnimationFrame(tick);
}

/**
 * React binding for the spring integrator in ./spring.ts, driven by requestAnimationFrame.
 *
 * Retargeting is the whole point: call this hook again with a new `target` while the previous
 * animation is still in flight (an interrupt) and the spring does not reset to the new target,
 * it keeps integrating from wherever the presentation value and velocity currently are. That is
 * what makes it feel grabbable rather than snapping to a "logical" value, per the apple-design
 * skill's interruptibility principle.
 *
 * 2D motion (a magnetic button, a parallax offset) should call this hook twice, once for x and
 * once for y (or use useSpring2D below), rather than spring a single 2D distance: independent
 * axes avoid the desync that comes from X and Y needing different velocities at different moments.
 */
export function useSpring(target: number, options: UseSpringOptions): UseSpringResult {
  const { damping, response, restSpeed, restDisplacement, immediate = false } = options;

  const storeRef = useRef<SpringStore | null>(null);
  if (storeRef.current === null) {
    // Lazy ref init, the one render-time ref access React itself sanctions. Every other touch of
    // storeRef.current below happens inside an effect or callback, dereferenced fresh each time,
    // never hoisted into a variable that the render body itself would read.
    storeRef.current = createStore(target);
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    store.target = target;
    store.config = { damping, response, restSpeed, restDisplacement };

    if (immediate) {
      stopLoop(store);
      if (store.state.value !== target || store.state.velocity !== 0) {
        store.state = { value: target, velocity: 0 };
        notify(store);
      }
      return;
    }

    // Deliberately not resetting store.state here. Retargeting mid-flight continues from the
    // live presentation value with whatever velocity the spring already had.
    startLoop(store);
  }, [target, damping, response, restSpeed, restDisplacement, immediate]);

  useEffect(
    () => () => {
      if (storeRef.current) stopLoop(storeRef.current);
    },
    [],
  );

  const subscribe = useCallback((callback: () => void) => {
    const store = storeRef.current;
    if (!store) return () => {};
    store.listeners.add(callback);
    return () => {
      store.listeners.delete(callback);
    };
  }, []);

  const value = useSyncExternalStore(
    subscribe,
    () => storeRef.current?.state.value ?? target,
    () => target,
  );
  const velocity = useSyncExternalStore(
    subscribe,
    () => storeRef.current?.state.velocity ?? 0,
    () => 0,
  );

  const jumpTo = useCallback((v: number) => {
    const store = storeRef.current;
    if (!store) return;
    stopLoop(store);
    store.state = { value: v, velocity: 0 };
    store.target = v;
    notify(store);
  }, []);

  return { value, velocity, jumpTo };
}

/**
 * Decomposes 2D motion into two independent springs, one per axis, per the apple-design skill:
 * a single spring on a 2D distance desyncs when X and Y need different velocities.
 */
export function useSpring2D(
  target: { x: number; y: number },
  options: UseSpringOptions,
): { x: number; y: number; jumpTo: (point: { x: number; y: number }) => void } {
  const x = useSpring(target.x, options);
  const y = useSpring(target.y, options);

  const jumpTo = (point: { x: number; y: number }) => {
    x.jumpTo(point.x);
    y.jumpTo(point.y);
  };

  return { x: x.value, y: y.value, jumpTo };
}
