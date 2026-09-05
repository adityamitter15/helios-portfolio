"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BlackHole } from "@/components/ui/black-hole";
import { Magnetic } from "@/components/ui/magnetic";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { useScrollProgress } from "@/lib/motion/use-scroll-progress";
import { useSpring } from "@/lib/motion/use-spring";
import { WHATSAPP_HREF } from "@/lib/contact";

/**
 * The hero, docs/DESIGN-SPEC-V2.md sections 5 and 6.2. HELIOS in the chrome CSS gradient
 * (globals.css .chrome-text) paired with Aditya Mitter at the same hero type scale stays: his
 * name being small has been flagged as a defect twice, so both lines share text-hero rather than
 * his name riding a smaller subhead. Directly beneath, the trade statement sits at text-h3 so a
 * stranger knows what is being sold without scrolling, then the existing promise line at
 * text-lead, then the two calls to action.
 *
 * Entrance is a deliberately heavy, staggered arrival rather than the routine section reveal:
 * each line springs up from a large rise on its own critically damped spring (no overshoot, an
 * arrival rather than a gesture) with a slower response than lib/motion's other callers, so the
 * settle reads as something with mass rather than a quick fade. This is the one moment on the
 * page that has to feel cinematic.
 */

const RISE_PX = 56; // dramatically larger travel than a routine 16px section reveal
const ENTRANCE_SPRING = { damping: 1, response: 0.85 }; // slow settle reads as weight, not a fade

const DELAY = {
  eyebrow: 0,
  promise: 130,
  heading: 210,
  trade: 370,
  lead: 510,
  ctas: 650,
} as const;

/** Drives one entrance step's 0..1 progress: armed after its stagger delay, then springs up.
 *  Hero is the first thing painted, so this fires on mount rather than waiting on an
 *  IntersectionObserver the way the shared Reveal component does further down the page. */
function useEntranceProgress(delayMs: number, reduced: boolean): number {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => setArmed(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, reduced]);

  const spring = useSpring(reduced || armed ? 1 : 0, { ...ENTRANCE_SPRING, immediate: reduced });
  return reduced ? 1 : spring.value;
}

/** Fade, rise and a small scale settle, all driven off the same progress value so they resolve
 *  together. Used for every text line; the mark composes its own version alongside its scroll
 *  parallax below. */
function textEntranceStyle(progress: number, reduced: boolean): CSSProperties {
  if (reduced) return {};
  return {
    opacity: progress,
    transform: `translate3d(0, ${(1 - progress) * RISE_PX}px, 0) scale(${0.96 + progress * 0.04})`,
  };
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const scrollProgress = useScrollProgress(sectionRef);

  const eyebrowP = useEntranceProgress(DELAY.eyebrow, reduced);
  const promiseP = useEntranceProgress(DELAY.promise, reduced);
  const headingP = useEntranceProgress(DELAY.heading, reduced);
  const tradeP = useEntranceProgress(DELAY.trade, reduced);
  const leadP = useEntranceProgress(DELAY.lead, reduced);
  const ctaP = useEntranceProgress(DELAY.ctas, reduced);

  // The scroll parallax the mark used to carry, now applied to the black hole, which is what
  // occupies that slot. The transform is written straight to the DOM in an effect rather than
  // rendered as a style attribute: its input only exists on the client, so letting React render it
  // produces a style string the server cannot reproduce, which is a hydration mismatch. Writing it
  // imperatively means the server and the first client render agree on the markup exactly.
  //
  // Scale stays at or above 1 and leads the translate, so the layer can never expose the section
  // behind it as it drifts up.
  const holeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = holeRef.current;
    if (!el) return;
    if (reduced) {
      el.style.transform = "";
      return;
    }
    el.style.transform =
      `translate3d(0, ${scrollProgress * -40}px, 0) scale(${1 + scrollProgress * 0.15})`;
  }, [scrollProgress, reduced]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Introduction"
      className="hero-void relative isolate flex min-h-svh flex-col justify-center overflow-hidden
        bg-void px-6 pb-10 pt-16 sm:px-8 sm:pb-16 sm:pt-24"
    >
      {/* The black hole, components/ui/black-hole.tsx. A Schwarzschild geodesic integrator: every
          pixel launches a photon and follows it through curved spacetime until it crosses the
          horizon, hits the accretion disk, or escapes to the sky. The shadow, the ring of light
          around it and the disk apparently folding over the top of the hole all fall out of that
          one calculation rather than being drawn.

          This replaces the two daylight layers that stood here, a stack of --color-bloom-*
          gradients and /brand/aurora-daylight.jpg. Both were built for a white ground and neither
          survives on black, so they are gone rather than dimmed: re-using art on a ground it was
          not drawn for is the exact failure the note they carried was itself written about.

          It costs no bytes and no request, and it follows the palette rather than freezing it. The
          renderer's default ramp is already --color-bloom-b through --color-bloom-c over a
          chrome-white core, which is why no palette prop is passed here.

          It also removes itself when it should: a single still frame under prefers-reduced-motion,
          and the render loop stops outright once the hero leaves the viewport, which on this page
          is within a screen of scrolling. See the header of black-hole-utils/renderer.ts. */}
      <div ref={holeRef} aria-hidden="true" className="absolute inset-0 -z-10 will-change-transform">
        <BlackHole />
      </div>

      {/* Scrim over the type. The contrast ratios recorded for .hero-void in globals.css are true
          of the #04060C GROUND, and the accretion disk is many times brighter than the ground, so
          without this the eyebrow and lead would sit on whatever the disk happened to be doing at
          that moment rather than on a known value.

          There are two, because the type is in a completely different place in the two layouts and
          a single gradient cannot serve both. Wide: the type is a narrow column on the left, so the
          scrim is horizontal and the right of the frame stays clear for the hole. Narrow: the type
          is one full-width block down the middle, so a horizontal scrim would leave the end of
          every line unprotected; it runs vertically instead, holding the top of the frame open for
          the hole and covering everything below it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 sm:hidden"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 0%, rgba(4,6,12,0.45) 16%, rgba(4,6,12,0.88) 38%, rgba(4,6,12,0.94) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden sm:block"
        style={{
          backgroundImage: [
            "linear-gradient(to right, #04060c 0%, rgba(4,6,12,0.86) 34%, rgba(4,6,12,0.35) 62%, transparent 88%)",
            "linear-gradient(to top, rgba(4,6,12,0.72) 0%, transparent 42%)",
          ].join(", "),
        }}
      />

      {/* The horizon, globals.css .hero-void-horizon. The dark hero meets the white page below on
          a lit hairline rather than a fade, for the reason recorded with that rule: the gradient
          between those two grounds runs through grey, and a grey band is the failure this file
          already threw one backdrop out over. */}
      <div
        aria-hidden="true"
        className="hero-void-horizon pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px"
      />

      {/* Text and mark are real flex siblings, not an absolutely positioned mark layered over a
          full-width text block: at the tablet width band a vw-scaled "Aditya Mitter" and a
          percentage-offset mark drifted into each other, which is exactly the "decorative art
          must never overlap text" rule breaking. As flex items neither can invade the other's
          column regardless of how the type reflows; the mark's negative right margin below can
          only push it further away from the text; it never has a path back toward it.

          The mark is first in the DOM so the default flex-col stacks it above the type on
          phones (the empty band above the type, never behind it), then sm:flex-row-reverse
          swaps the visual order so the type sits left and the mark right, without needing to
          reorder the markup. */}
      {/* The type column, now the only child. It kept its narrow max-widths from when it shared
          this row with the mark, which is still what we want: the column stays left, over the
          scrimmed side, and the hole keeps the right of the frame to itself. */}
      <div className="relative z-10 flex w-full flex-col gap-10">
        <div className="flex flex-col gap-10 sm:max-w-sm md:max-w-md lg:max-w-2xl">
          <div className="flex flex-col gap-5 sm:gap-6">
            <p
              className="font-mono text-label uppercase text-text-2"
              style={textEntranceStyle(eyebrowP, reduced)}
            >
              HELIOS &middot; web studio, London
            </p>

            {/* The tagline. Treated as the headline of the page, not as a caption to the wordmark.
                A stranger has no reason to care that the studio is called HELIOS; they care what it
                will do for them, so the promise is read first and the name signs it underneath.

                Set in Instrument Serif italic against the sans used everywhere else, and in accent
                blue against the ink, so it arrives as a different voice rather than as another line
                of the same paragraph.

                On scale: this was clamp(1.5rem, 3.4vw, 2.6rem), which left the tagline meaningfully
                smaller than the studio name and made the page lead with identity instead of offer.
                It is now close to the wordmark's weight without passing it. It deliberately does not
                take the hero scale outright: hero.tsx has carried a note since v1 that Aditya Mitter
                rendering small was flagged as a defect twice, so the name keeps its billing and the
                tagline earns dominance through position, colour and voice instead of pure size. */}
            <p
              className="font-serif-italic text-[clamp(2rem,4.8vw,3.9rem)] leading-[1.08] tracking-[-0.015em] text-accent"
              style={textEntranceStyle(promiseP, reduced)}
            >
              Your business, in its best light.
            </p>

            <h1 className="text-hero text-text" style={textEntranceStyle(headingP, reduced)}>
              <span className="chrome-text">HELIOS</span>
              <br />
              Aditya Mitter
            </h1>

            <p className="text-h3 text-text" style={textEntranceStyle(tradeP, reduced)}>
              I design and build websites for independent businesses.
            </p>

            {/* Rewritten from "See it before you pay: a free homepage mockup, no deposit." Same
                offer, said with more conviction: second person and imperative rather than a colon
                and a noun phrase, and the two guarantees stated flat rather than tucked in as an
                aside. The offer is the strongest thing this studio has; it should not read like
                a footnote to itself. */}
            <p className="text-lead text-text-2" style={textEntranceStyle(leadP, reduced)}>
              See your homepage before you pay. No deposit, no contract.
            </p>
          </div>

          <div
            className="flex flex-wrap items-center gap-4"
            style={textEntranceStyle(ctaP, reduced)}
          >
            <Magnetic
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent-hi px-6 text-body font-medium text-void"
            >
              Claim a free mockup
            </Magnetic>
            <Magnetic
              href="#work"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-6 text-body font-medium text-text"
            >
              See the work
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
