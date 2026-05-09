# 004 — Provider Canonicalization and Country-Scoped Provider Data

## Context

Three bugs shared one root cause: provider data was country-naïve and name-fragmented.

1. **Brand fragmentation.** JustWatch returns the same brand under multiple short codes per country (Amazon Prime Video = `prv` in NL/BE, `amp` in US/DE/GB/JP). The UI showed them as separate filter options, so filtering by "Amazon" on one country returned zero results on another.
2. **Filters silently fail across countries.** `web/scripts/providers.json` was a hand-curated NL-centric file. On US/DE/JP, different short codes meant selecting "Amazon Prime Video" filtered by `prv` and returned zero results.
3. **Wrong providers shown per country.** KPN (`kpn`, NL-only) was hardcoded as mainstream and showed in the filter sidebar for DE/US/JP where it has zero offers.

## Decision

Introduce a brand-canonicalization layer and derive per-country provider lists from actual catalog data at preprocess time.

### Brand canonicalization (`web/scripts/provider-brands.ts`)
- `BRAND_BY_SHORT_NAME`: maps every JustWatch `short_name` observed across all 6 country catalogs to a canonical `brand_id`. Known consolidations: `prv|amp|amz → amazon`, `nfx → netflix`, `mxx → max`, `app → paramount`, `atp|itu → apple`, `ply → google`, `hlu → hulu`. Per-country exclusives pass through unchanged.
- `BRANDS`: canonical `{ display_name, brand_color, logo_url? }` per brand ID using official current names ("Amazon Prime Video", "Apple TV+", "Max", "Disney+", etc.).

### Per-country derived provider data (`web/scripts/preprocess.ts`)
- For each country: scans its titles' FLATRATE offers, counts unique titles per `brand_id`, emits `web/public/data/providers_<cc>.json`.
- Tier assignment: top 8 brands by title count = `mainstream`; remaining ≥ 50 titles = `niche`; rest dropped.
- Each title's `available_on_flatrate` array contains brand IDs (deduped), not raw short_names.
- Each offer retains `provider_short_name` (for deep-link URLs) and gains `brand_id`.

### Frontend reads country-scoped brand data (`web/src/lib/providers.ts`)
- `loadProviders(countryCode)`: async, per-country cached, fetches `providers_<cc>.json`.
- `groupProvidersByTier`: reads `tier` from metadata, no hardcoded constants.
- My Providers store (`app-store.ts`): persist version 2 with migration translating legacy short_names → brand_ids; unknown values are dropped.

## Consequences

- **Positive:** KPN no longer appears in DE/US/GB/JP sidebars. Amazon filter works correctly across all countries. Provider list is always derived from real catalog data — no stale hand-curation.
- **Positive:** Filtering by brand_id works cross-country because the canonical ID is the same regardless of which JustWatch short_name the country uses.
- **Negative:** Users with saved My Providers preferences get a one-time migration; any saved short_name that has a brand_id equivalent is remapped, truly unknown values are dropped.
- **Neutral:** `web/scripts/providers.json` (legacy hand-curated source) is no longer the source of truth; it can be removed. `web/public/data/providers.json` is superseded by per-country files.

## Updates 2026-05-09 (task 20260509-complete-brand-coverage)

The initial implementation only enumerated brand codes from the 6 small `data/streaming_*_providers.csv` lookup files (~6 entries per country). The main offer-level CSVs contain many additional provider short_names that appear in title offers (`mag`, `etv`, `mbi`, `cru`, `uck`, `wki`, etc.) — these fell through as passthrough brands, displaying raw 3-letter codes in the UI.

### Changes

- **Brand enumeration source:** `BRAND_BY_SHORT_NAME` in `web/scripts/provider-brands.ts` now covers every short_name observed in all 6 offer-level CSVs, not just the small providers lookup files. Total: ~120+ short_name mappings.
- **MagentaTV consolidation:** both `mag` and `etv` (technical_name: `entertaintv`) map to brand_id `magenta` with `display_name: "MagentaTV"`.
- **New brands added:** MUBI (`mbi`/`amu`), Crunchyroll (`cru`/`cra`), BritBox (`bbo`/`abb`/`bba`), Sky Go (`skg`), ARD Plus (`ard`/`ara`/`arl`), Rakuten TV (`wki`), UCI Kino (`uck`), Acorn TV (`act`/`aac`/`acr`), many US-specific channel providers, and JP-specific providers.
- **Provider name fallback in preprocess:** passthrough brand IDs (short_names not in `BRAND_BY_SHORT_NAME`) now fall back to the JustWatch `provider_name` column from the CSV instead of the raw 3-letter code, so even unmapped brands display correctly.
- **UI safety net:** `title-detail.tsx` falls back to `offer.provider_name` (full name) when a `brand_id` is missing from the loaded `providers_<cc>.json`.
- **Regression guard:** `web/scripts/test-filters.ts` assertion [7] rejects any `providers_<cc>.json` entry where `display_name.length <= 4 && display_name === display_name.toLowerCase()`.
