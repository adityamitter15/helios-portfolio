"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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

/** Cuts the render down to the mark itself, discarding its square frame.
 *
 *  On the daylight ground this is a near-hard circular cut rather than the soft feather the dark
 *  themes used, and the reasoning is worth keeping. The render is a chrome ring around a dark disc
 *  on a dark ground. On a dark page you hide the frame by screen-blending it away; on white that is
 *  exactly wrong, because screen against white returns white and the entire mark disappears. So the
 *  frame has to be cut geometrically instead.
 *
 *  The stops are measured, not guessed. Sampling the render's radial luminance puts the bright
 *  chrome ring between 68% and 76% of the radius, the dark disc inside 64%, and the discardable
 *  frame beyond 80%. So the cut sits at 78 to 84%: the ring survives whole, and everything outside
 *  it goes. Cutting anywhere below 68% slices the ring off and leaves a plain grey disc, which is
 *  exactly what a guessed value produced first time round. A soft feather is wrong here too, it
 *  leaves a grey haze bleeding onto the white that reads as a rendering fault. */
// `closest-side` matters: without it a radial gradient sizes to the farthest corner, so a stop
// written as 78% actually lands at 78% of the corner distance, about 1.1x the half-width, which
// falls outside the image and rounds the square's corners instead of cutting a circle. With
// closest-side, 100% is the half-width, so these percentages mean what the measurement meant.
const MARK_MASK =
  "radial-gradient(circle closest-side at 50% 50%, #000 78%, rgba(0, 0, 0, 0.5) 81%, transparent 84%)";
const MARK_SRC = "/brand/mark-eclipse.png";

const RISE_PX = 56; // dramatically larger travel than a routine 16px section reveal
const ENTRANCE_SPRING = { damping: 1, response: 0.85 }; // slow settle reads as weight, not a fade

const DELAY = {
  eyebrow: 0,
  mark: 90,
  heading: 170,
  trade: 330,
  lead: 490,
  ctas: 630,
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
  const markP = useEntranceProgress(DELAY.mark, reduced);
  const headingP = useEntranceProgress(DELAY.heading, reduced);
  const tradeP = useEntranceProgress(DELAY.trade, reduced);
  const leadP = useEntranceProgress(DELAY.lead, reduced);
  const ctaP = useEntranceProgress(DELAY.ctas, reduced);

  // The mark composes two independent transforms into one: its own entrance (a scale-in from
  // 0.86, arriving with the wordmark) and the existing scroll parallax (drift and grow as the
  // section scrolls by). Both are inline styles on the *inner* Image only, never its wrapper:
  // an inline transform silently replaces a Tailwind translate rather than composing with it.
  // Layout (position and size) stays entirely on the wrapper below.
  const markStyle: CSSProperties = reduced
    ? {}
    : {
        transform: `translate3d(0, ${scrollProgress * -64}px, 0) scale(${
          (0.86 + markP * 0.14) * (1 + scrollProgress * 0.14)
        })`,
        opacity: markP * (1 - scrollProgress * 0.35),
      };

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Introduction"
      className="relative flex min-h-svh flex-col justify-center overflow-hidden px-6 pb-10 pt-16 sm:px-8 sm:pb-16 sm:pt-24"
    >
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
      <div className="relative z-10 flex w-full flex-col gap-10 sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-10 lg:gap-16">
        <div
          className="relative aspect-square w-[52vw] max-w-[280px] shrink-0 self-end opacity-70
            sm:w-[34%] sm:max-w-[380px] sm:self-center sm:opacity-100 sm:mr-[-4%]
            md:w-[36%] md:max-w-[440px] md:mr-[-6%]
            lg:w-[32%] lg:max-w-[560px] lg:mr-[-10%]
            xl:max-w-[640px] xl:mr-[-14%]"
        >
          <Image
            src={MARK_SRC}
            alt=""
            width={1024}
            height={1024}
            priority
            sizes="(min-width: 1024px) 640px, 52vw"
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
            style={{
              // No blend mode on the light ground. Screen would erase the mark entirely against
              // white; the circular mask above is what removes the render's frame instead.
              maskImage: MARK_MASK,
              WebkitMaskImage: MARK_MASK,
              ...markStyle,
            }}
          />
        </div>

        <div className="flex flex-col gap-10 sm:max-w-sm md:max-w-md lg:max-w-2xl">
          <div className="flex flex-col gap-5 sm:gap-6">
            <p
              className="font-mono text-label uppercase text-text-2"
              style={textEntranceStyle(eyebrowP, reduced)}
            >
              HELIOS &middot; web studio, London
            </p>

            <h1 className="text-hero text-text" style={textEntranceStyle(headingP, reduced)}>
              <span className="chrome-text">HELIOS</span>
              <br />
              Aditya Mitter
            </h1>

            <p className="text-h3 text-text" style={textEntranceStyle(tradeP, reduced)}>
              I build websites for small businesses.
            </p>

            <p className="text-lead text-text-2" style={textEntranceStyle(leadP, reduced)}>
              See it before you pay: a free homepage mockup, no deposit.
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
