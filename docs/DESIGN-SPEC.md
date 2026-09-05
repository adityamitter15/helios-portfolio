# HELIOS Portfolio: Design Specification

Authoritative brief. Build to this. Where this document and a skill disagree, this document wins.

---

## 1. What this is

The portfolio site for **HELIOS**, the one-person web studio run by **Aditya Mitter** in London.
He designs and builds websites for real businesses. This site exists to make a stranger believe
he is worth hiring, inside about eight seconds.

- Brand name: **HELIOS**. Always paired with **Aditya Mitter** at a size that reads as equally important.
  His name being small has been raised as a defect twice before. It is a hero-level element, never a footnote.
- Tagline: **Your business, in its best light.**
- Offer: **See it before you pay.** Free homepage mockup, no deposit.
- **No prices anywhere on the site.** This is a settled decision.
- Contact: WhatsApp / call **07788930954** (`https://wa.me/447788930954`), email **addy15@duck.com**.
  **No Instagram link.** His account is personal and is deliberately omitted.
- Audience is deliberately broad: showrooms, trades, ateliers, salons, clubs, any high-street business.
  Do not narrow the copy to one niche.

---

## 2. Visual direction: Deep ink and liquid chrome

Near-black ground, mirror-chrome objects, one electric blue accent, generous void.
The reference feeling is a 2026 hardware launch page, not a template.

### Hard bans

These were rejected explicitly and must not reappear:

- Sunlight falling on a concrete or plaster wall. Any variation of it.
- Warm golden-hour photography, amber glows, orange gradients.
- Purely abstract "texture" filler with no idea behind it.
- AI-generated video or stills of devices. Generated hardware drifts and looks fake.
  Device screens must always be **real screenshots** of the live sites.
- Pure `#000000`. It smears on OLED and kills the depth the chrome needs.

### Colour tokens

```css
--void:       #08090C;  /* page ground */
--surface:    #0F1116;  /* raised panel */
--surface-2:  #161922;  /* card */
--line:       #232734;  /* hairline border */
--chrome-hi:  #E8EEF7;  /* chrome highlight stop */
--chrome-mid: #9AA7BD;  /* chrome midtone stop */
--chrome-lo:  #3A4152;  /* chrome shadow stop */
--accent:     #5B8CFF;  /* electric blue */
--accent-hi:  #A8C0FF;
--glow:       #C8D4FF;
--text:       #F2F4F8;
--text-2:     #949CB0;  /* muted body */
```

**Contrast, already computed against `--void`. Do not re-derive, do not weaken:**

| Pair | Ratio | Verdict |
|---|---|---|
| `--text` on `--void` | 18.9:1 | AAA |
| `--text-2` on `--void` | 7.24:1 | AAA body |
| `--accent` on `--void` | 6.30:1 | AA body, safe for links |
| `--void` on `--accent` | 6.30:1 | **This is the button combination** |
| `#FFFFFF` on `--accent` | 3.16:1 | **Fails.** Large display text only, never body, never buttons |

Buttons are `--accent` background with `--void` text. Never white text on the accent.

### Chrome as CSS, not only as image

The generated PNGs are focal objects. Everything else that needs to look metallic uses a
CSS gradient so it stays sharp and weightless:

```css
background: linear-gradient(145deg,
  var(--chrome-lo) 0%, var(--chrome-mid) 22%, var(--chrome-hi) 38%,
  var(--chrome-mid) 52%, var(--chrome-lo) 68%, var(--chrome-mid) 84%, var(--chrome-hi) 100%);
```

Use it on rules, the wordmark fill (`background-clip: text`), card edges and dividers.

---

## 3. Typography

Deliberately **not Inter**. The ui-ux-pro-max database recommends it; it is the generic default
and wrong for a studio whose entire pitch is "not a template".

- **Geist Sans**: display and UI. Install `geist` from npm and load through `next/font`, self-hosted, no external request.
- **Geist Mono**: labels, domains, stats, section numbers, eyebrows.
- **Instrument Serif, italic only**: Google Fonts via `next/font/google`. Used **sparingly**: the phrase
  "in its best light", pull quotes, and nothing else. It is the one warm human note against the metal.

Scale, mobile-first, all fluid:

| Role | Size | Weight | Tracking | Leading |
|---|---|---|---|---|
| Hero | `clamp(3rem, 11vw, 8rem)` | 500 | `-0.04em` | 0.92 |
| H2 | `clamp(2rem, 5vw, 3.75rem)` | 500 | `-0.03em` | 1.0 |
| H3 | `clamp(1.35rem, 2.6vw, 2rem)` | 500 | `-0.02em` | 1.15 |
| Body | `clamp(1.0625rem, 0.5vw + 1rem, 1.1875rem)` | 400 | 0 | 1.6 |
| Label | `0.75rem` mono | 500 | `0.18em` uppercase | 1 |

Body text never goes below 17px on mobile. A previous version was criticised as "really basic,
text is really small". Err large.

---

## 4. Motion system

Motion is the main reason this site should feel expensive. Follow the **apple-design** skill closely.
Its through-line: *an interface feels alive when motion starts from the current on-screen value,
inherits the user's velocity, projects momentum forward, and can be grabbed and reversed at any instant.*

### 4.1 Real springs, not CSS easing

Build `lib/motion/spring.ts`. Parameterise as Apple does, **damping ratio + response**, not mass/stiffness/damping:

```
k = (2π / response)²
c = 2 · dampingRatio · √k
```

- `useSpring(target, { damping, response })` integrates on `requestAnimationFrame`.
- **Always animate from the presentation (live on-screen) value, never the target value.**
  On interrupt, read the current transform and continue from there. Starting from the logical value causes a visible jump.
- **On re-target, carry velocity through.** Hard-cutting velocity creates a "brick wall".
- **Decompose 2D motion into independent X and Y springs.** One spring on a 2D distance desyncs.

Defaults:
- `damping: 1.0` (critically damped, no overshoot) for entrances, reveals, anything that appears on its own.
- `damping: 0.8` (slight overshoot) **only** where the user's own gesture carried momentum: a drag release, a flick.
  Overshoot on something that merely faded in feels wrong.

### 4.2 Response and directness

- **Feedback on `pointerdown`, never on `click`.** Buttons and cards scale to `0.97` the instant they are pressed.
- Never lock out input during a transition.
- For anything draggable, track 1:1 with the pointer and respect the grab offset. Use `setPointerCapture`.

### 4.3 Scroll motion

Use **GSAP ScrollTrigger** for pinning and scrubbing, **motion/react** for component-level reveals.

1. **Hero**: the eclipse mark scales and drifts on scroll, driven by rAF reading `getBoundingClientRect`,
   never a scroll event listener.
2. **Manifesto**: word-by-word scroll-linked reveal. Words warm from `--text-2` to `--text` as the
   section crosses the viewport. Technique is in the `motion-library` skill.
3. **Work**: the four projects. Pinned section, horizontal scrub on desktop; plain vertical stack on mobile.
4. **Stats**: count-up when they enter view. Tabular numerals so the layout does not jitter.
5. **Section entrances**: staggered, `damping: 1.0`, 60ms between children.

### 4.4 Reduced motion

`prefers-reduced-motion: reduce` must produce a still, complete, legible page:
no pinning, no scrub, no parallax, no count-up (show the final number), reveals become a plain cross-fade.
Check this with the actual media query, and make the hooks SSR-safe so the server render never
assumes a window.

---

## 5. Page structure

Mobile-first. Every section is designed at 390px first, then allowed to expand.

| # | Section | Purpose | Motion |
|---|---|---|---|
| 1 | Nav | Glass bar, `backdrop-filter`, slides in after the hero passes | spring translateY |
| 2 | Hero | Eclipse mark, HELIOS wordmark in chrome, **Aditya Mitter** at hero scale, the statement, two CTAs | mark parallax + staggered entrance |
| 3 | Proof strip | Four live domains, count-up stats | count-up |
| 4 | Manifesto | The argument for why a real site matters. Contains the Instrument Serif italic line | word-by-word scroll reveal |
| 5 | Work | Four client projects, real desktop + phone screenshots, live links | pinned horizontal scrub (desktop) |
| 6 | What you get | Six craft cards | staggered reveal, press feedback |
| 7 | Process | Three steps | staggered reveal |
| 8 | Offer | "See it before you pay" on a full-bleed band | chrome texture parallax |
| 9 | FAQ | Objection handling, disclosure/accordion | spring height |
| 10 | Footer | Contact, coverage, colophon | none |
| 11 | Mobile dock | Sticky WhatsApp + Call, always within reach | press feedback |

### The work, with real copy

All four are live. Screenshots are already in `public/work/` as `d-*.jpg` (desktop) and `m-*.jpg` (mobile).
**Serve them through `<picture>`: phones get `m-*`, desktops get `d-*` from 700px up.**
A desktop screenshot shrunk into a phone card is unreadable. That is a real defect that was fixed once already.

1. **OneUnity Bathrooms**: `oneunitybathrooms.co.uk`
   Bespoke bathroom design and installation across London and Reading. An after-hours emergency line that
   appears by itself once evening comes, call and WhatsApp within reach on every screen, and twenty-two
   area pages so the firm turns up when someone nearby searches.
   Tags: Design and build / Local search / Lead capture / Own domain

2. **AGW Bathrooms**: `agwbathroomsltd.co.uk`
   A luxury showroom in Colindale, put online without becoming a shop. A hundred and twenty-six real products
   across twelve ranges, filterable galleries, sizes and finishes on every card, and an enquiry that opens
   WhatsApp already knowing which piece you were looking at.
   Tags: 126-product catalogue / Galleries / Showroom visits / Own domain

3. **by SEEMA**: `byseema.in`
   A luxury atelier where no two pieces are alike. There is deliberately no checkout: you build a selection,
   then enquire or reserve over WhatsApp, because a cart implies a second one exists. Chikankari, gota patti,
   zardozi, jamdani and patola, each photographed as a single piece.
   Tags: Catalogue / WhatsApp reserve / No checkout / Own domain

4. **Daigaku Karate Kai**: `goju-karate.co.uk`
   The oldest sports club at the University of Westminster, training continuously since 1990, rebuilt from
   the ground up. A thirty-three name black belt register with a page for every member, a fight record of
   sixteen wins from the club's first twenty professional cage fights, the written history from Okinawa to
   Regent Street, and decades of archive photography finally given somewhere to live.
   Tags: Member register / Fight record / Archive gallery / Own domain

### What you get, six cards

1. **Drawn for you, not picked off a shelf.** No templates and no page builders. Your site is designed around your business, your work and the way your customers actually buy.
2. **Phone first, always.** Most people will meet your business on a phone, so that is where the design starts and where it is tested, on real handsets rather than a laptop window.
3. **Built to be found.** Local area pages, structured data, sitemaps and a Google Business Profile wired in from day one, so you appear when someone nearby is searching.
4. **One tap to reach you.** WhatsApp, a phone call and directions sit within reach on every screen. An interested visitor should never have to go looking for you.
5. **Quick, even on a bad signal.** Pages are built static and images compressed properly, so the site opens on a mid-range phone on mobile data rather than only on fast broadband.
6. **Yours to keep.** Your domain, your hosting account, your content. Nothing is held hostage, and you are free to take it elsewhere whenever you like.

### The offer

> Tell me about your business and I will design and build your homepage first. Look at it on your own phone,
> show it to whoever you trust, and if it is not right you owe nothing and you walk away. No deposit, no contract
> to sign before you have seen something real.

CTA: **Claim a free mockup** → `https://wa.me/447788930954?text=Hi%20Aditya%2C%20I%27d%20like%20a%20free%20homepage%20mockup%20for%20my%20business.`

---

## 6. Brand assets

Already generated and saved. Do not regenerate.

| File | Use |
|---|---|
| `public/brand/mark-eclipse.png` | **The logo.** Chrome corona ring, 1024×1024, transparent-feel black ground. Hero mark, favicon source, nav mark |
| `public/brand/texture-refraction.png` | Chrome blade splitting light into a cool spectrum. Offer band or manifesto backdrop |
| `public/brand/texture-meridian.png` | Chrome sphere on a lit horizon. Secondary section object |
| `brand/concept-*.png` | The four originals kept for reference. Not shipped |

The mark's ground is near-black, matching `--void`, so it composites cleanly with
`mix-blend-mode: screen` or `lighten` where an edge shows. Check it against the actual ground before shipping;
if a seam appears, mask it with a radial gradient rather than recolouring the PNG.

Favicon: derive from `mark-eclipse.png`. A ring at 32px must still read as a ring, so crop tight and test it small.

---

## 7. Stack and structure

- **Next.js 16, App Router, TypeScript, Tailwind v4** (CSS-first `@theme`, not a JS config).
- `motion` (Motion / Framer Motion v12) for component motion, `gsap` + `ScrollTrigger` for pin and scrub.
- `geist` for fonts, `next/font/google` for Instrument Serif.
- Static export friendly. No database, no auth, no API routes.

```
app/
  layout.tsx          fonts, metadata, Open Graph
  page.tsx            composes the sections
  globals.css         @theme tokens, base layer
components/
  nav.tsx  hero.tsx  proof.tsx  manifesto.tsx  work.tsx
  craft.tsx  process.tsx  offer.tsx  faq.tsx  footer.tsx  dock.tsx
  ui/  magnetic.tsx  reveal.tsx  count-up.tsx  chrome-rule.tsx
lib/motion/
  spring.ts           the integrator
  use-spring.ts       React binding
  use-reduced-motion.ts   SSR-safe
  use-scroll-progress.ts  rAF + getBoundingClientRect
public/brand/  public/work/
```

### Metadata that must not be forgotten

The previous Helios site shipped for a long time with **no doctype, no lang, no charset and no Open Graph tags**,
because its template was authored for a different publisher. Browsers rendered it anyway, which is exactly
why nobody noticed. This site must ship with:

`lang="en-GB"`, charset, description, canonical, theme-color `#08090C`, full Open Graph and Twitter card tags,
and a real `og.jpg` at 1200×630. The distribution plan is people forwarding a link on WhatsApp; with no OG tags
a forwarded link renders as a bare URL with no preview card, which kills it.

---

## 8. Non-negotiables

- **No em dashes. Anywhere.** Not in copy, not in comments, not in commit messages. Restructure the sentence
  instead, or use a comma, colon, full stop or brackets. Do not substitute en dashes as a loophole.
  Before declaring done, run: `grep -rn $'\u2014' app components lib docs`
- **No references to Claude, AI assistants, or generated code** in commits, comments or documentation.
- Mobile-first. Verify at **390px** before anything else.
- Every interactive target at least **44×44px** with 8px of separation.
- Visible focus rings. Never remove them.
- SVG icons only. **No emoji as icons.**
- `cursor: pointer` on everything clickable.
- Images: explicit dimensions so nothing shifts. Lazy-load below the fold. Keep the page under ~2.2MB.
  The site's own copy promises it opens on a mid-range phone on mobile data, so the payload has to honour that.

## 9. Skills to consult while building

Load these and actually apply them, in this order of weight:

1. `apple-design`: the motion system. **Weight this most heavily.** Springs, interruptibility, direct manipulation, materials, restraint.
2. `ui-ux-pro-max`: the design-system search. Already run: pattern is Portfolio Grid, style is Modern Dark (Cinema Mobile). Anti-patterns to avoid: corporate minimalism, hidden portfolio.
3. `frontend-design`: keeping the result distinctive rather than generically "AI-styled".
4. `gsap-scrolltrigger`: pinning and scrub for the work section.
5. `gsap-framer-scroll-animation`: parallax and scroll-triggered reveals.
6. `motion-library`: the word-by-word scroll-linked text reveal, and the SSR-safe reduced-motion hooks.
7. `tailwind-design-system`: Tailwind v4 token architecture.
8. `nextjs-app-router-patterns`: Server Component boundaries. Motion components are client; keep the tree above them on the server.
9. `accessibility`: WCAG 2.2, dark-mode contrast, keyboard paths.
10. `vercel-react-view-transitions`: only if a project detail route is added later.

## 10. Definition of done

- [ ] Renders correctly at 390px, 768px, 1024px, 1440px with no horizontal scroll
- [ ] Every contrast pair in section 2 verified in the built page
- [ ] `prefers-reduced-motion` produces a still, complete, readable page
- [ ] Keyboard-only pass reaches every link and control with a visible focus ring
- [ ] `grep -rn $'\u2014'` returns nothing
- [ ] Aditya Mitter's name is unmistakably prominent in the hero
- [ ] All four project links open the live sites
- [ ] WhatsApp, call and email links all work from a phone
- [ ] Open Graph tags present, `og.jpg` renders in a link preview
- [ ] `npm run build` passes clean
