# 20260508-streaming-dashboard

**Status:** READY_FOR_DEV
**Created:** 2026-05-08

## Goal
Build a modern Python Dash web application for searching and exploring the Dutch streaming catalog. Users can search for titles, see where they're available, compare pricing, and filter by provider/type/genre. Clean, performant, millennial-aesthetic UI.

## Acceptance criteria
- [x] **Separate codebase**: Dashboard code lives in `src/dashboard/` (NOT mixed with `src/streaming_nl/`)
- [x] **Search functionality**:
  - [x] Real-time search input (debounced, min 2 chars)
  - [x] Search across title, IMDb ID, TMDB ID
  - [x] Fuzzy matching (handle typos/partial matches)
  - [x] Results table with: title, year, type, genres, avg rating
- [x] **Title detail view**:
  - [x] Click a search result to see detailed breakdown
  - [x] Provider cards showing: logo/name, monetization type, price, quality (4K/HD/SD), direct link
  - [x] Display IMDb/TMDB scores, runtime, certification, poster image
  - [x] Highlight best deal (cheapest rent/buy, or flatrate options)
- [x] **Filters (sidebar)**:
  - [x] Provider multi-select
  - [x] Content type (SHOW/MOVIE)
  - [x] Monetization type (FLATRATE/RENT/BUY)
  - [x] Genre multi-select (top 15)
  - [x] Release year range slider
  - [x] Quality (4K/HD/SD)
- [x] **Performance**:
  - [x] Initial load < 2s
  - [x] Search results update < 300ms
  - [x] Pagination (25 results per page)
  - [x] Data cached in memory (reload CSV only on restart)
- [x] **Modern UI (millennial aesthetic)**:
  - [x] Clean sans-serif typography (system font stack)
  - [x] Muted color palette with accent colors for CTAs
  - [x] Card-based layouts with subtle shadows
  - [x] Smooth transitions (200ms ease)
  - [x] Mobile-responsive (breakpoints at 768px, 1024px)
  - [x] Dark mode toggle
  - [x] Empty states with helpful messaging
- [x] **CLI runner**: `uv run python -m dashboard --port 8050`
- [x] **Dependencies**: Add `dash`, `dash-bootstrap-components`, `fuzzywuzzy`, `python-levenshtein` to `[dashboard]` optional group in pyproject.toml
- [x] **README**: Create `README-dashboard.md` with setup, usage, architecture notes

## Constraints / non-goals
- NOT a production deployment (local dev server only)
- NOT real-time data updates (CSV snapshot is static)
- NO user authentication/accounts
- NO backend database (CSV loaded into pandas DataFrame in memory)
- Do NOT modify `src/streaming_nl/` (extraction remains separate)

## Affected docs (developer must update or prune)
- `docs/INDEX.md` — add dashboard reference
- Create `docs/features/dashboard.md` — architecture, component structure, styling guide

## Implementation hints

### Recommended file structure:
```
src/dashboard/
├── __init__.py
├── __main__.py          # CLI entry with argparse
├── app.py               # Dash app initialization, layout assembly
├── data.py              # CSV loading, caching, search logic
├── callbacks.py         # Dash callback functions
├── components/
│   ├── __init__.py
│   ├── search.py        # Search bar component
│   ├── filters.py       # Sidebar filter controls
│   ├── results.py       # Results table component
│   └── detail.py        # Title detail modal/panel
└── assets/
    ├── style.css        # Custom CSS (colors, typography, transitions)
    └── dark-mode.css    # Dark theme overrides
```

### Tech stack:
- **Dash + Dash Bootstrap Components** (use `dbc.themes.BOOTSTRAP` or custom theme)
- **pandas** for data wrangling (already in deps)
- **fuzzywuzzy + python-levenshtein** for fuzzy search
- **functools.lru_cache** for memoizing expensive operations

### Search algorithm:
1. Exact match on title (case-insensitive) → top results
2. Fuzzy match with `fuzz.partial_ratio()` threshold ≥ 70
3. Match on IMDb/TMDB IDs if input looks like an ID
4. Apply filters AFTER search (intersection of results)

### Styling guide (millennial aesthetic):
- **Typography**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Colors (light mode)**: 
  - Background: `#FAFAFA`
  - Card: `#FFFFFF`
  - Text: `#1A1A1A`
  - Accent: `#4A90E2` (links/CTAs)
  - Muted: `#6B7280`
- **Colors (dark mode)**:
  - Background: `#121212`
  - Card: `#1E1E1E`
  - Text: `#E5E5E5`
  - Accent: `#60A5FA`
- **Spacing**: 8px grid (8, 16, 24, 32, 48, 64)
- **Border radius**: 8px for cards, 4px for inputs
- **Shadows**: `0 1px 3px rgba(0,0,0,0.1)` for cards
- **Transitions**: `all 0.2s ease`

### Performance tips:
- Load CSV once at startup into global DataFrame
- Use `@lru_cache` for filter options (genre list, provider list)
- Debounce search input (300ms delay before triggering callback)
- Pagination via `dash_table.DataTable` or manual slicing
- Use `dcc.Store` to cache search results client-side

### Example CSV columns available:
`extracted_at`, `country`, `jw_entry_id`, `jw_object_id`, `object_type`, `title`, `release_year`, `runtime_minutes`, `imdb_id`, `tmdb_id`, `genres`, `age_certification`, `imdb_score`, `tmdb_score`, `tomatometer`, `jw_url`, `poster_url`, `provider_short_name`, `provider_name`, `provider_technical_name`, `monetization_type`, `presentation_type`, `price_value`, `price_currency`, `offer_url`, `audio_languages`, `subtitle_languages`

### Provider logo sources:
- JustWatch URLs: `https://images.justwatch.com/icon/{provider_id}/s100`
- Or use provider_name initial as fallback avatar

---
## Developer log

### 2026-05-08 — Implementation complete

**Components implemented:**

1. **[src/dashboard/__init__.py](../src/dashboard/__init__.py)** — Package initialization
2. **[src/dashboard/__main__.py](../src/dashboard/__main__.py)** — CLI entry point with argparse (`--port`, `--csv`, `--debug`)
3. **[src/dashboard/app.py](../src/dashboard/app.py)** — Dash app initialization and layout assembly
4. **[src/dashboard/data.py](../src/dashboard/data.py)** — CSV loading, caching (`@lru_cache`), search logic with fuzzy matching
5. **[src/dashboard/callbacks.py](../src/dashboard/callbacks.py)** — All Dash callbacks (search, filters, pagination, detail modal, dark mode)
6. **[src/dashboard/components/](../src/dashboard/components/)** — UI components:
   - `search.py` — Search bar with debounce
   - `filters.py` — Sidebar with provider/genre/year/quality filters
   - `results.py` — Paginated results table with empty states
   - `detail.py` — Title detail modal with offers and best deal highlighting
7. **[src/dashboard/assets/style.css](../src/dashboard/assets/style.css)** — Millennial aesthetic CSS (light/dark modes, 8px grid, smooth transitions)

**Features delivered:**
- ✅ Real-time fuzzy search (debounced 300ms, min 2 chars)
- ✅ IMDb/TMDB ID search support
- ✅ Sidebar filters (provider, type, monetization, genre, year, quality)
- ✅ Pagination (25 results/page)
- ✅ Title detail modal with all offers
- ✅ Best deal highlighting (flatrate → cheapest rent → cheapest buy)
- ✅ Dark mode toggle with smooth transitions
- ✅ Mobile-responsive layout
- ✅ Client-side result caching via `dcc.Store`
- ✅ `@lru_cache` for filter options

**Performance:**
- CSV loaded once at startup into global DataFrame
- Filter options cached
- Search < 300ms (fuzzy matching threshold 70)
- Pagination instant (client-side)

**Documentation:**
- ✅ [README-dashboard.md](../README-dashboard.md) — Setup, usage, CLI options, features, troubleshooting
- ✅ [docs/features/dashboard.md](../docs/features/dashboard.md) — Architecture, component structure, search algorithm, styling guide
- ✅ [docs/INDEX.md](../docs/INDEX.md) — Updated with dashboard reference

**Dependencies added to pyproject.toml:**
- `dash>=2.14.0`
- `dash-bootstrap-components>=1.5.0`
- `fuzzywuzzy>=0.18.0`
- `python-levenshtein>=0.23.0`
- `pandas>=2.2.0` (already in deps)

**CLI usage:**
```bash
# Install dashboard dependencies
uv sync --extra dashboard

# Run dashboard (auto-detects latest CSV)
uv run python -m dashboard

# Specify port
uv run python -m dashboard --port 8080

# Specify CSV file
uv run python -m dashboard --csv data/streaming_nl_2026-05-08.csv

# Debug mode (hot reload)
uv run python -m dashboard --debug
```

**Notes:**
- Auto-detects latest `streaming_nl_*.csv` in `data/` if `--csv` not provided
- Exits with helpful error if no CSV found
- Dark mode state not persisted (session-only)
- No deep linking (search state not in URL)
- Best deal logic prefers flatrate, then cheapest rent, then cheapest buy

---
## Reviewer verdict

(Reviewer appends here)

