# Dashboard Quick Start

## Prerequisites

1. Python 3.11+
2. `uv` installed
3. Streaming catalog CSV exists in `data/` (run extractor first)

## Step-by-step setup

### 1. Install dependencies

```bash
# Install all dependencies including dashboard extras
uv sync --extra dashboard
```

This installs:
- `dash>=2.14.0`
- `dash-bootstrap-components>=1.5.0`
- `fuzzywuzzy>=0.18.0`
- `python-levenshtein>=0.23.0`
- `pandas>=2.2.0`

### 2. Generate streaming data (if not done yet)

```bash
uv run python -m streaming_nl
```

This creates `data/streaming_nl_<date>.csv` with the catalog.

### 3. Run the dashboard

```bash
uv run python -m dashboard
```

Output:
```
Loading data from: data/streaming_nl_2026-05-08.csv

🚀 Dashboard starting on http://localhost:8050
Press Ctrl+C to stop
```

### 4. Open in browser

Navigate to http://localhost:8050

## Common commands

```bash
# Custom port
uv run python -m dashboard --port 8080

# Specific CSV file
uv run python -m dashboard --csv data/streaming_nl_2026-05-08.csv

# Debug mode (hot reload)
uv run python -m dashboard --debug

# Stop server
# Press Ctrl+C in terminal
```

## Verification checklist

- [ ] Dashboard loads without errors
- [ ] Search bar accepts input (min 2 chars)
- [ ] Search returns results (try "Matrix", "Netflix", "tt0133093")
- [ ] Filters work (provider, year, genre, etc.)
- [ ] Click a result row → detail modal opens
- [ ] Detail modal shows offers with prices
- [ ] Best deal is highlighted (if applicable)
- [ ] Dark mode toggle works (top-right switch)
- [ ] Pagination works (if >25 results)
- [ ] Mobile view is responsive (resize browser)

## Troubleshooting

**Problem**: `ModuleNotFoundError: No module named 'dash'`
**Solution**: Run `uv sync --extra dashboard`

**Problem**: `Error: No streaming catalog CSV found in data/`
**Solution**: Run `uv run python -m streaming_nl` first

**Problem**: Port 8050 already in use
**Solution**: Use `--port 8051` or kill existing process

**Problem**: Search is slow (>1s response)
**Solution**: Check dataset size. Ensure `python-levenshtein` is installed (compiled C extension)

**Problem**: Dark mode toggle doesn't work
**Solution**: Check browser console for JS errors. Ensure `dash-bootstrap-components` is installed.

## Features overview

### Search
- Type at least 2 characters to trigger search
- Searches title, IMDb ID (tt...), TMDB ID (numeric)
- Fuzzy matching handles typos
- Results update after 300ms pause in typing

### Filters (left sidebar)
- **Providers**: Multi-select (Netflix, Disney+, etc.)
- **Content Type**: MOVIE or SHOW
- **Monetization**: FLATRATE, RENT, BUY
- **Genres**: Top 15 genres, multi-select
- **Release Year**: Slider range
- **Quality**: 4K, HD, SD

### Results table
- Shows unique titles (not individual offers)
- Columns: Title, Year, Type, Genres, Avg Rating
- Click row to see details
- 25 results per page

### Detail modal
- Full metadata (runtime, age rating, scores)
- All streaming offers with:
  - Provider name
  - Type (flatrate/rent/buy)
  - Quality (4K/HD/SD)
  - Price (if applicable)
  - "Watch Now" deeplink
- **Best Deal** badge (prefers flatrate → cheapest rent → cheapest buy)
- Poster image
- Links to IMDb/TMDB

### Dark mode
- Toggle in top-right corner
- Smooth color transitions
- Not persisted (resets on page refresh)

## Architecture notes

- **Data loading**: CSV loaded once at startup into memory
- **Caching**: Filter options cached with `@lru_cache`
- **Search**: In-memory fuzzy matching via `fuzzywuzzy`
- **Pagination**: Client-side (instant page changes)
- **Performance**: Initial load < 2s, search < 300ms

## Next steps

- Explore different search queries
- Try combining filters
- Check detail pages for titles on multiple providers
- Test dark mode
- Try on mobile device (responsive design)

For full documentation, see:
- [README-dashboard.md](../README-dashboard.md) — User guide
- [docs/features/dashboard.md](../docs/features/dashboard.md) — Developer docs
