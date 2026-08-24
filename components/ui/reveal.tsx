"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useSpring } from "@/lib/motion/use-spring";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

const STAGGER_MS = 60;
const RISE_PX = 16;
const SPRING = { damping: 1, response: 0.6 }; // critically damped: an entrance, not a gesture

interface RevealItemProps {
  children: ReactNode;
  delayMs: number;
  reduced: boolean;
}

function RevealItem({ children, delayMs, reduced }: RevealItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setVisible(true), delayMs);
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
  }, [delayMs, visible]);

  // A single spring drives entrance progress (0..1); opacity and rise are both derived from it,
  // so the fade and the settle stay perfectly in sync without needing two coupled springs.
  const progress = useSpring(visible ? 1 : 0, { ...SPRING, immediate: reduced });

  const style: CSSProperties = reduced
    ? { opacity: visible ? 1 : 0, transition: "opacity 300ms ease" }
    : {
        opacity: progress.value,
        transform: `translateY(${(1 - progress.value) * RISE_PX}px)`,
      };

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
}

interface RevealProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  /** Wrapper element for the group. Defaults to a div. */
  as?: ElementType;
  /** Extra stagger steps to add before the first child, for composing multiple Reveal groups. */
  startIndex?: number;
}

/**
 * Staggered entrance for a group of children: each direct child fades and rises in on its own
 * critically damped spring (damping 1.0, no overshoot, per docs/DESIGN-SPEC.md section 4.3),
 * 60ms after the previous one, once the group scrolls into view. Under prefers-reduced-motion,
 * every child instead does a plain opacity cross-fade with no movement.
 */
export function Reveal({ children, as: Tag = "div", startIndex = 0, ...rest }: RevealProps) {
  const reduced = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <Tag {...rest}>
      {items.map((child, i) => (
        <RevealItem key={i} delayMs={(startIndex + i) * STAGGER_MS} reduced={reduced}>
          {child}
        </RevealItem>
      ))}
    </Tag>
  );
}
