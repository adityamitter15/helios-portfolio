"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChromeRule } from "@/components/ui/chrome-rule";
import { Glass } from "@/components/ui/glass";
import { Reveal } from "@/components/ui/reveal";
import { useSpring } from "@/lib/motion/use-spring";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

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

// Press feels instant (damping 1, a short response), the release settles with a touch of life
// (damping 0.8) since it is the end of a gesture, not an appearance, per the apple-design skill.
// Mirrors components/craft.tsx so the two staggered card grids feel like the same material.
const PRESS = { damping: 1, response: 0.15 };
const RELEASE = { damping: 0.8, response: 0.3 };

function ProcessStep({ number, title, body }: (typeof STEPS)[number]) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const scale = useSpring(pressed ? 0.97 : 1, { ...(pressed ? PRESS : RELEASE), immediate: reduced });

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    setPressed(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerUp = () => setPressed(false);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={reduced ? undefined : { transform: `scale(${scale.value})`, willChange: "transform" }}
      className="h-full"
    >
      <Glass className="flex h-full flex-col gap-4 p-6 sm:p-7">
        <span className="chrome-text font-mono text-h3">{number}</span>
        <ChromeRule className="w-10" />
        <h3 className="text-h3 text-text">{title}</h3>
        <p className="text-body text-text-2">{body}</p>
      </Glass>
    </div>
  );
}

/**
 * Process: three steps, docs/DESIGN-SPEC.md section 5. Each step is now a liquid glass card
 * (docs/DESIGN-SPEC-V2.md section 1) rather than a bare text block, with the same pointerdown
 * press feedback as components/craft.tsx (section 6.2: "staggered entrance, press feedback on
 * pointerdown at scale 0.97"). Reveal owns the staggered entrance itself (damping 1.0, 60ms
 * between children); this component is a client component now purely because that press spring
 * needs one.
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

        <Reveal startIndex={2} className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <ProcessStep key={step.number} {...step} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
