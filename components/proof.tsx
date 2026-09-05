import { ArrowUpRightIcon } from "@/components/ui/icons";
import { CountUp } from "@/components/ui/count-up";
import { Reveal } from "@/components/ui/reveal";

/**
 * Proof: the four live client sites, docs/DESIGN-SPEC.md section 5.
 *
 * Rebuilt from a row of raw-URL pills stacked above four glass stat cards. That version had two
 * problems beyond the styling. It presented the same list twice, once as domains and once as
 * numbers, so the eye met two identical four-up rhythms in a row. And it stripped every number out
 * of the context that gave it meaning: "126" and "33" as isolated KPI tiles tell a stranger
 * nothing, because the fact that makes them impressive is which client they belong to.
 *
 * Now it is one list. Each row is a client, and the number sits on the row it describes, so
 * "126 products catalogued" is read next to "AGW Bathrooms" rather than floating in a card. The
 * whole row is the link, which also removes the pills: the domain is a column of the row rather
 * than a chip that has to be styled into a button shape and then wraps awkwardly at four across.
 *
 * A plain Server Component shell; CountUp and Reveal own their own client-side behaviour.
 */

/** Daigaku Karate Kai's own domain. It replaced the Firebase preview subdomain the site used to
 *  be listed under (dkk-karate-london-b9f74.web.app), which was the one URL in this list that
 *  undercut the section's own claim of four own domains. Kept as a constant because the same
 *  value appears in the Work section's project entry. */
const DKK_DOMAIN = "goju-karate.co.uk";

/** The four live sites. Every one is a real, checkable, own-domain site, and the stat on each row
 *  is drawn from that build rather than being an invented round number. */
const CLIENTS = [
  {
    name: "OneUnity Bathrooms",
    where: "London & Reading",
    href: "https://oneunitybathrooms.co.uk",
    domain: "oneunitybathrooms.co.uk",
    count: 22,
    fact: "local area pages",
  },
  {
    name: "AGW Bathrooms",
    where: "Colindale showroom",
    href: "https://agwbathroomsltd.co.uk",
    domain: "agwbathroomsltd.co.uk",
    count: 126,
    fact: "products catalogued",
  },
  {
    name: "by SEEMA",
    where: "Luxury atelier",
    href: "https://byseema.in",
    domain: "byseema.in",
    count: 5,
    fact: "craft traditions",
  },
  {
    name: "Daigaku Karate Kai",
    where: "London",
    href: `https://${DKK_DOMAIN}`,
    domain: DKK_DOMAIN,
    count: 33,
    fact: "black belts registered",
  },
];

export function Proof() {
  return (
    <section id="proof" aria-label="Proof" className="px-6 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <Reveal className="flex flex-col gap-3">
          <h2 className="font-mono text-label uppercase text-text-2">Live, not mockups</h2>
          <p className="max-w-xl text-lead text-text-2">
            Four businesses, four own domains. Open any of them.
          </p>
        </Reveal>

        {/* A list rather than a grid of cards: the hairline between rows is the only division, so
            four clients read as one roll instead of four competing objects. */}
        <Reveal startIndex={1}>
          <ul className="flex flex-col border-t border-line">
            {CLIENTS.map((client) => (
              <li key={client.href} className="border-b border-line">
                <a
                  href={client.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-3 py-6 transition-colors
                    lg:grid lg:grid-cols-[1.4fr_1fr_1.3fr] lg:items-baseline lg:gap-8"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-h3 text-text transition-colors group-hover:text-accent">
                      {client.name}
                    </span>
                    <span className="font-mono text-label uppercase text-text-2">
                      {client.where}
                    </span>
                  </div>

                  {/* The number stays animated, but it is now read against the client it belongs
                      to instead of standing alone in a tile. */}
                  <p className="flex items-baseline gap-2 text-body text-text-2">
                    <CountUp value={client.count} className="text-h3 text-text" />
                    <span>{client.fact}</span>
                  </p>

                  <span className="flex items-center gap-1.5 font-mono text-sm text-text-2 transition-colors group-hover:text-accent lg:justify-end">
                    {client.domain}
                    <ArrowUpRightIcon className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    <span className="sr-only"> (opens {client.name} in a new tab)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
