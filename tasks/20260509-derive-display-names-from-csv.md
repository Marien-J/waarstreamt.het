# 20260509-derive-display-names-from-csv

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
The CSV has a `provider_name` column with the canonical full name (e.g. "MagentaTV", "Amazon Prime Video", "MUBI"). The previous brand-coverage task hand-authored 100+ `display_name` entries in `BRANDS` when JustWatch's data already contains them. Stop hand-writing names. Derive `display_name` for each brand from the CSV at preprocess time.

The `BRAND_BY_SHORT_NAME` consolidation table stays — it's still needed to merge multi-code brands (e.g. `amp`/`prv`/`amz` → `amazon`). But the `BRANDS` registry's `display_name` field becomes unused and should be dropped.

## Acceptance criteria

- [ ] In `web/scripts/preprocess.ts` `deriveProviders`, for each `brand_id`, compute `display_name` as the `provider_name` of the most-frequent (by FLATRATE-offer-count) `provider_short_name` within that brand. Tie-break: alphabetic on provider_name. Fallback (brand has zero FLATRATE offers): the `provider_name` of the most-frequent offer of any monetization type. Final fallback: brand_id itself (should never trigger after preprocess).
- [ ] Drop the entire `display_name` field from the `BRANDS` registry in `web/scripts/provider-brands.ts`. Keep `brand_color` and `logo_url` (those are not in the CSV). Drop any `BRANDS` entry that has no `logo_url` AND no non-default `brand_color` — they have no purpose anymore.
- [ ] `BrandInfo` interface shrinks accordingly (`display_name` removed).
- [ ] `deriveProviders` no longer reads `meta?.display_name`; it reads only `meta?.logo_url` and `meta?.brand_color`.
- [ ] Update the regression assertion in `web/scripts/test-filters.ts` — keep the "no lowercase ≤4-char display_name" check, but with the new derivation it should naturally pass since all CSV provider_names are full names.
- [ ] Verify by spot-checking `web/public/data/providers_de.json` after build: `magenta` brand has `display_name: "MagentaTV"` (from CSV), `amazon` has `display_name: "Amazon Prime Video"`, etc. — without any of these being hand-written.
- [ ] Update ADR 004 (or append a new short ADR 006) noting the simplification: "display_name is derived from CSV `provider_name`, not hand-authored."
- [ ] All gates green: pytest, build, test:search, test:filters, check-i18n-keys, verify-wiring.

## Constraints / non-goals
- Do NOT change `BRAND_BY_SHORT_NAME` consolidation rules — those still earn their keep.
- Do NOT remove `logo_url` overrides — JustWatch icon URLs are not in the offer CSV.
- Do NOT touch the monetization toggle or any other unrelated feature.
- Do NOT re-run extraction.

## Implementation hints
- The `provider_name` column is already captured in `Offer.provider_name` during CSV parsing (line ~165 of `preprocess.ts`).
- For the most-frequent-FLATRATE-short_name selection per brand, accumulate a `Map<brand_id, Map<short_name, { provider_name, count }>>` while walking offers.
- After this change, `web/scripts/provider-brands.ts` becomes ~15 lines: just the `BRAND_BY_SHORT_NAME` map plus a tiny `BRANDS: Record<string, { logo_url?: string; brand_color?: string }>` of overrides for the handful of brands whose logos JustWatch doesn't auto-resolve.

---
## Developer log

**Branch:** `agent/20260509-derive-display-names-from-csv` stacked on `agent/20260509-monetization-coalesce-and-purchases-toggle` (monetization PR not yet merged to main — Reviewer should stack).

**Files changed:**
- `web/scripts/preprocess.ts` — replaced `brandProviderName` (first-seen fallback) with `brandFlatrateOffers` + `brandAllOffers` maps counting FLATRATE/all offers per (brand_id, short_name); added `pickDisplayName` helper; derive `display_name` from most-frequent short_name's provider_name (FLATRATE-first, any-offer fallback, brand_id final fallback).
- `web/scripts/provider-brands.ts` — removed 103 `display_name: '...',` lines from `BRANDS` entries; removed `display_name: string` from `BrandInfo` interface; updated BRANDS JSDoc comment. No entries dropped (all have non-default brand_color or logo_url).
- `docs/architecture/decisions/004-provider-canonicalization.md` — appended "Updates 2026-05-09 [simplification]" section.
- `docs/INDEX.md` — updated ADR 004 description.
- `tasks/_queue.json` — status IN_DEV → READY_FOR_REVIEW.

**Tests added:** none (existing test-filters.ts [7] assertion already validates derived display_names are not raw codes).

**Docs updated:** ADR 004 (appended), INDEX.md (updated description).

**`provider-brands.ts` line count delta:** removed 103 `display_name` lines + 1 interface line = −104 lines net (plus minor comment update).

**Sample derived display_names per country (FLATRATE-driven):**
- DE: `netflix→"Netflix"`, `amazon→"Amazon Prime Video"`, `magenta→"Magenta TV+"` (CSV says "Magenta TV+", not "MagentaTV" — CSV is authoritative), `crunchyroll→"Crunchyroll Amazon Channel"` (cra has more DE FLATRATE offers than cru)
- NL: `amazon→"Amazon Prime Video"`, `max→"HBO Max"`, `videoland→"Videoland"`
- US: `amazon→"Amazon Prime Video"`, `disney→"Disney Plus"` (CSV says "Disney Plus", not "Disney+")
- GB: `amazon→"Amazon Prime Video"`, `itv→"ITVX Premium"` (itp code dominant)
- JP: `amazon→"Amazon Prime Video with Ads"` (pva has most JP FLATRATE offers), `unx→"U-NEXT"`
- BE: `amazon→"Amazon Prime Video"`, `netflix→"Netflix"`

**Gate results:** all green.
- `uv run pytest -q`: 18 passed
- `npm run build`: ✓ all 6 countries preprocessed, Vite built in 2.06s
- `npm run test:search`: 9 passed, 0 failed
- `npm run test:filters`: 243 assertions PASS
- `npx tsx scripts/check-i18n-keys.ts`: ✅ all 4 dictionaries 60 keys
- `npx tsx scripts/verify-wiring.ts`: PASS

**Surprising:** The CSV `provider_name` differs from some hand-authored names ("Magenta TV+" vs "MagentaTV", "Disney Plus" vs "Disney+", "HBO Max" vs "Max"). These are now authoritative from JustWatch CSV data — not regressions.

---
## Reviewer verdict
APPROVED. All 6 gates green (pytest 18, build OK, test:search 9, test:filters 243, check-i18n-keys, verify-wiring).

Spot-checks passed:
- `providers_de.json`: `magenta → "Magenta TV+"`, `amazon → "Amazon Prime Video"`
- No ≤4-char lowercase display_names anywhere
- `provider-brands.ts`: zero `display_name:` data entries (only in comments)
- ADR 004: "Updates 2026-05-09 [simplification]" section present

Base: stacked on agent/20260509-monetization-coalesce-and-purchases-toggle (monetization not yet in main).
Branch: agent/20260509-derive-display-names-from-csv
PR: https://github.com/Marien-J/waarstreamt.het/compare/agent/20260509-monetization-coalesce-and-purchases-toggle...agent/20260509-derive-display-names-from-csv?expand=1
