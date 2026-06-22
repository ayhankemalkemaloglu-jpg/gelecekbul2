# superwhisper — landing page

> aurora dissolving over midnight glass

A single-page marketing site built directly on the **Superwhisper** design
system: a cinematic dark-mode product whose hero is a vertical aurora gradient
(black → deep navy → violet → lavender → dusty pink) floating on a near-black
`#000000` canvas.

## Stack

Plain, dependency-free static site so it's trivial to preview and edit:

- `index.html` — page structure (nav, hero, features, how-it-works, pricing, CTA, footer)
- `styles.css` — all design tokens as CSS custom properties + component styles
- `script.js` — light scroll-reveal + active-nav interactions

No build step. Just open `index.html`.

## Run locally

```bash
# any static server works, e.g.
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Design tokens

Every token from the style reference lives in `:root` at the top of
`styles.css` — colors, the signature aurora gradient, the Inter type scale with
its aggressive negative tracking, spacing, radii, shadows, and surface levels.
Edit there to retheme globally.

### Key rules baked in

- **Aurora gradient** is the only hero atmosphere — never a flat dark.
- **White (`#ffffff`) is the primary action fill** — no chromatic CTA color.
- **Display type** is Inter 60px / weight 500 / `-3.42px` tracking — the
  compressed, logo-like headline is the signature.
- **One chromatic accent** (`#0088ff` electric signal) for icons and links.
- **Radii:** 24px cards, 9px buttons/inputs, 9999px nav pill + chips.

## Customizing

Content is in `index.html`; swap the headline, copy, and feature cards freely.
To change the palette or type ramp, edit the variables in `styles.css :root`.
