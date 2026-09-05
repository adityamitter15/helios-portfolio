"use client";

import { useId, type CSSProperties } from "react";

/**
 * The HELIOS mark: a sun cresting a horizon, drawn as an engraved emblem.
 *
 * Design history, so it is not re-litigated. **Eclipse** (black disc + corona) argued against the
 * studio's own pitch and was rejected — "why are you blocking the light". **Open ring with rays**
 * fixed the meaning but was a symmetric sunburst with no silhouette at favicon size, and its flare
 * turned out to be the Google Gemini shape. **Horizon sun** is the shape that finally works: a
 * horizon gives the mark an up and a down, so the silhouette survives being shrunk to 28px in the
 * nav, and it says dawn, which is the moment a business commissioning a new site is actually in.
 *
 * This revision adds the craft the flat version was missing. A bare disc, twelve rays and a rule is
 * a correct mark but a plain one; what follows is the engraving. Concentric arcs ring the disc like
 * the rings of a banknote lathe, fine hatching runs inside it, the ray fan is doubled so short
 * filaments sit between the long ones, and a turbulence layer lays grain over the whole thing so it
 * reads as printed rather than as a fill.
 *
 * All of that detail is deliberately additive over the silhouette rather than part of it. At hero
 * scale the engraving is what you look at; at 28px it dissolves into tone and the disc, rule and
 * twelve rays still carry the mark on their own. That is the property a raster emblem could not
 * give us — a generated version of this was tried and produced a lumpy asymmetric ring that read as
 * a life preserver, and could not have been shrunk in any case.
 *
 * Twelve primary rays, for the twelve Adityas, the solar deities of the Sanskrit year. Aditya is a
 * name of Surya, the sun; Helios is the Greek sun. The studio's name and its owner's are the same
 * word in two languages, and the ray count is where that is written down.
 */

interface HeliosMarkProps {
  className?: string;
  style?: CSSProperties;
}

/** Rounds a coordinate so the server and the browser emit the same string. Math.cos and Math.sin are
 *  implementation-approximated in ECMAScript, so Node and V8 can disagree in the last bit, which
 *  React reports as a hydration mismatch. */
const fix = (n: number) => Math.round(n * 1000) / 1000;

const HORIZON_Y = 140;
const DISC_CX = 100;
const DISC_CY = 136; // cut just past the equator, so it reads as rising rather than resting
const DISC_R = 40;

const RAY_INNER = 49;
const RAY_COUNT = 12; // the twelve Adityas
const RAY_SPREAD = 148; // degrees of fan, centred on straight up

/** The lathe rings: radii and weights for the concentric arcs that ring the disc. */
const ARCS = [
  { r: 46, w: 1.6, o: 0.5 },
  { r: 51.5, w: 0.7, o: 0.32 },
  { r: 62, w: 0.7, o: 0.22 },
  { r: 68, w: 0.5, o: 0.14 },
];

/** Polar to cartesian with 0 degrees pointing straight up. */
function polar(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [fix(DISC_CX + Math.cos(rad) * r), fix(DISC_CY + Math.sin(rad) * r)];
}

/** An arc across the top of the disc, drawn from the horizon on one side to the other. */
function arcPath(r: number): string {
  const dy = HORIZON_Y - DISC_CY;
  // Half-width of the chord where this radius meets the horizon. Radii smaller than the drop to the
  // horizon never reach it, so they fall back to a full semicircle.
  const half = r > Math.abs(dy) ? fix(Math.sqrt(r * r - dy * dy)) : r;
  return `M ${fix(DISC_CX - half)} ${HORIZON_Y} A ${r} ${r} 0 0 1 ${fix(DISC_CX + half)} ${HORIZON_Y}`;
}

export function HeliosMark({ className = "", style }: HeliosMarkProps) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;

  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="HELIOS" className={className} style={style}>
      <defs>
        {/* Lit from above: brightest at the crown, deepest where it meets the horizon. All three
            stops stay blue — an earlier version sank to --color-chrome-hi here, which put a
            near-navy band against the rule and read as a shadow under a dome. */}
        <linearGradient id={id("disc")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b93f5" />
          <stop offset="45%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-accent-hi)" />
        </linearGradient>

        <linearGradient id={id("horizon")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-chrome-lo)" stopOpacity="0" />
          <stop offset="24%" stopColor="var(--color-chrome-mid)" stopOpacity="0.6" />
          <stop offset="50%" stopColor="var(--color-chrome-mid)" stopOpacity="0.95" />
          <stop offset="76%" stopColor="var(--color-chrome-mid)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--color-chrome-lo)" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={id("glow")}>
          <stop offset="0%" stopColor="var(--color-bloom-b)" stopOpacity="0.6" />
          <stop offset="55%" stopColor="var(--color-bloom-a)" stopOpacity="0.24" />
          <stop offset="100%" stopColor="var(--color-bloom-a)" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={id("rayFade")} gradientUnits="userSpaceOnUse" cx={DISC_CX} cy={DISC_CY} r="96">
          <stop offset="50%" stopColor="#fff" stopOpacity="1" />
          <stop offset="74%" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={id("rayMask")}>
          <rect x="0" y="0" width="200" height={HORIZON_Y} fill={`url(#${id("rayFade")})`} />
        </mask>

        <radialGradient id={id("crown")}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Engraved hatching inside the disc: fine horizontal rules, denser and stronger toward the
            base, so the disc reads as a printed solid rather than a flat fill. Clipped to the disc
            so it never escapes into the rays. */}
        <clipPath id={id("discClip")}>
          <circle cx={DISC_CX} cy={DISC_CY} r={DISC_R} />
        </clipPath>

        {/* Grain. Very low opacity, but it is the difference between an emblem that looks printed
            and one that looks like a shape tool. */}
        <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" />
          <feColorMatrix type="saturate" values="0" />
        </filter>

        <clipPath id={id("aboveHorizon")}>
          <rect x="0" y="0" width="200" height={HORIZON_Y} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id("aboveHorizon")})`}>
        <ellipse cx={DISC_CX} cy={HORIZON_Y} rx="96" ry="56" fill={`url(#${id("glow")})`} />

        {/* The lathe rings, behind everything the sun itself owns. */}
        <g fill="none" stroke="var(--color-accent)" strokeLinecap="round">
          {ARCS.map((a) => (
            <path key={a.r} d={arcPath(a.r)} strokeWidth={a.w} opacity={a.o} />
          ))}
        </g>

        <g mask={`url(#${id("rayMask")})`}>
          {/* Secondary filaments, sitting between the primaries. These are the first thing to
              dissolve at small sizes, which is intended. */}
          {Array.from({ length: RAY_COUNT - 1 }, (_, i) => {
            const step = RAY_SPREAD / (RAY_COUNT - 1);
            const deg = -RAY_SPREAD / 2 + i * step + step / 2;
            const [x1, y1] = polar(RAY_INNER + 2, deg);
            const [x2, y2] = polar(RAY_INNER + 13, deg);
            return (
              <line
                key={`f${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-accent)"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.42"
              />
            );
          })}

          {Array.from({ length: RAY_COUNT }, (_, i) => {
            const deg = -RAY_SPREAD / 2 + (i * RAY_SPREAD) / (RAY_COUNT - 1);
            // Alternating reach, so the fan reads as light rather than as a stamped starburst.
            const len = i % 2 === 0 ? 31 : 20;
            const [x1, y1] = polar(RAY_INNER, deg);
            const [x2, y2] = polar(RAY_INNER + len, deg);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-accent)"
                strokeWidth={i % 2 === 0 ? 3.6 : 2.4}
                strokeLinecap="round"
                opacity={i % 2 === 0 ? 0.92 : 0.55}
              />
            );
          })}
        </g>

        <circle cx={DISC_CX} cy={DISC_CY} r={DISC_R} fill={`url(#${id("disc")})`} />

        <g clipPath={`url(#${id("discClip")})`}>
          {/* Hatching. Spacing tightens and opacity lifts toward the base of the disc. */}
          {Array.from({ length: 16 }, (_, i) => {
            const y = fix(DISC_CY - DISC_R + 4 + i * 2.6);
            return (
              <line
                key={`h${i}`}
                x1={DISC_CX - DISC_R}
                y1={y}
                x2={DISC_CX + DISC_R}
                y2={y}
                stroke="#0a1f4d"
                strokeWidth="0.6"
                opacity={fix(0.05 + i * 0.012)}
              />
            );
          })}
          {/* A crown highlight, so the sphere has a light source rather than only a gradient. Drawn
              with a radial falloff, not a flat fill: a solid ellipse at any opacity high enough to
              see reads as a grey smudge sitting on the disc rather than as light on it. */}
          <ellipse
            cx={DISC_CX}
            cy={DISC_CY - DISC_R * 0.5}
            rx={DISC_R * 0.62}
            ry={DISC_R * 0.28}
            fill={`url(#${id("crown")})`}
          />
          <rect
            x={DISC_CX - DISC_R}
            y={DISC_CY - DISC_R}
            width={DISC_R * 2}
            height={DISC_R * 2}
            filter={`url(#${id("grain")})`}
            opacity="0.14"
            style={{ mixBlendMode: "multiply" }}
          />
        </g>
      </g>

      <rect x="6" y={HORIZON_Y - 1.75} width="188" height="3.5" rx="1.75" fill={`url(#${id("horizon")})`} />
    </svg>
  );
}
