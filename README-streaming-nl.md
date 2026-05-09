# streaming-nl

Multi-country streaming catalog extractor using JustWatch data.

## Overview

Backend-only Python CLI job that extracts streaming availability data for 5 countries (NL, DE, BE, US, GB) from major SVOD/TVOD providers via the JustWatch API and writes flat, analyst-friendly CSV dumps.

## Install

Requires Python 3.11+ and `uv`.

```bash
uv sync
```

## Run

```bash
# Extract a single country
uv run python -m streaming_nl --country NL

# Extract multiple countries
uv run python -m streaming_nl --country NL --country DE

# Extract all 5 countries sequentially (~25–60 min total)
uv run python -m streaming_nl --all

# Print help
uv run python -m streaming_nl
```

This will:
- Resolve streaming providers for each country
- Extract movie and show catalogs with offer details
- Write two CSV files to `data/` per country:
  - `streaming_<cc>_<lang>_<YYYY-MM-DD>.csv` — main catalog (one row per title × offer)
  - `streaming_<cc>_<lang>_<YYYY-MM-DD>_providers.csv` — provider metadata

Example: `streaming_nl_nl_2026-05-09.csv`, `streaming_de_de_2026-05-09.csv`

Running on the same day overwrites existing files. Different days create new dated files.

## Output schema

Main CSV columns (snake_case, UTF-8, comma-delimited, quote-all):

| Column                   | Type     | Description                                          |
|--------------------------|----------|------------------------------------------------------|
| `extracted_at`           | ISO ts   | Extraction timestamp (UTC)                           |
| `country`                | str      | Country code (`NL`)                                  |
| `jw_entry_id`            | str      | JustWatch entry ID                                   |
| `jw_object_id`           | int      | JustWatch object ID                                  |
| `object_type`            | str      | `MOVIE` or `SHOW`                                    |
| `title`                  | str      | Title                                                |
| `release_year`           | int/null | Release year                                         |
| `runtime_minutes`        | int/null | Runtime in minutes                                   |
| `imdb_id`                | str      | IMDb ID (e.g., `tt1234567`)                          |
| `tmdb_id`                | str      | TMDB ID                                              |
| `genres`                 | str      | Semicolon-separated genres                           |
| `age_certification`      | str      | Age rating                                           |
| `imdb_score`             | float    | IMDb rating                                          |
| `tmdb_score`             | float    | TMDB rating                                          |
| `tomatometer`            | int      | Rotten Tomatoes tomatometer                          |
| `jw_url`                 | str      | JustWatch URL                                        |
| `poster_url`             | str      | Poster image URL                                     |
| `provider_short_name`    | str      | Provider short code (e.g., `nfx`, `vdl`)             |
| `provider_name`          | str      | Provider display name                                |
| `provider_technical_name`| str      | Provider technical name                              |
| `monetization_type`      | str      | `FLATRATE`, `RENT`, `BUY`, `ADS`, or `FREE`          |
| `presentation_type`      | str      | `4K`, `HD`, `SD`, or empty                           |
| `price_value`            | float    | Price (for rent/buy)                                 |
| `price_currency`         | str      | Currency code (e.g., `EUR`)                          |
| `offer_url`              | str      | Direct link to watch/purchase                        |
| `audio_languages`        | str      | Semicolon-separated audio language codes             |
| `subtitle_languages`     | str      | Semicolon-separated subtitle language codes          |

**Sample output (first 3 columns):**

```csv
"extracted_at","country","jw_entry_id"
"2026-05-08T14:23:45Z","NL","tm123456"
"2026-05-08T14:23:45Z","NL","ts654321"
```

## Known limitations

- **1999-row API cap**: The JustWatch API limits `count + offset` to 1999 per partition. Logged as WARNING if hit.
- **Unofficial API**: Uses the unofficial JustWatch GraphQL API via `simple-justwatch-python-api`. Schema changes may break extraction.
- **No database backend**: CSV is the deliverable. SQLite/Postgres integration is a stretch goal.
- **Presentation type collapsing**: When a title has multiple quality levels (SD/HD/4K) for the same offer, only the highest quality is kept.

## Attribution

> Catalog availability data sourced from JustWatch via the unofficial `simple-justwatch-python-api` library. JustWatch attribution must be displayed in any user-facing surface built on this data. This project is for personal/educational use; for production or commercial use, contact JustWatch for a data partnership.

## Development

Run tests:

```bash
uv run pytest
```

Type check:

```bash
uv run mypy src/streaming_nl
```

Lint:

```bash
uv run ruff check src tests
```

## Future enhancements

- **TMDB enrichment**: Join with TMDB API for additional metadata (cast, crew, detailed descriptions).
- **Multi-country support**: Parameterize country/language.
- **Database backend**: Load into SQLite or Postgres for querying.
- **Historical tracking**: Store snapshots over time to track availability changes.

## License

MIT
