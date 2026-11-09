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
- 8 indexable URLs, each with the name in `<title>` and `h1`: `/`, `/about/`, `/resume/`, `/projects/`, `/projects/{plant,pid,erp,aips}/`.
  Sub-pages use `src/layouts/Page.astro` (no WebGL/preloader — fast, text-first) and are linked from the home page footer and Work cards.
- Unique title/description (≤160 chars), trailing-slash canonical, Open Graph + Twitter card (`public/og-image.png`, 1200×630).
- JSON-LD `@graph`: `WebSite`, `ProfilePage`/`WebPage`, `Person` (with `alternateName` spellings and `sameAs` profiles),
  `BreadcrumbList` on sub-pages, `CreativeWork` per project.
- Search-console verification tags from `site.verification` in `src/data/profile.ts`.
- `sitemap-index.xml` with `lastmod`, `robots.txt`, `llms.txt` (for AI search), web manifest, icons.
- Non-render-blocking web fonts; `vercel.json` forces trailing slashes so each page has one URL.
- Semantic landmarks, one `h1`, ordered headings, skip link, `prefers-reduced-motion` support.

### Getting the site to rank for the name (off-site — code alone can't do this)

1. **Google Search Console** → add property `https://abdula-adil.vercel.app/` → HTML tag → paste the token into
   `site.verification.google` → deploy → Verify → *Sitemaps* → submit `sitemap-index.xml` → *URL inspection* → *Request indexing* for `/`, `/about/`, `/resume/`.
2. **Bing Webmaster Tools** → import from Search Console (also feeds DuckDuckGo, Yahoo, ChatGPT search).
3. **Link to the site from every profile you own** — LinkedIn (Contact info → Website, and Featured), GitHub profile + README, any
   dev.to / Medium / Kaggle / Hugging Face account — then add those URLs to `person.profiles` so they appear in `sameAs`.
4. **Custom domain** (e.g. `abdulaadil.com` / `.dev`) — an exact-name domain is the single biggest on-site boost for a name query.
   Change `site` in `astro.config.mjs`, `site.url` in `profile.ts`, `robots.txt` and `llms.txt`, and 301 the vercel.app host to it.
5. **A real headshot** at a stable URL (e.g. `public/abdula-adil.jpg`) used as the `Person` image helps Knowledge Panel / image results.

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
