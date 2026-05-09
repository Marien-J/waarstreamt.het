# 20260509-provider-canonicalization-and-country-scoping

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
Three bugs share one root cause: provider data is country-naïve and name-fragmented.

1. **Brand fragmentation.** JustWatch returns the same brand under multiple short codes per country (Amazon Prime Video = `prv` in NL, `amp` in US; "Amazon Video" = `amz` is the same brand's TVOD storefront). Apple TV+ vs iTunes is the same story. The UI shows them as separate options and filtering by one excludes offers from the other.
2. **Filters silently fail across countries.** `web/scripts/providers.json` is a hand-curated NL-centric file. On US/DE/JP the catalog uses different short codes (`amp` not `prv`, `mxx`/Max display etc.), so selecting "Amazon Prime Video" in My Providers filters by `prv` and returns zero results.
3. **Wrong providers shown per country.** KPN (`kpn`, NL-only) is in the hardcoded `mainstream` tier in `web/src/lib/providers.ts` and shows up in the filter sidebar for DE/US/JP where it has zero offers.

Fix the data layer once: derive provider lists per country from the actual catalog at preprocess time, and introduce a brand-canonicalization layer so the UI deals in brands ("Amazon", "Apple"), not raw JustWatch short codes. Then verify all cross-filtering works.

## Acceptance criteria

### Brand canonicalization
- [ ] New file `web/scripts/provider-brands.ts` (or `.json`) defines:
  - A `BRAND_BY_SHORT_NAME: Record<string, string>` mapping every observed short_name across all 6 country catalogs to a canonical brand ID. At minimum: `prv|amz|amp → amazon`, `atp|itu → apple`, `mxx → max` (HBO Max / Max consolidation), `nfx → netflix`, `dnp|dis → disney`, `ply → google`, plus per-country exclusives kept as their own brand (e.g. `kpn → kpn`, `vil/vdl → videoland`, `hlu → hulu`, `unx → unext`).
  - A `BRANDS: Record<string, { display_name, brand_color, logo_url? }>` defining the canonical display per brand. Use the FULL official brand name (no abbreviations): "Amazon Prime Video" not "Amazon", "Apple TV+" not "Apple TV Plus", "Max" (the post-rebrand official name), etc.
- [ ] Developer must enumerate every short_name appearing in the 6 `data/streaming_*_providers.csv` files (NL/DE/BE/US/GB/JP) and assign each to a brand. No short_name may be left unmapped — unknown ones default to a brand ID equal to the short_name (passthrough).

### Preprocess emits country-scoped, brand-aware provider data
- [ ] `web/scripts/preprocess.ts` is updated to:
  - For each country, scan its titles' offers, count titles per `brand_id` (deduped across short_names), and emit `web/public/data/providers_<cc>.json` with shape:
    ```json
    {
      "amazon": { "brand_id": "amazon", "display_name": "Amazon Prime Video", "logo_url": "...", "brand_color": "...", "title_count": 1234, "tier": "mainstream", "short_names": ["prv","amz"] },
      ...
    }
    ```
  - Tier derivation: top 8 brands by `title_count` per country = `mainstream`; remaining ≥ a threshold (say 50 titles) = `niche`; rest dropped. (Channel tier may stay empty for now.)
  - The legacy `web/public/data/providers.json` is removed (or replaced with an alias-only stub for backward compat). `web/scripts/providers.json` source file is removed since the data is now derived.
- [ ] Each title's `available_on_flatrate` array in `titles_<cc>.json` is rewritten to contain **brand IDs**, not short_names, deduped (so a title available on both `prv` and `amz` shows up once as `amazon`).
- [ ] Each title's `offers[].provider_short_name` field is supplemented (not replaced) with a new `offers[].brand_id` field so the detail page can group by brand without losing the original short_name (still useful for direct deep-link offer URLs).

### Frontend reads country-scoped brand data
- [ ] `web/src/lib/providers.ts`:
  - Drop the hardcoded `PROVIDER_TIERS` constant.
  - `loadProviders(countryCode: string): Promise<Record<string, BrandMetadata>>` — fetches `providers_<cc>.json`. Cache per-country.
  - `groupProvidersByTier(providers, metadata)` reads the `tier` field from the metadata, not from a hardcoded constant.
- [ ] `web/src/components/filter-sidebar.tsx`, `provider-picker.tsx`, `routes/__root.tsx` (My Providers chips), `routes/index.tsx` (filter logic) all key on **brand IDs** instead of short_names.
- [ ] When `country` changes, the provider sidebar/picker reload to show only that country's brands. KPN does NOT appear in DE/US/GB/JP.
- [ ] My Providers store value migrates: when rehydrated, any value that's not a known brand ID for the current country gets dropped (or attempted-mapped via `BRAND_BY_SHORT_NAME` if it's a legacy short_name). Add a one-time migration in `web/src/store/app-store.ts` `partialize`/rehydrate hook.

### Detail page
- [ ] `routes/title.$id.tsx` "Where to Watch" section groups offers by `brand_id` (so multiple Amazon offers — Prime + rent + buy — collapse under one Amazon card showing all monetizations).
- [ ] The displayed name is the canonical `BRANDS[brand_id].display_name`, never a JustWatch short code.

### Cross-filter verification
- [ ] New script `web/scripts/test-filters.ts` (run via `tsx`) loads every country's `titles_<cc>.json` + `providers_<cc>.json` and asserts:
  - For each country, every brand in `mainstream` tier has at least 50 titles when filtered by FLATRATE monetization.
  - "Amazon Prime Video" (brand `amazon`) filter on NL/DE/US returns ≥ 100 titles each — proving the cross-country code mismatch is fixed.
  - Cross-filter: `brand=netflix + genre=drama + type=MOVIE + monetization=FLATRATE` returns ≥ 10 titles in NL/DE/US/GB/JP.
  - Cross-filter: `brand=netflix + brand=disney` (multi-brand union) returns ≥ titles(netflix) titles (sanity: union ≥ each).
  - No title in the result of any country-scoped filter contains an offer brand that isn't in that country's `providers_<cc>.json`.
  - KPN does NOT appear in `providers_de.json`, `providers_us.json`, `providers_gb.json`, or `providers_jp.json`.
- [ ] `npm run test:filters` script wired in `web/package.json`.

### Gates
- [ ] All existing gates green: `npm run build`, `npm run test:search`, `check-i18n-keys`, `verify-wiring`, `uv run pytest`.
- [ ] `verify-wiring.ts` extended:
  - `web/src/lib/providers.ts` has `loadProviders(countryCode` signature.
  - `web/scripts/preprocess.ts` writes `providers_${cc}.json`.
  - `web/scripts/provider-brands.ts` (or `.json`) exists.
  - `routes/title.$id.tsx` references `brand_id` in offer grouping.

## Constraints / non-goals
- Do NOT re-extract any data from JustWatch. The 6 existing CSVs in `data/` are sufficient — this is purely a downstream data + UI fix.
- Do NOT change i18n keys.
- Do NOT redesign the filter UI visually — just fix what it operates on.
- Channels tier can remain empty in v1.
- If a title has zero offers in the current country (legacy artifact of preprocess), drop it from the country's `titles_<cc>.json`. (This catches catalog hygiene issues for free.)

## Affected docs (developer must update or prune)
- docs/features/streaming-web-app.md — describe brand canonicalization and country-scoped provider lists
- docs/features/streaming-catalog.md — note that preprocess emits `providers_<cc>.json` per country and that brand IDs are the primary key
- docs/architecture/decisions/004-provider-canonicalization.md — NEW ADR (Context: brand fragmentation + country-naïve providers; Decision: brand layer + per-country derived data; Consequences: My Providers values migrate, filters become country-scoped, preprocess is now data-source-of-truth)

## Implementation hints
- Enumerate short_names with: `awk -F, 'NR>1 {gsub(/"/,""); print $1, $2, $3}' data/streaming_*_providers.csv | sort -u`. From there assemble `BRAND_BY_SHORT_NAME`.
- Known brand consolidations to start from (verify by hand against the CSVs):
  - `amazon`: prv (NL/BE/DE/GB), amp (US), amz (Amazon Video TVOD wherever it appears)
  - `apple`: atp (Apple TV+), itu (iTunes / Apple TV TVOD)
  - `max`: mxx (HBO Max / Max)
  - `disney`: dnp / dis
  - `netflix`: nfx
  - `google`: ply (Google Play Movies)
  - Per-country uniques pass through unchanged: kpn, vil/vdl (videoland), hlu (hulu), unx (u-next), str (streamz), bbc (bbc iplayer), itv (itvx), now (NOW), rtp (RTL+), wow, joyn, vrt (VRT MAX), gpl (GoPlay), pmp/pmt (paramount), pcc (peacock), etc.
- Brand display names — use the official current name. Examples:
  - `amazon` → "Amazon Prime Video" (the SVOD service name; even though `amz` is technically TVOD, users think of it as the same Amazon brand)
  - `apple` → "Apple TV+"
  - `max` → "Max"
  - `google` → "Google Play"
- For `available_on_flatrate` migration in preprocess: map each short_name to its brand_id, then `[...new Set(brandIds)]`.
- For the My Providers rehydrate migration: in `app-store.ts` `persist({ migrate })`, if any stored value matches a known short_name, replace with its brand_id; if it's an unknown legacy value, drop it.
- For `test-filters.ts`: import the same `applyFilters` function from `web/src/lib/search.ts` (or a refactored shared module) so the test exercises the actual filter code, not a duplicate.

---
## Developer log
(Developer appends here)

---
## Reviewer verdict
(Reviewer appends here)
