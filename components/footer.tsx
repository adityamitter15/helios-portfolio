import { ChromeRule } from "@/components/ui/chrome-rule";
import { HeliosMark } from "@/components/ui/helios-mark";
import { Glass } from "@/components/ui/glass";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { CALL_HREF, EMAIL, EMAIL_HREF, PHONE_DISPLAY, WHATSAPP_HREF } from "@/lib/contact";

// Same load-bearing mask as components/hero.tsx and components/nav.tsx, tuned for

/**
 * Static footer: contact, coverage, colophon. No motion, per docs/DESIGN-SPEC.md section 5.
 * The ChromeRule divider marks the handoff from the last section; the body below it is a
 * full-bleed pane of the shared liquid glass material (components/ui/glass.tsx) rather than a
 * hand-rolled flat panel, so it picks up the aurora drifting behind the page. specular is off:
 * a pane this large is exactly the "background pane where the sheen would be wasted" case the
 * component calls out. Everything here is a link, nothing needs client-side state.
 */
export function Footer() {
  return (
    <footer>
      <ChromeRule />
      <Glass as="div" radius="0" className="px-0">
        {/* Extra bottom padding on mobile only: the sticky dock (components/dock.tsx) is fixed
            over this last stretch of the page below sm, and the colophon line must clear it
            rather than sit half hidden underneath. */}
        <div className="mx-auto max-w-5xl px-6 pb-28 pt-14 sm:px-8 sm:py-14">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <HeliosMark className="h-6 w-6" />
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
              {/* This was a Coverage block reading "London, Reading, and remotely, anywhere in
                  the UK". It was both unhelpful and untrue: the work is done online, and one of
                  the four sites in the section above is byseema.in, an atelier whose domain is not
                  even in this country. A service radius on a studio that has never needed one only
                  talks a reader out of enquiring. What is left is who the work is for, which is the
                  part that was actually doing any work. */}
              <h2 className="font-mono text-label uppercase text-text-2">Who it&rsquo;s for</h2>
              <p className="text-body text-text-2">
                Showrooms, trades, ateliers, salons and clubs: any independent business. It is all
                built online, so where you are makes no difference to any of it.
              </p>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-sm text-text-2 sm:flex-row sm:items-center sm:justify-between">
            <p>HELIOS, a web studio run by Aditya Mitter, London.</p>
            <p>Designed and built by hand, no templates.</p>
          </div>
        </div>
      </Glass>
    </footer>
  );
}
