import { Glass } from "@/components/ui/glass";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { CALL_HREF, PHONE_DISPLAY, WHATSAPP_HREF } from "@/lib/contact";

/**
 * Sticky mobile dock: WhatsApp and Call, always within reach on a phone (docs/DESIGN-SPEC.md
 * section 5, "an interested visitor should never have to go looking for you"). Hidden from
 * sm and up, where the nav's CTA already covers this. Built on the shared liquid glass material
 * (components/ui/glass.tsx) as a floating pane, inset from the edges rather than a flush bar, so
 * it reads as the same substance as the nav above it. Press feedback is the plain CSS case
 * straight from the apple-design skill: respond on the press itself via :active, not on click.
 */
export function Dock() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-3 pt-3 sm:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <Glass radius="1.25rem" className="flex gap-2 p-2">
        <a
          href={CALL_HREF}
          aria-label={`Call Aditya, ${PHONE_DISPLAY}`}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-text transition-transform duration-100 ease-out active:scale-[0.97]"
        >
          <PhoneIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Call</span>
        </a>
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message Aditya on WhatsApp"
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-hi text-void transition-transform duration-100 ease-out active:scale-[0.97]"
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span className="text-sm font-medium">WhatsApp</span>
        </a>
      </Glass>
    </div>
  );
}
