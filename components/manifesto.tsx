import { ScrollRevealText } from "@/components/ui/scroll-reveal-text";

/**
 * Manifesto: the argument for why a real site matters, docs/DESIGN-SPEC-V2.md section 6.1.
 * Copy is exact, no rewording. "in its best light" keeps the Instrument Serif italic treatment.
 */
const STATEMENT =
  "Most small business sites are built once and left to rot. A stranger lands, cannot tell what " +
  "you do, and leaves. That stranger was a customer. I build sites that put your business in its " +
  "best light.";

const ACCENT_WORDS = ["in", "its", "best", "light"];

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
        <h2 className="font-mono text-label uppercase text-text-2">Why this matters</h2>
        <ScrollRevealText
          text={STATEMENT}
          accentWords={ACCENT_WORDS}
          className="text-[clamp(1.75rem,5.8vw,4.75rem)] font-medium leading-[1.08] tracking-[-0.025em] text-text"
        />
      </div>
    </section>
  );
}
