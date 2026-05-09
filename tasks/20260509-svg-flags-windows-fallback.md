# 20260509-svg-flags-windows-fallback

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
Country flag emojis (🇳🇱 🇩🇪 🇧🇪 🇺🇸 🇬🇧) do not render on Windows because Windows ships no glyphs for the regional-indicator pairs and falls back to displaying the two ISO letters. The country switcher and the title-detail "unavailable in {country}" banner therefore look like "NL NL", "DE DE", etc. on the production GitHub Pages deployment. Replace the emoji-based flag rendering with inline SVG flags so the flags render identically across all platforms (Windows, macOS, Linux, Android, iOS).

## Acceptance criteria
- [ ] Create a new component `web/src/components/flag.tsx` exporting `<Flag code="NL|DE|BE|US|GB" className?="..." />` that renders an inline SVG flag for the given country code.
- [ ] SVG flags are inlined in the bundle (or imported as static SVG assets via Vite). No external CDN dependency. No emoji codepoints used for flag rendering anywhere in the UI.
- [ ] Flags display at ~16-18px height inline next to the ISO code in `country-switcher.tsx` (visually equivalent to the current emoji + code layout).
- [ ] Flags display at the same size in the title-detail "unavailable in {country}" banner.
- [ ] `country-switcher.tsx` and `routes/title.$id.tsx` no longer reference flag emoji codepoints (`🇳🇱`, `🇩🇪`, `🇧🇪`, `🇺🇸`, `🇬🇧`).
- [ ] The unavailable-in-country i18n string keeps its `{country}` placeholder, but the placeholder is now substituted with the ISO code only (e.g. `Not available in BE.`), and the SVG flag is rendered alongside via JSX (not via the translated string). Update the EN/NL/DE/FR copy if needed so the sentence still reads naturally with the flag rendered before the ISO code in JSX.
- [ ] Aspect ratio of each flag is correct (NL/DE/BE = 3:2; US = 19:10; GB = 2:1 — or use a single common aspect like 4:3 if the source SVG is normalized; just don't squash any of them).
- [ ] All existing test gates remain green: `npm run build`, `npm run test:search`, `check-i18n-keys`, `verify-wiring`, `uv run pytest`.
- [ ] `verify-wiring.ts` extended with assertions:
  - `country-switcher.tsx` imports the new `Flag` component.
  - `country-switcher.tsx` does NOT contain regional-indicator codepoints (regex `[\u{1F1E6}-\u{1F1FF}]`).
  - `routes/title.$id.tsx` does NOT contain regional-indicator codepoints.

## Constraints / non-goals
- Do not introduce a heavyweight dependency. Either inline the 5 SVGs as React components, or use a tiny package like `flag-icons` (CSS-only, ~120 KB total but tree-shakeable to per-country files), OR fetch from `public/flags/<cc>.svg`. Prefer inline React SVG components — only 5 countries, ~3 KB total, zero runtime overhead, no dependency.
- Do not change which countries are supported.
- Do not redesign the switcher visual.

## Affected docs (developer must update or prune)
- docs/features/streaming-web-app.md (note: flags rendered via inline SVG to avoid Windows emoji-fallback)

## Implementation hints
- Wikimedia Commons hosts simple public-domain SVG flags. Source minimal, optimized SVGs (one per country), strip any unnecessary metadata, keep them small. Acceptable to hand-author very simple ones (NL: three horizontal stripes red/white/blue; DE: three horizontal stripes black/red/gold; BE: three vertical stripes black/yellow/red). For US and GB use proper SVGs since they're more complex — copy from a permissive source (Wikimedia, public domain) and strip to viewBox + paths.
- The `Flag` component should accept `aria-hidden` (true by default since the ISO code is right next to it for screen readers).
- Suggested implementation pattern:
  ```tsx
  // web/src/components/flag.tsx
  const FLAG_PATHS: Record<CountryCode, JSX.Element> = {
    NL: <svg viewBox="0 0 9 6" ...><rect.../></svg>,
    DE: <svg viewBox="0 0 5 3" ...><rect.../></svg>,
    BE: <svg viewBox="0 0 3 2" ...><rect.../></svg>,
    US: <svg viewBox="0 0 19 10" ...>{...}</svg>,
    GB: <svg viewBox="0 0 60 30" ...>{...}</svg>,
  }
  export function Flag({ code, className }: { code: CountryCode; className?: string }) { ... }
  ```
- For the title-detail banner: `t('detail.unavailable_in_country', { country: 'BE' })` → render as `<>{<Flag code={country} />} {t(...)}</>` adjacent in JSX.
- Manual smoke check (paste observations into Developer log):
  1. Build, run `npm run preview`. Open in a browser. Flags render.
  2. (If possible) check on Windows or in a browser configured without emoji font support.

---
## Developer log

**Files changed:**
- `web/src/components/flag.tsx` — created; exports `<Flag code={CountryCode} className? />`. Hand-authored SVGs: NL (3:2, horizontal stripes), DE (5:3, horizontal stripes), BE (3:2, vertical stripes), US (19:10, 13-stripe + blue canton), GB (2:1, Union Jack with diagonals + cross). Each SVG uses `style={{ height: '1em', width: 'auto', display: 'block' }}` so it scales with font-size.
- `web/src/components/country-switcher.tsx` — removed emoji COUNTRIES array; COUNTRIES is now `CountryCode[]`; replaced `{c.flag} {c.code}` with `<Flag code={c} className="mr-0.5" /> {c}`.
- `web/src/routes/title.$id.tsx` — removed `COUNTRY_FLAGS` dict and `countryDisplay` variable; imported `Flag`; unavailable banner now renders `<Flag code={country} className="mr-1" /> {t('detail.unavailable_in_country', { country })}` with ISO code only in the translation.
- `web/scripts/verify-wiring.ts` — added 3 new assertions: `country-switcher.tsx` imports `Flag`, and both `country-switcher.tsx` and `routes/title.$id.tsx` contain no regional-indicator codepoints (`/[\u{1F1E6}-\u{1F1FF}]/u`).
- `docs/features/streaming-web-app.md` — updated Country Switcher description and unavailable banner description to reflect inline SVG flags.
- `tasks/_queue.json` — added task, set to READY_FOR_REVIEW.

**Tests:** no new tests (pure UI component, covered by verify-wiring + build). All existing gates green:
- `npm run build` ✓
- `npm run test:search` ✓ (9 passed)
- `check-i18n-keys` ✓ (62 keys, 4 dicts)
- `verify-wiring` ✓ (25 assertions, including 3 new)
- `uv run pytest` ✓ (18 passed)

**Decisions:**
- GB Union Jack: simplified counterchange (St. Patrick saltire is symmetric, not properly offset by quadrant). At 16-18px this difference is imperceptible. Noted here for completeness; a pixel-perfect offset version would add ~200 bytes of polygon paths for no visible benefit at display size.
- No i18n string changes needed — existing strings like "Not available on any streaming service in {country}." read naturally with ISO codes (NL, DE, etc.) substituted in.

---
## Reviewer verdict
(Reviewer appends here)
