# Streaming Catalog Extractor (Multi-Country)

**Status:** Implemented  
**Created:** 2026-05-08 (NL-only), extended to multi-country 2026-05-09

## Overview

Backend Python CLI job that extracts streaming availability data for 6 countries (NL, DE, BE, US, GB, JP) via the JustWatch API. Produces dated CSV snapshots per country suitable for analysis and web app consumption.

## Supported Countries

| Country | Code | Language | Key Providers |
|---------|------|----------|---------------|
| Netherlands | NL | nl | Netflix, Videoland, Disney+, Amazon Prime Video, HBO Max, SkyShowtime, Apple TV+ |
| Germany | DE | de | Netflix, Amazon Prime Video, Disney+, Apple TV+, RTL+, WOW, Paramount+, Joyn |
| Belgium | BE | nl | Netflix, Streamz, Amazon Prime Video, Disney+, Apple TV+, VRT MAX, GoPlay |
| United States | US | en | Netflix, Hulu, Amazon Prime Video, Disney+, Apple TV+, Max, Paramount+, Peacock |
| United Kingdom | GB | en | Netflix, Amazon Prime Video, Disney+, Apple TV+, BBC iPlayer, NOW, ITVX, Paramount+ |
| Japan | JP | en | Netflix, Amazon Prime Video, Hulu, U-NEXT (Disney+, Apple TV+, Paramount+ unmatched by JustWatch JP API) |

## CLI Usage

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

## Output Files

Per country, two dated CSV files are written to `data/`:

- `data/streaming_<cc>_<lang>_<YYYY-MM-DD>.csv` — main catalog (one row per title × offer)
- `data/streaming_<cc>_<lang>_<YYYY-MM-DD>_providers.csv` — provider metadata

Examples: `streaming_nl_nl_2026-05-09.csv`, `streaming_de_de_2026-05-09.csv`

## Data source rationale

**Why JustWatch:**
- No API key required. Country-aware endpoint for all 5 supported markets.
- Returns IMDb + TMDB IDs → joinable with other catalogs.
- Full offer detail: monetization type, deeplink, price, currency, quality, audio/subtitle languages.

**Library:** [`simple-justwatch-python-api`](https://pypi.org/project/simple-justwatch-python-api/) — unofficial JustWatch GraphQL client.

## Output schema

27 columns including JustWatch IDs, external IDs (IMDb/TMDB), metadata (title, year, runtime, genres, scores), and offer details (provider, monetization, quality, price, deeplinks, audio/subtitle languages).

See `src/streaming_nl/writer.py` for the full column list.

## Configuration

Country configs live in `src/streaming_nl/config.py` under `COUNTRY_CONFIGS`. Each entry specifies:
- `country`: two-letter code
- `language`: primary extraction language
- `provider_names`: target provider list

## Known limitations

1. **1999-row API cap**: The JustWatch API limits `count + offset` to 1999 per `(provider, content_type)` partition. Logged as WARNING if hit.
2. **Provider name fuzzy matching**: Provider names are matched case-insensitively against JustWatch's catalog. Unmatched providers log a WARNING and are skipped.
3. **Unofficial API**: Schema changes may break extraction without notice.

## Preprocess output (web layer)

`web/scripts/preprocess.ts` consumes the CSV files and emits:
- `web/public/data/titles_<cc>.json` — title catalog per country; each offer has `brand_id` (canonical) + `provider_short_name` (raw, for deeplinks). `available_on_flatrate` contains brand IDs.
- `web/public/data/providers_<cc>.json` — brand metadata per country derived from real offer counts; tier = mainstream (top 8) or niche (≥50 FLATRATE titles). Brand IDs are the primary key; see `web/scripts/provider-brands.ts` for the short_name→brand_id mapping.
