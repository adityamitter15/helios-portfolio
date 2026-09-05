"use client";

import { useRef } from "react";
import { Glass } from "@/components/ui/glass";
import { Magnetic } from "@/components/ui/magnetic";
import { Reveal } from "@/components/ui/reveal";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { useScrollProgress } from "@/lib/motion/use-scroll-progress";
import { WHATSAPP_HREF } from "@/lib/contact";

const PARALLAX_RANGE_PX = 64;

// The aurora field for this band, docs/DESIGN-SPEC-V2.md section 8.
//
// This was /brand/texture-aurora.png, and its own comment recorded that it replaced an earlier
// render which "reads as a grey smudge here" once the ground changed underneath it. The same thing
// then happened again: that file is a saturated dark cobalt texture picked for the cobalt theme,
// the ground is now white, and holding a dark render at 0.22 opacity over white desaturates it
// toward grey rather than lightening it. Twice is a pattern, and the pattern is that a raster
// cannot follow the palette.
//
// So it is composed from --color-bloom-* instead. It is light-on-white by construction, it moves
// with the theme, there is no raster boundary left to feather away, and the band no longer ships
// 1.8MB to draw a blur.
const TEXTURE_LAYERS = [
  "radial-gradient(46% 58% at 24% 34%, var(--color-bloom-a) 0%, transparent 66%)",
  "radial-gradient(54% 62% at 72% 30%, var(--color-bloom-b) 0%, transparent 64%)",
  "radial-gradient(50% 56% at 52% 78%, var(--color-bloom-c) 0%, transparent 68%)",
].join(", ");

// Kept: the band still feathers at its edges so the field ends in air rather than at a rectangle.
const TEXTURE_MASK =
  "radial-gradient(ellipse 75% 65% at 50% 42%, #000 40%, rgba(0, 0, 0, 0.35) 68%, transparent 88%)";

/**
 * Offer: "See it before you pay", docs/DESIGN-SPEC.md section 5, copy used verbatim. A
 * full-bleed band: the section carries no horizontal padding of its own so the texture render
 * can run edge to edge, with the copy sitting on the site's liquid glass panel (components/ui/
 * glass.tsx, docs/DESIGN-SPEC-V2.md section 3) rather than a hand-rolled translucent box, so the
 * offer reads as the same material as every other card on the page.
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-[12%] z-0 h-[124%] w-full select-none will-change-transform"
        style={{
          backgroundImage: TEXTURE_LAYERS,
          opacity: 0.62,
          maskImage: TEXTURE_MASK,
          WebkitMaskImage: TEXTURE_MASK,
          ...parallaxStyle,
        }}
      />
      {/* The aurora render's brightest blooms are genuinely bright, and the offer copy sits
          directly on top of this band, so unlike a purely decorative backdrop this overlay cannot
          fade to transparent in the middle: it keeps a constant, deliberate wash of --color-void
          under the glass panel's whole footprint (not just its top and bottom edges) so the
          panel's blur never has a near-white bloom to sample straight through. Darkening this
          layer, not the text tokens, is how contrast stays correct: those are already verified
          against --color-void in docs/DESIGN-SPEC-V2.md section 2 and must not change. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, var(--color-void) 0%, color-mix(in srgb, var(--color-void) 68%, transparent) 22%, color-mix(in srgb, var(--color-void) 68%, transparent) 78%, var(--color-void) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8">
        <Glass
          className="flex flex-col items-start gap-8 p-8 sm:p-12"
          style={{
            // Lighter than the default glass-pane fill and drop shadow (docs/RESUME.md "boxes
            // everywhere"): this panel earns its place as the single CTA surface on the page, it
            // just should not read as heavy as the six-card grids that prompted the complaint.
            // Tokens throughout, never literals, so it stays correct across a theme change.
            background: "color-mix(in srgb, var(--color-surface) 78%, transparent)",
            boxShadow:
              "0 1px 0 0 color-mix(in srgb, var(--color-void) 92%, transparent) inset, " +
              "0 10px 24px -20px color-mix(in srgb, var(--color-text) 16%, transparent)",
          }}
        >
          <Reveal className="flex flex-col gap-6">
            <h2 className="font-mono text-label uppercase text-text-2">The offer</h2>
            <p className="text-h2 text-text">See it before you pay.</p>
            <p className="max-w-xl text-lead text-text-2">
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
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent-hi px-7 text-body font-medium text-void"
          >
            Claim a free mockup
          </Magnetic>
        </Glass>
      </div>
    </section>
  );
}
