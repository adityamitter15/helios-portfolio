# HELIOS Portfolio: Design Specification v2 (Aurora)

**This document supersedes `DESIGN-SPEC.md` for palette, type, motion and materials.**
`DESIGN-SPEC.md` remains authoritative for everything it alone covers: the brand facts, the contact
details, the four client projects and their copy, the six craft cards, and the offer wording.
Where the two disagree, **v2 wins**.

The previous near-black theme is preserved at git tag `theme-midnight-black` and documented in
`THEME-BACKUP-midnight-black.md`. It is a backup, not a fallback to drift toward.

---

## 1. What changed and why

Direct feedback on v1:

- "why is the whole theme black again ... the theme has gotta change, not black. i liked the blue bits"
- "responsiveness needs to be fixed. text is really small again, needs to be eye catchy, dramatic"
- "cinematograph, full of immerssiveness and interactive things"
- "the whole thing is too long" (the manifesto) and it needs "the scroll text reveal ... not subtle"
- "put some proper liquid glass in it as well"
- "the big helio aditya mitter is good, but it should be clear what the website is for"

So: the ground becomes **blue, not black**. Type gets **substantially bigger**. Materials become
**real liquid glass**. Motion becomes **dramatic rather than tasteful**. The hero states the trade outright.

---

## 2. Palette: Aurora on deep cobalt

The ground is a deep saturated blue. **It must never read as black or as near-black.**
If a screenshot could be mistaken for the old theme, the ground is too dark.

```css
--color-ground:        #0A1240;  /* page ground, deep cobalt */
--color-ground-2:      #0C1750;  /* alternating band */
--color-lift:          #142063;  /* raised panel base */
--color-line:          #2A3A85;  /* hairline border */

--color-bloom-a:       #4F7BFF;  /* electric blue */
--color-bloom-b:       #22D3EE;  /* cyan */
--color-bloom-c:       #A78BFA;  /* violet */

--color-accent:        #4F7BFF;  /* links and accent text */
--color-accent-bright: #7CA0FF;  /* button background */

--color-text:          #EEF2FF;
--color-text-2:        #A9B6E8;  /* muted body */
```

**Contrast, computed against `--color-ground`. Use as given, do not weaken:**

| Pair | Ratio | Verdict |
|---|---|---|
| `--text` on `--ground` | 15.9:1 | AAA |
| `--text-2` on `--ground` | 8.95:1 | AAA body |
| `--accent` on `--ground` | 4.72:1 | AA normal text, fine for links |
| `--ground` on `--accent-bright` | 7.06:1 | **the button combination** |
| `--ground` on `--accent` | 4.72:1 | passes but tight, prefer accent-bright |
| `#FFFFFF` on `--accent` | 3.78:1 | **fails.** Large display only, never buttons |

Buttons are `--accent-bright` background with `--ground` text. Never white text on either blue.

### The aurora

Large, soft, slow-moving colour blooms sit **behind** content and give the page its depth.

- Three blooms, one per bloom colour, as heavily blurred radial gradients.
- Very large: each roughly 60 to 110vw across, deliberately bigger than it looks.
- Low opacity, roughly 0.30 to 0.50, so the ground stays blue and the text stays readable.
- They **drift**: slow independent motion, a full cycle measured in tens of seconds, never a loop
  short enough to notice. Drive from a single rAF loop, not three CSS animations.
- Under `prefers-reduced-motion` they are **static**, not removed. The depth stays, the movement goes.
- Blooms must never sit directly behind body copy at an opacity that drops it below its contrast ratio.
  Check the worst case, which is `--text-2` over the brightest part of a bloom.

---

## 3. Liquid glass

This is the material of the site, so it must be genuinely built, not a flat translucent card.
Every glass surface needs all four of these or it will look cheap:

1. **Backdrop blur and saturation.** `backdrop-filter: blur(24px) saturate(180%)`. Always ship the
   `-webkit-` prefix too.
2. **A tinted fill**, not transparent: roughly `rgba(255,255,255,0.06)` over the ground.
3. **A lit edge.** A hairline border that is brighter at the top and fades toward the bottom, which
   is what sells it as a physical pane catching light. A single flat border does not.
4. **A specular highlight** that responds to the pointer: a soft radial sheen following the cursor
   across the panel. This is the "liquid" part and it is what makes it feel interactive.

Provide `components/ui/glass.tsx` as the single implementation. Every card, the nav and the dock use it.
Do not hand-roll glass in individual sections.

Fallback: where `backdrop-filter` is unsupported, fall back to a solid `--color-lift` panel. Never
leave an unreadable transparent box.

---

## 4. Type: bigger, and dramatic

v1 was called small twice. Err large, then err larger. **Body text never below 18px on mobile.**

```css
--text-hero:  clamp(3.5rem, 13vw, 10rem);   line-height .88;  tracking -.045em;  weight 600
--text-h2:    clamp(2.4rem, 6.5vw, 5rem);   line-height .98;  tracking -.035em;  weight 600
--text-h3:    clamp(1.5rem, 3vw, 2.25rem);  line-height 1.15; tracking -.02em;   weight 500
--text-lead:  clamp(1.35rem, 2.2vw, 1.875rem); line-height 1.45;                 weight 400
--text-body:  clamp(1.125rem, .6vw + 1.05rem, 1.375rem); line-height 1.6;        weight 400
--text-label: 0.8125rem; tracking .18em; uppercase; mono
```

`--text-lead` is new: section introductions use it, so they no longer sit at body size.

Fonts are unchanged: Geist Sans, Geist Mono, Instrument Serif italic used sparingly.

---

## 5. The hero must say what the site is for

The big HELIOS / Aditya Mitter pairing stays, it was liked. Directly beneath it, at `--text-h3` or
larger, an unmissable plain statement of the trade:

> **I build websites for small businesses.**

Then the existing promise line at `--text-lead`:

> See it before you pay: a free homepage mockup, no deposit.

A stranger must know what is being sold within two seconds, without scrolling.

---

## 6. Motion: dramatic, not tasteful

Keep the existing spring engine in `lib/motion/`. It is correct: a real integrator parameterised as
damping ratio and response, animating from the live presentation value and carrying velocity.
**Do not rewrite it.** What changes is amplitude and ambition.

### 6.1 The manifesto reveal, deliberately not subtle

The single most important animation on the page. Follow the `motion-library` skill's scroll-reveal
text technique (the one used on AGW), then push it well past subtle. Per word, scroll-linked:

- colour warming from `--text-2` to `--text`
- **blur from about 8px to 0**
- **scale from about 0.94 to 1**
- a small rise, roughly 10px to 0

All four driven off the same scroll progress so they resolve together. The effect should be
unmistakable, like the sentence is condensing into focus as you scroll into it.

**Shorten the copy.** The idea was liked, the length was not. Use exactly this:

> Most small business sites are built once and left to rot. A stranger lands, cannot tell what you
> do, and leaves. That stranger was a customer. I build sites that put your business *in its best light.*

"in its best light" stays in Instrument Serif italic. Under reduced motion the whole statement
cross-fades in once, fully legible, no blur.

### 6.2 Everywhere else

- **Hero entrance**: the wordmark arrives with real weight, staggered, larger travel than v1.
- **Work section**: keep the pin and scrub. Add depth, cards scale and lift as they take focus.
- **Craft and process cards**: staggered entrance, pointer-tracked specular on the glass, press
  feedback on `pointerdown` at scale 0.97.
- **Counters**: count up on entry, tabular numerals.
- **Aurora**: always drifting behind everything.
- **Section transitions**: content should feel like it is arriving in a space, not fading in place.

### 6.3 Reduced motion, non-negotiable

`prefers-reduced-motion: reduce` yields a still, complete, fully readable page: aurora static, no
blur-in, no scrub, no pin, counters at final value, reveals become a plain cross-fade. Every hook
must be SSR-safe.

---

## 7. Responsiveness

Called out explicitly as broken. Verify at **390, 430, 768, 1024, 1440**.

- No horizontal scroll at any width. The document `scrollWidth` must equal the viewport.
- Nothing may rely on hover alone. Every hover affordance needs a touch equivalent.
- Touch targets at least 44x44px with 8px separation.
- The hero must fit a 390x844 viewport without the promise line or the CTAs being pushed out of view.
- Decorative art (aurora, the mark, backdrops) must never overlap text at any width. It sits behind
  or beside, never on top.
- Test with the CDP harness, not a foreground browser tab. See section 10.

---

## 8. Generated assets

New renders are being produced and will land in `public/brand/`. Build against these filenames and
degrade gracefully if one is missing:

| File | Use |
|---|---|
| `mark-eclipse-v2.png` | The logo. Chrome corona ring with a patterned inner disc, not a flat black centre |
| `hero-backdrop.png` | Wide cinematic backdrop behind the hero |
| `texture-aurora.png` | Large soft colour field for section backgrounds |

The v1 renders stay in place as fallbacks. Every render needs the radial `mask-image` treatment:
their grounds are dark navy rather than true black, so a plain `<img>` shows a visible square edge.
On the new blue ground this is **more** obvious, not less, so masking is mandatory.

---

## 9. Non-negotiables

- **No em dashes anywhere**, copy or comments. Verify with `grep -rn $'\u2014' app components lib`.
- **No mention of Claude, AI, agents, phases, or "generated"** in code, comments or docs.
- Tokens only, never raw hex in components.
- Mobile-first. Visible focus rings. SVG icons only, never emoji.
- No prices anywhere on the site.
- Aditya Mitter stays hero-scale.
- `npm run build`, `npm run lint` and `npx tsc --noEmit` must all pass clean.

## 10. How to verify (use this, do not skip it)

A backgrounded browser tab parks `requestAnimationFrame` and defers IntersectionObserver, which
freezes every spring reveal at opacity 0 and makes a working page look broken. Do not judge from a
foreground tab. Use the CDP harness:

```bash
cd /private/tmp/claude-501/-Users-addymitter-Developer/98e42f7e-455f-4842-b6dc-c7cb2495546c/scratchpad
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --remote-debugging-port=9222 --user-data-dir=./cdp-profile about:blank &
node shot.mjs http://localhost:3000 390 844 mob 0 900 1800
node shot.mjs http://localhost:3000 1440 900 desk 0 900 1800
```

It scrolls the page first so IntersectionObserver-gated content has been seen, writes PNGs you must
actually open and look at, and prints an overflow report naming anything wider than the viewport.
A small circled "N" bottom left is the dev indicator, not a defect.

**Do not claim a visual result without having viewed the screenshot that proves it.**
