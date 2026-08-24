"use client";

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

/**
 * Liquid glass, docs/DESIGN-SPEC-V2.md section 3. The single implementation of the material:
 * sections compose this rather than hand-rolling their own translucent boxes, otherwise the panes
 * drift apart and stop reading as the same substance.
 *
 * Four things together make it look like glass rather than a tinted div, and dropping any one of
 * them is what makes this effect look cheap:
 *
 *   1. backdrop blur AND saturation. Blur alone greys out whatever is behind; the saturation boost
 *      is what keeps the aurora's colour alive through the pane.
 *   2. a tinted fill rather than full transparency, so the pane has substance of its own.
 *   3. a lit edge: a border that is brighter along the top and fades toward the bottom, the way a
 *      real pane catches light from above. A single flat border is the giveaway of fake glass.
 *   4. a specular highlight that tracks the pointer. This is the "liquid" part, and the only part
 *      that makes the surface feel responsive rather than painted on.
 *
 * The lit edge is done with a gradient-filled border via mask compositing rather than border-color,
 * because a border cannot itself hold a gradient.
 */

interface GlassProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Corner radius token. Matches the rounded-* scale used across the sections. */
  radius?: string;
  /** Turn off the pointer-tracked sheen for large background panes where it would be wasted. */
  specular?: boolean;
  style?: CSSProperties;
}

export function Glass({
  children,
  as: Tag = "div",
  className = "",
  radius = "1.5rem",
  specular = true,
  style,
}: GlassProps) {
  const ref = useRef<HTMLElement>(null);
  const [sheen, setSheen] = useState<{ x: number; y: number; on: boolean }>({
    x: 50,
    y: 50,
    on: false,
  });

  const handleMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!specular) return;
      // Coarse pointers (touch) get no sheen: there is no hover state to track, and firing this on
      // every touchmove would just cost work for an effect nobody sees.
      if (event.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSheen({
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
        on: true,
      });
    },
    [specular],
  );

  const handleLeave = useCallback(() => {
    setSheen((s) => (s.on ? { ...s, on: false } : s));
  }, []);

  return (
    <Tag
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`glass-pane relative isolate overflow-hidden ${className}`}
      style={{ "--glass-radius": radius, borderRadius: radius, ...style } as CSSProperties}
    >
      {specular ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300"
          style={{
            opacity: sheen.on ? 1 : 0,
            // Tinted rather than white: on a light ground a white sheen is invisible, so the
            // highlight has to read as a faint pool of blue light gathering under the pointer.
            background: `radial-gradient(38rem circle at ${sheen.x}% ${sheen.y}%, rgba(96, 140, 225, 0.13), transparent 60%)`,
          }}
        />
      ) : null}
      {children}
    </Tag>
  );
}
