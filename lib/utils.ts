import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The shadcn/ui class helper, which components pulled in from a registry expect to find at
 * `@/lib/utils`. This project was never initialised with the shadcn CLI (there is no
 * components.json), so the file did not exist and every such component failed to resolve.
 *
 * clsx flattens the conditional forms, and tailwind-merge resolves conflicts by LAST WINS rather
 * than by CSS source order. That second half is the part that matters: without it a component's
 * own `px-4` and a caller's `px-8` both land in the class list, and which one applies depends on
 * the order Tailwind happened to emit them in, not on which the caller asked for. Every component
 * here that takes a className prop relies on that override actually working.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
