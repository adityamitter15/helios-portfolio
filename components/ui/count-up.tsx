"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSpring } from "@/lib/motion/use-spring";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  /** Damping ratio for the settle. Default critically damped: this is an appearance, not a gesture. */
  damping?: number;
  response?: number;
}

const TABULAR_NUMS: CSSProperties = { fontVariantNumeric: "tabular-nums" };

/**
 * Counts up to `value` once it scrolls into view, on a critically damped spring so the number
 * settles without overshooting past itself. Tabular numerals keep every digit the same width so
 * the surrounding layout never jitters as the count changes. Under prefers-reduced-motion, shows
 * the final value immediately, no counting.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  damping = 1,
  response = 1.1,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const spring = useSpring(active ? value : 0, { damping, response, immediate: reduced });
  const display = reduced ? value : spring.value;

  return (
    <span ref={ref} className={className} style={TABULAR_NUMS}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
