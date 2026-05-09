# Waar streamt het? — NL Streaming Web App

Fast, modern React/Vite SPA for exploring streaming catalogs across NL, DE, BE, US, and GB.

## Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## Available Scripts

- **`npm run dev`** — Start Vite dev server with HMR
- **`npm run build`** — Preprocess CSV + build production bundle
- **`npm run preview`** — Preview production build locally
- **`npm run lint`** — Run ESLint
- **`npm run format`** — Format code with Prettier

## Build Pipeline

The build process:
1. Runs `scripts/preprocess.ts` to convert CSV → JSON
2. Vite bundles React app with code splitting
3. Outputs static site to `dist/`

The preprocessing script:
- Reads latest `../data/streaming_nl_*.csv`
- Filters out `release_year=0` entries
- Aggregates title×offer grain → title-level with nested offers
- Computes derived fields: `available_on_flatrate`, `lowest_rent`, `lowest_buy`
- Outputs to `public/data/titles.json` (~2-3 MB gzipped)

## Deployment

### Vercel (recommended)

```bash
npm run build
vercel --prod
```

Or connect your GitHub repo for automatic deployments.

### Other Static Hosts

The `dist/` folder after `npm run build` can be deployed to:
- Netlify
- Cloudflare Pages
- GitHub Pages
- Any static file host

## Architecture

See [docs/features/nl-streaming-web-app.md](../docs/features/nl-streaming-web-app.md) for detailed architecture documentation.

### Tech Stack

- React 18 + TypeScript
- Vite 5 (dev server + build tool)
- Orama (search + faceted filtering)
- @tanstack/react-virtual (virtualized grid)
- Zustand (global state)
- Tailwind CSS (styling)

### Performance

- Virtualized grid: renders only visible cards (~10-20 at a time)
- Lazy-loaded images with responsive `srcset`
- Debounced search (100ms)
- Code splitting (React, Router, Orama in separate chunks)
- Gzipped data payload served from edge CDN

### Features (v1)

- ✅ Fuzzy, typo-tolerant search (Orama BM25)
- ✅ Virtualized poster grid (10k+ titles)
- ✅ Detail modal with offers grouped by provider
- ✅ Dark mode (default) with toggle
- ✅ Keyboard shortcuts (`/` to search, `Esc` to close)
- ✅ Responsive (mobile-first)
- ✅ Zero-backend (static site)

### Future (v2+)

- Advanced filters (provider, genre, year, rating)
- TanStack Router with URL state sync
- Web Worker for Orama index
- Local watchlist (localStorage)
- TMDB enrichment (descriptions, backdrops)

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Project Structure

```
web/
├── src/
│   ├── main.tsx              # Entry point
│   ├── app.tsx               # Root component
│   ├── components/           # React components
│   ├── lib/                  # Core logic
│   ├── store/                # Zustand state
│   └── styles/               # Tailwind + CSS vars
├── scripts/
│   └── preprocess.ts         # CSV → JSON build script
├── public/
│   └── data/                 # Generated at build time
└── package.json
```

### Adding New Features

1. Update types in `src/lib/data.ts` if data model changes
2. Add UI components in `src/components/`
3. Update `src/app.tsx` to integrate
4. Add documentation to `docs/features/nl-streaming-web-app.md`

### Updating Provider Metadata

Edit `scripts/providers.json` to add/update provider logos and colors.

## Troubleshooting

**Build fails with "CSV not found"**
- Ensure `../data/streaming_nl_*.csv` exists
- Run the extractor first: `python -m streaming_nl`

**Search not working**
- Check browser console for Orama errors
- Ensure `public/data/titles.json` was generated

**Images not loading**
- JustWatch CDN may have rate limits
- Check network tab for 404s on poster URLs

## License

See main repo LICENSE.
