# NL Streaming Catalog Extractor

**Status:** Implemented  
**Created:** 2026-05-08

## Overview

Backend-only Python CLI job that extracts streaming availability data for the Dutch market via the JustWatch API. Produces dated CSV snapshots suitable for analysis.

## Data source rationale

**Why JustWatch:**
- Same data source TMDB credits for `/watch/providers`. Going direct gets full offer detail (monetization type, deeplink, price, currency, quality, audio/subtitle languages) in one API call.
- No API key required, no registration. NL is first-class.
- Returns IMDb + TMDB IDs → joinable with other catalogs.
- Comprehensive Dutch provider coverage including local services (Videoland, NPO Plus).

**Library:** [`simple-justwatch-python-api`](https://pypi.org/project/simple-justwatch-python-api/) — unofficial JustWatch GraphQL client (MIT licensed, Python 3.11+, actively maintained).

## Target providers (Dutch market)

| Provider              | Notes                                                    |
|-----------------------|----------------------------------------------------------|
| Netflix               | ~51% NL market share                                      |
| Videoland             | RTL-owned, NL-native — critical for NL coverage           |
| Disney+               | Includes "Star" content tier                              |
| Amazon Prime Video    | Note NL `short_name` differs from US                      |
| HBO Max               | Rebranded in 2025                                         |
| SkyShowtime           | Comcast/Paramount JV, launched NL Oct 2022                |
| Apple TV+             | Smaller catalog, originals matter                         |

Provider codes are resolved at runtime via fuzzy matching against JustWatch's provider list for NL.

## Output schema

Two CSV files per run:

### Main catalog: `data/streaming_nl_<YYYY-MM-DD>.csv`

One row per **title × offer**. A title available on Netflix (4K flatrate) + Pathé Thuis (HD rent) = 2 rows.

27 columns including:
- JustWatch IDs (`jw_entry_id`, `jw_object_id`)
- External IDs (`imdb_id`, `tmdb_id`)
- Metadata (title, release year, runtime, genres, age rating, scores)
- Offer details (provider, monetization type, presentation type, price, deeplink)
- Audio/subtitle language support

**Presentation type collapsing:** When a title has multiple quality levels (SD/HD/4K) for the same `(provider, monetization_type)`, only the highest quality is kept.

### Provider lookup: `data/streaming_nl_<YYYY-MM-DD>_providers.csv`

Resolved provider metadata (display name, short name, country) for joins and verification.

## Known limitations

1. **1999-row API cap**: The JustWatch API limits `count + offset` to 1999 per `(provider, content_type)` partition. With ~7 providers × 2 types, expect ~26k rows max. Logged as WARNING if cap is hit.

2. **Unofficial API**: Schema changes may break extraction. Wrapped with retries on network errors; API errors fail fast with clear messages.

3. **NL-only**: Hardcoded country. Multi-country support is future work.

4. **No database in v1**: CSV is the deliverable. SQLite/Postgres loading is a stretch goal.

## Usage

```bash
# Install (requires Python 3.11+, uv)
uv sync

# Run full extract
uv run python -m streaming_nl

# Output
data/streaming_nl_2026-05-08.csv           # Main catalog
data/streaming_nl_2026-05-08_providers.csv # Provider lookup
```

Re-running on the same day overwrites. Different days create new dated files.

## Future enrichment paths

- **TMDB join**: Use `tmdb_id` to fetch cast, crew, detailed descriptions, episode counts.
- **Multi-country**: Parameterize country/language, partition extraction.
- **Database backend**: Load CSV into SQLite/Postgres with proper schema and indexes.
- **Historical tracking**: Store daily snapshots to track availability changes over time.
- **Price monitoring**: Alert on price changes for rent/buy offers.

## Testing

- `test_normalize.py`: Fixture-based tests covering presentation type collapsing, missing fields, multi-offer scenarios.
- `test_providers.py`: Provider resolution sanity checks (successful match, partial match, zero-match exit).

Coverage target: ≥80% on `normalize.py` and `extract.py`.

## Attribution

> Catalog availability data sourced from JustWatch via the unofficial `simple-justwatch-python-api` library. JustWatch attribution must be displayed in any user-facing surface built on this data. This project is for personal/educational use; for production or commercial use, contact JustWatch for a data partnership.
