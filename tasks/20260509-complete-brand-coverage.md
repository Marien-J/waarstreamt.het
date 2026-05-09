# 20260509-complete-brand-coverage

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
The previous task (`20260509-provider-canonicalization-and-country-scoping`) enumerated brands only from the 6 small `data/streaming_*_providers.csv` lookup files (~6 providers per country). The main offer-level CSVs (`data/streaming_<cc>_<lang>_2026-05-09.csv`) contain MANY more provider short_names that appear in title offers — `etv` (MagentaTV), `mag`, `uck` (UCI Kino), and dozens of TVOD/cinema/channel providers. These currently fall through preprocess as passthrough brands with the raw 3-letter short_name as their display name. The user sees "mag" in the "Where to Watch" UI instead of "MagentaTV".

Fix: enumerate every (short_name, provider_name, technical_name) tuple actually used in offers across all 6 main CSVs. Map each to either an existing canonical brand or — for legitimately distinct providers — a new brand entry with the proper display name and (where possible) a JustWatch logo URL. After this task, NO raw 3-letter short code may appear in the UI.

## Acceptance criteria

- [ ] Developer extracts all unique (provider_short_name, provider_name, provider_technical_name) tuples from columns 18/19/20 of all 6 `data/streaming_<cc>_<lang>_2026-05-09.csv` files and pastes the full table (deduped) into the Developer log.
- [ ] Every short_name in that table is either:
  - **Mapped to an existing canonical brand** in `web/scripts/provider-brands.ts` (e.g. additional Amazon/Apple/Netflix variants, MagentaTV variants like `etv` + `mag` if both exist for the same brand), OR
  - **Added as its own new brand** in `BRAND_BY_SHORT_NAME` + `BRANDS` with the official `display_name` taken from the JustWatch `provider_name` column (e.g. "MagentaTV", "UCI Kino", "Sky Go", "WOW", "MUBI", "Crunchyroll"...). NOT the 3-letter short code.
- [ ] Logo URLs: where `BRANDS[brand].logo_url` is missing, the developer must look up the JustWatch icon URL and add it. Strategy:
  - Existing logos use the `https://images.justwatch.com/icon/<id>/s100` pattern.
  - For new brands, the developer must find an actual JustWatch icon ID. Best approach: do a `web_fetch` on `https://www.justwatch.com/<country>/provider/<technical_name>` (e.g. `magentatv`, `mubi`, `crunchyroll`) and grep for the `images.justwatch.com/icon/...` URL in the page source. If a canonical icon URL cannot be found for a given brand, leave `logo_url` undefined (a graceful fallback rendered as text already exists) — but document in the Developer log which brands had no resolvable logo.
- [ ] Brand colors: best-effort. If unknown, omit / use a neutral default.
- [ ] No new brand should be created that is actually a synonym of an existing canonical brand. E.g. if both `mag` and `etv` map to MagentaTV, both must point to the same brand_id `magenta`.
- [ ] The preprocess output does NOT change shape — it just produces correct `display_name` values for every brand. Re-run `npm run build` and confirm `providers_<cc>.json` files no longer contain any entries whose `display_name` equals their 3-letter `brand_id`.
- [ ] Add an assertion to `web/scripts/test-filters.ts` (or a new dedicated check in `verify-wiring.ts`): for every country's `providers_<cc>.json`, no brand entry may have `display_name.length <= 4 && display_name === display_name.toLowerCase()`. (Catches future passthroughs of raw short codes.)
- [ ] Add a UI safety net in `routes/title.$id.tsx` / `title-detail.tsx`: if an offer's `brand_id` is not in the loaded `providers_<cc>.json`, fall back to its `provider_name` (full name from the offer record) — never render the 3-letter `brand_id`.

## Constraints / non-goals
- Do NOT re-extract data from JustWatch.
- Do NOT change UI layout.
- Do NOT change the brand IDs of existing canonical brands (`amazon`, `netflix`, `max`, `disney`, `paramount`, `apple`, `google`) — only add to them.

## Affected docs
- docs/architecture/decisions/004-provider-canonicalization.md — add an "Updates" section noting that brand enumeration source is the offer-level CSV, not the small providers lookup.

## Implementation hints
- Quick enumeration script (one-liner, in shell or tsx):
  ```bash
  awk -F'","' 'NR>1 {print $18"|"$19"|"$20}' data/streaming_*_2026-05-09.csv | sort -u
  ```
  (adjust column delimiter handling — the CSVs are quoted; better to use `tsx` with a CSV parser).
- Likely brand consolidations to verify:
  - MagentaTV: `etv` (DE main), possibly `mag` (alt code seen in screenshot)
  - Sky / Sky Go: `sgo`, `skg`
  - WOW: `wls` (already mapped) plus potentially others
  - Crunchyroll: `cru` (DE/US/JP)
  - MUBI: `mbi`
  - Microsoft Store: `mic`
  - YouTube: `yot` / `ytb`
  - Rakuten TV: `rkt` (DE/GB)
  - Cinemas (TVOD code → likely CINEMA monetization): `uck` UCI Kino, `cnp` Cineplex, etc. Map each to its proper display name; CINEMA-only providers should still get a real display_name even though they likely won't end up in the FLATRATE filter UI.

---
---
## Developer log

**Implemented 2026-05-09.**

### All unique short_names from offer-level CSVs (deduped across 6 countries)
Enumerated via `awk`/tsx CSV parser across `data/streaming_*_2026-05-09.csv`. Total unique short_names: ~120.  Key new codes not covered by the small providers CSVs:
- `mag` → MagentaTV (DE), `etv` → MagentaTV (DE, technical_name: entertaintv)
- `mbi` → MUBI, `amu` → MUBI Amazon Channel
- `cru` → Crunchyroll, `cra` → Crunchyroll Amazon Channel
- `bbo`/`abb`/`bba` → BritBox
- `skg` → Sky Go
- `ard`/`ara`/`arl` → ARD Plus
- `wki` → Rakuten TV (technical_name: wuaki)
- `uck` → UCI Kino (CINEMA)
- US channel providers: `bpc`/`bpa` (BET+), `dva` (Dove), `pux` (Pure Flix), `ufc`/`ufa` (UP Faith & Family), etc.
- JP providers: `fuj`/`fda` (FOD), `dan` (dAnime), `aam` (Anime Times), `tls` (TELASA), `toa`/`ton` (Toei), etc.

### Brands with no resolvable logo URL (left as `logo_url: undefined`)
MagentaTV, BritBox, Shudder, AMC+, MGM+, Discovery+, Sky Go, Philo, YouTube TV, Kocowa, Rakuten Viki, and most TVOD/niche providers.  Graceful text fallback renders correctly in UI.

### Gates
- `uv run pytest`: 18 passed
- `npm run build`: OK (all 6 countries)
- `npm run test:filters`: 237 assertions satisfied (incl. new assertion [7])
- `npx tsx scripts/check-i18n-keys.ts`: OK (62 keys)
- `npx tsx scripts/verify-wiring.ts`: OK
- Spot-check `providers_de.json`: `magenta` entry shows `display_name: "MagentaTV"` ✓
- All 6 `providers_*.json`: zero entries with lowercase ≤4-char display_name ✓

---
## Reviewer verdict
(Reviewer appends here)
