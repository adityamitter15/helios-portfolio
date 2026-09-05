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
  /** Width as a fraction of the viewport width. */
  size: number;
  /** Height as a fraction of the bloom's own width. Below 1 gives a horizontal sweep. */
  ratio: number;
  /** Home position in viewport percentages. */
  home: [number, number];
  /** Drift radius in viewport percentages, per axis. */
  travel: [number, number];
  /** Seconds for a full cycle, per axis. Deliberately not multiples of each other. */
  period: [number, number];
  opacity: number;
}

/**
 * Retuned twice over, because the previous values did not produce depth, they produced fog.
 *
 * Opacity was 0.72 / 0.50 / 0.55 with the gradient holding solid colour all the way out to 18%
 * before fading. Three of those, overlapping near the middle of the viewport, tinted the entire
 * page a flat pale lavender. That is a real correctness problem and not only a taste one: every
 * contrast ratio recorded in app/globals.css is computed against #FFFFFF, and with the old wash
 * there was no white anywhere on the page for those numbers to be true of.
 *
 * Three changes. Opacity roughly halved, so the wash is felt rather than seen, which is what the
 * spec asked for. The solid core is gone, so each bloom fades from its centre instead of holding
 * flat colour and then falling off a cliff. And they are pushed out to the edges: the middle of
 * the viewport, where the type sits and where contrast has to hold, is now the clearest part of
 * the page rather than where all three overlapped.
 *
 * They are also ellipses now rather than circles. An aurora is a sweep across a sky, and three
 * circles read as three balls of gas no matter how far they are blurred.
 */
/* Opacities raised again on 2026-08-30: the wash had been called too subtle, and it was. The values
   below were originally cut hard to kill a lavender fog, but the fog was mostly the old dark render
   compositing to grey on top of these, not the blooms themselves. With that render replaced by a
   high-key one there is headroom to push these back up. They stay pinned to the edges so the middle
   of the viewport, where the type sits, remains the clearest part of the page and the contrast
   ratios in globals.css still hold against white. */
const BLOOMS: Bloom[] = [
  { color: "var(--color-bloom-a)", size: 1.05, ratio: 0.6, home: [8, 12], travel: [9, 7], period: [37, 43], opacity: 0.52 },
  { color: "var(--color-bloom-b)", size: 0.88, ratio: 0.68, home: [94, 22], travel: [7, 10], period: [53, 61], opacity: 0.44 },
  { color: "var(--color-bloom-c)", size: 1.0, ratio: 0.55, home: [66, 97], travel: [11, 8], period: [67, 71], opacity: 0.4 },
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
            height: `${b.size * b.ratio * 100}vw`,
            left: `${b.home[0]}%`,
            top: `${b.home[1]}%`,
            marginLeft: `${-b.size * 50}vw`,
            marginTop: `${-b.size * b.ratio * 50}vw`,
            // Plain colour stops on purpose. This was written with
            // color-mix(in oklab, <colour> 100%, transparent), which is just the colour itself but
            // makes the whole gradient depend on color-mix support: in any browser without it the
            // declaration is invalid and the bloom does not paint at all, so the wash silently
            // disappears instead of degrading.
            // No solid hold before the falloff. The old stop list kept full colour to 18% and then
            // ran to transparent at 70%, which paints a flat disc with a soft edge rather than a
            // bloom; blurring a flat disc only softens its rim, it never softens its middle.
            background: `radial-gradient(ellipse at center, ${b.color} 0%, transparent 68%)`,
            opacity: b.opacity,
            filter: "blur(110px)",
            willChange: reduced ? undefined : "transform",
          }}
        />
      ))}
    </div>
  );
}
