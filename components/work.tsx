"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { Glass } from "@/components/ui/glass";
import { Reveal } from "@/components/ui/reveal";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

/** The four live client projects, real copy from docs/DESIGN-SPEC.md section 5, used verbatim. */
const PROJECTS = [
  {
    name: "OneUnity Bathrooms",
    domain: "oneunitybathrooms.co.uk",
    href: "https://oneunitybathrooms.co.uk",
    slug: "oneunity",
    description:
      "Bespoke bathroom design and installation across London and Reading. An after-hours " +
      "emergency line that appears by itself once evening comes, call and WhatsApp within " +
      "reach on every screen, and twenty-two area pages so the firm turns up when someone " +
      "nearby searches.",
    tags: ["Design and build", "Local search", "Lead capture", "Own domain"],
  },
  {
    name: "AGW Bathrooms",
    domain: "agwbathroomsltd.co.uk",
    href: "https://agwbathroomsltd.co.uk",
    slug: "agw",
    description:
      "A luxury showroom in Colindale, put online without becoming a shop. A hundred and " +
      "twenty-six real products across twelve ranges, filterable galleries, sizes and finishes " +
      "on every card, and an enquiry that opens WhatsApp already knowing which piece you were " +
      "looking at.",
    tags: ["126-product catalogue", "Galleries", "Showroom visits", "Own domain"],
  },
  {
    name: "by SEEMA",
    domain: "byseema.in",
    href: "https://byseema.in",
    slug: "seema",
    description:
      "A luxury atelier where no two pieces are alike. There is deliberately no checkout: you " +
      "build a selection, then enquire or reserve over WhatsApp, because a cart implies a " +
      "second one exists. Chikankari, gota patti, zardozi, jamdani and patola, each " +
      "photographed as a single piece.",
    tags: ["Catalogue", "WhatsApp reserve", "No checkout", "Own domain"],
  },
  {
    name: "Daigaku Karate Kai",
    domain: "dkk-karate-london-b9f74.web.app",
    href: "https://dkk-karate-london-b9f74.web.app",
    slug: "dkk",
    description:
      "One of the strongest Okinawan Goju Ryu clubs in the country, rebuilt from the ground " +
      "up. A thirty-three name black belt register with a page for every member, class times, " +
      "the club's written history, and decades of archive photography finally given somewhere " +
      "to live.",
    tags: ["Member register", "Archive gallery", "Club history", "Static and fast"],
  },
];

const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Work: the four client projects, docs/DESIGN-SPEC.md section 5. Pinned horizontal scrub on
 * desktop (section 4.3.3), driven by GSAP ScrollTrigger; a plain vertical stack everywhere else,
 * including under prefers-reduced-motion, where no pin or scrub runs at all (section 4.4).
 *
 * One DOM shape serves both layouts: the track is a column on narrow screens and a row from
 * lg up (Tailwind `flex-col lg:flex-row`), so GSAP only ever needs to add a transform on top of
 * a layout that already works without it.
 */
export function Work() {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    // No pin, no scrub under reduced motion, section 4.4: the effect simply never registers
    // ScrollTrigger, and the track stays the plain flex layout Tailwind already lays out.
    if (reduced) return;
    const pinEl = pinRef.current;
    const trackEl = trackRef.current;
    if (!pinEl || !trackEl) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add(DESKTOP_QUERY, () => {
      // Depth: each card scales up and sits flush as it nears the centre of the pinned viewport,
      // then shrinks, dims and drops slightly as it is carried away in either direction, docs/
      // DESIGN-SPEC-V2.md section 6.2. Read as its own outer wrapper rather than the Glass pane
      // itself, since components/ui/glass.tsx keeps its DOM node private (no forwarded ref) and
      // this effect needs a real element to measure and transform.
      const cardEls = Array.from(trackEl.querySelectorAll<HTMLElement>("[data-work-card]"));

      // The scrub has to travel far enough that the LAST card can reach the centre of the pinned
      // viewport, the same moment every other card gets on its way past. Using the track's raw
      // overflow (scrollWidth - clientWidth) stops short of that: the track only travels until
      // its trailing edge, including the row's own right padding, reaches the viewport's edge,
      // which left the last card's centre sitting well right of the pin's centre at the end of
      // the scroll. That card could never reach norm 0 in updateDepth below, so it stayed dimmed
      // and slightly shrunk instead of fully revealed, the "DKK does not reveal properly" defect.
      // Measuring the last card's own layout offset, which stays constant regardless of the
      // transform GSAP drives on trackEl, and solving directly for the scroll distance that
      // centres it fixes this for any viewport width rather than one particular width.
      const LAST_CARD_BUFFER_PX = 48; // a little scroll to spare past dead centre, not the exact edge
      const getScrollDistance = () => {
        const overflowDistance = Math.max(0, trackEl.scrollWidth - pinEl.clientWidth);
        const lastCard = cardEls[cardEls.length - 1];
        if (!lastCard) return overflowDistance;
        const lastCardCenter = lastCard.offsetLeft + lastCard.offsetWidth / 2;
        const centerDistance = lastCardCenter - pinEl.clientWidth / 2 + LAST_CARD_BUFFER_PX;
        return Math.max(overflowDistance, centerDistance);
      };

      const updateDepth = () => {
        const pinRect = pinEl.getBoundingClientRect();
        const centerX = pinRect.left + pinRect.width / 2;
        for (const card of cardEls) {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const norm = Math.min(1, Math.abs(cardCenter - centerX) / (pinRect.width * 0.55));
          gsap.set(card, {
            scale: 1 - norm * 0.14,
            y: norm * 22,
            opacity: 1 - norm * 0.3,
            transformOrigin: "center center",
          });
        }
      };

      updateDepth();

      const tween = gsap.to(trackEl, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: pinEl,
          start: "top top",
          end: () => `+=${getScrollDistance()}`,
          scrub: true,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: updateDepth,
          onRefresh: updateDepth,
        },
      });

      // gsap.matchMedia reverts everything created in this callback automatically once the
      // query stops matching or the context is reverted, but the tween, its ScrollTrigger and
      // the per-card transforms driven imperatively from onUpdate still need clearing explicitly.
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(cardEls, { clearProps: "all" });
      };
    });

    return () => mm.revert();
  }, [reduced]);

  return (
    <section id="work" aria-label="Work" className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <Reveal className="flex flex-col gap-4">
          <h2 className="font-mono text-label uppercase text-text-2">Work</h2>
          <p className="max-w-xl text-lead text-text-2">
            Four businesses, four live sites, real screenshots from the real thing. Every one
            is a link you can open right now.
          </p>
        </Reveal>
      </div>

      <div ref={pinRef} className="relative mt-12 lg:h-screen lg:overflow-hidden">
        <div
          ref={trackRef}
          className="mx-auto flex max-w-6xl flex-col gap-10 px-0 sm:px-0 lg:h-full lg:flex-row lg:items-center lg:gap-8 lg:pl-6 lg:pr-24 lg:will-change-transform"
        >
          {PROJECTS.map((project) => (
            <div
              key={project.slug}
              data-work-card
              className="flex w-full shrink-0 lg:w-[min(78vw,760px)] lg:will-change-transform"
            >
              <Glass
                as="article"
                className="flex w-full flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8"
                style={{
                  // Lighter than the default glass-pane fill and drop shadow (docs/RESUME.md
                  // "boxes everywhere"): these are genuinely discrete objects, four separate
                  // sites, so a surface earns its place here, it just should not read as heavy
                  // as a generic card. Tokens throughout, not literals, so this stays correct
                  // across a theme change instead of rotting like the hardcoded hex already
                  // found once in this codebase.
                  background: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
                  boxShadow:
                    "0 1px 0 0 color-mix(in srgb, var(--color-void) 92%, transparent) inset, " +
                    "0 10px 24px -20px color-mix(in srgb, var(--color-text) 16%, transparent)",
                }}
              >
                <picture className="block w-full overflow-hidden rounded-2xl border border-line bg-void lg:w-[280px] lg:shrink-0">
                  <source media="(min-width: 700px)" srcSet={`/work/d-${project.slug}.jpg`} />
                  <img
                    src={`/work/m-${project.slug}.jpg`}
                    alt={`${project.name} homepage screenshot`}
                    width={585}
                    height={1266}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[585/1266] h-auto w-full object-cover lg:aspect-[1440/900]"
                  />
                </picture>

                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-h3 text-text">{project.name}</h3>
                    <p className="font-mono text-sm text-text-2">{project.domain}</p>
                  </div>

                  <p className="text-body text-text-2">{project.description}</p>

                  <ul className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-line px-3 py-1 font-mono text-xs uppercase tracking-wide text-text-2"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line px-5 text-body font-medium text-text transition-colors hover:border-accent hover:text-accent active:border-accent active:text-accent"
                  >
                    Visit the live site
                    <ArrowUpRightIcon className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-0.5 group-active:-translate-y-0.5" />
                  </a>
                </div>
              </Glass>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
