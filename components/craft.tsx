"use client";

import {
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
  type SVGProps,
} from "react";
import {
  BoltIcon,
  KeyIcon,
  MapPinIcon,
  PencilIcon,
  SmartphoneIcon,
  TapIcon,
} from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { useSpring } from "@/lib/motion/use-spring";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

/** The six "what you get" cards, docs/DESIGN-SPEC.md section 5, copy used verbatim. */
const CARDS: { icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; body: string }[] = [
  {
    icon: PencilIcon,
    title: "Drawn for you, not picked off a shelf.",
    body: "No templates and no page builders. Your site is designed around your business, your work and the way your customers actually buy.",
  },
  {
    icon: SmartphoneIcon,
    title: "Phone first, always.",
    body: "Most people will meet your business on a phone, so that is where the design starts and where it is tested, on real handsets rather than a laptop window.",
  },
  {
    icon: MapPinIcon,
    title: "Built to be found.",
    body: "Local area pages, structured data, sitemaps and a Google Business Profile wired in from day one, so you appear when someone nearby is searching.",
  },
  {
    icon: TapIcon,
    title: "One tap to reach you.",
    body: "WhatsApp, a phone call and directions sit within reach on every screen. An interested visitor should never have to go looking for you.",
  },
  {
    icon: BoltIcon,
    title: "Quick, even on a bad signal.",
    body: "Pages are built static and images compressed properly, so the site opens on a mid-range phone on mobile data rather than only on fast broadband.",
  },
  {
    icon: KeyIcon,
    title: "Yours to keep.",
    body: "Your domain, your hosting account, your content. Nothing is held hostage, and you are free to take it elsewhere whenever you like.",
  },
];

// Press feels instant (damping 1, a short response), the release settles with a touch of life
// (damping 0.8) since it is the end of a gesture, not an appearance, per the apple-design skill.
const PRESS = { damping: 1, response: 0.15 };
const RELEASE = { damping: 0.8, response: 0.3 };

function CraftCard({ icon: Icon, title, body }: (typeof CARDS)[number]) {
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
      className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6 sm:p-7"
    >
      <Icon className="h-6 w-6 shrink-0 text-accent" />
      <h3 className="text-h3 text-text">{title}</h3>
      <p className="text-body text-text-2">{body}</p>
    </div>
  );
}

/**
 * Craft: the six "what you get" cards, docs/DESIGN-SPEC.md section 5, copy used verbatim.
 * Staggered reveal via Reveal, plus a per-card press feedback spring that reacts on pointerdown
 * (section 4.2: "feedback on pointerdown, never on click"), even though the cards themselves
 * carry no link, purely as the tactile, physical affordance the apple-design skill asks for.
 */
export function Craft() {
  return (
    <section id="craft" aria-label="What you get" className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <Reveal className="flex flex-col gap-4">
          <h2 className="font-mono text-label uppercase text-text-2">What you get</h2>
          <p className="max-w-xl text-body text-text-2">
            Six things every HELIOS build starts from, whatever the business behind it.
          </p>
        </Reveal>

        <Reveal startIndex={2} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <CraftCard key={card.title} {...card} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
