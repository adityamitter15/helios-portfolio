"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

/**
 * The aurora, docs/DESIGN-SPEC-V2.md section 2. Three very large, heavily blurred colour blooms
 * drifting slowly behind everything, which is what gives the page depth and stops a flat cobalt
 * ground reading as a solid block.
 *
 * Fixed to the viewport and pointer-inert, so it costs nothing in layout and never intercepts a
 * click. It sits at the very back; content stacks above it.
 *
 * One rAF loop drives all three, rather than three CSS animations: independent CSS animations on
 * blurred elements of this size mean three separate compositor timelines, and their periods visibly
 * beat against each other. Driving them from a single clock keeps the drift incommensurate on
 * purpose (the periods below are deliberately non-multiples) so it never appears to loop.
 *
 * Under prefers-reduced-motion the blooms are rendered once and left still. The depth is the point;
 * the movement is the accessibility problem, so only the movement goes.
 */

interface Bloom {
  color: string;
  /** Fraction of the viewport this bloom spans. */
  size: number;
  /** Home position in viewport percentages. */
  home: [number, number];
  /** Drift radius in viewport percentages, per axis. */
  travel: [number, number];
  /** Seconds for a full cycle, per axis. Deliberately not multiples of each other. */
  period: [number, number];
  opacity: number;
}

const BLOOMS: Bloom[] = [
  { color: "var(--color-bloom-a)", size: 0.78, home: [18, 22], travel: [9, 7], period: [37, 43], opacity: 0.5 },
  { color: "var(--color-bloom-b)", size: 0.6, home: [82, 30], travel: [7, 10], period: [53, 61], opacity: 0.34 },
  { color: "var(--color-bloom-c)", size: 0.7, home: [58, 78], travel: [11, 8], period: [67, 71], opacity: 0.36 },
];

export function Aurora() {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const host = hostRef.current;
    if (!host) return;

    const nodes = Array.from(host.children) as HTMLElement[];
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      for (let i = 0; i < nodes.length; i++) {
        const b = BLOOMS[i];
        if (!b) continue;
        const dx = Math.sin((t / b.period[0]) * Math.PI * 2) * b.travel[0];
        const dy = Math.cos((t / b.period[1]) * Math.PI * 2) * b.travel[1];
        nodes[i].style.transform = `translate3d(${dx}vw, ${dy}vh, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-50 overflow-hidden"
    >
      {BLOOMS.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${b.size * 100}vw`,
            height: `${b.size * 100}vw`,
            left: `${b.home[0]}%`,
            top: `${b.home[1]}%`,
            marginLeft: `${-b.size * 50}vw`,
            marginTop: `${-b.size * 50}vw`,
            background: `radial-gradient(circle, color-mix(in oklab, ${b.color} 100%, transparent) 0%, transparent 68%)`,
            opacity: b.opacity,
            filter: "blur(90px)",
            willChange: reduced ? undefined : "transform",
          }}
        />
      ))}
    </div>
  );
}
