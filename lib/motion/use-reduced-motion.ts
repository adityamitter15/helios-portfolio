"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mediaQueryList = window.matchMedia(QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

/**
 * SSR-safe prefers-reduced-motion hook, built on useSyncExternalStore: the React-native way to
 * read and subscribe to an external, mutable source (a MediaQueryList here) without reading it
 * during server render and without a synchronous setState-in-effect round trip on mount. Server
 * render and the very first client render both resolve to `false`; the real value takes over as
 * soon as React reads the store on the client, then updates live on every change.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
