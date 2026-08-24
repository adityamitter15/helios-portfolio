"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { useSpring } from "@/lib/motion/use-spring";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

// React warns if useLayoutEffect runs where there is no browser to lay anything out in (the
// server render pass); this is the standard isomorphic swap, effect-only on the client.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// An entrance, not a gesture: critically damped, per docs/DESIGN-SPEC.md section 4.1.
const SPRING = { damping: 1, response: 0.4 };

/** Objection handling, docs/DESIGN-SPEC.md section 5: cost and commitment, timeline, what
 *  happens if they do not like it, ownership, what they need to provide, life after launch. */
const FAQS = [
  {
    question: "What does the free mockup actually cost me?",
    answer:
      "Nothing, and there is no catch. I design and build your homepage first, before any money " +
      "or contract is involved. If you like it, we carry on. If you do not, you walk away and " +
      "owe nothing, no deposit either way.",
  },
  {
    question: "How long does the whole thing take?",
    answer:
      "The homepage mockup usually takes a few days once I understand your business. If you go " +
      "ahead, the rest of the site, area pages, galleries, whatever your business needs, is " +
      "usually finished within a couple of weeks, not months.",
  },
  {
    question: "What if I do not like what you come back with?",
    answer:
      "Then you say so and we stop there. The mockup stage exists so you are judging something " +
      "real rather than a promise. Nothing is owed, and nothing has been signed.",
  },
  {
    question: "Do I actually own the website afterwards?",
    answer:
      "Yes, entirely. It goes live on your own domain, in a hosting account that belongs to you, " +
      "not to me. You are free to hand it to another developer at any point, and nothing is held " +
      "back to stop you.",
  },
  {
    question: "What do you need from me to get started?",
    answer:
      "Not much: a short call or WhatsApp message about your business, a few photos if you have " +
      "them, and access to your domain if you already own one. Anything you do not have yet, we " +
      "work around.",
  },
  {
    question: "What happens once the site is live?",
    answer:
      "I stay reachable on WhatsApp for anything that needs fixing or changing. There is no " +
      "ongoing contract, so it is entirely up to you whether you want changes made later or " +
      "leave the site exactly as it launched.",
  },
];

function FaqItem({ question, answer }: (typeof FAQS)[number]) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [measured, setMeasured] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Measured once on mount and kept in sync with ResizeObserver, so the target height is ready
  // the moment the panel opens rather than lagging a frame behind. Also keeps the target correct
  // across breakpoints, since the fluid type scale changes the answer's wrapped height.
  useIsomorphicLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setMeasured((entry.target as HTMLElement).scrollHeight));
    setMeasured(el.scrollHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = useSpring(open ? measured : 0, { ...SPRING, immediate: reduced });
  const rotation = useSpring(open ? 180 : 0, { ...SPRING, immediate: reduced });

  return (
    <div className="border-b border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 w-full items-center justify-between gap-4 py-5 text-left text-h3 text-text"
        >
          <span>{question}</span>
          <ChevronDownIcon
            className="h-5 w-5 shrink-0 text-text-2"
            style={{ transform: `rotate(${rotation.value}deg)` }}
          />
        </button>
      </h3>
      <div
        id={panelId}
        inert={!open}
        style={{ height: reduced ? (open ? "auto" : 0) : height.value, overflow: "hidden" }}
      >
        <div ref={contentRef} className="max-w-2xl pb-6 pr-8 text-body text-text-2">
          {answer}
        </div>
      </div>
    </div>
  );
}

/**
 * FAQ: objection handling, docs/DESIGN-SPEC.md section 5. A disclosure pattern (WAI-ARIA APG
 * accordion: heading, button[aria-expanded][aria-controls], panel referenced by id), animated
 * with a spring on measured pixel height rather than the native <details> element, since a real
 * spring needs a numeric target to integrate toward. `inert` takes the closed panel out of the
 * tab order and the accessibility tree entirely, the same technique components/nav.tsx uses for
 * its own hidden state.
 */
export function Faq() {
  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      className="px-6 pt-16 pb-24 sm:px-8 sm:pt-20 sm:pb-32"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <Reveal className="flex flex-col gap-4">
          <h2 className="font-mono text-label uppercase text-text-2">Questions</h2>
          <p className="max-w-xl text-body text-text-2">
            The things people usually want settled before they get in touch.
          </p>
        </Reveal>

        <Reveal startIndex={2} className="flex flex-col">
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
