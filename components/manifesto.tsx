"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

// Mirror --color-text-2 and --color-text from app/globals.css. motion's useTransform needs
// concrete colour values to interpolate between (a CSS custom property string can't be tweened),
// so these are pinned here rather than read live. Keep in sync with globals.css if the tokens
// ever change; do not introduce a third value anywhere else in this file.
const COLOR_MUTED = "#949CB0"; // --color-text-2
const COLOR_FULL = "#F2F4F8"; // --color-text

const STATEMENT =
  "Most small business sites are built once and left to rot. A stranger lands, waits for it " +
  "to load, cannot tell what you do or how to reach you, and leaves. That stranger was a " +
  "customer. HELIOS exists to stop that: real design, phone first, fast on a bad signal, " +
  "built to put your business in its best light.";

const ACCENT_WORDS = new Set(["in", "its", "best", "light."]);

/**
 * Manifesto: the argument for why a real site matters, docs/DESIGN-SPEC.md section 5. Word by
 * word scroll-linked reveal, each word warming from --text-2 to --text as the block passes up
 * through the viewport (section 4.3.2). Technique from the motion-library skill's
 * ScrollRevealText, adapted to warm colour rather than opacity, and to read the project's own
 * useReducedMotion instead of a duplicate hook.
 *
 * Scroll-position driven only, no pin, no hijack. Under prefers-reduced-motion the whole
 * statement is a single plain cross-fade in, per section 4.4.
 */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const words = STATEMENT.split(" ");

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.32"],
  });

  return (
    <section id="manifesto" aria-label="Manifesto" className="px-6 pt-24 pb-16 sm:px-8 sm:pt-32 sm:pb-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h2 className="font-mono text-label uppercase text-text-2">Why this matters</h2>

        {reduced ? (
          <motion.p
            ref={ref}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-72px" }}
            transition={{ duration: 0.6 }}
            className="text-[clamp(1.55rem,5.2vw,3.75rem)] font-medium leading-[1.12] tracking-[-0.02em] text-text"
          >
            {words.map((word, i) => {
              const isAccent = ACCENT_WORDS.has(word.toLowerCase());
              return (
                <span key={i} className={isAccent ? "font-serif-italic text-text" : undefined}>
                  {word}
                  {i < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </motion.p>
        ) : (
          <p
            ref={ref}
            className="text-[clamp(1.55rem,5.2vw,3.75rem)] font-medium leading-[1.12] tracking-[-0.02em]"
          >
            {/* Screen readers get the statement as one clean sentence; the animated word spans
                (faint until scrolled) are hidden from assistive tech. */}
            <span className="sr-only">{STATEMENT}</span>
            <span aria-hidden="true">
              {words.map((word, i) => {
                const start = i / words.length;
                const end = start + 1 / words.length;
                const isAccent = ACCENT_WORDS.has(word.toLowerCase());
                return (
                  <ManifestoWord key={i} progress={scrollYProgress} range={[start, end]} accent={isAccent}>
                    {word}
                  </ManifestoWord>
                );
              })}
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

function ManifestoWord({
  children,
  progress,
  range,
  accent,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  accent: boolean;
}) {
  const color = useTransform(progress, range, [COLOR_MUTED, COLOR_FULL]);
  return (
    <span className="relative mr-[0.28em] inline-block">
      <motion.span style={{ color }} className={accent ? "font-serif-italic" : undefined}>
        {children}
      </motion.span>
    </span>
  );
}
