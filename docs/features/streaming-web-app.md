# Streaming Web App (Multi-Country)

**Status:** Implemented  
**Created:** 2026-05-08 (NL-only), extended to multi-country + i18n 2026-05-09

## Quick Start

```bash
cd web
npm install
npm run build   # preprocess CSVs → JSON, then build
npm run dev     # dev server (requires preprocessed JSON in public/data/)
```

Visit http://localhost:5173

## Deploy

```bash
npm run build && vercel --prod
```

## Multi-Country Support

The app supports 5 countries (NL, DE, BE, US, GB) with automatic country detection:

1. **7-day localStorage cache** (returns immediately on repeat visits)
2. **ipapi.co geolocation** (`country_code` field) — 4s timeout
3. **`navigator.language`** country segment (e.g., `nl-NL` → NL)
4. **Fallback**: NL

Explicit user selection (via the country dropdown) always overrides detection and is persisted indefinitely.

## Internationalization (i18n)

4 UI languages: NL, DE, EN, FR. Implementation:
- 4 JSON dictionaries in `src/i18n/{nl,de,en,fr}.json` (~55 keys each)
- Custom `useTranslation()` hook in `src/lib/i18n.ts` — no external library
- Genre labels are language-aware via `src/lib/genres.ts`
- Language switch is instantaneous (no reload)

Default language per country: NL→nl, BE→nl, DE→de, US→en, GB→en.

## Country & Language Switchers

Two dropdowns in the header, side by side:
- **Country switcher** (`components/country-switcher.tsx`): flag + country name
- **Language switcher** (`components/language-switcher.tsx`): flag + language name

Switching country triggers reload of the matching `titles_<cc>.json` and re-indexing of the search engine. Switching language is instantaneous.

## Data Flow

1. **Build time**: `npm run build` runs `scripts/preprocess.ts`
   - Discovers all `data/streaming_<cc>_<lang>_<date>.csv` files, picks latest per country
   - Aggregates from title×offer grain to title-level with nested offers
   - Outputs one `public/data/titles_<cc>.json` per country
   - Writes `public/data/manifest.json` with per-country metadata

2. **Runtime**:
   - Geo-detection runs on first load; explicit preference wins
   - `loadTitles(countryCode)` fetches and caches `titles_<cc>.json` per country
   - User searches → Orama BM25 ranking
   - Results rendered via virtualized grid

## Architecture

| Layer | Tech |
|-------|------|
| UI Framework | React 18 + TypeScript |
| Build | Vite 5 + tsx (preprocess) |
| Search | Orama (BM25, in-memory) |
| Virtualization | TanStack Virtual |
| State | Zustand (persisted to localStorage) |
| Styling | Tailwind CSS |
| i18n | Custom hook + 4 JSON dicts |

## Project Structure

```
web/
├── scripts/
│   ├── preprocess.ts          # Build-time: CSV → JSON per country
│   └── check-i18n-keys.ts    # Assert all dicts have same key set
├── src/
│   ├── app.tsx                # Root: geo-detection, catalog loading, header
│   ├── components/
│   │   ├── country-switcher.tsx
│   │   ├── language-switcher.tsx
│   │   ├── search-bar.tsx
│   │   ├── result-grid.tsx
│   │   ├── title-card.tsx
│   │   ├── title-detail.tsx
│   │   └── filter-sidebar.tsx
│   ├── lib/
│   │   ├── data.ts            # loadTitles(countryCode), per-country cache
│   │   ├── geo.ts             # detectCountry() with ipapi.co + fallbacks
│   │   ├── i18n.ts            # useTranslation() hook
│   │   ├── genres.ts          # Language-aware genre labels
│   │   ├── search.ts          # Orama index + queries
│   │   └── providers.ts       # Provider tiering & metadata
│   ├── store/
│   │   ├── preferences.ts     # country + language, persisted
│   │   └── app-store.ts       # dark mode, search query
│   └── i18n/
│       ├── en.json
│       ├── nl.json
│       ├── de.json
│       └── fr.json
└── public/data/               # Generated at build time
    ├── manifest.json
    ├── titles_nl.json
    ├── titles_de.json
    ├── titles_be.json
    ├── titles_us.json
    └── titles_gb.json
```
