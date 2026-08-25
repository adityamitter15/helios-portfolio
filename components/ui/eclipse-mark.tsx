"use client";

import { useId, type CSSProperties } from "react";

/**
 * The HELIOS mark: a total solar eclipse. A solid disc with a corona flaring off its rim, plus the
 * diamond-ring flare at the moment of second contact.
 *
 * Drawn rather than rendered, deliberately. A raster render brought three problems that kept
 * recurring: it carries a square frame that has to be masked off against whatever the page ground
 * happens to be, its ring geometry has to be measured before it can be cropped, and it cannot be
 * recoloured when the palette changes. Drawing it removes all three, scales cleanly from a favicon
 * to a hero, and weighs nothing.
 *
 * One real astronomical liberty: a true eclipse corona is white, which is invisible on a white page.
 * Here the corona takes the brand blue and the disc is deep navy rather than black, so the mark
 * still reads as an eclipse while actually being visible on the daylight ground.
 */

interface EclipseMarkProps {
  className?: string;
  style?: CSSProperties;
  /** Rotates the diamond-ring flare around the rim, in degrees. 0 puts it at the upper left. */
  flareAngle?: number;
}

/** Rounds a coordinate to a fixed precision so the server and the browser emit the same string.
 *  Math.cos and Math.sin are implementation-approximated in ECMAScript, so Node and V8 can disagree
 *  in the last bit: the server rendered x1="59.39964451469416" while Chrome computed
 *  59.39964451469417, which React reports as a hydration mismatch. Three decimals is far finer than
 *  a 200 unit viewBox can show, and it is identical on both sides. */
const fix = (n: number) => Math.round(n * 1000) / 1000;

export function EclipseMark({ className = "", style, flareAngle = -45 }: EclipseMarkProps) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;

  // Geometry, in a 0..200 viewBox. The disc is deliberately small relative to the frame: the corona
  // needs room to flare, and a disc that fills its box reads as a button rather than an eclipse.
  const c = 100;
  const rDisc = 52;

  const flareRad = ((flareAngle - 90) * Math.PI) / 180;
  const flareX = fix(c + Math.cos(flareRad) * rDisc);
  const flareY = fix(c + Math.sin(flareRad) * rDisc);

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="HELIOS"
      className={className}
      style={style}
    >
      <defs>
        {/* The corona: brightest hard against the rim, gone well before the frame edge. */}
        <radialGradient id={id("corona")}>
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
          <stop offset="25.5%" stopColor="var(--color-accent)" stopOpacity="0" />
          <stop offset="26%" stopColor="#8fb6ff" stopOpacity="0.95" />
          <stop offset="30%" stopColor="var(--color-accent)" stopOpacity="0.55" />
          <stop offset="45%" stopColor="var(--color-accent)" stopOpacity="0.22" />
          <stop offset="70%" stopColor="var(--color-accent)" stopOpacity="0.07" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>

        {/* Streamers. A conic sweep of alternating stops gives the radial filaments a real corona
            has; the radial mask below keeps them near the rim so they fade out rather than
            reaching the frame as hard spokes. */}
        <radialGradient id={id("streamerMask")}>
          <stop offset="26%" stopColor="#fff" stopOpacity="0" />
          <stop offset="34%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="58%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="88%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={id("streamers")}>
          <circle cx={c} cy={c} r="100" fill={`url(#${id("streamerMask")})`} />
        </mask>

        {/* The limb: a hairline of light right on the disc's edge, which is what makes the disc read
            as an object occluding a light source rather than as a flat dot. */}
        <radialGradient id={id("limb")}>
          <stop offset="94%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="99%" stopColor="#cfe0ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={id("flare")}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="35%" stopColor="#dbe8ff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>

        <filter id={id("soften")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      <circle cx={c} cy={c} r="100" fill={`url(#${id("corona")})`} />

      <g mask={`url(#${id("streamers")})`} opacity="0.5">
        {/* Rotation is a CSS animation under motion-safe, not a client-gated SMIL element.
            Conditionally rendering an animation based on a reduced-motion value read on the client
            makes the server and client trees differ, which React reports as a hydration mismatch.
            A CSS animation is identical in both trees and the media query does the gating. */}
        <g
          className="motion-safe:animate-[spin_140s_linear_infinite]"
          style={{ transformOrigin: "100px 100px" }}
        >
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2;
            // Uneven lengths, otherwise the filaments read as a machined gear rather than plasma.
            const len = 30 + ((i * 37) % 23);
            return (
              <line
                key={i}
                x1={fix(c + Math.cos(a) * 53)}
                y1={fix(c + Math.sin(a) * 53)}
                x2={fix(c + Math.cos(a) * (53 + len))}
                y2={fix(c + Math.sin(a) * (53 + len))}
                stroke="var(--color-accent)"
                strokeWidth={i % 3 === 0 ? 1.5 : 0.7}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </g>

      <circle cx={c} cy={c} r={rDisc} fill="var(--color-text)" />
      <circle cx={c} cy={c} r={rDisc + 1.5} fill={`url(#${id("limb")})`} />

      <g filter={`url(#${id("soften")})`}>
        <circle cx={flareX} cy={flareY} r="13" fill={`url(#${id("flare")})`} />
        <circle cx={flareX} cy={flareY} r="2.6" fill="#ffffff" />
      </g>
    </svg>
  );
}
