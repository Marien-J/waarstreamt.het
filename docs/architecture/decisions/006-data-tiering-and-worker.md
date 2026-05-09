# ADR 006: Data Tiering, Compact Wire Format, and Web Worker Index Build

**Date:** 2026-05-10  
**Status:** Accepted

## Context

The original data pipeline emitted one `titles_<cc>.json` per country containing every field (id, title, genres, poster, scores, all offer URLs, audio/subtitle language lists, prices, etc.). The resulting files were:

| Country | Old `titles_<cc>.json` |
|---------|------------------------|
| NL | ~37 MB |
| BE | ~38 MB |
| GB | ~79 MB |
| DE | ~112 MB |
| JP | ~85 MB |
| US | ~179 MB |

US and DE exceeded GitHub Pages' **100 MB per-file hard limit**, breaking the deploy. Even below that limit, the browser had to download the full blob before rendering anything, then parse and index it synchronously on the main thread — freezing the UI for 5–10 seconds on the largest countries.

## Decision

### 1 — Two-tier data split: catalog + offers

Each country is split into two tiers:

**`web/public/data/catalog_<cc>.json`** — slim, loaded eagerly.  
Contains only the fields needed for grid cards, filter chips, and the search index:  
`id`, `title`, `type`, `year`, `runtime`, `poster`, `genres`, `imdb`, `tmdb`, `tomato`, `age_cert`, `flatrate` (brand id list), `rent_lo`, `buy_lo`, `monet` (set of monetization types), `brands` (all brand ids with any offer, used by the provider filter).  
No offer URLs, no per-offer prices, no audio/subtitle language lists.

**`web/public/data/offers_<cc>.json`** (or sharded `offers_<cc>_<n>.json`) — loaded lazily.  
A `Record<id, Offer[]>` where each `Offer` keeps: `brand_id`, `provider_short_name`, `monetization_type`, `presentation_type`, `price_value`, `offer_url`, `audio_languages`, `subtitle_languages`.  
`currency` is stored once at the file root. `provider_name` and `provider_technical_name` are dropped (looked up via brands at runtime).

Resulting file sizes:

| Country | catalog | offers | shard count |
|---------|---------|--------|-------------|
| NL | 11 MB | 16 MB | 1 |
| BE | 11 MB | 14 MB | 1 |
| DE | 20 MB | 27 + 26 MB | 2 |
| GB | 19 MB | 35 MB | 1 |
| JP | 12 MB | 21 MB | 1 |
| US | 34 MB | 41 + 41 MB | 2 |

Every file stays comfortably under 50 MB.

### 2 — Compact wire format

All catalog and offers JSON files use single- or two-character keys on disk (e.g. `i` → `id`, `t` → `title`, `tp` → `type`, `y` → `year`, `r` → `runtime`, `p` → `poster`, `g` → `genres`, `im` → `imdb`, `td` → `tmdb`, `tm` → `tomato`, `a` → `age_cert`, `f` → `flatrate`, `rl` → `rent_lo`, `bl` → `buy_lo`, `mn` → `monet`, `b` → `brands`).

The mapping table and rehydration functions live exclusively in [`web/src/lib/data.ts`](../../../web/src/lib/data.ts). UI components (`routes/index.tsx`, `components/title-card.tsx`, `routes/title.$id.tsx`, etc.) consume only the rehydrated `Title` / `Offer` types and are unaware of the wire format.

### 3 — Offer sharding by id-mod-K

When `offers_<cc>.json` would exceed 50 MB, `preprocess.ts` shards it into K files. The shard index for a title id is:

```
shard = parseInt(id.replace(/^[a-z]+/, '')) % K
```

K is the smallest power of 2 such that every shard is ≤ 50 MB. In practice this is K = 2 for DE and US.  
The lazy loader in [`web/src/lib/data.ts`](../../../web/src/lib/data.ts) (`loadOffersForTitle`) computes the same formula to select the correct shard URL. Fetched shards are cached in a module-level `Map` so repeat detail-page opens within the same session are instant.

### 4 — Web Worker for catalog fetch + index build

Parsing and indexing a 34 MB JSON blob (US) on the main thread blocks for ~3–5 seconds on a mid-range device. The solution: a **dedicated Web Worker** at [`web/src/workers/catalog-worker.ts`](../../../web/src/workers/catalog-worker.ts).

The worker:
1. Receives a `{type:'load', country, baseUrl}` message.
2. Fetches `catalog_<cc>.json` and parses it (fully off the main thread).
3. Rehydrates the compact wire records into `Title[]`.
4. Builds the MiniSearch index over `Title[]`.
5. Posts `{type:'ready', titles: Title[], index: ...}` back to the main thread via `postMessage`.

The main thread ([`web/src/routes/index.tsx`](../../../web/src/routes/index.tsx)) shows the grid skeleton immediately on mount, lets the search input remain interactive, queues any query typed before `ready`, and flushes the queue once the worker posts `ready`. No spinner blocks the search field.

Vite's built-in worker support (`new Worker(new URL('./catalog-worker.ts', import.meta.url), { type: 'module' })`) is used — no additional Vite plugins needed.

### 5 — Why no service worker / IndexedDB

- GitHub Pages does not set `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`, so `SharedArrayBuffer` is not available.
- A **service worker** would add significant complexity (install/activate lifecycle, cache invalidation strategy, separate build entry) for a benefit (offline support) the product doesn't need.
- **IndexedDB** persistence would require a schema migration story and versioned cache invalidation tied to the build hash. The HTTP cache (ETag / `Cache-Control: immutable` on hashed assets) already covers warm-load performance adequately.
- The in-memory shard cache in `data.ts` is sufficient: detail pages are rarely visited for more than a few dozen unique titles per session.

## Consequences

**Better:**
- Every output file is ≤ 50 MB — GitHub Pages deploy is unblocked.
- Main thread is never blocked by JSON parsing or index construction.
- Grid skeleton appears on the first frame after route mount; search is interactive before the catalog finishes loading.
- Detail-page offers load lazily on first click; subsequent clicks within the same session (same shard) are instant.
- Old monolithic `titles_<cc>.json` files are removed from the repository.

**Trade-offs accepted:**
- An extra network round-trip to load the offers shard on first detail-page click (typically one fetch of 14–41 MB). Acceptable because the detail page has its own loading state and users don't open details on first paint.
- The compact key mapping must be kept in sync between `preprocess.ts` and `data.ts`. A mismatch silently produces `undefined` fields. The existing `test-search.ts` and `test-filters.ts` scripts catch this at CI time because they read the real emitted files.
- `manifest.json` now records `offers_shard_count` per country; any future tooling that reads the manifest must handle K > 1.
