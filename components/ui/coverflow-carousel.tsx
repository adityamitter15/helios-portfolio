"use client";

import * as React from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Coverflow: a ring of cards raked away from the centre in 3D, draggable, keyboard-steerable and
 * looping without cloning a single node.
 *
 * Adapted from the 21st.dev registry component rather than pasted. Three things had to change to
 * live in this codebase:
 *
 *   - The registry version is written against shadcn's token names (bg-muted, text-foreground,
 *     bg-background, ring-ring). None of those exist here; this project's tokens are declared in
 *     app/globals.css. Left as-is the cards would have rendered on transparent backgrounds with
 *     invisible captions.
 *   - lucide-react is not a dependency, and adding an icon package for two chevrons to a project
 *     that hand-draws its icon set (components/ui/icons.tsx) would have been the wrong trade. The
 *     two chevrons were added there instead, in the same 24px stroked style as the rest.
 *   - The cards were hard-coded square, which suits album art and ruins a website screenshot.
 *     `aspectRatio` now drives both the card and the track height.
 *
 * The mechanism below is the registry's and is left intact, including its comments.
 */

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export interface CoverflowSlide {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  href?: string;
  /**
   * The card's own colour, as a 6-digit hex. It grounds the card while the image is still
   * loading, edges it, and blooms underneath it. With a ring of a dozen screenshots that are
   * mostly dark rectangles, this is what stops the stack reading as one grey ribbon.
   */
  tint?: string;
  meta?: { label: string; value: string }[];
}

export interface CoverflowCarouselProps {
  slides: CoverflowSlide[];
  /** Degrees the first neighbour tilts. */
  rotate?: number;
  /** How far the first neighbour recedes, as a fraction of card width. */
  depth?: number;
  /** Viewer distance as a multiple of card width — smaller is a wider lens. */
  perspective?: number;
  /** Exponent on distance. Below 1 the rake eases off as cards travel out. */
  falloff?: number;
  /** Opacity lost per step from the centre. */
  fade?: number;
  /** Any CSS length. Everything else is derived from it, so the rake scales. */
  cardWidth?: string;
  /** Card width divided by height. 1 is the registry's square; 16/10 suits a site screenshot. */
  aspectRatio?: number;
  /** Space between cards, as a fraction of card width. */
  gap?: number;
  /** Milliseconds between automatic steps. 0 or omitted leaves it still. */
  autoplayMs?: number;
  /** Cards turned per 1000px of page scroll while the carousel is in view. 0 disables. */
  scrollSpeed?: number;
  loop?: boolean;
  showCaption?: boolean;
  showPagination?: boolean;
  showNavigation?: boolean;
  /** Names the carousel for assistive tech. */
  label?: string;
  className?: string;
  cardClassName?: string;
}

export function CoverflowCarousel({
  slides,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = "clamp(148px, 22vw, 260px)",
  aspectRatio = 1,
  gap = 0.05,
  autoplayMs = 0,
  scrollSpeed = 0,
  loop = true,
  showCaption = false,
  showPagination = false,
  showNavigation = false,
  label = "Cover carousel",
  className,
  cardClassName,
}: CoverflowCarouselProps) {
  const count = slides.length;

  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  /** Fractional card index at the centre. The single source of truth. */
  const posRef = React.useRef(0);
  /** Where the current settle is headed. Stepping off `pos` instead would
      swallow a keypress that lands mid-flight, before the round-off moves. */
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
    moved: boolean;
  } | null>(null);

  const [selected, setSelected] = React.useState(0);
  const reduced = useReducedMotion();

  /** True once a pointer has travelled far enough to count as a drag, so the card it started on
   *  does not also fire its link on release. Reset on every pointerdown. */
  const movedRef = React.useRef(false);
  const hoverRef = React.useRef(false);
  /**
   * Starts true, not false. IntersectionObserver only reports on a rendering opportunity, so a
   * document that is not being painted -- a background tab, an occluded window, a headless capture
   * -- may never deliver the first callback at all. Defaulting to false means the gate below never
   * opens and the carousel silently never moves, which is a far worse failure than the opposite:
   * defaulting to true costs at most a few steps of an off-screen carousel before the observer
   * corrects it on the first frame that actually renders.
   */
  const inViewRef = React.useRef(true);

  /** Nearest whole card, folded back into 0..count-1. */
  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  // Paint straight to the DOM. Sixty state updates a second would re-render
  // every card for numbers React never needs to see.
  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      // Fold the distance into the shorter way round the ring. This is the
      // whole looping mechanism — no cloned nodes, no shuffling the DOM.
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      // Both the tilt and the recession ease off as cards travel out —
      // doubling the distance adds only about half again as much of each.
      // A linear ramp folds the second card shut; this keeps it readable.
      const ramp = Math.pow(distance, falloff);
      // Capped short of edge-on so a far card never turns its back.
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

      // A card is teleported across the ring at exactly half a turn out, so it
      // has to be gone by then or the jump is visible.
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
    });
  }, [count, depth, fade, falloff, gap, loop, rotate]);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        // ponytail: exponential ease-out, not a spring. Swap in a spring only
        // if the settle needs overshoot.
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint],
  );

  const clamp = React.useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  );

  const goTo = React.useCallback(
    (index: number) => {
      // Take the shorter way round rather than unwinding the whole ring.
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle],
  );

  const nudge = React.useCallback(
    (by: number) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    movedRef.current = false;
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    // A few pixels of slop before this counts as a drag, so that a card carrying a link is not
    // robbed of its click by the tremor in an ordinary tap.
    if (Math.abs(event.clientX - drag.x) > 4) {
      drag.moved = true;
      movedRef.current = true;
    }

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    // Cards per second, for the throw.
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;

    const index = indexAt(posRef.current);
    if (index !== selected) setSelected(index);
    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    // Let a flick carry, but never more than two cards.
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  /** Whether the carousel is on screen. Both the autoplay and the scroll drive below are gated on
   *  it, so a carousel four sections down is not quietly stepping through itself all visit. */
  React.useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /**
   * Autoplay. It moves on its own so the rake is legible as motion rather than as a still frame
   * that happens to be in perspective, and so it is obvious the thing can be moved at all.
   *
   * It yields to everything: a drag in progress, a pointer resting on it, being scrolled off
   * screen, a backgrounded tab, and prefers-reduced-motion. It steps rather than drifts, reusing
   * nudge, so the ring always comes to rest on a card instead of parking between two.
   */
  React.useEffect(() => {
    if (!autoplayMs || reduced) return;
    const id = setInterval(() => {
      if (dragRef.current || hoverRef.current || !inViewRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      nudge(1);
    }, autoplayMs);
    return () => clearInterval(id);
  }, [autoplayMs, nudge, reduced]);

  /**
   * Scrolling the page turns the ring, while the carousel is in view.
   *
   * Deliberately driven by scroll DELTA rather than by the section's progress through the
   * viewport: progress would pin a given scroll position to a given card, so scrolling back up
   * would rewind it and the carousel could never be anywhere the scrollbar disagreed with. Delta
   * just adds to wherever it already is, which composes with the autoplay and with dragging
   * instead of fighting them.
   *
   * The page keeps scrolling normally throughout: this reads the scroll, it never swallows it.
   */
  React.useEffect(() => {
    if (!scrollSpeed || reduced || typeof window === "undefined") return;

    let last = window.scrollY;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      last = y;
      if (!inViewRef.current || dragRef.current) return;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      posRef.current = clamp(posRef.current + (delta / 1000) * scrollSpeed);
      targetRef.current = posRef.current;
      setSelected(indexAt(posRef.current));
      paint();

      // Snap to the nearest card once the scroll stops, so it never rests half-turned.
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => settle(clamp(Math.round(posRef.current))), 140);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(settleTimer);
    };
  }, [clamp, indexAt, paint, reduced, scrollSpeed, settle]);

  // Card width drives pitch, depth and perspective, so it is the only thing
  // worth measuring — and only when the box actually changes.
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const active = slides[selected];

  return (
    <div
      className={cn("w-full", className)}
      style={{ ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="relative">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerEnter={() => {
            hoverRef.current = true;
          }}
          onPointerLeave={() => {
            hoverRef.current = false;
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(1);
            }
          }}
          // Vertical padding keeps the drop shadows clear of the overflow clip.
          // No focus ring classes: app/globals.css already rings every :focus-visible target.
          className="cursor-grab overflow-hidden py-10 outline-none active:cursor-grabbing"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            // Horizontal drag is ours; the page keeps vertical scrolling.
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative select-none"
            style={{
              height: `calc(var(--cf-card) / ${aspectRatio})`,
              transformStyle: "preserve-3d",
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}`}
                className={cn(
                  "absolute left-1/2 top-0 overflow-hidden rounded-2xl border will-change-transform",
                  slide.tint ? "" : "border-line bg-surface-2",
                  cardClassName,
                )}
                style={{
                  width: "var(--cf-card)",
                  aspectRatio: String(aspectRatio),
                  ...(slide.tint
                    ? {
                        background: slide.tint,
                        borderColor: `${slide.tint}`,
                        // Two shadows: a wide coloured bloom that reads at a glance across the
                        // ring, and a tight one directly under the card so it still sits on the
                        // page rather than floating over it. Alpha is carried in the 8-digit hex
                        // rather than color-mix, which app/globals.css already records as a
                        // dependency worth avoiding for anything load-bearing.
                        boxShadow: `0 22px 52px -18px ${slide.tint}b0, 0 4px 14px -6px ${slide.tint}70`,
                      }
                    : { boxShadow: "0 18px 44px -22px rgba(16, 38, 84, 0.45)" }),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt={slide.alt}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full select-none object-cover object-top"
                />

                {/* The link sits OVER the image rather than wrapping it. Wrapping would put an
                    anchor between the card and its <img>, and the card measures itself through
                    that subtree; an inline anchor's box is not the card's box, so the pitch and
                    the rake would have been computed from the wrong width.

                    onClick guards against a drag ending on this card: a pointer that travelled
                    more than a few pixels was steering the ring, and releasing it should not also
                    open a site. Without that, every flick on a phone opens whatever it let go of. */}
                {slide.href && (
                  <a
                    href={slide.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => {
                      if (movedRef.current) event.preventDefault();
                    }}
                    onDragStart={(event) => event.preventDefault()}
                    className="absolute inset-0 rounded-2xl"
                  >
                    <span className="sr-only">
                      {slide.title ?? slide.alt}, opens in a new tab
                    </span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {showNavigation && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => nudge(-1)}
              className="absolute left-3 top-1/2 z-[200] -translate-y-1/2 rounded-full border border-line bg-surface/80 p-2 text-text backdrop-blur transition-colors hover:bg-surface"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => nudge(1)}
              className="absolute right-3 top-1/2 z-[200] -translate-y-1/2 rounded-full border border-line bg-surface/80 p-2 text-text backdrop-blur transition-colors hover:bg-surface"
            >
              <ChevronRightIcon />
            </button>
          </>
        )}
      </div>

      {showCaption && active?.title && (
        // Keyed on the index so the fade replays on every change. The registry used
        // tailwindcss-animate's `animate-in fade-in`, which is not a dependency here.
        <div key={selected} className="caption-in mt-2 flex flex-col items-center px-6">
          <p className="text-[15px] font-semibold tracking-tight text-text">
            {active.title}
          </p>
          {active.subtitle && (
            <p className="mt-1 font-mono text-[13px] text-text-2">{active.subtitle}</p>
          )}
          {active.meta && active.meta.length > 0 && (
            <dl className="mt-6 w-full max-w-[230px] text-[12px]">
              {active.meta.map((row) => (
                <div key={row.label} className="flex justify-between py-[5px]">
                  <dt className="text-text-2">{row.label}</dt>
                  <dd className="font-medium text-text">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {showPagination && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selected}
              onClick={() => goTo(index)}
              className={cn(
                "size-2 rounded-full bg-text transition-opacity",
                index === selected ? "opacity-100" : "opacity-30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CoverflowCarousel;
