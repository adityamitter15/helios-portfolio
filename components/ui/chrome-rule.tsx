import type { CSSProperties, HTMLAttributes } from "react";

interface ChromeRuleProps extends HTMLAttributes<HTMLDivElement> {
  /** Thickness in pixels. Defaults to a 1px hairline. */
  thickness?: number;
  /** Gradient angle. Defaults to the 145deg used across the spec. */
  angle?: number;
}

/**
 * The chrome gradient divider, docs/DESIGN-SPEC.md section 2: "Chrome as CSS, not only as
 * image". A gradient, not a raster image, so it stays sharp and weightless at any width and
 * never needs its own network request.
 */
export function ChromeRule({
  thickness = 1,
  angle = 145,
  className,
  style,
  ...rest
}: ChromeRuleProps) {
  const gradient: CSSProperties = {
    height: thickness,
    backgroundImage: `linear-gradient(${angle}deg,
      var(--color-chrome-lo) 0%, var(--color-chrome-mid) 22%, var(--color-chrome-hi) 38%,
      var(--color-chrome-mid) 52%, var(--color-chrome-lo) 68%, var(--color-chrome-mid) 84%,
      var(--color-chrome-hi) 100%)`,
    ...style,
  };

  return <div aria-hidden="true" className={className} style={gradient} {...rest} />;
}
