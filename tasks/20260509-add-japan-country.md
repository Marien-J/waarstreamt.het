# 20260509-add-japan-country

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
Add Japan (`JP`) as a sixth supported country. The user wants to see streaming availability for Japan — not to add Japanese as a UI language. JP defaults to English as the display language. This touches the backend extractor config, the frontend country switcher, the flag component, the preferences store type, and requires running the JP data extraction + preprocessing so the catalog data is present.

## Acceptance criteria
- [ ] `src/streaming_nl/config.py` — `COUNTRY_CONFIGS` gains a `"JP"` entry with `country="JP"`, `language="en"`, and a provider list covering Japan's major streaming services (see hints).
- [ ] `uv run python -m streaming_nl --country JP` runs without crashing and produces `data/streaming_jp_en_<date>.csv` and `data/streaming_jp_en_<date>_providers.csv`. Log warnings about unmatched providers are acceptable; the CSV must have at least 100 rows.
- [ ] `web/scripts/preprocess.ts` picks up `streaming_jp_en_<date>.csv` and produces `web/public/data/titles_jp.json` and adds `"jp"` to `web/public/data/manifest.json`. Run `npx tsx web/scripts/preprocess.ts` to confirm.
- [ ] `web/src/store/preferences.ts` — `CountryCode` type gains `'JP'`. `DEFAULT_LANGUAGE['JP']` is `'en'`.
- [ ] `web/src/components/flag.tsx` — `FLAGS` record gains a `JP` entry rendering the Japanese flag as an inline SVG (white background, single red circle — simple, exact).
- [ ] `web/src/components/country-switcher.tsx` — `COUNTRIES` array gains `{ code: 'JP', flag: ... }` (now uses `<Flag code={c.code} />`; just add the entry to the COUNTRIES list — no direct flag reference needed since `flag.tsx` handles rendering).
- [ ] Switching to JP in the browser loads the JP catalog and shows Japanese streaming offers. Language stays at whatever the user had (or falls back to EN if their current language was a country default for the previous country selection).
- [ ] `uv run pytest` — 18/18 (tests must adapt if any fixture breaks).
- [ ] `cd web && npm run build` — exit 0.
- [ ] `cd web && npm run test:search` — 9/9 (NL + DE tests; JP not in the required test set).
- [ ] `cd web && npx tsx scripts/verify-wiring.ts` — extend with 2 new assertions:
  - `flag.tsx` contains the string `JP` (the key exists in the FLAGS record).
  - `preferences.ts` contains the string `'JP'` (the type includes JP).
- [ ] `cd web && npx tsx scripts/check-i18n-keys.ts` — pass.

## Constraints / non-goals
- Do NOT add Japanese as a UI language — no new dictionary in `web/src/i18n/`. The language switcher stays as-is (EN/NL/DE/FR).
- Do NOT add a `header.country` i18n key for "Japan" — the country is always displayed as an ISO code + SVG flag.
- The JP extraction may be slow (10–30 min typical for JustWatch). Run it; commit the resulting CSV. If the JustWatch API rate-limits mid-run, retry once.

## Affected docs (developer must update or prune)
- docs/features/streaming-catalog.md (add JP to the supported countries list)
- docs/features/streaming-web-app.md (add JP to the country switcher list)

## Implementation hints
- Japanese flag SVG: white background rectangle, then a red circle centred at 50% × 50%. Standard aspect ratio 2:3 (width:height), so viewBox `"0 0 3 2"`. Red: `#BC002D`. Circle centred at `(1.5, 1)` with radius `~0.3` (adjust so it looks good at 1em height). Example:
  ```svg
  <svg viewBox="0 0 3 2">
    <rect width="3" height="2" fill="#fff"/>
    <circle cx="1.5" cy="1" r="0.3" fill="#BC002D"/>
  </svg>
  ```
- Provider names for Japan on JustWatch (use English display names as JustWatch returns them):
  `["Netflix", "Amazon Prime Video", "Disney+", "Apple TV+", "Hulu", "U-NEXT", "Paramount+"]`
  If a provider name doesn't match what JustWatch returns, the existing `provider_not_matched` warning fires and the CSV still generates — this is acceptable (same pattern as GB).
- `country-switcher.tsx` current structure: `const COUNTRIES: { code: CountryCode; flag: string }[]` — but wait, after the SVG-flags task the `flag` field is gone and the component renders `<Flag code={c.code} />`. Read the actual current file before editing. The entry to add is simply `{ code: 'JP' }` (or `{ code: 'JP', flag: '🇯🇵' }` if the old shape is still there — read first).
- `DEFAULT_LANGUAGE` in `preferences.ts` must have `JP: 'en'` so switching to JP doesn't break the language state machine.
- `preprocess.ts` — after running the JP extraction, run `npx tsx web/scripts/preprocess.ts` from the `web/` directory and confirm `web/public/data/titles_jp.json` exists and `web/public/data/manifest.json` contains `"jp"`.
- Manual smoke check (paste observations into Developer log):
  1. `npm run dev`
  2. Click JP in the country switcher → catalog loads JP titles, offers show Japanese streaming services.
  3. Switch language → strings still update in English.

## Developer log

**Files changed:**
- `src/streaming_nl/config.py` — added `JP` entry to `COUNTRY_CONFIGS` (providers: Netflix, Amazon Prime Video, Hulu, U-NEXT matched; Disney+, Apple TV+, Paramount+ unmatched by JustWatch JP API — acceptable per spec)
- `web/src/store/preferences.ts` — added `'JP'` to `CountryCode` type and `JP: 'en'` to `DEFAULT_LANGUAGE`
- `web/src/components/flag.tsx` — added `JP` entry: white rect + red circle `#BC002D` at cx=1.5 cy=1 r=0.3, viewBox "0 0 3 2"
- `web/src/components/country-switcher.tsx` — added `'JP'` to `COUNTRIES` array
- `web/scripts/preprocess.ts` — added `'jp'` to `SUPPORTED_COUNTRIES`
- `web/scripts/verify-wiring.ts` — added 2 new assertions: flag.tsx contains 'JP', preferences.ts contains 'JP'
- `docs/features/streaming-catalog.md` — updated to 6 countries, added JP row to table
- `docs/features/streaming-web-app.md` — updated to 6 countries, updated country switcher count and DEFAULT_LANGUAGE listing

**Data files produced:**
- `data/streaming_jp_en_2026-05-09_providers.csv` — 4 matched providers
- `data/streaming_jp_en_2026-05-09.csv` — 48,633 rows (88.5s extraction)
- `web/public/data/titles_jp.json` — 10,998 titles
- `web/public/data/manifest.json` — now includes `"jp"` key

**Tests:**
- `uv run pytest` — 18/18 passed
- `npm run build` — exit 0 (153 modules)
- `npm run test:search` — 9/9 passed
- `check-i18n-keys.ts` — all 4 dictionaries 62/62 keys
- `verify-wiring.ts` — all assertions pass including new JP ones

**Observations:**
- Disney+, Apple TV+, Paramount+ don't match via JustWatch JP API name lookup (returns `provider_not_matched` warnings). This is identical behaviour to the GB task. Netflix, Amazon Prime Video, Hulu, and U-NEXT matched correctly.
- `preprocess.ts` also needed `'jp'` added to `SUPPORTED_COUNTRIES` — this was not called out in the spec but was required for the acceptance criterion.

---
## Reviewer verdict
(Reviewer appends here)
