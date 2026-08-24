import { ChromeRule } from "@/components/ui/chrome-rule";
import { Reveal } from "@/components/ui/reveal";

/** Three steps, start to finish. Mirrors the offer copy in docs/DESIGN-SPEC.md section 5:
 *  mockup first, no deposit, own domain at the end. */
const STEPS = [
  {
    number: "01",
    title: "Tell me about your business",
    body: "A short call or a WhatsApp message: what you do, who your customers are, and what is not working on your site now, if you have one at all.",
  },
  {
    number: "02",
    title: "See your homepage first",
    body: "I design and build the homepage before you commit to anything, so you are judging something real on your own phone, not a plan on a slide.",
  },
  {
    number: "03",
    title: "Launch on your own domain",
    body: "Once you are happy, the rest of the site gets built out and put live on your own domain, in a hosting account that belongs to you.",
  },
];

function ProcessStep({ number, title, body }: (typeof STEPS)[number]) {
  return (
    <div className="flex flex-col gap-4">
      <span className="chrome-text font-mono text-h3">{number}</span>
      <ChromeRule className="w-10" />
      <h3 className="text-h3 text-text">{title}</h3>
      <p className="text-body text-text-2">{body}</p>
    </div>
  );
}

/**
 * Process: three steps, docs/DESIGN-SPEC.md section 5. Open space rather than a card grid, per
 * the repeated feedback that panelled cards read as boxy: each step is just its number, a short
 * chrome accent rule and the type, with no border or fill standing in for a container. Reveal
 * still owns the staggered entrance (damping 1.0, 60ms between children); nothing else here
 * needs client-side state, so this stays a server component.
 */
export function Process() {
  return (
    <section id="process" aria-label="Process" className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <Reveal className="flex flex-col gap-4">
          <h2 className="font-mono text-label uppercase text-text-2">Process</h2>
          <p className="max-w-xl text-lead text-text-2">
            Three steps, start to finish. No deposit before the second one.
          </p>
        </Reveal>

        <Reveal startIndex={2} className="grid gap-12 sm:grid-cols-3 sm:gap-10">
          {STEPS.map((step) => (
            <ProcessStep key={step.number} {...step} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
