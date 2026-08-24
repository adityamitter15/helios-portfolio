import Image from "next/image";
import { ChromeRule } from "@/components/ui/chrome-rule";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { CALL_HREF, EMAIL, EMAIL_HREF, PHONE_DISPLAY, WHATSAPP_HREF } from "@/lib/contact";

const COVERAGE = ["London", "Reading", "and remotely, anywhere in the UK"];

/**
 * Static footer: contact, coverage, colophon. No motion, per docs/DESIGN-SPEC.md section 5.
 * A plain Server Component, everything here is a link, nothing needs client-side state.
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <ChromeRule />
      <div className="mx-auto max-w-5xl px-6 py-14 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Image src="/brand/mark-eclipse.png" alt="" width={24} height={24} className="h-6 w-6" />
              <span className="font-mono text-label uppercase text-text">HELIOS</span>
            </div>
            <p className="max-w-xs text-body text-text-2">
              Aditya Mitter designs and builds websites for real businesses. Your business, in
              its best light.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-label uppercase text-text-2">Talk to Aditya</h2>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2.5 text-body text-text transition-colors hover:text-accent"
                >
                  <WhatsAppIcon className="h-5 w-5 shrink-0 text-text-2" />
                  WhatsApp: {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={CALL_HREF}
                  className="inline-flex min-h-11 items-center gap-2.5 text-body text-text transition-colors hover:text-accent"
                >
                  <PhoneIcon className="h-5 w-5 shrink-0 text-text-2" />
                  Call: {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={EMAIL_HREF}
                  className="inline-flex min-h-11 items-center gap-2.5 text-body text-text transition-colors hover:text-accent"
                >
                  <MailIcon className="h-5 w-5 shrink-0 text-text-2" />
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-label uppercase text-text-2">Coverage</h2>
            <p className="text-body text-text-2">
              {COVERAGE.join(", ")}. Showrooms, trades, ateliers, salons and clubs: any
              high-street business.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-sm text-text-2 sm:flex-row sm:items-center sm:justify-between">
          <p>HELIOS, a web studio run by Aditya Mitter, London.</p>
          <p>Designed and built by hand, no templates.</p>
        </div>
      </div>
    </footer>
  );
}
