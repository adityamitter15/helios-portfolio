"use client";

import { useEffect, useRef, useState } from "react";
import { createRenderer, type BlackHolePalette } from "./black-hole-utils/renderer";

/**
 * A Schwarzschild black hole, raymarched. The physics and the WebGL plumbing live in
 * ./black-hole-utils; this is the React surface over them.
 *
 * Renders nothing on the server and nothing meaningful in markup: it is decoration, so it is
 * aria-hidden and unreachable, and every visible thing it contributes is painted by the GPU.
 *
 * The fallback underneath is not a nicety. If WebGL2 is missing (old hardware, a locked-down
 * browser, a GPU blocklist, or simply too many live contexts on the page) the canvas paints
 * nothing at all, and since this sits behind light type on a dark ground, "nothing at all" means
 * an unreadable hero rather than a missing flourish. The CSS layer guarantees a dark ground with
 * a glow in roughly the right place no matter what the GPU does.
 */

interface BlackHoleProps {
  className?: string;
  /** Scales the resolved pixel ratio. Below 1 trades sharpness for frame rate. */
  quality?: number;
  palette?: BlackHolePalette;
  exposure?: number;
  /** Where the hole sits, in 0..1 fractions of the canvas, y from the top. Defaults to "auto". */
  center?: readonly [number, number] | "auto";
}

export function BlackHole({ className, quality, palette, exposure, center }: BlackHoleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = createRenderer({
      canvas,
      quality,
      palette,
      exposure,
      center,
      onStatus: (status) => setFailed(status === "unsupported"),
    });

    void renderer.ready;

    return () => renderer.dispose();
    // palette and center are reference types: a caller passing an inline literal would tear the
    // renderer down and rebuild it on every render, so both are expected to be module constants.
  }, [quality, palette, exposure, center]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative h-full w-full overflow-hidden bg-[#04060c] ${className ?? ""}`}
    >
      {/* Painted first and never removed, so it is also what shows during the frame or two before
          the shader has linked. The canvas draws over it opaquely once it is running. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(38% 26% at 50% 50%, rgba(165,226,255,0.30) 0%, transparent 70%)",
            "radial-gradient(58% 40% at 50% 50%, rgba(195,189,255,0.16) 0%, transparent 72%)",
            "radial-gradient(120% 90% at 50% 50%, rgba(10,26,51,0.55) 0%, #04060c 78%)",
          ].join(", "),
        }}
      />
      {/* pointer-events-auto against the wrapper's none, and only on the canvas: the fallback
          gradient underneath stays inert. touch-pan-y rather than the registry's touch-none --
          none would let a finger steer the hole but would also make the hero a region of the page
          that cannot be scrolled past, which on a full-height hero means trapping the reader at
          the top of the site. pan-y gives the browser every vertical gesture and keeps the
          horizontal ones for the camera. */}
      <canvas
        ref={canvasRef}
        className="pointer-events-auto relative block h-full w-full touch-pan-y"
        style={{ opacity: failed ? 0 : 1 }}
      />
    </div>
  );
}

export default BlackHole;
