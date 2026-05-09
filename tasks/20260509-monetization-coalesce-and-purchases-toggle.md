# 20260509-monetization-coalesce-and-purchases-toggle

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
Two changes around monetization:

1. **Coalesce to FLATRATE / RENT / BUY only.** Any offer whose `monetization_type` is not one of these three (currently includes `FREE`, `ADS`, `CINEMA`, plus possibly `FLATRATE_AND_BUY`, `PEEK`, etc.) is dropped at preprocess time. Map known equivalents into the canonical three (e.g. `FLATRATE_AND_BUY` → emit two offers, one FLATRATE and one BUY). After preprocess, no `titles_<cc>.json` offer may have a `monetization_type` outside `{FLATRATE, RENT, BUY}`.
2. **Top-level "View purchases" toggle.** A clearly visible button in the global header (next to country/language switchers) that toggles whether BUY offers are surfaced anywhere in the app. **Default OFF**. When OFF, BUY offers are filtered out of: the overview filter logic, the detail-page "Where to Watch" section, the BUY checkbox in the filter sidebar (hidden), and the `lowest_buy` display on title cards.

## Acceptance criteria

### Preprocess (data layer)
- [ ] `web/scripts/preprocess.ts` filters/normalizes offers:
  - Pass through `FLATRATE`, `RENT`, `BUY` unchanged.
  - Drop offers with `monetization_type ∈ {FREE, ADS, CINEMA, ...anything else}`.
  - If `FLATRATE_AND_BUY` (or any compound type) is encountered, expand to two offers with the corresponding canonical types.
  - If, after dropping, a title has zero offers, drop the title entirely.
- [ ] Add an assertion in `web/scripts/test-filters.ts`: for every `titles_<cc>.json`, every offer's `monetization_type ∈ {FLATRATE, RENT, BUY}`.
- [ ] `MONETIZATION_TYPES` constant in `web/src/components/filter-sidebar.tsx` shrinks to `['FLATRATE', 'RENT', 'BUY']`.
- [ ] i18n keys `monetization_FREE`, `monetization_ADS`, `monetization_CINEMA` are removed from all 4 locale files (en/nl/de/fr) — `check-i18n-keys.ts` parity check still must pass.

### "View purchases" toggle (UI + state)
- [ ] New persisted boolean in `web/src/store/app-store.ts`:
  - `showPurchases: boolean` (default `false`)
  - `toggleShowPurchases: () => void`
  - Added to `partialize` so it persists alongside `darkMode` + `myProviders`.
  - Bump `persist` version to `3` (since v2 was set in the brand-canonicalization task) with a no-op migrate that leaves prior state intact.
- [ ] Top-level button rendered in `web/src/routes/__root.tsx` header bar (sibling to the country/language switchers, NOT inside the sidebar). Label: i18n key `view_purchases` — "View purchases" (en), "Koop tonen" (nl), "Käufe anzeigen" (de), "Voir achats" (fr). Visual: a toggle/pill clearly indicating ON/OFF state (e.g. filled when ON, outlined when OFF, with a small icon).
- [ ] When OFF (`showPurchases === false`):
  - `applyFilters` in `web/src/lib/search.ts`: if user's selected `filters.monetization` includes `BUY`, that `BUY` is silently stripped from the active set before filtering. If after stripping the set is empty, behave as if no monetization filter is set.
  - `web/src/components/filter-sidebar.tsx`: the `BUY` checkbox is hidden.
  - `web/src/routes/title.$id.tsx` and `web/src/components/title-detail.tsx`: offers with `monetization_type === 'BUY'` are excluded from the "Where to Watch" grouping (per-brand groups recompute without BUY; brands that had only BUY offers disappear).
  - `web/src/components/title-card.tsx` (if it shows `lowest_buy`): hide that price line.
- [ ] When ON (`showPurchases === true`): all current behavior restored; BUY offers visible everywhere.
- [ ] Toggling the button is **reactive** — updates the visible page immediately without requiring a navigation/refresh (same standard already met for country/language).
- [ ] Default: any new visitor (no persisted state) sees the toggle OFF.

### Verify-wiring asserts
- [ ] `web/scripts/verify-wiring.ts` adds the following source-level assertions:
  - `web/src/store/app-store.ts` contains `showPurchases` and `toggleShowPurchases`.
  - `web/src/store/app-store.ts` contains `version: 3`.
  - `web/src/routes/__root.tsx` contains `showPurchases` (i.e. button is wired into the root, not just the sidebar).
  - `web/src/lib/search.ts` references `showPurchases` (i.e. filter logic respects the toggle) — design choice: pass `showPurchases` as part of the `Filters` object so the filter pipeline is the single source of truth.
  - `web/src/components/title-detail.tsx` references `showPurchases`.
- [ ] All gates green: pytest, build, test:search, test:filters, check-i18n-keys, verify-wiring.

## Constraints / non-goals
- Do NOT re-extract from JustWatch — purely a downstream filter.
- Do NOT change the brand canonicalization layer.
- Do NOT add a separate "View rentals" toggle. Rent stays always-on.
- Do NOT remove the existing per-monetization checkboxes in the filter sidebar; only the BUY checkbox is conditionally hidden by the new toggle.

## Affected docs
- `docs/features/streaming-web-app.md` — add a "Monetization model" subsection.
- `docs/architecture/decisions/005-monetization-coalesce.md` — NEW ADR (Context: noise from FREE/ADS/CINEMA + BUY noise dominating typical SVOD-first usage; Decision: drop non-canonical monetizations in preprocess + introduce global "View purchases" toggle defaulted OFF; Consequences: cleaner default UX, BUY discoverable via one-click, rents stay always-on).

## Implementation hints
- For `FLATRATE_AND_BUY` (and any other compound types): inspect the 6 main offer-level CSVs first. If none are present, no expansion needed — just drop unknown types. A `tsx` one-liner enumerating distinct `monetization_type` values per country into the Developer log is the fastest first step.
- Place the toggle button in the header alongside flags. Suggested visual: a small pill button with a shopping-cart icon. Bound size, fits on mobile.
- Pass `showPurchases` into `applyFilters` via the `Filters` object rather than mutating the `monetization` array at every call site — keeps the policy in one place.
- For the detail page, do offer filtering BEFORE grouping by brand, so empty brand groups disappear naturally.

---
## Developer log
Developer did not leave a log. Changes observed in review: preprocess.ts coalesces to FLATRATE/RENT/BUY (compound expand via _AND_ split, zero-offer titles dropped); app-store.ts adds showPurchases/toggleShowPurchases, version 3 with migrate; root adds pill toggle with shopping-cart icon; search.ts strips BUY from active filter set when toggle OFF; filter-sidebar MONETIZATION_TYPES reduced; title-detail + title.$id filter before grouping; all 4 i18n locales updated; verify-wiring 5 new asserts added. Docs added by Reviewer (ADR 005, streaming-web-app.md section, INDEX.md link).

---
## Reviewer verdict
APPROVED. All 6 gates green (pytest 18/18, build clean, test:search 9/9, test:filters 243/243, check-i18n-keys 60 keys parity, verify-wiring all asserts pass). Implementation satisfies all acceptance criteria. ADR 005 and docs added in this review cycle. Branch: agent/20260509-monetization-coalesce-and-purchases-toggle. PR: https://github.com/Marien-J/waarstreamt.het/compare/main...agent/20260509-monetization-coalesce-and-purchases-toggle?expand=1
