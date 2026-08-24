"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Glass } from "@/components/ui/glass";
import { useSpring } from "@/lib/motion/use-spring";
import { useScrollProgress } from "@/lib/motion/use-scroll-progress";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { WHATSAPP_HREF } from "@/lib/contact";

const HIDDEN_Y = -96;
const SPRING = { damping: 1, response: 0.5 }; // the bar arriving, not a gesture: no overshoot

// Same load-bearing mask as components/hero.tsx, tuned for mark-eclipse-v2.png's tighter ring
// geometry (the chrome ring's outer edge sits at ~44% of the image radius). Kept small at this
// icon size, but the render's square boundary is still there without it.
const MARK_MASK =
  "radial-gradient(circle at 50% 50%, #000 47%, rgba(0, 0, 0, 0.4) 51%, transparent 56%)";

interface NavProps {
  /** id of the section the nav should wait to clear before it springs in. Defaults to "hero". */
  heroId?: string;
}

/**
 * Nav bar built on the shared liquid glass material (components/ui/glass.tsx), floating above
 * the content rather than consuming a fixed strip (apple-design skill, materials & depth). Stays
 * off-screen and out of the tab order until the hero has scrolled past, then springs in, tracked
 * via requestAnimationFrame reading getBoundingClientRect on the hero section, never a scroll
 * event listener. The header carries the entrance transform; the nav element stays semantic and
 * the Glass pane inside it carries the material.
 */
export function Nav({ heroId = "hero" }: NavProps) {
  const sentinelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sentinelRef.current = document.getElementById(heroId);
  }, [heroId]);

  const progress = useScrollProgress(sentinelRef);
  const reduced = useReducedMotion();
  // Once the hero has all but scrolled out from under the viewport, reveal the bar.
  const visible = progress > 0.94 || reduced;

  const y = useSpring(visible ? 0 : HIDDEN_Y, { ...SPRING, immediate: reduced });
  const opacity = useSpring(visible ? 1 : 0, { ...SPRING, immediate: reduced });

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
      style={{
        transform: `translateY(${y.value}px)`,
        opacity: opacity.value,
      }}
      inert={!visible}
    >
      <nav aria-label="Primary" className="w-full max-w-5xl">
        <Glass className="flex items-center justify-between gap-4 px-4 py-2.5 sm:px-5">
          <a href="#hero" className="flex items-center gap-2 rounded-md" aria-label="HELIOS, home">
            <Image
              src="/brand/mark-eclipse-v2.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0"
              style={{ maskImage: MARK_MASK, WebkitMaskImage: MARK_MASK }}
            />
            <span className="font-mono text-label uppercase text-text">HELIOS</span>
          </a>

          <ul className="hidden items-center gap-6 sm:flex">
            <li>
              <a
                href="#work"
                className="font-mono text-label uppercase text-text-2 transition-colors hover:text-text"
              >
                Work
              </a>
            </li>
            <li>
              <a
                href="#offer"
                className="font-mono text-label uppercase text-text-2 transition-colors hover:text-text"
              >
                Offer
              </a>
            </li>
            <li>
              <a
                href="#faq"
                className="font-mono text-label uppercase text-text-2 transition-colors hover:text-text"
              >
                FAQ
              </a>
            </li>
          </ul>

          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent-hi px-4 text-sm font-medium text-void transition-transform active:scale-[0.97]"
          >
            Claim a free mockup
          </a>
        </Glass>
      </nav>
    </header>
  );
}
