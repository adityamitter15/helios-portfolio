"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

/**
 * ScrollRevealText, docs/DESIGN-SPEC-V2.md section 6.1: a statement that condenses into focus as
 * the block scrolls up through the viewport. Deliberately not subtle. Per word, four channels
 * resolve together off the same scroll progress: colour warms from muted to full ink, blur clears
 * from about 8px to 0, scale settles from about 0.94 to 1, and the word rises about 10px into
 * place. Driving all four off one progress value is what makes the sentence read as condensing
 * into focus rather than four separate effects layered on top of each other.
 *
 * Technique from the motion-library skill's scroll-reveal text (there, a single colour channel),
 * extended here to the full four-channel drive the spec calls for.
 *
 * Scroll-position driven only, no pin, no hijack. Under prefers-reduced-motion the whole statement
 * is a single plain cross-fade in, fully legible, no blur at any point.
 */

// Mirror --color-text-2 and --color-text from app/globals.css. useTransform needs concrete colour
// values to interpolate between (a CSS custom property string can't be tweened), so these are
// pinned here rather than read live. Keep in sync with globals.css if the tokens ever change.
const COLOR_MUTED = "#8a99bd"; // muted start, 3.6:1 on white: faint but never illegible
const COLOR_FULL = "#0a1a33"; // --color-text, 17.4:1 on white

const BLUR_START = "blur(5px)";
const BLUR_END = "blur(0px)";
const SCALE_START = 0.94;
const SCALE_END = 1;
const RISE_START = 10;
const RISE_END = 0;

interface ScrollRevealTextProps {
  text: string;
  /** Words rendered in Instrument Serif italic (matched case-insensitively, punctuation-stripped). */
  accentWords?: string[];
  className?: string;
}

export function ScrollRevealText({ text, accentWords = [], className }: ScrollRevealTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const accent = new Set(accentWords.map((w) => w.toLowerCase()));

  // Called unconditionally so hook order never depends on the reduced-motion branch below.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.32"],
  });

  if (reduced) {
    return (
      <motion.p
        ref={ref}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-72px" }}
        transition={{ duration: 0.6 }}
        className={className}
      >
        {words.map((word, i) => {
          const isAccent = accent.has(word.replace(/[.,]/g, "").toLowerCase());
          return (
            <span key={i} className={isAccent ? "font-serif-italic text-text" : undefined}>
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </motion.p>
    );
  }

  return (
    <p ref={ref} className={className}>
      {/* Screen readers get the statement as one clean sentence; the animated word spans (faint
          and blurred until scrolled) are hidden from assistive tech. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          const isAccent = accent.has(word.replace(/[.,]/g, "").toLowerCase());
          return (
            <RevealWord key={i} progress={scrollYProgress} range={[start, end]} accent={isAccent}>
              {word}
            </RevealWord>
          );
        })}
      </span>
    </p>
  );
}

function RevealWord({
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
  const filter = useTransform(progress, range, [BLUR_START, BLUR_END]);
  const scale = useTransform(progress, range, [SCALE_START, SCALE_END]);
  const y = useTransform(progress, range, [RISE_START, RISE_END]);

  return (
    <span className="relative mr-[0.28em] inline-block">
      <motion.span
        style={{ color, filter, scale, y }}
        className={accent ? "font-serif-italic inline-block" : "inline-block"}
      >
        {children}
      </motion.span>
    </span>
  );
}
