import { ScrollRevealText } from "@/components/ui/scroll-reveal-text";

/**
 * Manifesto: the argument for why a real site matters, docs/DESIGN-SPEC-V2.md section 6.1.
 *
 * Rewritten away from the original fear pitch ("built once and left to rot... that stranger was a
 * customer"), which sold by telling the reader their business was already failing, and did it at
 * the largest type size on the page. The argument now opens by crediting the reader's work and
 * casts the site as the thing that lets that work be seen. The three-second beat is kept, because
 * a promise with no tension behind it has nothing to push against, but it is framed as the window
 * you get rather than as the customer you lost.
 *
 * "in its best light" deliberately does NOT appear here any more: it was promoted to the hero as
 * the studio's promise, and repeating it as the payoff of this section would spend the same line
 * twice. The Instrument Serif italic accent moves to "already good", which is the new claim.
 */
const STATEMENT =
  "Your work is already good. A site's only job is to let the person who needs it see that, in " +
  "the few seconds they give you, on the phone in their hand.";

const ACCENT_WORDS = ["already", "good"];

/**
 * The single most important animation on the page, docs/DESIGN-SPEC-V2.md section 6.1: the
 * statement condenses into focus, word by word, as the section scrolls up through the viewport.
 * All motion mechanics (the four reveal channels, the sr-only fallback, the reduced-motion
 * cross-fade) live in components/ui/scroll-reveal-text.tsx; this file owns only the copy and the
 * section shell.
 */
export function Manifesto() {
  return (
    <section id="manifesto" aria-label="Manifesto" className="px-6 pt-24 pb-16 sm:px-8 sm:pt-32 sm:pb-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h2 className="font-mono text-label uppercase text-text-2">What a site is for</h2>
        {/* Ceiling pulled down from 4.75rem. At that size the previous, longer statement filled a
            desktop viewport nine lines deep and read as a wall being shouted at you rather than as
            a considered claim. */}
        <ScrollRevealText
          text={STATEMENT}
          accentWords={ACCENT_WORDS}
          className="text-[clamp(1.75rem,5vw,3.75rem)] font-medium leading-[1.1] tracking-[-0.025em] text-text"
        />
      </div>
    </section>
  );
}
