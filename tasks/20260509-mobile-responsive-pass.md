# 20260509-mobile-responsive-pass

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
Do a focused mobile UX pass on the whole web app. The most visible bug: on small viewports the `Country:` and `Language:` prefix labels in the header switchers are hidden via `hidden sm:inline`, so the user sees two unlabeled rows of buttons (5 country buttons + 4 language buttons + a theme toggle = 10 controls without explanation). Fix that AND review every page's mobile experience: home/browse, title detail, filter sidebar (mobile drawer), search bar, result grid card sizing. Result must feel deliberately mobile-designed, not "desktop minus things."

## Acceptance criteria
- [ ] **Header**: `Country:` and `Language:` labels are visible on mobile (or replaced by an icon that conveys the same meaning, e.g. globe icon for country, "Aa" / translation glyph for language). Switchers do NOT overflow horizontally on a 360px-wide viewport. Acceptable approaches:
  1. Always-visible compact labels (e.g. `Country` shrunk and stacked above the row of buttons on mobile, full-width inline on `sm:` and up).
  2. Two-row header on mobile: row 1 = title + theme toggle; row 2 = country switcher; row 3 = language switcher (each clearly labeled).
  3. A "Settings" sheet behind a single icon on mobile containing both switchers + theme toggle.
  Pick one, document the decision in the Developer log, and ship it.
- [ ] **Browse page (`routes/index.tsx`)**: 
  - "Filters" mobile button works (already does). Sidebar drawer is full-screen on mobile and dismissible.
  - Search bar input is large enough to be tapped (≥44px tap target) and not hidden behind the filter button.
  - Results count + "Clear all filters" line wraps gracefully on small screens.
  - "My Providers:" chip area wraps to a new row on mobile instead of forcing a horizontal scroll.
- [ ] **Result grid (`components/result-grid.tsx`)**: tile sizing already adapts via `getColumnCount(width)` (3 cols < 480px). Confirm tiles look right on a 360px viewport — poster aspect 2:3, no clipping, title text readable. Touch the function only if there's a real issue.
- [ ] **Title detail (`routes/title.$id.tsx`)**: 
  - Poster + details stack vertically on mobile (already `flex-col md:flex-row`). Confirm.
  - "Where to Watch" provider cards are touch-friendly (≥44px tap targets on offer links).
  - Unavailable banner reads naturally on a narrow screen.
  - Back button has a bigger tap target on mobile.
- [ ] **Filter sidebar (`components/filter-sidebar.tsx`)** mobile drawer: 
  - Closes via a clear close button (X) at the top.
  - "Clear all filters" and "Apply" CTAs sit in a sticky footer on mobile so they're always reachable without scrolling.
  - All inputs (sliders, checkboxes) have touch-friendly sizing.
- [ ] No horizontal scrolling on any page at 360px viewport.
- [ ] All existing test gates remain green: `npm run build`, `npm run test:search`, `check-i18n-keys`, `verify-wiring`, `uv run pytest`.
- [ ] Extend `verify-wiring.ts` with: `country-switcher.tsx` and `language-switcher.tsx` no longer rely solely on `hidden sm:inline` for the label (i.e. either the `hidden sm:inline` class is gone, or it's replaced/wrapped by a mobile-visible alternative).

## Constraints / non-goals
- No new icon library. If you need an icon, hand-author a small inline SVG in the same file.
- No design-system overhaul. Use existing CSS vars (`--accent`, `--muted`, `--border`).
- Do not change desktop layout in a way that's visible regression.

## Affected docs (developer must update or prune)
- docs/features/streaming-web-app.md — add a "Mobile layout" section documenting the chosen header strategy

## Implementation hints
- Currently:
  - `country-switcher.tsx` line 22: `<span className="text-sm text-[var(--muted)] hidden sm:inline">{t('header.country')}</span>` — this is the hidden label.
  - `language-switcher.tsx` line 18: same pattern.
  - `routes/__root.tsx` header line ~46: `<h1>` + flex-wrap row containing `<CountrySwitcher /> <LanguageSwitcher /> <ThemeToggle />`. On a 360px viewport the row wraps but without prefix labels visible.
- Easiest viable design: drop the `hidden sm:inline` so the labels are always visible; on mobile let the switcher block stack vertically (label on its own line above the buttons). The buttons themselves are already small enough to fit 5 in a row at 360px (each ~40px wide).
- For the filter sidebar sticky footer pattern: `position: sticky; bottom: 0; padding: 12px; background: var(--card); border-top: 1px solid var(--border); z-index: 10` on the action row.
- Manual smoke check (paste into Developer log):
  1. `npm run dev`, open Chrome devtools device toolbar at 360×640 (Pixel-ish).
  2. Verify header shows labeled switchers, no horizontal scroll.
  3. Open filter drawer, change a filter, close it, see results update.
  4. Open a title detail, verify it stacks correctly, tap an offer button.
  5. Switch language → strings update.
  6. Repeat at 768px (tablet) and 1280px (desktop) — confirm no desktop regression.

---
## Developer log
(Developer appends here)

---
## Reviewer verdict
(Reviewer appends here)
