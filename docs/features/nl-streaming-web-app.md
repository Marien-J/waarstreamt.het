# NL Streaming Web App

Modern React/Vite SPA for exploring the Dutch streaming catalog. Fast, responsive, and user-friendly browsing experience with fuzzy search, faceted filtering, and provider selection.

## Quick Start

```bash
cd web
npm install
npm run dev
```

Visit http://localhost:5173

## Build & Deploy

```bash
npm run build    # Preprocess CSV + build production bundle
npm run preview  # Preview production build locally
```

Deploy to Vercel:
```bash
npm run build && vercel --prod
```

## Architecture

### Tech Stack
- **React 18** + **TypeScript** (strict mode)
- **Vite 5** — blazing fast dev server & optimized builds
- **TanStack Virtual** — virtualized grid for 10k+ titles
- **Orama** — in-memory search + faceted filtering (BM25 ranking)
- **Zustand** — minimal global state (dark mode, provider selection)
- **Tailwind CSS** — utility-first styling with custom design system

### Data Flow

1. **Build time**: `npm run build` runs `scripts/preprocess.ts`
   - Reads latest CSV from `../data/`
   - Aggregates from title×offer grain to title-level with nested offers
   - Filters out `release_year=0` titles (data quality)
   - Computes derived fields: `available_on_flatrate`, `lowest_rent`, `lowest_buy`
   - Outputs to `public/data/titles.json` (~2-3 MB gzipped)

2. **Runtime**:
   - App loads `titles.json` once on mount
   - Initializes Orama search index (Web Worker would be ideal but punted to v2)
   - User searches → Orama queries with BM25 ranking
   - Results rendered via virtualized grid (only visible rows)
   - Click title → detail modal with offers grouped by provider

### Performance Optimizations

- **Virtualized grid**: `@tanstack/react-virtual` renders only visible cards (~10-20 at a time)
- **Lazy-loaded posters**: `loading="lazy"`, `decoding="async"`, responsive `srcset`
- **Debounced search**: 100ms delay to avoid excessive queries
- **Code splitting**: Manual chunks for React, Router, Orama
- **Memoization**: `React.memo` on `TitleCard`, `useMemo` for derived state
- **Optimized data payload**: Gzipped JSON served from Vercel edge network

### Project Structure

```
web/
├── src/
│   ├── main.tsx              # Entry point
│   ├── app.tsx               # Root component
│   ├── components/           # React components
│   │   ├── search-bar.tsx    # Debounced search input
│   │   ├── result-grid.tsx   # Virtualized poster grid
│   │   ├── title-card.tsx    # Poster card with metadata
│   │   ├── title-detail.tsx  # Full-screen detail modal
│   │   └── theme-toggle.tsx  # Dark/light mode toggle
│   ├── lib/                  # Core logic
│   │   ├── data.ts           # Load titles/manifest from JSON
│   │   ├── search.ts         # Orama index + queries
│   │   ├── genres.ts         # Genre code → label mapping
│   │   └── providers.ts      # Provider tiering & metadata
│   ├── store/
│   │   └── app-store.ts      # Zustand state (dark mode, filters)
│   └── styles/
│       └── globals.css       # Tailwind + custom CSS vars
├── scripts/
│   ├── preprocess.ts         # CSV → JSON build script
│   └── providers.json        # Provider metadata (logos, colors, tiers)
├── public/
│   └── data/                 # Generated at build time
│       ├── titles.json       # Preprocessed catalog
│       ├── providers.json    # Provider metadata
│       └── manifest.json     # Build metadata
└── package.json
```

## Features

### Search
- Fuzzy, typo-tolerant (Orama BM25 ranking)
- Searches `title` field
- Debounced 100ms
- Keyboard shortcut: `/` to focus

### Filters (v1: basic, extensible)
Currently: search-only browse view
Planned (v2): provider, genre, monetization, year, rating sliders

### Dark Mode
- Default: dark
- Toggle in header (persisted to localStorage)
- CSS custom properties for theming

### Detail View
- Full-screen modal
- Poster, title, year, runtime, age cert, genres, ratings
- Offers grouped by provider (monetization type, quality, price, deeplink)
- Links to JustWatch for more info (no TMDB enrichment in v1)

### Keyboard Shortcuts
- `/` → focus search
- `Esc` → clear search / close detail
- `Enter` → open detail (when card focused)

## Design System

**Colors** (CSS custom properties):
- `--bg`: background
- `--card`: card background
- `--text`: primary text
- `--accent`: interactive elements
- `--muted`: secondary text
- `--border`: dividers

**Typography**: System font stack (`-apple-system, ...`)

**Spacing**: 8px grid (Tailwind)

**Shadows**: `shadow-sm` for cards

**Transitions**: `duration-200` for smooth interactions

## Performance Targets

- **First Contentful Paint**: < 1.5s (4G throttled)
- **Time to Interactive**: < 2.5s
- **Search keystroke → results**: < 100ms (p95)
- **Initial JS bundle**: < 200 KB gzipped
- **Initial data payload**: < 3 MB gzipped
- **Lighthouse Performance**: ≥ 90

## Future Work (v2+)

- **Advanced filters**: sidebar with provider multi-select, genre, year range, rating sliders
- **TanStack Router**: URL state sync for shareable filtered views
- **Web Worker for Orama**: offload search index to background thread
- **Provider logo CDN**: real logos instead of initial avatars
- **Local watchlist**: localStorage-based favorites
- **TMDB enrichment**: fetch descriptions, backdrops, cast
- **Multi-day diffs**: "new this week" badges

## Related Docs

- [Architecture Decision: React/Vite SPA](../architecture/decisions/001-web-app-architecture.md) — Why this stack
- [NL Streaming Catalog](nl-streaming-catalog.md) — Data extraction pipeline
- [Dashboard (deprecated)](dashboard.md) — Legacy Python Dash app
