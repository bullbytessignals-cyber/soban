# Ahmad Mullick — Official Website

A luxury personal branding website for Ahmad Mullick — Entrepreneur, Public Figure, Business Mentor & Content Creator.

Minimal · Editorial · Cinematic — inspired by Apple, Porsche, Rolls-Royce and Forbes.

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** with a custom luxury design system
- **GSAP + ScrollTrigger** — scroll-driven timeline & reveals
- **Framer Motion** — text/image reveals, counters, magnetic buttons
- **Lenis** — buttery smooth scrolling
- **Lucide Icons** & shadcn-style UI primitives

## Design System

| Token | Value |
| --- | --- |
| Background | `#F8F6F3` |
| Text | `#111111` |
| Brown | `#8C5A43` |
| Gold | `#C8A96A` |
| Headings | Playfair Display |
| Body | Inter |

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Replacing the Placeholder Photography

All imagery lives in `public/images/`. The site ships with generated SVG
placeholders — swap them with real photography (keep the same file names, or
update the paths in `components/sections/*`):

| File | Used in | Recommended |
| --- | --- | --- |
| `portrait-hero.svg` | Hero (right side) | Transparent PNG portrait, ~720×900 |
| `portrait-about.svg` | About section | Editorial portrait, 4:5 |
| `project-{1..3}.svg` | Featured projects | 4:5 |
| `gallery-{1..8}.svg` | Masonry gallery | Mixed ratios |
| `video-{1..3}.svg` | Video cards | 4:5 |
| `og.png` | Social sharing | 1200×630 |

## Content

Contact details, social links and the site URL are centralized in
`lib/site.ts` — update them there once real handles and domains are known.

## SEO

Open Graph + Twitter Cards, `schema.org` Person JSON-LD, `sitemap.xml` and
`robots.txt` are all generated from `lib/site.ts` via the App Router metadata
API.
