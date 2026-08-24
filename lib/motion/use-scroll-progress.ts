"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, type RefObject } from "react";

/**
 * The mutable, external-to-React state behind a single useScrollProgress instance. Modelled the
 * same way as the spring store in ./use-spring.ts: the ref is dereferenced fresh inside effects
 * and callbacks only, never hoisted to a variable the render body itself would read, and React
 * is told about new values through useSyncExternalStore rather than a raw setState call sitting
 * directly in an effect body.
 */
interface ProgressStore {
  progress: number;
  frameId: number | null;
  listeners: Set<() => void>;
}

function createStore(): ProgressStore {
  return { progress: 0, frameId: null, listeners: new Set() };
}

function notify(store: ProgressStore) {
  for (const listener of store.listeners) listener();
}

function setProgress(store: ProgressStore, next: number) {
  if (next !== store.progress) {
    store.progress = next;
    notify(store);
  }
}

function measure(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const total = rect.height + viewportHeight;
  const travelled = viewportHeight - rect.top;
  return total > 0 ? Math.min(1, Math.max(0, travelled / total)) : 0;
}

function stopLoop(store: ProgressStore) {
  if (store.frameId !== null) {
    cancelAnimationFrame(store.frameId);
    store.frameId = null;
  }
}

function startLoop(store: ProgressStore, el: HTMLElement) {
  if (store.frameId !== null) return;
  const loop = () => {
    setProgress(store, measure(el));
    store.frameId = requestAnimationFrame(loop);
  };
  store.frameId = requestAnimationFrame(loop);
}

/**
 * Tracks how far `ref`'s element has travelled through the viewport, as a 0..1 progress value,
 * sampled every animation frame via getBoundingClientRect. Deliberately not a `scroll` event
 * listener: scroll events fire off the render cadence, coalesce unpredictably and jitter under a
 * fast flick, while requestAnimationFrame stays locked to the display's refresh and always reads
 * the element's *current* geometry.
 *
 *   progress 0   -> the element's top has just reached the bottom of the viewport
 *   progress 1   -> the element's bottom has just passed the top of the viewport
 *
 * The rAF loop only actually runs while the element is near the viewport (gated by an
 * IntersectionObserver with a generous margin), so a page with many of these hooks mounted
 * doesn't spend every frame on sections nowhere near the screen. If the element can't be found
 * (unmounted, or the ref never resolves), progress reports 1 so callers gating "has this scrolled
 * by yet" fail open rather than staying stuck hidden forever.
 */
export function useScrollProgress<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const storeRef = useRef<ProgressStore | null>(null);
  if (storeRef.current === null) storeRef.current = createStore();

  useEffect(() => {
    const store = storeRef.current;
    const el = ref.current;
    if (!store) return;

    if (!el || typeof IntersectionObserver === "undefined") {
      setProgress(store, 1);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startLoop(store, el);
        } else {
          stopLoop(store);
          setProgress(store, measure(el));
        }
      },
      { rootMargin: "25% 0px 25% 0px" },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      stopLoop(store);
    };
  }, [ref]);

  const subscribe = useCallback((callback: () => void) => {
    const store = storeRef.current;
    if (!store) return () => {};
    store.listeners.add(callback);
    return () => {
      store.listeners.delete(callback);
    };
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => storeRef.current?.progress ?? 0,
    () => 0,
  );
}
