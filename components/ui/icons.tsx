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

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 17.5 4.5 20l2.6-.7a8 8 0 1 0-3.1-3.4" />
      <path d="M9 9.5c0 3.5 3 6.5 6.5 6.5.5 0 .9-.4.9-1v-1.1c0-.3-.2-.5-.4-.6l-1.9-.8a.6.6 0 0 0-.7.2l-.5.6a5.2 5.2 0 0 1-2.7-2.7l.6-.5a.6.6 0 0 0 .2-.7l-.8-1.9a.6.6 0 0 0-.6-.4H9.9c-.5 0-.9.4-.9.9Z" />
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
