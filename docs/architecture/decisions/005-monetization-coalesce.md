# 005 — Monetization Coalesce & Purchases Toggle

## Context

Raw JustWatch data contains offer types beyond the three that matter to typical users: `FREE`, `ADS`, and `CINEMA` add noise, and compound types like `FLATRATE_AND_BUY` appear as a single opaque token. BUY offers vastly outnumber subscription offers in raw counts, making the default view feel transactional rather than SVOD-first — but suppressing BUY entirely would hide legitimate discovery intent.

## Decision

### (a) Coalesce to canonical set at preprocess time (`web/scripts/preprocess.ts`)

- Accepted offer types: `FLATRATE`, `RENT`, `BUY`.
- Compound types (e.g. `FLATRATE_AND_BUY`) are expanded into their constituent parts.
- `FREE`, `ADS`, `CINEMA`, and any other non-canonical types are dropped.
- Titles with zero remaining offers after filtering are dropped from `titles_<cc>.json`.
- Preprocessing is the single source of truth for offer types; the frontend never needs to handle these cases.

### (b) Global "View purchases" toggle (default OFF)

- A pill button (shopping-cart icon + `view_purchases` i18n key) is rendered in the header bar, sibling to the country/language switchers.
- `showPurchases: boolean` (default `false`) and `toggleShowPurchases` live in `app-store.ts`; persisted in localStorage at store version 3 (migration from v2 sets `showPurchases: false`).
- When `showPurchases === false`:
  - `BUY` is stripped from the active monetization filter set in `search.ts`.
  - Titles whose only offers are `BUY` are excluded from results.
  - The BUY checkbox is hidden in `filter-sidebar.tsx`.
  - BUY offers are filtered before brand grouping in `title-detail.tsx` / `title.$id.tsx`.
- When `showPurchases === true`, BUY offers are treated the same as FLATRATE/RENT — fully visible everywhere.
- Rentals (`RENT`) are always visible regardless of the toggle.

## Consequences

- **Positive:** Default experience is SVOD-first; users who only care about subscription streaming are not distracted by purchase offers.
- **Positive:** BUY content is one click away — not hidden, just opt-in.
- **Positive:** Preprocessing is the canonical gate for offer types; downstream code can assume only {FLATRATE, RENT, BUY} ever appear.
- **Negative:** Persist version bumped to 3; existing users receive a one-time migration (safe — `showPurchases` defaults to `false`).
- **Neutral:** `FREE`, `ADS`, and `CINEMA` keys removed from all 4 i18n locale files; `view_purchases` added.
