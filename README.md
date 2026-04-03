# globalpayments-samples.github.io

Developer community entry point for [Global Payments Samples](https://github.com/globalpayments-samples). Catalogs all sample projects with gateway filters, language badges, and community links.

**Live site:** [globalpayments-samples.github.io](https://globalpayments-samples.github.io)

## Static Asset CDN

This site also serves brand assets consumed by every sample project in the org. **Do not rename, move, or modify these files** — they are referenced by 500+ HTML files across 24+ repositories:

| Asset | Path | Used By |
|-------|------|---------|
| Brand CSS | `/css/styles.css` | Every sample project's frontend (header, cards, forms, buttons) |
| Logo SVG | `/assets/img/GP_logo.svg` | Header logo across all projects |
| Favicon SVG | `/assets/img/GP_favicon.svg` | Favicon for all projects |
| Dev brand icon | `/assets/img/g-symbol-dev-brand.png` | CodeSandbox `template.json` entries |
| 3DS JS | `/js/globalpayments-3ds.js` | gpecom-3ds2 project |

### Safe to Modify

- `index.html` — The portal page itself
- `css/portal.css` — Portal-specific styles (does not affect sample projects)
- `js/portal.js` — Portal-specific JavaScript (mobile nav, count display)
- `js/script.js` — Portal render and filter logic (`renderProjects`, `initFilters`)
- `js/projects.js` — Project dataset powering the card grid (add/update entries here)
- `README.md` — This file

## Local Development

Serve with any static file server — no build step required:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Content Source

Project listings mirror the [org profile README](https://github.com/globalpayments-samples/.github/blob/main/profile/README.md). When adding new sample projects, update both.
