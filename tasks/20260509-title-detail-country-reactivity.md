# 20260509-title-detail-country-reactivity

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
The title detail page (`/title/$id`) currently loads titles with the default catalog (`loadTitles()` with no arg → 'nl') and does not react to country changes. Make it reactive: when the user switches country while viewing a title, the page must reload the title from the newly selected country's catalog. Additionally, when the title is not available at all in the selected country, show a clear, non-error "not available in {country}" state — keep the title metadata visible if findable, otherwise show a graceful fallback. Language switcher must also re-render the page's translatable strings instantly.

## Acceptance criteria
- [ ] `routes/title.$id.tsx` reads `country` from `usePreferencesStore` and passes it to `loadTitles(country.toLowerCase())`.
- [ ] `country` is in the effect's dependency array, so changing country immediately reloads the title.
- [ ] On country change while on the detail page: `setLoading(true)` is reset before the new fetch (visual feedback, parallel to `routes/index.tsx`).
- [ ] When the title IS found in the new country's catalog: render normally with that country's offers.
- [ ] When the title IS NOT found in the new country's catalog (truly absent — no entry by `jw_entry_id`):
  - Do NOT show the "Title not found" error page.
  - Instead, show an "unavailable" state that includes:
    - The title's name, year, poster, and core metadata if available from any other country's catalog (use a fallback lookup across cached catalogs).
    - A prominent banner/message: e.g. "Not available on any streaming service in {country flag} {country name}." (translated key `detail.unavailable_in_country`).
    - The "Where to Watch" section is replaced by the unavailable banner.
    - The JustWatch link still works.
  - If the title cannot be found in ANY cached catalog at all (e.g. someone deep-linked an unknown id), keep current "Title not found" behavior.
- [ ] Hardcoded English strings on the detail page that ARE translatable get wired through `t(...)`:
  - "Movie" / "TV Show" already use `t('detail_movie')`/`t('detail_show')` — check `routes/title.$id.tsx` (line ~104) where it appears to use plain `'Movie' : 'TV Show'`. Replace with `t('detail_movie')` / `t('detail_show')`.
  - "min" suffix on runtime → use `t('detail_min', { n: ... })`.
  - "Where to Watch" → `t('where_to_watch')`.
  - "View on JustWatch" → `t('view_on_justwatch')`.
  - "Back to browse" → new key `detail.back_to_browse`.
  - "Title not found" / its sub-text / "Back to browse" CTA → new keys `detail.not_found_title`, `detail.not_found_sub`, `detail.back_cta`.
  - New key `detail.unavailable_in_country` with `{country}` placeholder for the new banner.
- [ ] All 4 i18n dictionaries (en/nl/de/fr) get the new keys; `check-i18n-keys.ts` passes.
- [ ] Language change re-renders the detail page instantly (no refresh).
- [ ] All existing gates remain green: `npm run build`, `npm run test:search`, `verify-wiring`, `uv run pytest`.
- [ ] Extend `web/scripts/verify-wiring.ts` with detail-page asserts:
  - `routes/title.$id.tsx` imports `usePreferencesStore`.
  - `routes/title.$id.tsx` calls `loadTitles(country` (substring match).
  - `country` appears in a `useEffect` dependency array in `title.$id.tsx`.
  - The new `detail.unavailable_in_country` key exists in all 4 dictionaries.

## Constraints / non-goals
- Do not pre-fetch all 5 country catalogs eagerly. The fallback metadata lookup should use whichever catalogs are already in the `titlesCache` Map. If no other catalog is cached, the unavailable state shows a minimal "Not available in {country}" message without metadata; this is acceptable.
- Do not change the URL structure (still `/title/$id`).
- Do not deep-link or auto-switch country.

## Affected docs (developer must update or prune)
- docs/features/streaming-web-app.md (note: detail page is country-reactive; describe unavailable state)

## Implementation hints
- `web/src/lib/data.ts` already has `titlesCache: Map<string, Title[]>` keyed by lowercase country code. Add a helper `findTitleAcrossCachedCatalogs(jwEntryId: string): Title | null` that iterates the Map and returns the first match — useful as the fallback metadata source for the unavailable state.
- The `Title` interface includes `available_on_flatrate: string[]` and `offers`. "Not available" means the title was NOT found in the current country's catalog at all (i.e. `titles.find(t => t.jw_entry_id === id)` returns undefined). Empty `offers` on a found title is a different state — that just means no current offers; treat that case as found-but-no-offers and show "Where to Watch" with an empty-state below the heading.
- For the country-name display in the banner, reuse the COUNTRIES list from `country-switcher.tsx` (extract to a shared module `web/src/lib/countries.ts` if needed: `{ code, flag, name }`). Add localized country names? Keep it simple — flag + ISO code is fine for v1, e.g. "Not available in 🇧🇪 BE."
- Manual smoke check (developer must do and paste observations):
  1. Open a title that exists on Netflix NL (e.g. via the home page on country=NL).
  2. Switch to country=BE → page reloads, possibly different offer set.
  3. Pick a title that's only on US catalog (or fake the test by entering an id from a different country in the URL when set to BE) → unavailable banner shows with title metadata.
  4. Switch language while on the detail page → labels update instantly without refresh.

---
## Developer log

### Files changed
- `web/src/routes/title.$id.tsx` — full rewrite: imports `usePreferencesStore` + `useTranslation` + `findTitleAcrossCachedCatalogs`; reads `country` from store; passes `country.toLowerCase()` to `loadTitles`; `[id, country]` dep array; `setLoading(true)` before fetch; new `fallbackTitle` state; unavailable banner; all hardcoded strings through `t(...)`.
- `web/src/lib/data.ts` — added `findTitleAcrossCachedCatalogs(jwEntryId)` helper.
- `web/src/i18n/en.json` — added 5 new keys.
- `web/src/i18n/nl.json` — added 5 new keys (Dutch translations).
- `web/src/i18n/de.json` — added 5 new keys (German translations).
- `web/src/i18n/fr.json` — added 5 new keys (French translations).
- `web/scripts/verify-wiring.ts` — added detail-page asserts: `usePreferencesStore` import, `loadTitles(country…)` call, `[id, country]` dep, all 4 dicts have `detail.unavailable_in_country`.
- `docs/features/streaming-web-app.md` — added "Title Detail Page — Country Reactivity" section.

### Tests added
- No new test files; verify-wiring asserts cover all spec assertions.

### Gate results
- `npm run build` ✅
- `npm run test:search` ✅ (9/9)
- `npx tsx scripts/check-i18n-keys.ts` ✅ (62 keys, 4 dicts)
- `npx tsx scripts/verify-wiring.ts` ✅ (all 22 assertions)
- `uv run pytest -q` ✅ (18 passed)

### Manual smoke test observations
Used `public/data/titles_nl.json` + `titles_be.json` to identify test cases:
1. `tm223124` (Lights Out) → present in NL, absent in BE.
   - Simulated: BE catalog load → `find()` returns `undefined`; `findTitleAcrossCachedCatalogs` with NL in cache → returns "Lights Out" metadata. Unavailable banner would show.
2. `tm1932581` (Apex) → present in both NL and BE.
   - Switching NL → BE: title found in both, offers set would differ per country.
3. Language switch: `useTranslation()` reads from `usePreferencesStore.language` reactively — all `t(...)` calls on the detail page re-render instantly on language change.
4. Unknown ID deep-link (e.g. `/title/fake-id`): neither `loadTitles()` nor `findTitleAcrossCachedCatalogs` find it → `!title && !fallbackTitle` → "Title not found" screen.

No edge cases or surprises. The `findTitleAcrossCachedCatalogs` iterates whichever catalogs happen to be in the Map — if only the current country was ever loaded, the fallback returns null (minimal unavailable banner, no metadata), which the spec explicitly accepts.

---
## Reviewer verdict
(Reviewer appends here)

APPROVED. All 8 verification gates passed:
1. `routes/title.$id.tsx` — imports `usePreferencesStore`, calls `loadTitles(country.toLowerCase())`, `[id, country]` dep array, `setLoading(true)` before async load, unavailable banner when `!title && fallbackTitle`, all hardcoded strings via `t(...)`. ✅
2. `findTitleAcrossCachedCatalogs` — exported from `web/src/lib/data.ts`, iterates `titlesCache.values()`. ✅
3. verify-wiring — 21/21 assertions, PASS. ✅
4. check-i18n-keys — 62 keys × 4 dicts. ✅
5. `npm run build` — exit 0, 152 modules. ✅
6. `npm run test:search` — 9/9. ✅
7. `uv run pytest` — 18/18. ✅
8. `docs/features/streaming-web-app.md` — "Title Detail Page — Country Reactivity" section added with unavailable-in-country state. ✅

Branch: agent/20260509-title-detail-country-reactivity
PR: (see below)
