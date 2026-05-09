# 20260509-detail-page-search-bar

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
On the title detail page (`/title/$id`), expose a compact search bar so the user can start a new search without first navigating "back to overview". Keep the existing "Back to browse" link. Submitting a search should navigate to `/?q=<query>` (the browse view will pick up the query param and run the search), so detail-page search reuses the existing browse search machinery — no new search index initialization on the detail page.

## Acceptance criteria
- [ ] `routes/title.$id.tsx` shows a small search input near the top of the page (placement: in the same row as "Back to browse", aligned right; on mobile, on its own row below the back link).
- [ ] Submitting the search (Enter or clicking the search icon) navigates to `/` with `?q=<query>` as a search param.
- [ ] An empty submit does nothing (do not navigate to `/?q=`).
- [ ] The input is not full-width on desktop (max width ~320–400px). On mobile it spans the available width.
- [ ] Reuses the same translation key for placeholder as the main search bar (`search_placeholder`).
- [ ] Tap target ≥44px on mobile.
- [ ] The detail page does NOT call `initializeSearch` — the search index is built by the browse page when the user lands there.
- [ ] All existing test gates remain green: `npm run build`, `npm run test:search`, `check-i18n-keys`, `verify-wiring`, `uv run pytest`.
- [ ] Extend `verify-wiring.ts` with: `routes/title.$id.tsx` contains a search input bound to a navigation to `/` with `q` search param (substring match on `to: '/'` and `q:` or equivalent).

## Constraints / non-goals
- Do NOT initialize MiniSearch on the detail page.
- Do NOT add filters/sort/etc. — only a query box.
- Do NOT change the URL of the detail page.

## Affected docs (developer must update or prune)
- docs/features/streaming-web-app.md — note the detail page hosts a compact search-jump input

## Implementation hints
- The existing `components/search-bar.tsx` is overkill for this (it has its own state machinery). Either reuse it with an `onSearch` that navigates, OR inline a small `<input type="search">` + form `onSubmit` handler that calls `navigate({ to: '/', search: { q: query } })`. Prefer the inline approach — keeps detail-page bundle lean and avoids carrying search-bar-specific styling assumptions.
- The browse route already has `validateSearch` that picks up `q`. No backend changes needed.
- TanStack Router `useNavigate()` is already imported in `title.$id.tsx`.
- Manual smoke check (paste into Developer log):
  1. Open a title detail page.
  2. Type "vikings" in the new search box, press Enter.
  3. Should land on `/?q=vikings` with results showing.
  4. Verify the layout looks tidy on mobile (360px) and desktop.

---
## Developer log
(Developer appends here)

---
## Reviewer verdict
(Reviewer appends here)
