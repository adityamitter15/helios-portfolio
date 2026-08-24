import { PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { CALL_HREF, PHONE_DISPLAY, WHATSAPP_HREF } from "@/lib/contact";

/**
 * Sticky mobile dock: WhatsApp and Call, always within reach on a phone (docs/DESIGN-SPEC.md
 * section 5, "an interested visitor should never have to go looking for you"). Hidden from
 * sm and up, where the nav's CTA already covers this. Press feedback is the plain CSS case
 * straight from the apple-design skill: respond on the press itself via :active, not on click.
 */
export function Dock() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line px-3 pt-3 sm:hidden"
      style={{
        background: "rgba(8, 9, 12, 0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
      }}
    >
      <a
        href={CALL_HREF}
        aria-label={`Call Aditya, ${PHONE_DISPLAY}`}
        className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-text transition-transform duration-100 ease-out active:scale-[0.97]"
      >
        <PhoneIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Call</span>
      </a>
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message Aditya on WhatsApp"
        className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-void transition-transform duration-100 ease-out active:scale-[0.97]"
      >
        <WhatsAppIcon className="h-5 w-5" />
        <span className="text-sm font-medium">WhatsApp</span>
      </a>
    </div>
  );
}
