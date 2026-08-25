# HELIOS portfolio: where things stand

Read this first when picking the project back up. It is the handoff, kept current so work can
resume here rather than restarting.

**Working folder:** `~/Developer/helios-portfolio`
**Run it:** `npm run dev`, then `http://localhost:3000`
**Check it:** `npm run build && npm run lint && npx tsc --noEmit` (all three must pass)

## Read these, in this order
1. `docs/RESUME.md` (this file), current state and the open list
2. `docs/DESIGN-SPEC-V2.md`, palette, type, motion, materials
3. `docs/DESIGN-SPEC.md`, brand facts, contact details, all client copy. **Still authoritative for copy.**
4. `docs/THEME-BACKUP-midnight-black.md`, how to restore the old dark theme

## Themes, and how to move between them
| Theme | Where | Status |
|---|---|---|
| Midnight black | git tag `theme-midnight-black` (`9a4d148`) | Backup, explicitly requested. Do not delete |
| Aurora on deep cobalt | commit history only | Rejected |
| **Daylight, white with pale blue** | current HEAD | **Live** |

Every palette lives in `app/globals.css` under `@theme`. **Token names never change between themes**,
only their values, so a theme swap is a one-file change. `--color-void` just means "the page ground".

## Verifying visually (do not skip)
A backgrounded browser tab parks `requestAnimationFrame` and defers IntersectionObserver, so every
spring reveal freezes at opacity 0 and a working page looks broken. Never judge from a foreground tab.

```bash
cd /private/tmp/claude-501/-Users-addymitter-Developer/98e42f7e-455f-4842-b6dc-c7cb2495546c/scratchpad
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --remote-debugging-port=9222 --user-data-dir=./cdp-profile about:blank &
node shot.mjs http://localhost:3000 390 844 mob 0 900 1800
node shot.mjs http://localhost:3000 1440 900 desk 0 900 1800
```
The harness scrolls the whole page first (so IntersectionObserver-gated sections have been seen),
writes PNGs, and prints an overflow report. **Open the PNGs and look at them.**

## Open list, in priority order

Everything raised so far is done. What remains is launch work, not defects.

1. **Production domain.** `app/layout.tsx` still points canonical and Open Graph at
   `builtbyhelios.vercel.app`, which is the *other* site. Must change before launch or forwarded
   links preview as the wrong site. This is the only blocking item.
2. **Deploy.** Not deployed anywhere yet.
3. Optional polish worth a look with fresh eyes: the eclipse disc is fairly heavy on a white page,
   and the six craft items could carry an icon treatment that is less generic.

### Recently closed
- Eclipse mark drawn as SVG, fully on screen, reads as a solar eclipse, holds at 32px.
- Liquid glass now comes from the vendored module only, no hand-rolled effect.
- Craft and process de-boxed; craft items slide in alternately from left and right with a stagger.
- DKK card reveal fixed by solving for the scroll distance that centres the last card, rather than
  using the track's raw overflow, which always stopped short.
- Scroll reveal colours corrected for the light ground (was invisible at 1.05:1).
- Hydration mismatch fixed: SVG coordinates are rounded, and the mark's scroll transform is written
  imperatively so no client-only value reaches server markup. Console is clean.
- Hero backdrop added, feathered and held right of the type at low opacity.

## Traps already paid for, do not rediscover
- **Hardcoded colours rot across a theme change.** The scroll reveal kept `#eef2ff` from the cobalt
  theme, which is 1.05:1 on white, so revealed text was invisible. `useTransform` cannot tween a CSS
  variable, so if a colour must be literal, it has to be revisited on every palette change.
  `grep -rn "#[0-9a-fA-F]\{6\}" components/ lib/` finds them.
- **Only `html` may paint the page background.** Setting it on `body` too (it was set twice, in CSS
  and as a `bg-void` class) hides the fixed aurora layer behind it.
- **`radial-gradient` percentages are relative to the farthest corner**, not the half-width. Use
  `circle closest-side` so a stop means what you measured.
- **The eclipse render's real geometry**, measured from radial luminance: bright ring at 68 to 76% of
  the radius, dark disc inside 64%, discardable frame beyond 80%. Mask at 78 to 84%. Guessing gave a
  grey blob twice. Measure with PIL.
- **`mix-blend-mode: screen` erases artwork on a white ground** (screen against white returns white).
  On light themes cut the frame geometrically instead.
- **Glass inverts with the ground.** Translucent white on white is invisible; on light it needs a
  near-opaque fill, a hairline darkening downward, and a drop shadow.
- **Higgsfield: a trial blocks the CLI and the MCP for generation**, website only. But the MCP can
  still **read** history and returns direct CDN URLs, so assets can be fetched with `curl` without
  the browser extension. Non-square aspect ratios fail intermittently; just resubmit.

## Ground rules that are not negotiable
- **No em dashes anywhere.** `grep -rn $'\u2014' app components lib docs`
- No mention of Claude, AI, agents or "generated" in code, comments or commits.
- No prices anywhere on the site.
- Aditya Mitter stays hero-scale. The hero must state the trade outright.
- Body text never below 18px on mobile.
- Buttons: `bg-accent-hi` with `text-void`. Never white text on the mid blue.
- `prefers-reduced-motion` must give a still, complete, readable page.

## Known open issue
A React hydration mismatch is being reported on the page. It appeared while two agents were
mid-edit on `nav.tsx`, `dock.tsx`, `globals.css` and `hero.tsx`, so it may be theirs rather than
the mark's. Re-check with the console probe once the tree is stable:
`node probe.mjs http://localhost:3000` from the scratchpad directory.

## Still outstanding for launch
`app/layout.tsx` points canonical and Open Graph at `builtbyhelios.vercel.app`, which is the *other*
site. It needs this project's own domain before launch, otherwise forwarded links preview as the
wrong site.
