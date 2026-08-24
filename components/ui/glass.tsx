"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Liquid glass, from the `liquid-glass` module vendored at public/liquid-glass.js
 * (https://github.com/deepika-builds/liquid-glass). The optics are the module's job: the SVG
 * displacement filter, the chromatic fringe, the backdrop filter, resize handling, and the frosted
 * fallback on Safari and Firefox. This component only mounts it and supplies the CSS dressing the
 * module's README asks for, which is what makes a refracting rectangle actually read as glass.
 *
 * The module is a browser IIFE that assigns window.liquidGlass rather than an ES module, so it is
 * served from public/ and injected once on demand rather than imported. Importing it would fail
 * typechecking (it exports nothing) and a top level import would evaluate it during the server
 * render, where `window` does not exist.
 *
 * Tuning notes, following the module's own guidance rather than invented values: the page ground is
 * white and largely calm, so `blur` stays low (a busy backdrop is what forces it up) and `scale`
 * sits at the subtle end, because a strong bulge over text is what makes interiors smear. The
 * refraction never carries meaning: Safari and Firefox get the frosted fallback automatically and
 * lose nothing but the bend at the rim.
 */

interface LiquidGlassHandle {
  supported: boolean;
  refresh: () => void;
  destroy: () => void;
}

type LiquidGlassFn = (
  el: HTMLElement,
  options?: Record<string, number | string | null>,
) => LiquidGlassHandle;

declare global {
  interface Window {
    liquidGlass?: LiquidGlassFn;
  }
}

/** Injects the vendored script once per page and resolves when window.liquidGlass exists. */
let modulePromise: Promise<void> | null = null;
function loadModule(): Promise<void> {
  if (window.liquidGlass) return Promise.resolve();
  if (modulePromise) return modulePromise;
  modulePromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/liquid-glass.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("liquid-glass failed to load"));
    document.head.appendChild(script);
  });
  return modulePromise;
}

interface GlassProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Corner radius. The module reads this to build its displacement map, so keep them in step. */
  radius?: string;
  style?: CSSProperties;
}

export function Glass({
  children,
  as: Tag = "div",
  className = "",
  radius = "1.5rem",
  style,
}: GlassProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let handle: LiquidGlassHandle | undefined;
    let cancelled = false;

    // Refraction is decoration, so it is skipped entirely when the viewer has asked for less
    // motion or where the panel is large enough that the module warns about GPU cost.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = el.getBoundingClientRect();
    const tooLarge = rect.width > 800 || rect.height > 800;

    if (!reduced && !tooLarge) {
      loadModule()
        .then(() => {
          if (cancelled || !window.liquidGlass) return;
          handle = window.liquidGlass(el, {
            scale: -70,
            chroma: 4,
            blur: 2,
            saturate: 1.35,
            fallbackBlur: 14,
          });
        })
        .catch(() => {
          // The CSS dressing below already reads as a panel on its own, so a failed load simply
          // means no refraction rather than an unreadable box.
        });
    }

    return () => {
      cancelled = true;
      handle?.destroy();
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`glass-pane relative isolate ${className}`}
      style={{ borderRadius: radius, ...style }}
    >
      {children}
    </Tag>
  );
}
