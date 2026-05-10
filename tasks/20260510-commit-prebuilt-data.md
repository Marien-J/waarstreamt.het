# 20260510-commit-prebuilt-data

**Status:** READY_FOR_DEV
**Created:** 2026-05-10

## Goal

The deployed site at `https://marien-j.github.io/waarstreamt.het/` is showing stale data (DE: 11,678 titles instead of the expected 56,713) because the latest re-extracted CSVs were never pushable: DE 130MB and US 272MB exceed GitHub's hard 100MB per-file limit. The two local commits that hold the new CSVs (`61e5a30`, `96dd36e`) sit unpushed and orphaned on `agent/20260509-dynamic-provider-discovery`. CI on `main` therefore rebuilt against the older smaller CSVs and the perf-tier PR merged that build to Pages.

Fix this permanently by **stopping committing CSVs and starting to commit the preprocessed JSONs** (`web/public/data/*.json`) instead. The JSON tier is already designed to keep every file ≤50MB, so it fits GitHub. CSVs become local-dev artifacts only. CI's job becomes a plain `vite build` (no preprocess, no CSVs needed). On merge, the deploy auto-triggers and the site shows the full re-extracted catalog.

Also forward-port the small extractor changes from the orphaned commits so the next local extraction keeps the monetization filter behaviour we already validated:
- `src/streaming_nl/providers.py` — `INCLUDED_MONETIZATION_TYPES = {"FLATRATE", "FREE", "ADS", "RENT"}` filter
- `tests/_fixtures.py` — `make_package()` defaults `monetization_types=["FLATRATE"]`

## Acceptance criteria

### Data layout
- [ ] `.gitignore` (or `web/.gitignore`) is adjusted so `web/public/data/*.json` is **tracked** going forward. The existing `public/data/` ignore in `web/.gitignore` is removed.
- [ ] `.gitignore` (root) keeps CSVs ignored — i.e. revert the existing `!data/*.csv` allow-rule so all of `data/` is gitignored. Local CSVs and `data/streaming_*_providers.csv` files no longer go to git.
- [ ] All current `data/streaming_*.csv` and `data/streaming_*_providers.csv` files are **removed from the repo** (`git rm`). They live on disk for local extraction only.
- [ ] All current `web/public/data/*.json` files (manifest, catalog_<cc>, offers_<cc>{,_N}, providers_<cc>) are **committed** to the repo, generated from the latest re-extracted CSVs. Use `git checkout 96dd36e -- data/` to recover the big CSVs from the orphaned local commit, then run preprocess, then commit the JSON outputs.
- [ ] Final committed JSON file sizes match what the perf-tier task produced from the big CSVs: `catalog_de.json` ≈ 20MB, `catalog_us.json` ≈ 34MB, `offers_de_{0,1}.json` ≈ 27/26MB, `offers_us_{0,1}.json` ≈ 41/41MB, others smaller. Manifest reports `title_count` of NL≈35k, DE≈56k, BE≈34k, US≈96k, GB≈56k, JP≈34k.
- [ ] No file in the committed tree exceeds 50MB. Verify with `find . -type f -size +50M` before commit; nothing should match in tracked paths.

### Build pipeline
- [ ] `web/scripts/preprocess.ts` no longer runs as part of `npm run build`. Update `web/package.json`: `"build": "vite build"` (drop the `tsx scripts/preprocess.ts &&` prefix). Add a separate script `"preprocess": "tsx scripts/preprocess.ts"` for explicit local use.
- [ ] `web/scripts/preprocess.ts` itself stays functional: it must still be runnable locally after a fresh extraction to regenerate the JSONs. If `data/` has no matching CSVs, it should fail with a clear message rather than producing empty JSONs.
- [ ] `.github/workflows/deploy-pages.yml` is unchanged in structure — it still runs `npm ci && npm run build`, which now does only `vite build`. No preprocess in CI.
- [ ] `cd web && npm run build` succeeds locally on a clean clone (no CSVs present) and `dist/data/` ends up identical to `public/data/`.

### Extractor parity (small forward-port)
- [ ] `src/streaming_nl/providers.py`: add `INCLUDED_MONETIZATION_TYPES = {"FLATRATE", "FREE", "ADS", "RENT"}` and apply it to filter providers (use the exact change from commit `61e5a30`).
- [ ] `tests/_fixtures.py`: `make_package()` defaults `monetization_types=["FLATRATE"]` (also from `61e5a30`).
- [ ] `uv run pytest -q` passes with the forward-ported changes.

### Deploy verification
- [ ] After merge, the next CI run on `main` deploys successfully. Confirmed by `curl -sI https://marien-j.github.io/waarstreamt.het/data/manifest.json` showing the new `last-modified` and `curl -s .../data/manifest.json | jq '.countries.de.title_count'` returning ~56713 (or whatever the new build produced — must be ≥ the local manifest values).
- [ ] `curl -sI .../data/offers_us_0.json` returns 200 (was 404 before this fix).

### Quality bar
- [ ] `uv run pytest -q` passes (17 tests).
- [ ] `cd web && npx tsx scripts/test-search.ts && npx tsx scripts/test-filters.ts && npx tsx scripts/check-i18n-keys.ts && npx tsx scripts/verify-wiring.ts` all pass.
- [ ] `cd web && npm run build` succeeds. `find web/dist -type f -size +95M` returns nothing.

## Constraints / non-goals

- **Don't** change the Web Worker, search behaviour, UX, or filter semantics. This is a deploy-shape fix only.
- **Don't** introduce git LFS, gzip-of-CSVs, or any in-CI extraction step. The decision is to commit JSONs directly.
- **Don't** rewrite git history. Leave commits `61e5a30` and `96dd36e` orphaned on the local-only branch; we won't push them. After this task lands and the user confirms the deploy looks right, the orphaned `agent/20260509-dynamic-provider-discovery` remote branch can be deleted in a separate step (don't do it in this task).
- **Don't** re-run the full extraction. Recover the big CSVs from the orphaned local commit (`git checkout 96dd36e -- data/`) — they're already correct.
- **Don't** add new runtime deps.
- **Don't** modify the perf-tier work; that's already correct.

## Affected docs (developer must update or prune)

- `docs/architecture/decisions/006-data-tiering-and-worker.md` — add a "Deploy shape" subsection: JSONs are committed; CSVs are local-only intermediates; CI runs only `vite build`.
- `docs/features/streaming-catalog.md` — note that CSV extraction outputs are gitignored; the canonical persisted artifact is the per-country JSON tier under `web/public/data/`.
- `docs/features/streaming-web-app.md` — note `npm run build` no longer includes preprocess; reference the new `npm run preprocess` script for local rebuilds.
- `docs/INDEX.md` — no new entries; just verify links are still valid.

## Implementation hints

- **Branch base**: branch from `main`, not from any agent branch. The orphaned dynamic-provider commits are dead-end.
- **Recovery sequence**: `git checkout main && git pull && git checkout -b agent/20260510-commit-prebuilt-data` then `git checkout 96dd36e -- data/` to pull the big CSVs into the working tree without bringing those commits' history. Then `git checkout 96dd36e -- src/streaming_nl/providers.py tests/_fixtures.py`. Then run preprocess, then `git add web/public/data/ src/ tests/ web/.gitignore .gitignore web/scripts/preprocess.ts web/package.json` etc., **but do not** `git add data/`.
- **Verify CSVs aren't accidentally staged**: before commit, `git status` must not list `data/streaming_*.csv`.
- **Repo size check**: total repo working tree should grow by roughly +330MB (the JSON tier) and shrink by ~480MB (the CSVs being un-tracked from prior history is NOT in scope — they were never on main, so removing them from the workdir doesn't shrink history). Net: GH repo grows by ~330MB. That's fine.
- **Preprocess "no CSVs" guard**: a one-line check at the top of preprocess.ts that throws if zero matching CSVs are found.
- **Don't forget** to commit `data/` removal as part of this commit so anyone cloning fresh doesn't see stale CSVs (note: only matters if any CSVs were ever in main's history; check with `git ls-tree origin/main data/ | grep csv`. If yes, `git rm` them; if no, just gitignore-only is fine).

---
## Developer log
(Developer appends here)

---
## Reviewer verdict
(Reviewer appends here)
