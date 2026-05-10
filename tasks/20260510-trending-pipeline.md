# 20260510-trending-pipeline

**Status:** READY_FOR_DEV
**Created:** 2026-05-10

## Goal

Extend the extraction pipeline to capture JustWatch streaming chart rank (`streaming_charts.rank`) per title, drop Japan support from all layers (Python config, CSV data files, preprocess script, public data), re-extract catalogs for the 5 remaining countries (NL, DE, BE, US, GB), run `npm run preprocess` to rebuild JSON, and wire the `chart_rank` field end-to-end so the Trending rail in the UI becomes data-driven.

**Prerequisite:** Task `20260510-ux-polish` must be merged first — it adds `chart_rank: number | null` to the `Title` interface and `cr?: number | null` to `WireCatalogEntry`.

## Acceptance criteria

- [ ] `src/streaming_nl/writer.py` `COLUMNS` list includes `"streaming_charts_rank"` after `"tomatometer"`.
- [ ] `src/streaming_nl/normalize.py` `media_entry_to_rows()` emits `"streaming_charts_rank"` in each row dict: `str(entry.streaming_charts.rank)` if `entry.streaming_charts` is not None, else `""`.
- [ ] `JP` key is removed from `COUNTRY_CONFIGS` in `src/streaming_nl/config.py`.
- [ ] `web/scripts/preprocess.ts` `SUPPORTED_COUNTRIES` no longer contains `'jp'`.
- [ ] `web/scripts/preprocess.ts` `CSVRow` interface includes `streaming_charts_rank: string`.
- [ ] `web/scripts/preprocess.ts` `processCsv()` reads `streaming_charts_rank` from rows and sets it on each title (pick the minimum non-empty rank across all rows for that jw_entry_id, since rank is title-level not offer-level).
- [ ] `web/scripts/preprocess.ts` `WireCatalogEntry` includes `cr: number | null` and `toCatalogEntry()` sets it from `title.chart_rank`.
- [ ] Fresh CSVs for NL, DE, BE, US, GB exist in `data/` dated 2026-05-10 (or later).
- [ ] `npm run preprocess` succeeds and emits `catalog_<cc>.json` for each of the 5 countries (no `catalog_jp.json`).
- [ ] In the resulting `catalog_nl.json`, a sample of titles that appear on the JustWatch NL streaming charts have a non-null `cr` value.
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] `uv run pytest -q` passes (17 tests — update if test count changes).

## Constraints / non-goals

- Do NOT add `streaming_charts_trend` or other chart sub-fields in this task — just `rank`.
- Do NOT delete old JP CSV files from `data/` — leave them (they're just unused).
- Do NOT delete `web/public/data/catalog_jp.json` / `offers_jp.json` / `providers_jp.json` manually — `preprocess.ts` only writes countries in `SUPPORTED_COUNTRIES`, so they become stale. Leave them on disk; they won't be served.
- Do NOT run a full extraction if tests or code changes fail — fix those first.
- The extraction is a long-running operation (~several hours for 5 countries × 2 content types × many providers). Kick it off with `uv run python -m streaming_nl --all` and wait.

## Affected docs (developer must update or prune)

- `docs/features/streaming-catalog.md` — remove JP; note streaming_charts_rank field.
- `docs/features/streaming-web-app.md` — update Trending section description; remove JP from country list.

## Implementation hints

### 1. `normalize.py` — add streaming_charts_rank

In `media_entry_to_rows()`, add to the `row` dict (alongside `"tomatometer"`):

```python
"streaming_charts_rank": (
    str(entry.streaming_charts.rank)
    if entry.streaming_charts and entry.streaming_charts.rank is not None
    else ""
),
```

### 2. `writer.py` — add column

In `COLUMNS`, add `"streaming_charts_rank"` right after `"tomatometer"`. The DictWriter will automatically include it.

### 3. `config.py` — remove JP

Delete the `"JP"` key and its dict from `COUNTRY_CONFIGS`.

### 4. `preprocess.ts` — CSVRow + processCsv + wire format

**CSVRow interface:** add `streaming_charts_rank: string`.

**`processCsv()`:** Track the best (minimum) chart rank per title. Initialize `chartRankMap = new Map<string, number>()` before the row loop. Inside the loop, after resolving `jwEntryId`:

```ts
const rawRank = row.streaming_charts_rank
if (rawRank) {
  const r = parseInt(rawRank, 10)
  if (!isNaN(r)) {
    const prev = chartRankMap.get(jwEntryId)
    if (prev === undefined || r < prev) chartRankMap.set(jwEntryId, r)
  }
}
```

After building `titlesWithOffers`, assign:
```ts
for (const title of titlesWithOffers) {
  title.chart_rank = chartRankMap.get(title.jw_entry_id) ?? null
}
```

The `Title` interface in `preprocess.ts` already has a local definition — add `chart_rank: number | null` to it.

**`WireCatalogEntry`** (local interface in preprocess.ts): add `cr: number | null`.

**`toCatalogEntry()`:** add `cr: title.chart_rank`.

**`SUPPORTED_COUNTRIES`:** change to `['nl', 'de', 'be', 'us', 'gb']`.

### 5. Run extraction

```bash
uv run python -m streaming_nl --all
```

This runs all 5 country configs (JP is removed) in sequence. May take 4-8 hours. Once complete:

```bash
cd web && npm run preprocess
```

Verify NL catalog: `node -e "const d=require('./public/data/catalog_nl.json'); const ranked=d.entries.filter(e=>e.cr!==null&&e.cr!==undefined); console.log('Ranked titles:', ranked.length, 'Sample:', ranked.slice(0,3).map(e=>({t:e.t,cr:e.cr})))"`

### 6. Fix tests if needed

`tests/_fixtures.py` has `streaming_charts=None` — this is fine as-is (the normalizer handles None gracefully). If any test row dict is missing the `streaming_charts_rank` key and that causes a DictWriter error, add `"streaming_charts_rank": ""` to fixture row dicts.

Check `tests/` for any JP-specific assertions and remove or update them.

---
## Developer log
(Developer appends here)

---
## Reviewer verdict
(Reviewer appends here)
