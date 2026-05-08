# Dashboard

Web interface for searching and exploring the Dutch streaming catalog.

## Overview

Modern Python Dash application that provides an interactive search and exploration interface for the streaming catalog data extracted by `streaming_nl`. Built with a millennial aesthetic: clean typography, muted colors, card-based layouts, smooth transitions.

## Architecture

### Component structure

```
src/dashboard/
├── __init__.py
├── __main__.py          # CLI entry with argparse (--port, --csv, --debug)
├── app.py               # Dash app initialization, layout assembly
├── data.py              # CSV loading, caching, search logic
├── callbacks.py         # Dash callback functions
├── components/
│   ├── __init__.py
│   ├── search.py        # Search bar component
│   ├── filters.py       # Sidebar filter controls
│   ├── results.py       # Results table component
│   └── detail.py        # Title detail modal
└── assets/
    └── style.css        # Custom CSS (millennial aesthetic)
```

### Data flow

1. **Startup**: `__main__.py` auto-detects latest CSV in `data/` (or uses `--csv` arg)
2. **Loading**: `data.load_data()` reads CSV into global pandas DataFrame
3. **Caching**: `@lru_cache` decorators on `get_filter_options()` and `get_unique_titles()`
4. **Search**: User types → debounced callback → `search_titles()` → fuzzy matching + filters → results
5. **Detail**: User clicks row → `get_title_details()` → modal with all offers + best deal

### Search algorithm

1. **Exact match** on title (case-insensitive) → score 100
2. **Fuzzy match** with `fuzzywuzzy.fuzz.partial_ratio()` → threshold ≥ 70
3. **ID matching**: If query starts with `tt` → IMDb ID search; if numeric → TMDB ID search
4. **Filters applied** AFTER search (intersection of results)
5. **Sort by** fuzzy score (descending)

### Performance optimizations

- **Global DataFrame**: CSV loaded once at startup, cached in module-level `_df` variable
- **Filter options cached**: `@lru_cache(maxsize=1)` on `get_filter_options()` (genres, providers, year range)
- **Client-side pagination**: `dash_table.DataTable` handles paging without server round-trips
- **Debounced search**: 300ms delay via `dcc.Input(debounce=True)`
- **Result caching**: `dcc.Store` component stores search results for instant pagination

### Styling guide (millennial aesthetic)

**Typography:**
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

**Colors:**
- Light mode: `#FAFAFA` bg, `#FFFFFF` cards, `#4A90E2` accent, `#1A1A1A` text
- Dark mode: `#121212` bg, `#1E1E1E` cards, `#60A5FA` accent, `#E5E5E5` text

**Spacing:** 8px grid (8, 16, 24, 32, 48, 64)

**Border radius:** 8px for cards, 4px for inputs

**Shadows:** `0 1px 3px rgba(0,0,0,0.1)` for cards

**Transitions:** `all 0.2s ease` for smooth hover effects

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px – 1024px
- Desktop: > 1024px

## Features

### Real-time fuzzy search
- Min 2 chars to trigger
- Searches title, IMDb ID, TMDB ID
- Fuzzy matching via `fuzzywuzzy` (handles typos, partial matches)
- Results table: title, year, type, genres, avg rating

### Title detail view
- Modal popup on row click
- Provider cards: logo/name, monetization type, price, quality (4K/HD/SD), deeplink
- IMDb/TMDB scores, runtime, certification, poster
- **Best deal** highlighted (prefers flatrate → cheapest rent → cheapest buy)

### Sidebar filters
- Provider multi-select
- Content type (SHOW/MOVIE)
- Monetization type (FLATRATE/RENT/BUY)
- Genre multi-select (top 15 by frequency)
- Release year range slider
- Quality (4K/HD/SD)
- Clear filters button

### Pagination
- 25 results per page
- Client-side (instant page changes)
- Sortable columns

### Dark mode
- Toggle switch (top-right)
- Persists during session (not saved)
- Smooth 200ms transitions

### Mobile-responsive
- Stacked layout on mobile
- Touch-friendly controls
- Responsive tables

## Implementation notes

### Dependencies
- `dash>=2.14.0` — core framework
- `dash-bootstrap-components>=1.5.0` — UI components + Bootstrap theme
- `fuzzywuzzy>=0.18.0` — fuzzy string matching
- `python-levenshtein>=0.23.0` — C extension for faster fuzzy matching
- `pandas>=2.2.0` — data wrangling (already in main deps)

### Callbacks
All callbacks in `callbacks.py`:
- `update_results()` — search + filter logic
- `change_page()` — pagination
- `show_detail()` — title detail modal
- `clear_filters()` — reset all filters
- `toggle_dark_mode()` — dark mode class toggle

### Best deal logic
(from `data.get_title_details()`)

1. If any `FLATRATE` offers → first flatrate is best deal
2. Else if any `RENT` offers with price → cheapest rent
3. Else if any `BUY` offers with price → cheapest buy
4. Else → no best deal highlighted

### Empty states
- No search query: "Start typing to search" message
- No results: "No results found. Try adjusting your search or filters."

## Known limitations

- **Local dev only**: Uses Dash dev server, not production-ready
- **Static data**: CSV snapshot, no live updates
- **No authentication**: Public access on local network
- **Memory footprint**: Full dataset in RAM (~28k rows ≈ 50MB)
- **No deep linking**: Search state not in URL (refresh resets)
- **Single-user**: Concurrent users share same server state

## Future enhancements

- **URL state**: Encode search/filters in query params for shareable links
- **Favorites**: Client-side localStorage for saved titles
- **Provider logos**: Embed actual logos instead of text names
- **Recommendations**: "Similar titles" based on genre/cast
- **Comparison view**: Side-by-side provider pricing
- **Export**: Download filtered results as CSV
- **Watchlist**: Save titles to a list
- **Notifications**: Alert when a title becomes available on a new provider
