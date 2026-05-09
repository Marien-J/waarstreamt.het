# 20260509-switcher-labels-and-visual-differentiation

**Status:** READY_FOR_REVIEW
**Created:** 2026-05-09

## Goal

Two flag rows side-by-side in the header are visually indistinguishable — users can't tell which controls country and which controls language. Fix by adding inline labels and using a different visual idiom per control: country = flag + ISO code, language = text-only language code (no flag). This also follows the well-established UX rule that **flags should not be used for languages** (flags represent nations, not languages — and several language/country pairs collide visually).

## Scope decisions (binding)

1. **Country switcher** = `Country:` muted prefix label + 5 buttons, each rendering `<flag-emoji> <ISO-code>` (e.g., `🇩🇪 DE`).
2. **Language switcher** = `Language:` muted prefix label + 4 buttons, each rendering ONLY the uppercase language code (`EN`, `NL`, `DE`, `FR`). No flags.
3. Active button: solid `var(--accent)` background, `text-white`. Inactive: transparent, `text-[var(--muted)]`, `hover:text-[var(--text)]`. Both use `aria-pressed` correctly (already done; keep).
4. Header layout stays in `routes/__root.tsx`. Switchers stay in the same row as `ThemeToggle`. On narrow viewports (<640px), the prefix labels (`Country:` / `Language:`) hide via `hidden sm:inline`.

## Acceptance criteria

- [ ] `web/src/components/country-switcher.tsx`: each button shows `flag + ISO code` (e.g. `🇩🇪 DE`). A muted `Country:` label precedes the button group, hidden on `<640px`.
- [ ] `web/src/components/language-switcher.tsx`: each button shows uppercase code only (`EN`, `NL`, `DE`, `FR`). No flag glyphs in this component. A muted `Language:` label precedes the button group, hidden on `<640px`.
- [ ] Active state uses `bg-[var(--accent)] text-white`. Inactive uses `text-[var(--muted)] hover:text-[var(--text)]` with no background. `aria-pressed` reflects active state.
- [ ] Both labels (`Country:` / `Language:`) are translatable via `useTranslation()`. Add keys `header.country` and `header.language` to all 4 i18n dictionaries (en/nl/de/fr).
- [ ] `npx tsx web/scripts/check-i18n-keys.ts` still passes (57 keys after additions).
- [ ] `cd web && npm run build` exits 0.
- [ ] `npx tsx web/scripts/verify-wiring.ts` still passes (gate from previous task).

## Constraints / non-goals

- Do **not** add localized country names or language autonyms (e.g., "Deutschland", "Français"). The whole point is to keep buttons compact and unambiguous via codes. Translations of the prefix labels only.
- Do **not** change the data, the geo logic, or the catalog reload behavior.
- Do **not** add a new dependency.

## Affected docs

- `docs/features/streaming-web-app.md` — update the "header" / "switchers" section to describe the new visual treatment (label + code buttons).

## Implementation hints

- Tailwind: `<span className="text-sm text-[var(--muted)] hidden sm:inline">{t('header.country')}</span>` next to the button group.
- Keep both groups inside `<div className="flex items-center gap-3">…</div>` to maintain existing header alignment.
- For the language switcher, drop the `flag` field from the `LANGUAGES` array entirely; replace with `{ code: 'en' }, …`. Render `{l.code.toUpperCase()}`.
- Active class: `bg-[var(--accent)] text-white`. Inactive: `text-[var(--muted)] hover:text-[var(--text)]`. Add `font-medium` for legibility on the codes.

---
## Developer log

**Files changed:**
- `web/src/components/country-switcher.tsx` — added `useTranslation`, prefix label `header.country` (hidden `<640px`), changed buttons to render `{flag} {ISO-code}`, updated active/inactive classes to `bg-[var(--accent)] text-white` / `text-[var(--muted)] hover:text-[var(--text)]`, outer wrapper `flex items-center gap-3`.
- `web/src/components/language-switcher.tsx` — added `useTranslation`, prefix label `header.language` (hidden `<640px`), dropped `flag` field from `LANGUAGES` array entirely, buttons render `{code.toUpperCase()}` only (no flag emojis), same active/inactive classes.
- `web/src/i18n/en.json` — added `"header.country": "Country:"`, `"header.language": "Language:"`.
- `web/src/i18n/nl.json` — added `"header.country": "Land:"`, `"header.language": "Taal:"`.
- `web/src/i18n/de.json` — added `"header.country": "Land:"`, `"header.language": "Sprache:"`.
- `web/src/i18n/fr.json` — added `"header.country": "Pays :"`, `"header.language": "Langue :"` (French space-before-colon typography).
- `docs/features/streaming-web-app.md` — updated "Country & Language Switchers" section.

**Verification outputs:**
```
cd web && npm run build   → ✓ built in 3.58s (exit 0)
check-i18n-keys.ts        → ✅ All 4 dictionaries have the same 57 keys.
verify-wiring.ts          → PASS — all wiring assertions satisfied.
```

**Confirmation checks:**
- `country-switcher.tsx` contains `flag` field (emoji) AND renders `{c.flag} {c.code}` (ISO code).
- `language-switcher.tsx` contains zero flag emoji literals (🇳🇱/🇩🇪/🇬🇧/🇫🇷 removed).

---
## Reviewer verdict
(Reviewer appends here)

APPROVED. All 7 gates pass:
- Gate 1: `country-switcher.tsx` renders `{c.flag} {c.code}` with `t('header.country')` label ✅
- Gate 2: Zero flag emoji literals in `language-switcher.tsx` ✅
- Gate 3: `header.country` / `header.language` keys present in all 4 i18n files ✅
- Gate 4: `npm run build` exits 0 (built in 3.28s) ✅
- Gate 5: `check-i18n-keys.ts` — 57 keys, all dicts match ✅
- Gate 6: `verify-wiring.ts` — PASS ✅
- Gate 7: `docs/features/streaming-web-app.md` — "Country & Language Switchers" section updated ✅

Branch: agent/20260509-switcher-labels-and-visual-differentiation
PR: https://github.com/Marien-J/waarstreamt.het/compare/main...agent/20260509-switcher-labels-and-visual-differentiation?expand=1
