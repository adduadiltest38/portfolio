# Abdula Adil — Portfolio

AI Engineer (LLM · Voice AI · Computer Vision) · Full Stack (.NET · Python · React Native) · Abu Dhabi, UAE.

Live: https://abdula-adil.vercel.app

## Stack

| Layer | What | Where |
| --- | --- | --- |
| Framework | **Astro 7** — static HTML output, zero JS by default | `src/pages`, `src/components` |
| Islands | **React 19**, hydrated only where needed | `src/islands` |
| 3D | **Three.js** custom-shader particle field that morphs LLM core → voice waveform → P&ID pipe network | `src/islands/HeroScene.tsx` |
| Video | **Remotion Player** — "The Industrial Reflex" simulation rendered live in the browser | `src/islands/reflex/` |
| Motion | **GSAP + ScrollTrigger** (split text, pinned horizontal scroll, stacked cards, scrubbed reveals) and **Lenis** smooth scroll | `src/scripts/motion.ts` |
| Demos | Voice assistant, P&ID → 3D, NL → SQL terminal, risk matrix (GSAP) | `src/components/demos/` |

## Editing content

All copy lives in **`src/data/profile.ts`** (mirrors the CV). Every section, the meta tags and the JSON-LD read from it.
The downloadable CV is `public/Abdula_Adil_CV.pdf` — replace the file to update it.

## SEO

- Fully pre-rendered HTML — every word is in the markup, readable with JS disabled.
- Unique title/description, canonical, Open Graph + Twitter card (`public/og-image.png`, 1200×630).
- JSON-LD `@graph`: `WebSite`, `ProfilePage`, `Person` (job title, employer, location, skills, credentials, LinkedIn).
- `sitemap-index.xml` (auto via `@astrojs/sitemap`), `robots.txt`, web manifest, icons.
- Semantic landmarks, one `h1`, ordered headings, skip link, `prefers-reduced-motion` support.

## Develop

Requires Node ≥ 22.23.4.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs dist/
npm run preview
```

## Deploy

Vercel builds it automatically (`vercel.json` pins the Astro preset, `npm run build`, output `dist/`). Push to `main` to ship.

> Remotion is free for individuals and companies of up to 3 people — see remotion.dev/license.
