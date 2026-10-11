# HELIOS portfolio

The site for HELIOS, a one-person web studio run by Aditya Mitter. A single page that introduces the studio, shows four client projects, explains the process and the offer, and gives contact routes (call, WhatsApp, email).

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4, with the colour tokens in `app/globals.css`
- GSAP (ScrollTrigger) and `motion` for scroll and spring animation
- A vendored liquid glass module in `public/liquid-glass.js`

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Check a change before committing:

```bash
npm run build
npm run lint
npx tsc --noEmit
```

## Layout

```
app/              Root layout, global styles, the single page
components/       One file per section (hero, work, process, offer, faq, footer, ...)
components/ui/    Shared pieces: glass, reveal, carousel, icons, the HELIOS mark
lib/              Contact details (lib/contact.ts) and motion hooks
public/work/      Screenshots of the client projects, d-* for desktop and m-* for phone
brand/            Logo concepts
docs/             Design spec, copy, and a handoff note (docs/RESUME.md)
```

Contact details live in one place, `lib/contact.ts`. The copy and the design rules are in `docs/DESIGN-SPEC.md` and `docs/DESIGN-SPEC-V2.md`.

## Notes

- The canonical URL and Open Graph tags are set in `app/layout.tsx`.
- Reduced-motion users get a plain vertical layout with no pinned scrolling.
