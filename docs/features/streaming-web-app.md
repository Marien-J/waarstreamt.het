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

Switching country triggers reload of the matching `titles_<cc>.json` and re-indexing of the search engine — wired in **`routes/index.tsx`** via `usePreferencesStore().country` in the `useEffect` dependency array. On country change:
1. `setLoading(true)` and `setFilteredTitles([])` fire immediately so the loading spinner appears and the stale result grid is cleared before the async fetch begins.
2. The new catalog is fetched, then `await initializeSearch(loadedTitles)` rebuilds the MiniSearch index.
3. Only after both complete does `setLoading(false)` fire, revealing the new country's titles.

Switching language is instantaneous (no catalog reload).

## Mobile layout

**Header strategy (mobile-first stacking):** On `<640px` (`sm` breakpoint), the header switches from a single `flex-row` to a `flex-col` layout. The app title occupies its own line, then the country/language/theme controls flow below it with `flex-wrap`. This ensures the `Country:` and `Language:` prefix labels are always readable without horizontal overflow. On `sm+` the layout reverts to the original single-row `justify-between`.

**Tap targets:** All interactive elements that must be reachable on touch screens satisfy ≥44×44 px:
- Filter toggle button (`lg:hidden` in browse view): `min-h-[44px]`
- Filter drawer close ×: `min-h-[44px] min-w-[44px]`
- Offer links in title detail: `min-h-[44px]`
- Back-to-browse button: `min-h-[44px]`

**Filter drawer:** The mobile bottom-sheet now uses a `flex flex-col max-h-[80vh]` wrapper, keeping the header and new sticky footer always visible while only the filter list scrolls (`flex-1 min-h-0 overflow-y-auto`). The sticky footer provides two CTAs:
- **Clear all filters** — calls `clearFilters()` and closes the drawer.
- **Apply** — closes the drawer (filters are applied in real-time via URL params).

**No horizontal scroll:** `overflow-x: hidden` is set on `body` in `globals.css`. The result grid computes column count from container width (3 columns at <480 px) so it never overflows its parent.

## Title Detail Page — Country Reactivity

`routes/title.$id.tsx` is fully country-reactive:

- Reads `country` from `usePreferencesStore` and passes `country.toLowerCase()` to `loadTitles`.
- `country` is in the `useEffect` dependency array `[id, country]` → switching country while on the detail page immediately triggers a reload.
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


## Data Flow

1. **Build time**: `npm run build` runs `scripts/preprocess.ts`
   - Discovers all `data/streaming_<cc>_<lang>_<date>.csv` files, picks latest per country
   - Aggregates from title×offer grain to title-level with nested offers
   - Outputs one `public/data/titles_<cc>.json` per country
   - Writes `public/data/manifest.json` with per-country metadata

2. **Runtime**:
   - Geo-detection runs on first load; explicit preference wins
   - `loadTitles(countryCode)` fetches and caches `titles_<cc>.json` per country
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
    ├── titles_nl.json
    ├── titles_de.json
    ├── titles_be.json
    ├── titles_us.json
    └── titles_gb.json
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

