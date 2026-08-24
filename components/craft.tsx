"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
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

/** The six "what you get" items, docs/DESIGN-SPEC.md section 5, copy used verbatim. */
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

// Deliberately more pronounced than the generic Reveal used elsewhere on the page: a longer step
// between items and real horizontal travel, so the arrival reads as a sequence you can follow
// rather than a group fading in together.
const STAGGER_MS = 110;
const TRAVEL_PX = 56;
const ENTRANCE_SPRING = { damping: 1, response: 0.65 }; // critically damped: an entrance, not a gesture

interface CraftItemProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
  index: number;
}

/**
 * One "what you get" item. No panel, no border, no fill: open space and the type doing the work,
 * per the repeated feedback that the card grid read as boxy. In place of a surface, the entrance
 * itself carries the choreography, alternating in from the left and right by grid column parity
 * (even index from the left, odd from the right) so the six items arrive as a visible left-right
 * cascade rather than the plain fade the generic Reveal gives everywhere else on the page.
 */
function CraftItem({ icon: Icon, title, body, index }: CraftItemProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const fromLeft = index % 2 === 0;

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setVisible(true), index * STAGGER_MS);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [index, visible]);

  // A single spring drives entrance progress (0..1); opacity and the horizontal travel are both
  // derived from it, so the fade and the slide resolve together rather than needing two springs
  // kept in sync by hand.
  const progress = useSpring(visible ? 1 : 0, { ...ENTRANCE_SPRING, immediate: reduced });

  const style: CSSProperties = reduced
    ? { opacity: visible ? 1 : 0, transition: "opacity 300ms ease" }
    : {
        opacity: progress.value,
        transform: `translateX(${(1 - progress.value) * (fromLeft ? -TRAVEL_PX : TRAVEL_PX)}px)`,
      };

  return (
    <div ref={ref} style={style} className="flex flex-col gap-4">
      <Icon className="h-6 w-6 shrink-0 text-accent" />
      <h3 className="text-h3 text-text">{title}</h3>
      <p className="text-body text-text-2">{body}</p>
    </div>
  );
}

/**
 * Craft: the six "what you get" items, docs/DESIGN-SPEC.md section 5, copy used verbatim. The
 * heading uses the shared Reveal (plain rise and fade, correct for a single line of type); the
 * six items below choreograph their own alternating left/right entrance in CraftItem instead,
 * since a plain fade was repeatedly called out as not enough for a group this size.
 */
export function Craft() {
  return (
    <section id="craft" aria-label="What you get" className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <Reveal className="flex flex-col gap-4">
          <h2 className="font-mono text-label uppercase text-text-2">What you get</h2>
          <p className="max-w-xl text-lead text-text-2">
            Six things every HELIOS build starts from, whatever the business behind it.
          </p>
        </Reveal>

        <div className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card, index) => (
            <CraftItem key={card.title} {...card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
