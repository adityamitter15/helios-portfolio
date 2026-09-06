import type { SVGProps } from "react";

/**
 * Small inline SVG icon set shared by the shell components. SVG only, per
 * docs/DESIGN-SPEC.md section 8: never emoji as icons. Every icon is decorative (aria-hidden);
 * the accessible label lives on the interactive element that wraps it.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 4h3.2l1.6 4.4-2 1.6a12.2 12.2 0 0 0 5.7 5.7l1.6-2 4.4 1.6V18a2 2 0 0 1-2 2c-7.2 0-14.5-7.3-14.5-14.5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

/**
 * The one icon here that is FILLED rather than stroked, and it has to be.
 *
 * Every other glyph in this file is a shape this project drew, so the 1.75 stroke in `base` is a
 * free choice. WhatsApp's is a mark people recognise by silhouette: a solid bubble with the
 * handset knocked out of it. The previous version tried to draw it in the house style, as an open
 * arc with a separately stroked handset inside, and the result read as a clock face rather than as
 * WhatsApp -- the handset was a filled shape being outlined, so it came out as a tangle. A logo
 * that is not recognisable is not doing the job the logo is there to do, so the house stroke gives
 * way here and the real geometry is used.
 */
export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01Zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.98-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.75.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 5.5 18.5 9.5 8 20H4v-4Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

export function SmartphoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6.5" y="3" width="11" height="18" rx="2.2" />
      <path d="M10.5 18h3" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.6 7-11.7A7 7 0 0 0 5 9.3C5 14.4 12 21 12 21Z" />
      <circle cx="12" cy="9.3" r="2.4" />
    </svg>
  );
}

export function TapIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.5 12.5V6a1.6 1.6 0 0 1 3.2 0v5" />
      <path d="M13.7 11V5a1.6 1.6 0 0 1 3.2 0v7.5" />
      <path d="M16.9 12V8a1.6 1.6 0 0 1 3.2 0v6.5c0 3.6-2.6 6.5-6.4 6.5h-1.2c-2 0-3.2-.6-4.4-2l-3-3.5a1.5 1.5 0 0 1 2.1-2.1l2.3 2V7a1.6 1.6 0 0 1 3.2 0v5" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5Z" />
    </svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12 19 4" />
      <path d="m16 7 2.5 2.5" />
      <path d="m18.5 4.5 2.5 2.5" />
    </svg>
  );
}
