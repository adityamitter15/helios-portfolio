"use client";

import Image from "next/image";
import { useRef } from "react";
import { Magnetic } from "@/components/ui/magnetic";
import { Reveal } from "@/components/ui/reveal";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { useScrollProgress } from "@/lib/motion/use-scroll-progress";
import { WHATSAPP_HREF } from "@/lib/contact";

const PARALLAX_RANGE_PX = 64;

/**
 * Offer: "See it before you pay", docs/DESIGN-SPEC.md section 5, copy used verbatim. A
 * full-bleed band: the section carries no horizontal padding of its own so texture-refraction.png
 * can run edge to edge, with the copy sitting on a translucent glass panel, the same material
 * as the nav bar. Colour lives on that solid-enough layer rather than the translucent foreground,
 * per the apple-design skill's vibrancy guidance, so legibility never depends on what the image
 * happens to be doing behind it.
 *
 * The texture drifts on a scroll-linked parallax, useScrollProgress (rAF + getBoundingClientRect,
 * never a scroll listener, section 4.3), not a spring: this is direct manipulation of a value
 * that already tracks scroll 1:1, so springing it would only add lag. Under prefers-reduced-motion
 * the image sits still.
 */
export function Offer() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const progress = useScrollProgress(sectionRef);

  const parallaxStyle = reduced
    ? {}
    : { transform: `translate3d(0, ${(progress - 0.5) * PARALLAX_RANGE_PX}px, 0)` };

  return (
    <section
      ref={sectionRef}
      id="offer"
      aria-label="Offer"
      className="relative isolate overflow-hidden bg-surface py-24 sm:py-32"
    >
      <Image
        src="/brand/texture-refraction.png"
        alt=""
        width={1600}
        height={1200}
        sizes="100vw"
        className="pointer-events-none absolute inset-x-0 -top-[12%] z-0 h-[124%] w-full select-none object-cover opacity-50 will-change-transform"
        style={parallaxStyle}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, var(--color-void) 0%, transparent 30%, transparent 70%, var(--color-void) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8">
        <div
          className="flex flex-col items-start gap-8 rounded-3xl border border-line p-8 sm:p-12"
          style={{
            background: "rgba(15, 17, 22, 0.72)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <Reveal className="flex flex-col gap-6">
            <h2 className="font-mono text-label uppercase text-text-2">The offer</h2>
            <p className="text-h2 text-text">See it before you pay.</p>
            <p className="max-w-xl text-body text-text-2">
              Tell me about your business and I will design and build your homepage first. Look
              at it on your own phone, show it to whoever you trust, and if it is not right you
              owe nothing and you walk away. No deposit, no contract to sign before you have seen
              something real.
            </p>
          </Reveal>

          <Magnetic
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-7 text-body font-medium text-void"
          >
            Claim a free mockup
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
