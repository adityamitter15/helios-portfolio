# Theme backup: Midnight Black (deep ink and liquid chrome)

The original near-black direction, kept because it is worth being able to go back to.
Superseded as the live theme, not deleted.

**Restore the whole site exactly as it was:**

```bash
cd ~/Developer/helios-portfolio
git checkout theme-midnight-black       # look at it
git checkout -b black-theme theme-midnight-black   # or branch from it to keep working
```

The tag `theme-midnight-black` points at commit `9a4d148`, the full working site on this palette:
eight sections, spring motion library, masked eclipse mark.

**Restore just the palette**, if the newer layout is being kept and only the colours go back:
paste this block over the colour tokens at the top of `app/globals.css`.

```css
--color-void:       #08090c;  /* page ground */
--color-surface:    #0f1116;  /* raised panel */
--color-surface-2:  #161922;  /* card */
--color-line:       #232734;  /* hairline border */
--color-chrome-hi:  #e8eef7;
--color-chrome-mid: #9aa7bd;
--color-chrome-lo:  #3a4152;
--color-accent:     #5b8cff;  /* electric blue */
--color-accent-hi:  #a8c0ff;
--color-glow:       #c8d4ff;
--color-text:       #f2f4f8;
--color-text-2:     #949cb0;  /* muted body */
```

Contrast pairs verified against `--color-void`, so they can be reused without re-deriving:

| Pair | Ratio | Verdict |
|---|---|---|
| `--text` on `--void` | 18.9:1 | AAA |
| `--text-2` on `--void` | 7.24:1 | AAA body |
| `--accent` on `--void` | 6.30:1 | AA body |
| `--void` on `--accent` | 6.30:1 | the button combination |
| `#FFFFFF` on `--accent` | 3.16:1 | fails, large display only |

Two things this theme got right that any successor should keep:

- `.chrome-text` needs a **lighter ramp than `.chrome-fill`**. The shared chrome gradient bottoms out
  at `--color-chrome-lo`, about 1.4:1 on the void, which made the tail of the HELIOS wordmark vanish.
  The text variant bottoms out at `#8E9AAF`, roughly 7:1.
- The eclipse render needs a radial `mask-image`. Its ground is dark navy rather than true black, so
  `mix-blend-mode: screen` lifts the square and its border shows as a lighter box.
