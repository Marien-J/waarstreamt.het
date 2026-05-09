# 20260509-detail-page-search-bar

## Goal
Add a compact search input on the title detail page (`routes/title.$id.tsx`), in the same row as "Back to browse" on desktop, stacking below it on mobile.

## Acceptance criteria
- [ ] Search input appears in same row as "Back to browse" on desktop (`sm:flex-row`); stacks below on mobile.
- [ ] Submit → `navigate({ to: '/', search: { q: query } })`.
- [ ] Empty submit → no-op.
- [ ] Max width ~360px on desktop (`sm:max-w-[360px]`), full width on mobile.
- [ ] Tap target ≥ 44px (`min-h-[44px]`).
- [ ] Reuses `t('search_placeholder')` — no new i18n keys.
- [ ] `initializeSearch` is NOT called on the detail page.
- [ ] `verify-wiring.ts` asserts that `title.$id.tsx` navigates to `/` with a `q` search param.
- [ ] `docs/features/streaming-web-app.md` updated.
- [ ] All gates pass (`pytest`, `verify-wiring.ts`, `check-i18n-keys.ts`).

## Affected docs
- `docs/features/streaming-web-app.md`

## Implementation hints
- Add `const [query, setQuery] = useState('')` in `TitleDetailView`.
- Wrap back button + search form in a `flex flex-col sm:flex-row` container.
- Form `onSubmit`: `e.preventDefault(); if (!query.trim()) return; navigate({ to: '/', search: { q: query.trim() } })`.

## Developer log
- Modified: `web/src/routes/title.$id.tsx` — added `query` state, replaced back button with `flex flex-col sm:flex-row` container holding back button + search form; submit navigates to `/ ?q=...`.
- Modified: `web/scripts/verify-wiring.ts` — added assertion that `title.$id.tsx` navigates to `/` with `q` search param.
- Modified: `docs/features/streaming-web-app.md` — added "Detail Page — Search Bar" section.
- All 3 gates pass: 18 pytest tests ✓, 23 wiring assertions ✓, i18n 62-key parity ✓.

## Reviewer verdict
APPROVED. All gates pass.
- Gate 1: diff confirms `<form onSubmit>`, input bound to state, navigate to `/` with `q`, empty no-op, `t('search_placeholder')`, `min-h-[44px]` on button and input.
- Gate 2: zero `initializeSearch` matches in `title.$id.tsx`.
- Gate 3: `verify-wiring.ts` exits 0, 23 assertions including new `title.$id.tsx navigates to / with q search param`.
- Gate 4: i18n 62-key parity — PASS.
- Gate 5: `npm run build` — exit 0.
- Gate 6: `test:search` — 9/9.
- Gate 7: `pytest` — 18/18.
Branch: agent/20260509-detail-page-search-bar. PR: https://github.com/Marien-J/waarstreamt.het/compare/main...agent/20260509-detail-page-search-bar?expand=1
