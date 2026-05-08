# Dutch Streaming Dashboard

Web interface for searching and exploring the Dutch streaming catalog.

## Setup

Install with dashboard dependencies:

```bash
uv sync --extra dashboard
```

## Usage

Run the dashboard:

```bash
uv run python -m dashboard
```

The dashboard will:
1. Auto-detect the latest CSV in `data/`
2. Start a web server on http://localhost:8050
3. Open in your browser

### CLI options

```bash
# Specify port
uv run python -m dashboard --port 8080

# Specify CSV file
uv run python -m dashboard --csv data/streaming_nl_2026-05-08.csv

# Run in debug mode (hot reload)
uv run python -m dashboard --debug
```

## Features

### Search
- Real-time fuzzy search across titles
- Search by IMDb ID (e.g., `tt1234567`)
- Search by TMDB ID (numeric)
- Minimum 2 characters to trigger search
- 300ms debounce for smooth typing

### Filters
- **Providers**: Multi-select from all available streaming services
- **Content Type**: MOVIE or SHOW
- **Monetization**: FLATRATE, RENT, BUY, etc.
- **Genres**: Top 15 genres (multi-select)
- **Release Year**: Range slider
- **Quality**: Filter by 4K, HD, SD

### Results
- Paginated table (25 results per page)
- Shows: title, year, type, genres, average rating
- Sortable columns
- Click any row to see details

### Title Details
- Full metadata (runtime, age rating, scores)
- All streaming offers with:
  - Provider name
  - Watch/rent/buy options
  - Quality (4K/HD/SD)
  - Pricing
  - Direct deeplinks
- **Best Deal** highlighted (prefers flatrate, then cheapest rent/buy)
- Poster image
- IMDb/TMDB links

### Dark Mode
- Toggle in top-right corner
- Smooth transitions (200ms)
- Persists during session

## Performance

- **Initial load**: < 2s (CSV loaded once at startup)
- **Search response**: < 300ms (in-memory fuzzy matching)
- **Pagination**: Client-side (instant)
- **Caching**: Filter options and search results cached

## Design

Millennial aesthetic with clean, card-based layouts:

**Light mode:**
- Background: `#FAFAFA`
- Cards: `#FFFFFF`
- Accent: `#4A90E2`

**Dark mode:**
- Background: `#121212`
- Cards: `#1E1E1E`
- Accent: `#60A5FA`

Mobile-responsive with breakpoints at 768px and 1024px.

## Architecture

See [docs/features/dashboard.md](docs/features/dashboard.md) for implementation details.

## Limitations

- **Local only**: Not designed for production deployment
- **Static data**: CSV snapshot, no real-time updates
- **No auth**: Public access on local network
- **Memory footprint**: Full dataset loaded in RAM (~28k rows ≈ 50MB)

## Troubleshooting

**Error: No CSV found**
- Run `uv run python -m streaming_nl` first to generate data

**Port already in use**
- Try a different port: `uv run python -m dashboard --port 8051`

**Slow search**
- Check dataset size (>100k rows may need optimization)
- Ensure `python-levenshtein` is installed (compiled C extension)

## Attribution

Powered by JustWatch data via `streaming-nl` extractor. JustWatch attribution must be displayed in any public-facing deployment.
