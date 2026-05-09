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
