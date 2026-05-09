# ADR 003: Search Backend — Orama → MiniSearch

**Date:** 2026-05-09  
**Status:** Accepted

## Context

Title search was producing poor results for well-known shows (`suits`, `harry potter`, `the mentalist`). Root cause: Orama's default English tokenizer applies stemming and stop-word removal, which degrades ranking for short titles and produces unexpected misses in multilingual catalogs (NL/DE/EN/FR titles processed with an English stemmer).

## Decision

Replace `@orama/orama` with **MiniSearch** (`minisearch`).

Configuration:
- `fields: ['title']`
- `processTerm`: lowercase + NFD diacritic-strip + whitespace-collapse (no stemming, no stop-words)
- `searchOptions: { prefix: true, fuzzy: 0.2, combineWith: 'AND', boost: { title: 2 } }`
- Post-search 1.5× score bonus when a title's first token starts with the first query token
- Popularity tiebreaker: `imdb_score ?? tmdb_score ?? 0` descending

Query length floor: < 2 chars → empty result (reduces noise). Empty query → all titles (existing UX preserved).

## Consequences

**Better:**
- `suits` correctly surfaces "Suits" at rank #1
- `harry potter` returns Harry Potter titles in top 5
- `harry poter` (typo) still finds Harry Potter (fuzzy 0.2)
- Works correctly for NL, DE, BE, US, GB catalogs without language-specific config
- MiniSearch is ~18 kB gzipped vs Orama ~44 kB

**Trade-offs accepted:**
- No stemming: `suit` will not find `Suits` (singular/plural forms not matched) — acceptable for title-exact search
- `fuzzy: 0.2` tolerates one edit for tokens ≥ 5 chars; cranking it higher would produce false positives on a 17k-row catalog
- No semantic / vector search (not needed for this use case)

Known-good queries are locked in `web/scripts/test-search.ts` (`npm run test:search`) to catch regressions.

## Update — 2026-05-10: index now builds in a Web Worker

Following [ADR 006](006-data-tiering-and-worker.md), the catalog is fetched and parsed off the main thread in `web/src/workers/catalog-worker.ts`. The MiniSearch index is built inside the same worker over the rehydrated `Title[]` (compact wire keys decoded in `web/src/lib/data.ts`). The worker posts the finished `Title[]` + serialised index to the main thread, which attaches them via `attachWorker()` in `routes/index.tsx`. This change eliminates the multi-second main-thread freeze on large catalogs (US 34 MB, DE 20 MB) without any change to search ranking, fuzzy parameters, or query semantics.
