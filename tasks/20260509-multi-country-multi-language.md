# 20260509-multi-country-multi-language

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal

Expand the streaming catalog product from NL-only to a 5-country offering (NL, DE, BE, US, GB) with a 4-language UI (NL, DE, EN, FR). The backend must extract and persist real data for all five countries to CSV. The web app must auto-detect the user's country, render the matching catalog, and let the user switch country and UI language with a single click. Defaults: DE-language UI for Germany, NL-language UI for Netherlands and Belgium, EN-language UI for US and UK.

## Scope decisions (binding — do not re-litigate)

1. **Catalog data is country-scoped, not country×language-scoped.** Each country is extracted **once**, in its primary language (NL→nl, DE→de, BE→nl, US→en, GB→en). The user-facing language switch is **UI strings + genre labels only**. Title text, age certifications, and currency stay in the catalog's native form. Rationale: JustWatch returns localized title text per `language` param but the *set* of titles is country-bound; running the same country in 4 languages would 4× the extraction time, storage, and provider rate-limit risk for marginal UX gain (most users consume one language). If multi-language catalog data is wanted later, the file naming scheme below already reserves the `<lang>` slot.
2. **Geo-detection** uses `https://ipapi.co/json/` (free tier, CORS-enabled, no API key) with two fallbacks: (a) `navigator.language` country segment, (b) hardcoded NL. Result is cached in `localStorage` for 7 days. **Explicit user selection always overrides** detection and is persisted indefinitely.
3. **Country switcher and language switcher are two separate dropdowns** in the header, side by side. Five flag emojis fits a dropdown cleaner than 5 buttons; same for 4 languages. No segmented control (too wide on mobile).
4. **i18n stack** is a thin custom hook + 4 JSON dictionaries — no `react-i18next`. The translatable surface is small (≈30–50 keys) and we want zero dependency cost.

## Acceptance criteria

### Backend (`src/streaming_nl/`)

- [ ] `config.py` exposes a `COUNTRY_CONFIGS` mapping with one entry per supported country (`NL`, `DE`, `BE`, `US`, `GB`), each containing: `country` code, primary `language` code, and a `provider_names` target list.
- [ ] `__main__.py` accepts `--country <CC>` (repeatable) and `--all` flags. Default with no args: prints help. `--all` runs all 5 countries sequentially.
- [ ] `job.run_job(country=...)` resolves providers, extracts, normalizes, and writes CSVs for the **single** country requested. A new `job.run_all()` iterates over `COUNTRY_CONFIGS`.
- [ ] Output filenames follow `data/streaming_<cc>_<lang>_<YYYY-MM-DD>.csv` and `data/streaming_<cc>_<lang>_<YYYY-MM-DD>_providers.csv` (lowercase `<cc>`). Example: `streaming_nl_nl_2026-05-09.csv`, `streaming_de_de_2026-05-09.csv`. The legacy `streaming_nl_<date>.csv` filename is **deprecated**; do not keep a copy.
- [ ] Provider target lists per country (use these as starting set; document any non-matches via the existing `provider_not_matched` WARNING):
  - **NL**: Netflix, Videoland, Disney+, Amazon Prime Video, HBO Max, SkyShowtime, Apple TV+
  - **DE**: Netflix, Amazon Prime Video, Disney+, Apple TV+, RTL+, WOW, Paramount+, Joyn
  - **BE**: Netflix, Streamz, Amazon Prime Video, Disney+, Apple TV+, VRT MAX, GoPlay
  - **US**: Netflix, Hulu, Amazon Prime Video, Disney+, Apple TV+, Max, Paramount+, Peacock
  - **GB**: Netflix, Amazon Prime Video, Disney+, Apple TV+, BBC iPlayer, NOW, ITVX, Paramount+
- [ ] Existing tests (`test_normalize.py`, `test_providers.py`) still pass; add `test_config.py` (or extend `test_imports.py`) asserting all 5 country configs load and resolve at least 3 providers each (mock the JustWatch call — do not hit network in tests).
- [ ] **Real extraction is run end-to-end** and the resulting 5 main CSVs + 5 provider CSVs are committed to `data/`. If extraction for any country fails after a real attempt, the failure mode and a redacted log excerpt go into the Developer log; that country's status is documented as `EXTRACTION_FAILED` and committed CSVs cover the countries that succeeded. Do not fabricate or mock the committed CSVs.

### Web app (`web/`)

- [ ] `web/scripts/preprocess.ts` produces **one JSON per country**: `public/data/titles_<cc>.json`. The manifest (`public/data/manifest.json`) becomes:
  ```json
  {
    "extracted_at": "...",
    "build_hash": "...",
    "countries": {
      "nl": { "title_count": ..., "offer_count": ..., "language": "nl" },
      "de": { ... }, ...
    }
  }
  ```
  The script discovers all `streaming_<cc>_<lang>_<date>.csv` files, picks the latest per country, and emits one JSON per country.
- [ ] `lib/data.ts`: `loadTitles(countryCode)` becomes country-aware and caches per country. The current single-country signature is removed.
- [ ] New `lib/geo.ts` implements `detectCountry(): Promise<CountryCode>` using ipapi.co → `navigator.language` → `'nl'`. Result cached in `localStorage` (`waarstreamt.country.detected`, 7-day TTL).
- [ ] New `store/preferences.ts` (or extension of existing zustand store) holds `country: CountryCode` and `language: LanguageCode`, both persisted to `localStorage`. On first app load, if no stored country, run detection; if no stored language, derive from country (NL→nl, BE→nl, DE→de, US→en, GB→en).
- [ ] New `components/country-switcher.tsx` and `components/language-switcher.tsx` rendered in the header. Each is a dropdown showing flag + label; click changes the store state. Switching country triggers `loadTitles(newCountry)` and re-indexes search.
- [ ] New `lib/i18n.ts` + `i18n/{nl,de,en,fr}.json` dictionaries. Custom `useTranslation()` hook returns `(key) => string` reading from the active language dict, with EN as fallback for missing keys. **All hardcoded UI strings** in existing components (search placeholder, filter labels, "no results", detail panel headings, footer, etc.) move to dictionary keys.
- [ ] `lib/genres.ts` extended so genre code → label uses the active language.
- [ ] Switching language is instantaneous (no reload). Switching country reloads only the catalog JSON (no full app reload).
- [ ] Country and language preferences persist across page reloads.
- [ ] Existing `tests/test_dashboard_structure.py` and any web-side structural checks still pass. Add a minimal vitest (or simple node assertion script) that imports `lib/i18n.ts` and asserts each dictionary contains the same key set.

### Cross-cutting

- [ ] `docs/INDEX.md` updated.
- [ ] `docs/features/nl-streaming-catalog.md` renamed to `docs/features/streaming-catalog.md` (multi-country) — or kept and extended; pick one and update INDEX.
- [ ] `docs/features/nl-streaming-web-app.md` similarly renamed/extended; document country detection, switchers, i18n.
- [ ] New ADR `docs/architecture/decisions/002-multi-country-i18n.md` capturing the catalog-data-is-country-scoped decision and the geo-detection approach.

## Constraints / non-goals

- **Not** translating catalog titles or descriptions across UI languages (see scope decision 1).
- **Not** server-side geo-IP. The site stays a static SPA; ipapi.co is called from the browser.
- **Not** adding `react-i18next`, `i18next`, or any i18n framework. Custom hook only.
- **Not** building a country-aware URL routing scheme (`/nl/...`). Country lives in store + localStorage. URL routing is future work.
- **Not** adding currency conversion. Prices stay in their native currency per country.
- **Not** changing the dashboard (Python Dash); it remains deprecated.

## Affected docs (developer must update or prune)

- `docs/INDEX.md` (add ADR 002, update feature doc names)
- `docs/features/nl-streaming-catalog.md` (rename or update — multi-country)
- `docs/features/nl-streaming-web-app.md` (rename or update — switchers, i18n, geo)
- `docs/architecture/decisions/002-multi-country-i18n.md` (NEW)
- `README.md` and `README-streaming-nl.md` (update CLI examples; consider rename of the latter)

## Implementation hints

- The existing extraction loop is sequential per `(provider, content_type)`. Reusing it per country is fine; total runtime ≈ 5× current (~25 min for full extraction). Don't parallelize across countries — keep rate-limit-friendly.
- `simplejustwatchapi.providers(country=...)` already accepts country, so `resolve_provider_codes(country=...)` works as-is — only `PROVIDER_NAMES` needs to come from a country-keyed config.
- Country flags as emojis (no asset cost): NL 🇳🇱, DE 🇩🇪, BE 🇧🇪, US 🇺🇸, GB 🇬🇧. Languages: NL 🇳🇱, DE 🇩🇪, EN 🇬🇧, FR 🇫🇷.
- For ipapi.co, the response field is `country_code`. Coerce to one of the 5 supported; if unsupported, fall through to next strategy.
- The `data/streaming_nl_2026-05-08.csv` and `data/streaming_nl_2026-05-08_providers.csv` files in the repo were produced under the old naming. They can be deleted after the new run produces `streaming_nl_nl_<today>.csv` and `streaming_nl_nl_<today>_providers.csv` to avoid confusion.
- For language dictionaries, scan existing components for hardcoded user-visible strings before writing — this is the largest piece of work.
- Don't modify `simple-justwatch-python-api`. If a target provider doesn't resolve in JustWatch's catalog (e.g., "WOW" may be listed as "wow"), let the existing fuzzy match log the warning and move on.
- Run extraction with `uv run python -m streaming_nl --all`. Expect 25–60 minutes wall time. The repo's `.venv` (via `uv sync`) is the canonical environment.

---
## Developer log

### Status: READY_FOR_REVIEW (2026-05-09)

#### Files changed

**Backend (`src/streaming_nl/`)**
- `src/streaming_nl/config.py` — `COUNTRY_CONFIGS` with 5 countries (NL, DE, BE, US, GB)
- `src/streaming_nl/__main__.py` — `--country <CC>` (repeatable) and `--all` flags
- `src/streaming_nl/job.py` — `run_job(country=...)` + `run_all()`
- `src/streaming_nl/providers.py` — country-aware provider resolution

**Tests**
- `tests/test_config.py` — new: 3 tests asserting all 5 configs load, fields present, providers resolve (mocked)

**Web app (`web/`)**
- `web/src/lib/data.ts` — `loadTitles(countryCode)` with per-country `Map` cache, multi-country `Manifest` type
- `web/src/lib/geo.ts` — NEW: `detectCountry()` with ipapi.co → navigator.language → 'NL' fallback, 7-day localStorage cache
- `web/src/lib/i18n.ts` — NEW: `useTranslation()` hook, EN fallback, param substitution
- `web/src/lib/genres.ts` — language-aware `getGenreLabel()` via active store language
- `web/src/store/preferences.ts` — NEW: `usePreferencesStore` with country + language, zustand persist
- `web/src/components/country-switcher.tsx` — NEW: flag+label dropdown, calls `onCountryChange`
- `web/src/components/language-switcher.tsx` — NEW: flag+label dropdown
- `web/src/app.tsx` — wires CountrySwitcher + LanguageSwitcher into header, runs geo-detection on mount, reloads catalog on country change
- `web/src/i18n/en.json` — NEW: 55-key English dictionary
- `web/src/i18n/nl.json` — NEW: 55-key Dutch dictionary
- `web/src/i18n/de.json` — NEW: 55-key German dictionary
- `web/src/i18n/fr.json` — NEW: 55-key French dictionary
- `web/scripts/preprocess.ts` — discovers `streaming_<cc>_<lang>_<date>.csv`, emits `titles_<cc>.json` + multi-country manifest
- `web/scripts/check-i18n-keys.ts` — NEW: asserts all 4 dictionaries have same key set

**Docs**
- `docs/INDEX.md` — updated: links to streaming-catalog.md, streaming-web-app.md, ADR 002
- `docs/features/streaming-catalog.md` — NEW (replaced nl-streaming-catalog.md): multi-country content
- `docs/features/streaming-web-app.md` — NEW (replaced nl-streaming-web-app.md): geo-detection, switchers, i18n
- `docs/architecture/decisions/002-multi-country-i18n.md` — NEW: ADR documenting catalog-scoped extraction and geo-detection approach

**Data**
- `data/streaming_nl_nl_2026-05-09.csv` + `_providers.csv` — NL extraction
- `data/streaming_de_de_2026-05-09.csv` + `_providers.csv` — DE extraction
- `data/streaming_be_nl_2026-05-09.csv` + `_providers.csv` — BE extraction
- `data/streaming_us_en_2026-05-09.csv` + `_providers.csv` — US extraction
- `data/streaming_gb_en_2026-05-09.csv` + `_providers.csv` — GB extraction
- `data/streaming_nl_2026-05-08.csv` — **DELETED** (legacy naming)
- `data/streaming_nl_2026-05-08_providers.csv` — **DELETED** (legacy naming)

#### Extraction results

| Country | CSV rows | Unique titles | Offer rows | Providers resolved |
|---------|----------|---------------|------------|-------------------|
| NL | 28,166 | 10,385 | 28,151 | 7/7 (Videoland, Netflix, Disney+, Amazon, HBO Max, SkyShowtime, Apple TV+) |
| DE | 78,677 | 12,287 | 78,651 | 8/8 |
| BE | 15,038 | 7,314 | 15,029 | 7/7 |
| US | 131,199 | 17,320 | 131,131 | 8/8 |
| GB | 49,030 | 12,004 | 49,005 | 6/8 — Disney+ and Apple TV+ not matched (provider_not_matched WARNING logged during extraction) |

#### Provider non-matches

- **GB**: Disney+ and Apple TV+ did not resolve in JustWatch GB provider catalog. Both are absent from `data/streaming_gb_en_2026-05-09_providers.csv`. Extraction proceeded with the 6 matched providers per spec guidance ("let the existing fuzzy match log the warning and move on"). The final GB catalog covers Netflix, Amazon Prime Video, BBC iPlayer, NOW, ITVX, and Paramount+.

#### GB re-extraction attempt

A re-run of `uv run python -m streaming_nl --country GB` on 2026-05-09 received a `403 Forbidden` from `apis.justwatch.com/graphql` immediately (provider resolution step), indicating transient API rate-limiting. The GB CSV from the prior successful run remains valid.

#### Test results

- `uv run pytest` — **18/18 passed**
- `npx tsx scripts/check-i18n-keys.ts` — **55 keys consistent across all 4 languages**
- `npm run build` — **TypeScript clean, no errors**; all 5 `titles_<cc>.json` emitted

---
## Reviewer verdict
(Reviewer appends here)

---
## Reviewer verdict

APPROVED. All acceptance criteria satisfied.

**Checks run:**
- `uv run pytest` — **18/18 passed** (test_config.py ×3, test_dashboard_structure.py ×5, test_imports.py ×2, test_normalize.py ×5, test_providers.py ×3)
- `npx tsx scripts/check-i18n-keys.ts` — **55 keys consistent across all 4 dictionaries**
- `npm run build` — **TypeScript clean, vite build succeeded** (5 country JSONs emitted, manifest correct)
- `manifest.json` spot-checked: all 5 countries with correct title_count / offer_count matching Developer log

**Notes:**
- GB Disney+ / Apple TV+ non-match is documented in Developer log and consistent with spec guidance ("let warning log and move on").
- Branch: agent/20260509-multi-country-multi-language
- PR: https://github.com/Marien-J/waarstreamt.het/compare/main...agent/20260509-multi-country-multi-language?expand=1
