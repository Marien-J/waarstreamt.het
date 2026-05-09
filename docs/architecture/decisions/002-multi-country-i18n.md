# ADR 002: Multi-Country Catalog & i18n Strategy

**Status:** Accepted  
**Date:** 2026-05-09

## Context

The initial product extracted and served only the Dutch (NL) streaming catalog. Expanding to 5 countries (NL, DE, BE, US, GB) and 4 UI languages (NL, DE, EN, FR) raised several design questions:

1. Should catalog data be extracted per country×language, or per country only?
2. How should we detect the user's preferred country without a backend?
3. Should we use a third-party i18n library (e.g., `react-i18next`) or build a thin custom hook?
4. Where should country and language preferences be stored?

## Decision

### 1. Catalog data is country-scoped, not country×language-scoped

Each country is extracted **once**, in its primary language (NL→nl, DE→de, BE→nl, US→en, GB→en). The UI language switch is **UI strings and genre labels only** — title text, descriptions, age certifications, and prices stay in the catalog's native form.

**Rationale:** JustWatch returns localized title text per `language` parameter, but the *set* of titles is country-bound. Running each country in 4 languages would 4× extraction time, storage, and rate-limit risk for marginal UX gain. Most users consume one language per country. The file naming scheme (`streaming_<cc>_<lang>_<date>.csv`) reserves the `<lang>` slot for future multi-language extraction if needed.

### 2. Client-side geo-detection via ipapi.co

The site is a static SPA; no server-side geo-IP is available. Detection strategy:

1. **7-day localStorage cache** (`waarstreamt.country.detected`) — avoids repeated API calls
2. **ipapi.co `/json/`** (free tier, CORS-enabled, no API key) — field `country_code`
3. **`navigator.language`** country segment — e.g., `nl-NL` → `NL`
4. **Hardcoded fallback** `NL`

Coerce the detected code to one of the 5 supported countries; if not supported, fall through to the next strategy. **Explicit user selection always overrides** detection and is persisted indefinitely.

### 3. Custom `useTranslation()` hook over react-i18next

4 JSON dictionaries + a thin hook is sufficient for ≈30–50 keys. This avoids:
- `react-i18next` (complex, large API surface, bundle weight)
- Any build-time extraction tooling
- External dependency risk for a small translatable surface

The `useTranslation()` hook reads from the active language dict, substitutes `{key}` placeholders, and falls back to EN for missing keys.

### 4. Zustand + localStorage for preferences

Country and language preferences live in a zustand store, persisted to `localStorage` key `waarstreamt.preferences` via the `persist` middleware. On first load, if no stored country, geo-detection runs; if no stored language, it derives from country defaults.

## Consequences

- **Positive:** Simple extraction pipeline (~5× single-country runtime, all sequential). Simple i18n system with zero dependencies. Static SPA stays fully static.
- **Positive:** File naming (`streaming_<cc>_<lang>_<date>.csv`) is forward-compatible with per-language extraction.
- **Negative:** Catalog titles/descriptions are not translated — acceptable given scope decision 1.
- **Negative:** ipapi.co is an external free-tier service; could be rate-limited for high-traffic deployments (mitigated by 7-day cache).
- **Out of scope:** URL-based routing per country, currency conversion, server-side rendering.
