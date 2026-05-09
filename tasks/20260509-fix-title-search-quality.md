# 20260509-fix-title-search-quality

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal

Title search misses well-known shows that the user can verify exist in the dataset. Concrete failures reported by the user: searching `suits`, `harry potter`, `the mentalist` — none surface those titles at the top of results, sometimes not at all. The root cause is the current Orama configuration: default English tokenizer with stemming + stop-words + tolerance: 2 produces poor ranking for short titles and multilingual catalogs (DE/NL titles tokenized with English stemmer). Replace the search backend with MiniSearch, configured for prefix + bounded fuzzy + diacritic-stripped lowercase tokens + popularity tiebreaker. Add tests that lock in known-good queries so this regresses noisily next time.

## Scope decisions (binding)

1. **Replace Orama with MiniSearch.** MiniSearch's default tokenizer (Unicode whitespace + punctuation, no stemming, no stop-words) is exactly what we need for a title field across NL/DE/EN/FR. Orama's English-default analyzer is the wrong shape for this dataset.
2. **Normalization is centralized.** A single `normalize(s: string)` helper:
   - lowercases
   - strips diacritics via `s.normalize('NFD').replace(/\p{Diacritic}/gu, '')`
   - collapses whitespace
   Applied as `processTerm` in MiniSearch (both at index and query time).
3. **Search shape:**
   - Indexed field: `title` only, with optional secondary indexed field `original_title` if present in the dataset (skip if absent).
   - `prefix: true` (so "harr" → "Harry Potter").
   - `fuzzy: 0.2` (one typo tolerated for tokens of length ≥ 5).
   - `boost: { title: 2 }` (future-proof; still useful if `original_title` is added).
   - `combineWith: 'AND'` (multi-token queries require all tokens, e.g., `harry potter` requires both).
4. **Result ranking:** MiniSearch's BM25 score, with a tiebreaker bonus for titles whose first token starts with the first query token. Final sort:
   - score (descending),
   - then `imdb_score ?? tmdb_score ?? 0` (descending) as popularity tiebreaker.
5. **Query length floor:** queries shorter than 2 chars return an empty result list (the existing UX of "show all titles when query is empty" is preserved by short-circuiting on `query.trim().length === 0`).
6. **Drop Orama dependency** from `web/package.json`.

## Acceptance criteria

### Backend search lib (`web/src/lib/search.ts`)

- [ ] Orama imports removed. `@orama/orama` removed from `web/package.json` dependencies.
- [ ] MiniSearch added to `web/package.json` dependencies. Run `npm install`.
- [ ] `initializeSearch(titles)` creates a `MiniSearch` with `fields: ['title']`, `storeFields: ['jw_entry_id']`, `processTerm` = normalize, `searchOptions: { prefix: true, fuzzy: 0.2, combineWith: 'AND', boost: { title: 2 } }`.
- [ ] `searchTitles(query, filters)`:
  - For empty query → returns all titles (filtered).
  - For non-empty query → runs MiniSearch search, applies the start-with-first-token bonus, sorts by `(score desc, popularity desc)`, then applies filters.
- [ ] `searchTitles` is **async** still (keep API stable for callers).

### Tests (`web/scripts/test-search.ts` — new node script using `tsx`)

- [ ] New script that loads `web/public/data/titles_nl.json`, builds the index, and asserts:
  - Searching `suits` returns the title `Suits` in the **top 5** results (exact match expected).
  - Searching `harry potter` returns at least one Harry Potter title in the top 5.
  - Searching `mentalist` returns `The Mentalist` in the top 5.
  - Searching `harry poter` (typo) still returns Harry Potter in the top 10.
  - Searching `s` (1 char) returns 0 results (length floor).
  - Empty query returns total title count of the country catalog.
- [ ] Same tests run for `titles_de.json` against German titles known to exist (developer picks 1–2 well-known DE titles, e.g., `tatort`, `dark`).
- [ ] Script exits 0 if all assertions pass, non-zero otherwise. Add it to a `scripts.test:search` entry in `web/package.json`: `"tsx scripts/test-search.ts"`.

### Build + verification

- [ ] `cd web && npm run build` exits 0.
- [ ] `cd web && npm run test:search` exits 0 with all assertions passing. **Reviewer must run this and paste the verbatim output into the verdict.**
- [ ] Existing `npx tsx web/scripts/verify-wiring.ts` still passes.
- [ ] Existing `npx tsx web/scripts/check-i18n-keys.ts` still passes.
- [ ] Existing `uv run pytest` still 18/18.

## Constraints / non-goals

- Do **not** add fields to the indexed schema beyond `title` (and optionally `original_title` if it already exists in the JSON; do not change the preprocessing pipeline to add new fields).
- Do **not** introduce semantic / vector search.
- Do **not** add a search-as-you-type debouncer or virtualization in this task — search quality only.
- Do **not** change the `searchTitles` callsite signature in `routes/index.tsx`.

## Affected docs

- `docs/features/streaming-web-app.md` — update the "search" section: backend is MiniSearch, normalization rules, ranking strategy, known-good queries covered by `test:search`.
- `docs/architecture/decisions/003-search-backend.md` — **NEW** ADR documenting the Orama → MiniSearch swap, why, and the trade-offs (no stemming = won't match singular/plural forms; we accept this for title search).
- `docs/INDEX.md` — link the new ADR.

## Implementation hints

- MiniSearch `processTerm` returning a falsy value drops the term. Empty strings after diacritic strip should be dropped.
- For the start-with-first-token bonus: after MiniSearch returns hits, get the original title from `titlesCache.get(jw_entry_id)`, normalize it, split on whitespace, and if its first token starts with the normalized first query token, multiply the score by 1.5.
- MiniSearch's hit shape: `{ id, score, terms, ... }` plus any `storeFields` you configured. Use `storeFields: ['jw_entry_id']` to keep the existing return shape (`string[]` of jw_entry_ids).
- The current `tolerance: 2` in Orama is the closest analog to `fuzzy: 0.2` in MiniSearch. Don't be tempted to crank fuzzy higher — it explodes false positives on a 17k-row catalog.
- `original_title` field: check `web/scripts/preprocess.ts` to see if `original_title` exists. The CSV columns coming out of `streaming_nl/normalize.py` are the source of truth.
- The user's reproduction: NL catalog at `/`, search bar, type `suits`. Use this as your manual smoke test.

---
## Developer log
(Developer appends here)

---
## Reviewer verdict
(Reviewer appends here)
