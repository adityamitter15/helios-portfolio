import { ArrowUpRightIcon } from "@/components/ui/icons";
import { ChromeRule } from "@/components/ui/chrome-rule";
import { CountUp } from "@/components/ui/count-up";
import { Glass } from "@/components/ui/glass";
import { Reveal } from "@/components/ui/reveal";

/** The four live domains, docs/DESIGN-SPEC.md section 5. Own-domain, real, checkable sites. */
const DOMAINS = [
  { name: "OneUnity Bathrooms", href: "https://oneunitybathrooms.co.uk", label: "oneunitybathrooms.co.uk" },
  { name: "AGW Bathrooms", href: "https://agwbathroomsltd.co.uk", label: "agwbathroomsltd.co.uk" },
  { name: "by SEEMA", href: "https://byseema.in", label: "byseema.in" },
  {
    name: "Daigaku Karate Kai",
    href: "https://dkk-karate-london-b9f74.web.app",
    label: "dkk-karate-london-b9f74.web.app",
  },
];

/** Stats drawn straight from the real facts in section 5 of the spec, not invented round numbers. */
const STATS = [
  { value: 4, label: "Live sites, own domains" },
  { value: 126, label: "Products catalogued for one client" },
  { value: 22, label: "Local area pages built for search" },
  { value: 33, label: "Names in one club's black belt register" },
];

/**
 * Proof strip: the four live domains plus count-up stats, docs/DESIGN-SPEC.md section 5. Stat
 * cards are real liquid glass, docs/DESIGN-SPEC-V2.md section 3, composed from the single
 * components/ui/glass.tsx implementation rather than hand-rolled here. A plain Server Component
 * shell; Glass, CountUp and Reveal each own their own client-side behaviour.
 */
export function Proof() {
  return (
    <section id="proof" aria-label="Proof" className="px-6 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <div>
          <h2 className="mb-6 font-mono text-label uppercase text-text-2">Live, not mockups</h2>
          <Reveal className="flex flex-wrap gap-3 sm:gap-4">
            {DOMAINS.map((domain) => (
              <a
                key={domain.href}
                href={domain.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-body text-text-2 transition-colors hover:border-accent hover:text-text"
              >
                <span className="font-mono">{domain.label}</span>
                <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-text-2 transition-colors group-hover:text-accent" />
                <span className="sr-only"> (opens {domain.name} in a new tab)</span>
              </a>
            ))}
          </Reveal>
        </div>

        <ChromeRule />

        <Reveal className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6" startIndex={4}>
          {STATS.map((stat) => (
            <Glass key={stat.label} className="flex flex-col gap-1 px-5 py-6 sm:px-6 sm:py-8">
              <CountUp value={stat.value} className="text-h3 text-text" />
              <p className="font-mono text-label uppercase text-text-2">{stat.label}</p>
            </Glass>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
