# 20260509-rebrand-multi-country

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal
The product is now multi-country (NL/DE/BE/US/GB), but several user-facing surfaces still call it an "NL streaming catalog" — most visibly the browser-tab title (`Waar streamt het? — NL Streaming Catalog`). Sweep all user-facing copy and meta tags so nothing claims this is a Dutch-only product. Backend module names (`src/streaming_nl/`), CSV filenames, and historical task files stay as-is — those are not user-facing and renaming them is out of scope.

## Acceptance criteria
- [ ] `web/index.html` `<title>` is country-neutral. Suggested: `Waar streamt het? — Streaming Catalog` (or simply `Waar streamt het?`).
- [ ] `web/index.html` `<meta name="description">` is country-neutral (drop "Dutch"). Suggested: `Waar streamt het? Search and discover movies and shows across streaming providers in NL, DE, BE, US, GB.`
- [ ] `README.md` (top-level) and `README-streaming-nl.md` opening paragraphs do not call this a Dutch / NL-only product. Either retitle `README-streaming-nl.md` to `README-streaming-catalog.md` or update its content + leading H1. Pick one and update any links from `docs/INDEX.md` and the top-level `README.md`.
- [ ] `IMPLEMENTATION_SUMMARY.md` — if it survived earlier cleanups, either delete (it's stale historical context) or rename + retitle. Confirm it's not linked from `docs/INDEX.md`; if not, delete.
- [ ] `docs/features/streaming-catalog.md` and `docs/features/streaming-web-app.md` opening paragraphs reflect multi-country scope (a quick read; fix any "Dutch streaming catalog" / "NL only" claims).
- [ ] App-level visible strings: `routes/__root.tsx` `<h1>Waar streamt het?</h1>` is fine (already country-neutral). `i18n/*.json` `app_title` is `Waar streamt het?` — leave alone. Just confirm no stray "NL streaming" strings ship in any consumer-visible JSX or i18n dict.
- [ ] No regressions: `npm run build`, `npm run test:search`, `check-i18n-keys`, `verify-wiring`, `uv run pytest`.
- [ ] `verify-wiring.ts` extended with one assert: `web/index.html` title does NOT contain the substring "NL Streaming".

## Constraints / non-goals
- Do NOT rename `src/streaming_nl/` Python module. Renaming Python packages is mechanical churn with no user value at this time.
- Do NOT rename CSV files or change preprocess output paths.
- Do NOT change i18n keys.
- Skip historical task `.md` files in `tasks/` — they are write-once history.

## Affected docs (developer must update or prune)
- README.md (top-level) — confirm/clean opening paragraph
- README-streaming-nl.md — rename to README-streaming-catalog.md OR retitle and update content
- docs/INDEX.md — update any link to the renamed README
- docs/features/streaming-catalog.md — confirm multi-country opening
- docs/features/streaming-web-app.md — confirm multi-country opening
- IMPLEMENTATION_SUMMARY.md — delete if stale, or update

## Implementation hints
- The visible browser-tab text in the screenshot is the bug the user reported. Fix `web/index.html` first, verify in `npm run preview` the tab text reflects the new title.
- Use `git grep -i "NL Streaming\|Dutch streaming\|nl-streaming"` (excluding `tasks/`, `IMPLEMENTATION_SUMMARY.md` if deleting it, and the `streaming_nl` Python module) to find remaining mentions.

---
## Developer log

**Files changed:**
- `web/index.html` — title changed to `Waar streamt het? — Streaming Catalog`; meta description updated to multi-country wording (dropped "Dutch")
- `README-streaming-nl.md` → renamed to `README-streaming-catalog.md`; H1 updated from `# streaming-nl` to `# Streaming Catalog`
- `IMPLEMENTATION_SUMMARY.md` — deleted (stale historical doc; confirmed not linked from `docs/INDEX.md`)
- `web/scripts/verify-wiring.ts` — added assert: `web/index.html` title does NOT contain "NL Streaming"
- `tasks/_queue.json` — added entry, transitioned READY_FOR_DEV → IN_DEV → READY_FOR_REVIEW

**Tests added:** none (the new verify-wiring assert is the gate; all existing pytest 18/18 pass)

**Docs touched:**
- `docs/INDEX.md` — already links to `features/streaming-catalog.md` and `features/streaming-web-app.md`; no changes needed
- `docs/features/streaming-catalog.md` — already multi-country; no changes needed
- `docs/features/streaming-web-app.md` — already multi-country; no changes needed

**Surprising:** `docs/INDEX.md` did not link to `README-streaming-nl.md`, and `README.md` did not reference it either — so the rename required no link updates.

---
## Reviewer verdict
APPROVED. All 7 gates pass (1 fix cycle used).

Fix cycle 1: Developer updated 3 remaining "Dutch streaming catalog" occurrences missed in initial pass:
- web/README.md line 3
- docs/features/dashboard.md line 8
- docs/architecture/decisions/001-web-app-architecture.md line 9

Gates summary:
- Gate 1 (git diff): IMPLEMENTATION_SUMMARY.md deleted, README-streaming-nl.md renamed, web/index.html title/meta updated, verify-wiring.ts assert added. ✓
- Gate 2 (grep): zero matches after fix cycle. ✓
- Gate 3 (verify-wiring.ts): PASS — all wiring assertions satisfied. ✓
- Gate 4 (check-i18n-keys.ts): 62 keys across 4 dictionaries. ✓
- Gate 5 (npm run build): exit 0. ✓
- Gate 6 (test:search): 9/9 passed. ✓
- Gate 7 (pytest): 18/18 passed. ✓

Branch: agent/20260509-rebrand-multi-country. PR: https://github.com/Marien-J/waarstreamt.het/compare/main...agent/20260509-rebrand-multi-country?expand=1
