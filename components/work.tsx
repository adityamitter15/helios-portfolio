"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/coverflow-carousel";
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
    tint: "#1f4d5c",
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
    tint: "#7a5a1e",
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
    tint: "#7b2450",
    description:
      "A luxury atelier where no two pieces are alike. There is deliberately no checkout: you " +
      "build a selection, then enquire or reserve over WhatsApp, because a cart implies a " +
      "second one exists. Chikankari, gota patti, zardozi, jamdani and patola, each " +
      "photographed as a single piece.",
    tags: ["Catalogue", "WhatsApp reserve", "No checkout", "Own domain"],
  },
  {
    name: "Daigaku Karate Kai",
    domain: "goju-karate.co.uk",
    href: "https://goju-karate.co.uk",
    slug: "dkk",
    tint: "#7a2320",
    description:
      "The oldest sports club at the University of Westminster, training continuously since " +
      "1990, rebuilt from the ground up. A thirty-three name black belt register with a page " +
      "for every member, a fight record of sixteen wins from the club's first twenty " +
      "professional cage fights, the written history from Okinawa to Regent Street, and " +
      "decades of archive photography finally given somewhere to live.",
    tags: ["Member register", "Fight record", "Archive gallery", "Own domain"],
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
/**
 * Cards for the coverflow, derived from PROJECTS rather than restated: a second hand-written list
 * is a second place for a domain or a filename to go stale.
 *
 * The four projects, laid round the ring three times over. The carousel hides any card more than
 * half a turn away, so the ring's length is what decides how many cards are on screen at once: at
 * four there are about three, which reads as a flat row with one neighbour either side. Twelve
 * fills the frame edge to edge and never shows you the end of it, which is the whole point of the
 * effect. Repeating is not padding here, it is the mechanism -- the same four sites keep coming
 * back round, exactly as they would on a carousel with no end.
 */
const CAROUSEL_TURNS = 3;

const COVERFLOW_SLIDES: CoverflowSlide[] = Array.from({ length: CAROUSEL_TURNS }).flatMap(() =>
  PROJECTS.map((project) => ({
    src: `/work/d-${project.slug}.jpg`,
    alt: `${project.name} homepage`,
    title: project.name,
    subtitle: project.domain,
    tint: project.tint,
    href: project.href,
  })),
);

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

      {/* Below lg the four sites are browsed in the coverflow rather than laid out in a two-up
          grid. The grid was itself a fix for stacked full-width cards costing four viewports of
          scrolling, and it says so in the note on the track below; it solved the scrolling but
          left four screenshots at roughly a thumbnail each. The coverflow gives the whole width
          to whichever site is being looked at and keeps the others legible either side of it,
          which is the comparison this section exists to support.

          The desktop pinned track is untouched. It only initialises inside DESKTOP_QUERY (see the
          effect above), so hiding its container below lg cannot interfere with the pin. */}
      <div className="mt-12 lg:hidden">
        {/* Close to the registry's own defaults for rotate, depth, falloff and gap, because those
            numbers are what produce the rake.

            The aspect is NOT the registry's square, though. These are 1440x900 screenshots, and a
            square card crops 37% of the width off every one of them: the nav loses its right-hand
            end, centred hero type stops being centred, and a page built to be looked at wide gets
            shown as a tall slice of itself. Square suits the album art the component was written
            for and actively misrepresents a website. At 16:10 the card is the crop -- nothing is
            cut at all -- and it reads as a browser window, which is the thing being sold. */}
        <CoverflowCarousel
          slides={COVERFLOW_SLIDES}
          aspectRatio={1440 / 900}
          cardWidth="clamp(196px, 52vw, 340px)"
          autoplayMs={2600}
          scrollSpeed={1.6}
          showCaption
          label="Client sites"
        />
      </div>

      <div ref={pinRef} className="relative mt-12 hidden lg:block lg:h-screen lg:overflow-hidden">
        <div
          ref={trackRef}
          /* Phones and tablets get a two-up grid; desktop keeps the pinned horizontal track.
             Stacked full-width cards meant four screenshots at roughly a phone screen each, so the
             section was about four viewports of scrolling to see four sites — the one place on the
             page where a visitor most wants to compare at a glance. A grid shows all four at once.
             The GSAP track only ever initialises inside DESKTOP_QUERY, so grid at these widths
             cannot interfere with the pin, and the flex row is restored from lg upward. */
          className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-0 sm:gap-5 lg:flex lg:h-full lg:max-w-6xl lg:flex-row lg:items-center lg:gap-8 lg:pl-6 lg:pr-24 lg:will-change-transform"
        >
          {PROJECTS.map((project) => (
            <div
              key={project.slug}
              data-work-card
              className="flex w-full shrink-0 lg:w-[min(78vw,760px)] lg:will-change-transform"
            >
              <Glass
                as="article"
                className="flex w-full flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:items-center lg:gap-8 lg:p-6"
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
                    /* In the grid the full 585x1266 phone crop would make each tile taller than
                       the viewport again, which is the problem the grid exists to solve. Anchored
                       to the top so the tile shows the part of a homepage that identifies it. */
                    className="aspect-[3/4] h-auto w-full object-cover object-top lg:aspect-[1440/900]"
                  />
                </picture>

                <div className="flex flex-1 flex-col gap-2 lg:gap-4">
                  <div className="flex flex-col gap-0.5 lg:gap-1">
                    <h3 className="text-base font-medium leading-snug text-text sm:text-lg lg:text-h3">
                      {project.name}
                    </h3>
                    <p className="truncate font-mono text-xs text-text-2 lg:text-sm">
                      {project.domain}
                    </p>
                  </div>

                  {/* Description, tags and the button are the detail view. In a two-up grid they
                      would push each tile back to full height and undo the grid entirely, so below
                      lg the tile is the screenshot, the name and the domain, and the whole tile is
                      the link instead. */}
                  <p className="hidden text-body text-text-2 lg:block">{project.description}</p>

                  <ul className="hidden flex-wrap gap-2 lg:flex">
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
                    /* Keeps min-h-11 at every width so the tap target stays at the 44px floor even
                       when the tile is half a phone wide; the pill chrome and the longer label are
                       what drop away in the grid, not the target. */
                    className="group inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-accent transition-colors lg:mt-2 lg:gap-2 lg:rounded-full lg:border lg:border-line lg:px-5 lg:text-body lg:text-text lg:hover:border-accent lg:hover:text-accent lg:active:border-accent lg:active:text-accent"
                  >
                    <span className="lg:hidden">Visit</span>
                    <span className="hidden lg:inline">Visit the live site</span>
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
