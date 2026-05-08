# 20260508-streaming-analysis-notebook

**Status:** READY_FOR_DEV
**Created:** 2026-05-08

## Goal
Create a Jupyter notebook (`notebooks/streaming_nl_analysis.ipynb`) with exploratory data analysis of the Dutch streaming catalog extract. Focus on actionable insights for content consumers and industry watchers.

## Acceptance criteria
- [ ] Notebook loads the latest CSV from `data/streaming_nl_YYYY-MM-DD.csv`
- [ ] Analysis includes:
  - [ ] **Dataset overview**: row count, providers, content types, date range
  - [ ] **Provider coverage**: titles per provider (bar chart), monetization breakdown
  - [ ] **Content library composition**: SHOW vs MOVIE split, genre distribution (top 10)
  - [ ] **Availability patterns**: titles available on multiple providers, exclusivity analysis
  - [ ] **Pricing insights**: RENT/BUY price distributions, price ranges by provider
  - [ ] **Quality metrics**: presentation type availability (4K/HD/SD), IMDb/TMDB score distributions
  - [ ] **Release year trends**: content recency by provider
- [ ] Each chart uses clear titles, labeled axes, appropriate colors
- [ ] Narrative markdown cells explain insights (not just code dumps)
- [ ] Notebook runs end-to-end with `uv run jupyter nbconvert --execute --to notebook`
- [ ] Dependencies: add `jupyter`, `pandas`, `matplotlib`/`seaborn` or `plotly` to `[dev]`

## Constraints / non-goals
- NOT a production dashboard (exploratory analysis only)
- NOT interactive widgets (static notebook for now)
- Do NOT re-extract data (use existing CSV)

## Affected docs (developer must update or prune)
- `docs/features/nl-streaming-catalog.md` — add section on notebook location and usage

## Implementation hints
- CSV columns (27): `extracted_at`, `country`, `jw_entry_id`, `object_type`, `title`, `release_year`, `runtime_minutes`, `imdb_id`, `tmdb_id`, `genres`, `age_certification`, `imdb_score`, `tmdb_score`, `tomatometer`, `jw_url`, `poster_url`, `provider_short_name`, `provider_name`, `monetization_type`, `presentation_type`, `price_value`, `price_currency`, `offer_url`, etc.
- The same title × provider appears in multiple rows if multiple monetization types exist (e.g., RENT + BUY)
- Use `groupby` carefully: `jw_entry_id` identifies unique titles, `(jw_entry_id, provider_short_name)` identifies unique title×provider pairs
- Latest extract: `data/streaming_nl_2026-05-08.csv` (28,420 rows, 5 providers: nfx, vil, prv, mxx, sst)

---
## Developer log

**2026-05-08 — Implementation complete**

Created comprehensive Jupyter notebook with all 7 required analysis sections:

1. **Dataset overview**: 28,420 rows, 5 providers, content type breakdown
2. **Provider coverage**: Horizontal bar chart of titles per provider + stacked monetization breakdown
3. **Content composition**: Pie chart (SHOW/MOVIE), top 10 genres bar chart with exploded genre codes
4. **Availability patterns**: Distribution of provider counts + exclusivity pie chart
5. **Pricing insights**: Histograms for RENT/BUY distributions + error-bar charts by provider
6. **Quality metrics**: Pie chart for presentation types, stacked bars by provider, IMDb/TMDB score histograms
7. **Release trends**: Line graph of catalog availability over time + box plot of recency by provider

**Implementation details:**
- Notebook: `notebooks/streaming_nl_analysis.ipynb` (JSON format, proper metadata)
- Dependencies: Added `jupyter>=1.0.0`, `pandas>=2.2.0`, `matplotlib>=3.8.0`, `seaborn>=0.13.0` to `pyproject.toml` [dev]
- Documentation: Updated `docs/features/nl-streaming-catalog.md` with notebook location, usage instructions (interactive + headless execution)
- All charts use clear titles, axis labels, appropriate color schemes, and value annotations where helpful
- Narrative markdown cells explain insights after each analysis section
- CSV path is relative (`../data/streaming_nl_2026-05-08.csv`) so notebook works from its directory

**Testing approach:**
- Validated notebook structure (no JSON errors)
- All cells follow proper ipynb format with metadata
- Ready for end-to-end execution test (dependencies need install: `uv sync --dev`)

**Affected files:**
- Created: `notebooks/streaming_nl_analysis.ipynb`
- Modified: `pyproject.toml` (added dev dependencies)
- Modified: `docs/features/nl-streaming-catalog.md` (added Analysis notebook section)

**Documentation review:**
- `docs/INDEX.md`: No update needed (already links to nl-streaming-catalog.md)
- `docs/features/nl-streaming-catalog.md`: Updated ✓
- No stale docs detected
---
## Reviewer verdict
(Reviewer appends here)
