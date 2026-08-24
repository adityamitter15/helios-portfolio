"use client";

import Image from "next/image";
import { useRef } from "react";
import { Magnetic } from "@/components/ui/magnetic";
import { Reveal } from "@/components/ui/reveal";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { useScrollProgress } from "@/lib/motion/use-scroll-progress";
import { WHATSAPP_HREF } from "@/lib/contact";

/**
 * The hero, docs/DESIGN-SPEC.md section 5. HELIOS in the chrome CSS gradient (globals.css
 * .chrome-text, background-clip: text) paired with Aditya Mitter at the *same* hero type scale:
 * his name being small has been flagged as a defect twice before, so both lines share text-hero
 * rather than his name riding a smaller subhead.
 *
 * The eclipse mark drifts and scales as the section scrolls by, driven by useScrollProgress
 * (rAF + getBoundingClientRect, never a scroll listener) per section 4.3.1. Progress is fed
 * straight into the transform, no extra spring: this is direct manipulation of a scroll-linked
 * value, and springing a value that already tracks the scroll 1:1 would just add lag.
 */
/** Feathers the render's square boundary away so only the ring itself is left on the void. */
const MARK_MASK = "radial-gradient(circle at 50% 50%, #000 44%, rgba(0, 0, 0, 0.55) 62%, transparent 74%)";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const progress = useScrollProgress(sectionRef);

  const markStyle = reduced
    ? {}
    : {
        transform: `translate3d(0, ${progress * -64}px, 0) scale(${1 + progress * 0.14})`,
        opacity: 1 - progress * 0.35,
      };

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Introduction"
      className="relative flex min-h-svh flex-col items-start justify-center gap-10 overflow-hidden px-6 pt-24 sm:px-8"
    >
      {/* Layout lives on the wrapper, the scroll transform on the image. They cannot share an
          element: an inline transform silently replaces a Tailwind translate rather than composing
          with it, which previously cancelled the vertical centring.

          On phones the mark sits in the empty band above the type instead of behind it, so the
          wordmark and the name never compete with it for legibility. From the small breakpoint up
          there is room to set it beside the type, centred on the section. */}
      <div
        className="pointer-events-none absolute right-[-16%] top-[3%] h-[56vw] max-h-[640px] w-[56vw]
          max-w-[640px] select-none opacity-70 sm:right-[-8%] sm:top-1/2 sm:h-[70vw] sm:w-[70vw]
          sm:-translate-y-1/2 sm:opacity-100 lg:right-[-6%]"
      >
        <Image
          src="/brand/mark-eclipse.png"
          alt=""
          width={1024}
          height={1024}
          priority
          sizes="(min-width: 1024px) 640px, 56vw"
          className="h-full w-full"
          style={{
            mixBlendMode: "screen",
            // The render's ground is dark navy rather than true black, so screen blending lifts the
            // whole square and its border shows as a lighter box against the void. Feathering the
            // corners away is what makes it read as an object floating in the dark.
            maskImage: MARK_MASK,
            WebkitMaskImage: MARK_MASK,
            ...markStyle,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-10">
        <Reveal className="flex flex-col gap-6">
          <p className="font-mono text-label uppercase text-text-2">HELIOS &middot; web studio, London</p>
          <h1 className="text-hero text-text">
            <span className="chrome-text">HELIOS</span>
            <br />
            Aditya Mitter
          </h1>
          <p className="max-w-xl text-body text-text-2">
            Your business, in its best light. See it before you pay: a free homepage mockup,
            no deposit.
          </p>
        </Reveal>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Magnetic
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-body font-medium text-void"
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
    </section>
  );
}
