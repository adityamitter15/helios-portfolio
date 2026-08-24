"use client";

import {
  useCallback,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSpring } from "@/lib/motion/use-spring";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

const PULL_PX = 16; // maximum magnetic travel

// Following the pointer is direct manipulation, tracked continuously, so it stays critically
// damped: no overshoot while the user is actively moving. Letting go (the magnet releasing, the
// press releasing) is a discrete gesture end, so it gets a little life (damping 0.8) per the
// apple-design skill: "add bounce only where the user's own gesture carried momentum."
const FOLLOW = { damping: 1, response: 0.28 };
const RELEASE = { damping: 0.8, response: 0.32 };
const PRESS = { damping: 1, response: 0.15 }; // pointerdown must feel instant, never floaty
const POP = { damping: 0.8, response: 0.3 };

function useMagneticSprings(reduced: boolean) {
  const [following, setFollowing] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [pull, setPull] = useState({ x: 0, y: 0 });

  const x = useSpring(pull.x, { ...(following ? FOLLOW : RELEASE), immediate: reduced });
  const y = useSpring(pull.y, { ...(following ? FOLLOW : RELEASE), immediate: reduced });
  const scale = useSpring(pressed ? 0.97 : 1, { ...(pressed ? PRESS : POP), immediate: reduced });

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (reduced) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const relX = event.clientX - (rect.left + rect.width / 2);
      const relY = event.clientY - (rect.top + rect.height / 2);
      const reach = Math.max(rect.width, rect.height) * 1.4;
      const strength = Math.max(0, 1 - Math.hypot(relX, relY) / reach);
      setFollowing(true);
      setPull({ x: (relX / reach) * PULL_PX * strength, y: (relY / reach) * PULL_PX * strength });
    },
    [reduced],
  );

  const onPointerLeave = useCallback(() => {
    setFollowing(false);
    setPressed(false);
    setPull({ x: 0, y: 0 });
  }, []);

  // Feedback on pointerdown, never on click: the scale spring below retargets the instant the
  // pointer lands, not when the gesture completes.
  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    setPressed(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerUp = useCallback(() => setPressed(false), []);

  const style: CSSProperties = reduced
    ? {}
    : {
        transform: `translate3d(${x.value}px, ${y.value}px, 0) scale(${scale.value})`,
        willChange: "transform",
      };

  return {
    style,
    handlers: { onPointerMove, onPointerLeave, onPointerDown, onPointerUp, onPointerCancel: onPointerUp },
  };
}

type MagneticAnchorProps = { as?: "a" } & AnchorHTMLAttributes<HTMLAnchorElement>;
type MagneticButtonProps = { as: "button" } & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A CTA that follows the pointer on independent X/Y springs (docs/DESIGN-SPEC.md section 4.3)
 * and gives instant press feedback. Renders a real <a> or <button> so it stays keyboard operable
 * without any extra wiring: focus, Enter/Space activation and the global focus ring all come free.
 *
 * Callers are responsible for sizing padding so the rendered element clears the 44x44px minimum
 * touch target; this component only owns the magnetic motion, not the box model.
 */
export function Magnetic(props: MagneticAnchorProps | MagneticButtonProps) {
  const reduced = useReducedMotion();
  const { style, handlers } = useMagneticSprings(reduced);

  if (props.as === "button") {
    const { as, style: styleProp, type, ...rest } = props;
    void as; // discriminant only, stripped so it isn't spread onto the DOM node
    return (
      <button type={type ?? "button"} {...rest} {...handlers} style={{ ...styleProp, ...style }} />
    );
  }

  const { as, style: styleProp, ...rest } = props;
  void as;
  return <a {...rest} {...handlers} style={{ ...styleProp, ...style }} />;
}
