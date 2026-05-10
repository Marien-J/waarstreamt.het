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

Two inline control groups in the header, visually differentiated:
- **Country switcher** (`components/country-switcher.tsx`): muted `Country:` prefix label (always visible) + 5 buttons each showing an inline SVG flag + ISO-code (e.g., `[NL flag] NL`). Active button: `bg-[var(--accent)] text-white`. Inactive: `text-[var(--muted)] hover:text-[var(--text)]`. Flags are rendered via the `<Flag />` component (`components/flag.tsx`) — **no emoji codepoints**; SVGs render identically on Windows/macOS/Linux.
- **Language switcher** (`components/language-switcher.tsx`): muted `Language:` prefix label (always visible) + 4 buttons each showing the uppercase language code only (`EN`, `NL`, `DE`, `FR`). No flag emojis — flags represent nations, not languages. Same active/inactive style.

Both prefix labels are translatable via `useTranslation()` with keys `header.country` / `header.language`. Both use `aria-pressed` for accessibility.

Switching country triggers reload of the matching catalog in a background **Web Worker** (`src/workers/catalog-worker.ts`) and re-indexing of the search engine — wired in **`routes/index.tsx`** via `usePreferencesStore().country` in the `useEffect` dependency array. On country change:
1. `setLoading(true)` and `setFilteredTitles([])` fire immediately so the loading skeleton appears and the stale result grid is cleared before the async fetch begins.
2. The worker fetches `catalog_<cc>.json`, rehydrates the compact wire records into `Title[]`, and builds the MiniSearch index — entirely off the main thread.
3. Only after the worker posts `{type:'ready'}` does `setLoading(false)` fire, revealing the new country's titles.

Switching language is instantaneous (no catalog reload).

## Data layout (two-tier)

Per country `<cc>` (nl | de | be | us | gb), `preprocess.ts` emits:

- **`web/public/data/catalog_<cc>.json`** — slim, eager. Fields: `id`, `title`, `type`, `year`, `runtime`, `poster`, `genres`, `imdb`, `tmdb`, `tomato`, `age_cert`, `flatrate`, `rent_lo`, `buy_lo`, `monet`, `brands`, `cr` (chart_rank, optional). Stored with compact single/two-char keys on disk; rehydrated by `src/lib/wire.ts` before being handed to the UI. Sizes: NL 11 MB, BE 11 MB, DE 20 MB, GB 19 MB, US 34 MB.
- **`web/public/data/offers_<cc>.json`** (or `offers_<cc>_<n>.json` when sharded) — lazy. A `Record<id, Offer[]>` loaded on first detail-page click for that title's shard. Shard index = `parseInt(id.replace(/^[a-z]+/, '')) % K` where K = smallest power of 2 keeping each shard ≤ 50 MB (K=2 for DE and US). Cached in memory after first fetch.
- **`web/public/data/providers_<cc>.json`** — brand metadata (display name, tier, title counts).
- **`web/public/data/manifest.json`** — per-country `title_count`, `offer_count`, `offers_shard_count`, `catalog_size_bytes`, `language`, `extracted_at`, `build_hash`.

See [ADR 006](../architecture/decisions/006-data-tiering-and-worker.md) for the full rationale.

## Monetization model

### Canonical offer types

Only three offer types appear in `catalog_<cc>.json`: **FLATRATE** (subscription), **RENT**, and **BUY**. Everything else (`FREE`, `ADS`, `CINEMA`, compound types like `FLATRATE_AND_BUY`) is normalized out by `web/scripts/preprocess.ts`. Titles with zero remaining offers after normalization are excluded entirely. This is the single source of truth — the frontend never needs to handle non-canonical types.

### "View purchases" toggle

A pill button (shopping-cart icon, label `view_purchases` i18n key) sits in the header bar alongside the country and language switchers.

- **Default: OFF.** BUY offers are hidden across the overview, detail page, and filter sidebar. BUY-only titles are excluded from search results.
- **When ON.** BUY offers appear everywhere, treated the same as FLATRATE/RENT.
- **RENT is always visible** regardless of toggle state.
- State is persisted in localStorage under store version 3 (migration from v2 sets `showPurchases: false`).

## Mobile layout

**Header strategy (mobile-first stacking):** On `<640px` (`sm` breakpoint), the header switches from a single `flex-row` to a `flex-col` layout. The app title occupies its own line, then the country/language/theme controls flow below it with `flex-wrap`. This ensures the `Country:` and `Language:` prefix labels are always readable without horizontal overflow. On `sm+` the layout reverts to the original single-row `justify-between`.

**Tap targets:** All interactive elements that must be reachable on touch screens satisfy ≥44×44 px:
- Offer links in title detail: `min-h-[44px]`
- Back-to-browse button: `min-h-[44px]`

**Filter sidebar removed.** The left `<aside>` desktop sidebar and mobile bottom-sheet filter drawer are gone. Provider filtering is driven entirely by the "My Providers" picker in the header. Genre/type/year filters are not exposed in the current UI; the sidebar file (`filter-sidebar.tsx`) is retained on disk for archival.

**No horizontal scroll:** `overflow-x: hidden` is set on `body` in `globals.css`. The result grid computes column count from container width (3 columns at <480 px) so it never overflows its parent.

## Landing Page Rails (Trending + Top Rated)

When no search query and no provider filter is active, two horizontally-scrollable poster rails appear above the main grid:

- **Trending now** — top 20 flatrate titles sorted by `chart_rank ASC` (nulls last), falling back to `imdb_score || tmdb_score DESC`. Uses `chart_rank` from `Title.chart_rank` (wire key `cr`). Since current catalogs don't emit `cr`, the score-based fallback is active.
- **Top Rated** — top 20 flatrate titles with `imdb_score > 0`, sorted by `imdb_score DESC`.

Both rails disappear instantly when a search or provider filter is applied. Implementation in `routes/index.tsx` via `useMemo`.

## Card Entry Animation

`TitleCard` animates in with a fade + 8 px translateY (`@keyframes card-in`, 180 ms ease). Stagger is driven by a CSS custom property `--card-i` (capped at 24 to avoid long cascades). `@media (prefers-reduced-motion: reduce)` disables all card animations.

## Title Detail Page — Country Reactivity

`routes/title.$id.tsx` is fully country-reactive:

- Reads `country` from `usePreferencesStore` and passes `country.toLowerCase()` to `loadTitles`.
- `country` is in the `useEffect` dependency array `[id, country]` → switching country while on the detail page immediately triggers a reload.

## Provider Canonicalization and Country-Scoped Providers

Provider data is now **derived at preprocess time** from the actual catalog, not hand-curated. See [ADR 004](../architecture/decisions/004-provider-canonicalization.md).

### Brand layer (`web/scripts/provider-brands.ts`)
- `BRAND_BY_SHORT_NAME`: maps every JustWatch `short_name` to a canonical `brand_id` (e.g., `prv|amp|amz → amazon`).
- `BRANDS`: canonical display names, brand colors, logo URLs per brand ID.

### Per-country provider files
`web/public/data/providers_<cc>.json` is generated by `preprocess.ts` for each country. Shape:
```json
{
  "amazon": { "brand_id": "amazon", "display_name": "Amazon Prime Video", "tier": "mainstream", "title_count": 4165, "short_names": ["prv"], ... }
}
```
Tier assignment: top 8 brands by FLATRATE title count = `mainstream`; remaining ≥ 50 titles = `niche`.

### My Providers migration
`app-store.ts` persist version 2 migrates stored short_names → brand_ids on first load. Unknown values are dropped.
- `setLoading(true)` fires before the async fetch, matching the same pattern as `routes/index.tsx`.

### Unavailable state

When a title exists in one country's catalog but **not** in the currently selected country:
- The "Where to Watch" section is replaced by an inline banner rendered as `<Flag code={country} /> {t('detail.unavailable_in_country', { country })}` where `{country}` is the ISO code (e.g. `NL`). The SVG flag is rendered in JSX alongside the translated text — no emoji codepoints in the string. (i18n key `detail.unavailable_in_country`).
- Poster, metadata (title, year, type, runtime, ratings, genres) are still shown using `findTitleAcrossCachedCatalogs(id)` — a helper in `lib/data.ts` that searches whichever catalogs are already in the `titlesCache` Map.
- The JustWatch link remains functional.
- If the ID is not in **any** cached catalog, the original "Title not found" fallback (`detail.not_found_title` / `detail.not_found_sub`) is shown.

### i18n on the detail page

All formerly hardcoded English strings are now wired through `t(...)`:
| Key | Default EN value |
|-----|-----------------|
| `detail.back_to_browse` | Back to browse |
| `detail.not_found_title` | Title not found |
| `detail.not_found_sub` | The title you're looking for doesn't exist. |
| `detail.back_cta` | Back to browse |
| `detail.unavailable_in_country` | Not available on any streaming service in {country}. |

Language switching while on the detail page re-renders labels instantly (no reload).

## Detail Page — Search Bar

A compact search input sits in the same row as the "Back to browse" button (stacks below on mobile, `sm:flex-row`):

- Submitting a non-empty query calls `navigate({ to: '/', search: { q: query } })`, landing back on the browse page with the search pre-filled.
- Empty submit is a no-op.
- Desktop: `sm:max-w-[360px]`. Mobile: full width. Tap target ≥ 44 px.
- Reuses the existing `search_placeholder` i18n key — no new keys added.
- `initializeSearch` is **not** called on the detail page; the index is only built on `routes/index.tsx`.


## Data Flow

1. **Build time**: `npm run build` runs `scripts/preprocess.ts`
   - Discovers all `data/streaming_<cc>_<lang>_<date>.csv` files, picks latest per country
   - Aggregates from title×offer grain to title-level with nested offers
   - Emits `public/data/catalog_<cc>.json` (slim catalog, compact wire keys) and `public/data/offers_<cc>.json` (or sharded `offers_<cc>_<n>.json` for DE/US) per country
   - Writes `public/data/providers_<cc>.json` and `public/data/manifest.json`

2. **Runtime**:
   - Geo-detection runs on first load; explicit preference wins
   - A Web Worker (`src/workers/catalog-worker.ts`) fetches `catalog_<cc>.json`, rehydrates compact wire records, builds the MiniSearch index off the main thread, and posts `{type:'ready', titles}` to `routes/index.tsx`. Offers are lazy-loaded on first detail-page click via `loadOffersForTitle(id, cc)`.
   - User searches → MiniSearch BM25 ranking with prefix + fuzzy
   - Results rendered via virtualized grid

## Architecture

| Layer | Tech |
|-------|------|
| UI Framework | React 18 + TypeScript |
| Build | Vite 5 + tsx (preprocess) |
| Search | MiniSearch (BM25, prefix+fuzzy, in-memory) |
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
│   ├── workers/
│   │   └── catalog-worker.ts  # Web Worker: fetch + parse + MiniSearch index
│   ├── components/
│   │   ├── country-switcher.tsx
│   │   ├── language-switcher.tsx
│   │   ├── search-bar.tsx
│   │   ├── result-grid.tsx
│   │   ├── title-card.tsx
│   │   ├── title-detail.tsx
│   │   └── filter-sidebar.tsx
│   ├── lib/
│   │   ├── data.ts            # loadTitles(cc), loadOffersForTitle(id,cc), manifest cache
│   │   ├── wire.ts            # WireCatalogEntry / WireOffer compact types + decoders
│   │   ├── geo.ts             # detectCountry() with ipapi.co + fallbacks
│   │   ├── i18n.ts            # useTranslation() hook
│   │   ├── genres.ts          # Language-aware genre labels
│   │   ├── search.ts          # MiniSearch index + queries
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
    ├── catalog_nl.json        # 11 MB
    ├── catalog_de.json        # 20 MB
    ├── catalog_be.json        # 11 MB
    ├── catalog_gb.json        # 19 MB
    ├── catalog_jp.json        # 12 MB
    ├── catalog_us.json        # 34 MB
    ├── offers_nl.json         # 16 MB
    ├── offers_de_0.json       # 27 MB  (sharded K=2)
    ├── offers_de_1.json       # 26 MB
    ├── offers_be.json         # 14 MB
    ├── offers_gb.json         # 35 MB
    ├── offers_jp.json         # 21 MB
    ├── offers_us_0.json       # 41 MB  (sharded K=2)
    ├── offers_us_1.json       # 41 MB
    ├── providers_nl.json
    ├── ... (providers_de/be/gb/jp/us)
    └── manifest.json
```

## Search

Backend: **MiniSearch** (replaced Orama 2026-05-09 — see [ADR 003](../architecture/decisions/003-search-backend.md)).

**Normalization** (`normalize(s)`): lowercase → NFD diacritic-strip → whitespace-collapse. Applied at index time and query time via `processTerm`.

**Config**: `prefix: true`, `fuzzy: 0.2`, `combineWith: 'AND'`, `boost: { title: 2 }`.

**Ranking**: MiniSearch BM25 score, with a 1.5× multiplier when the title's first token starts with the first query token. Tiebreaker: `imdb_score ?? tmdb_score ?? 0` descending.

**Edge cases**:
- Empty query → all titles shown
- Query length < 2 chars → no results

**Known-good queries** (locked in `web/scripts/test-search.ts`):
- NL: `suits` → Suits (#1), `harry potter` → HP title in top 5, `mentalist` → The Mentalist in top 5, `harry poter` (typo) → HP in top 10
- DE: `dark` → Dark in top 5, `vikings` → Vikings in top 5

