# 20260508-fix-justwatch-api-imports

**Status:** READY_FOR_DEV
**Created:** 2026-05-08

## Goal

Fix the broken JustWatch API integration in `streaming-nl`. The previous implementation invented a class-based API (`GetPopularTitles`, `GetProviders`) that doesn't exist in `simple-justwatch-python-api`. The real library exposes module-level functions. The job currently fails immediately on import. This task replaces the fake API with the real one, removes now-redundant logic, and adds a runtime smoke test so this class of bug cannot ship again.

## Acceptance criteria

- [ ] `uv run python -c "import streaming_nl.extract, streaming_nl.providers, streaming_nl.normalize, streaming_nl.job"` exits 0 with no ImportError
- [ ] `uv run python -m streaming_nl` runs to completion and produces both CSV files in `data/`
- [ ] Main CSV has ≥1,000 rows (we already proved the spec-level ≥5k target, just need to confirm the wiring works end-to-end)
- [ ] `uv run pytest` still passes (existing tests must be updated to use correct imports)
- [ ] `uv run mypy --strict src/streaming_nl` passes
- [ ] `uv run ruff check src tests` passes
- [ ] A new test, `tests/test_imports.py`, imports every module in `streaming_nl` and asserts the real library symbols exist (catches this exact class of bug)

## Constraints / non-goals

- **Do not change the CSV schema.** Output must remain identical to what's documented in [README-streaming-nl.md](README-streaming-nl.md) and [tasks/20260508-nl-streaming-catalog-extractor.md](tasks/20260508-nl-streaming-catalog-extractor.md).
- **Do not change the public function signatures** of `extract_partition`, `media_entry_to_rows`, `resolve_provider_codes`, `run_job`. Only the internals change.
- **Do not add new dependencies.**
- **Do not refactor unrelated code.** This is a surgical fix.

## Affected docs

- [README-streaming-nl.md](README-streaming-nl.md) — add a one-line note in "Known limitations" about `best_only` being delegated to the API (see Implementation hints)
- [docs/features/nl-streaming-catalog.md](docs/features/nl-streaming-catalog.md) — update the "Data source" section if it references the wrong API shape

## Implementation hints

### The real API (verified by reading `.venv/lib/python3.12/site-packages/simplejustwatchapi/`)

The library exposes **module-level functions**, not classes. The correct imports are:

```python
from simplejustwatchapi import popular, providers, details
from simplejustwatchapi import MediaEntry, Offer, OfferPackage, Scoring
# OR equivalently:
# from simplejustwatchapi.tuples import MediaEntry, Offer, OfferPackage, Scoring
```

There is **no** `simplejustwatchapi.schema` module. There are **no** `GetPopularTitles` or `GetProviders` classes.

### Real `popular()` signature

```python
def popular(
    country: str = "US",
    language: str = "en",
    count: int = 4,
    best_only: bool = True,           # NOTE: defaults to True
    offset: int = 0,
    providers: list[str] | str | None = None,
    min_release_year: int | None = None,
    max_release_year: int | None = None,
    object_types: list[str] | str | None = None,   # NOT "content_types"
) -> list[MediaEntry]
```

### Real `providers()` signature

```python
def providers(country: str = "US") -> list[OfferPackage]
```

### Files to fix

#### [src/streaming_nl/extract.py](src/streaming_nl/extract.py)

- **Remove** `from simplejustwatchapi.query import GetPopularTitles`
- **Remove** `from simplejustwatchapi.schema import MediaEntry`
- **Add** `from simplejustwatchapi import popular, MediaEntry`
- **Remove** the `query = GetPopularTitles()` instantiation
- **Replace** `query.popular(...)` call inside `_fetch_page` with module-level `popular(...)`
- **Rename** the `content_type` argument to `object_type` everywhere in this file (the public function `extract_partition` keeps its existing parameter name to preserve the contract — but inside, when calling `popular()`, pass it as `object_types=[object_type]`)
- **Pass `best_only=True` explicitly** to `popular()` so it's clear we rely on API-side quality collapsing
- **Update retry exception types**: also retry on `JustWatchHttpError` (import from `simplejustwatchapi`). Do NOT retry on `JustWatchApiError` (per spec).

#### [src/streaming_nl/providers.py](src/streaming_nl/providers.py)

- **Remove** `from simplejustwatchapi.query import GetProviders`
- **Add** `from simplejustwatchapi import providers as jw_providers` (alias to avoid shadowing the module)
- **Replace** `provider_query = GetProviders(); available_providers = provider_query.providers(country=country)` with `available_providers = jw_providers(country=country)`

#### [src/streaming_nl/normalize.py](src/streaming_nl/normalize.py)

- **Remove** `from simplejustwatchapi.schema import MediaEntry`
- **Add** `from simplejustwatchapi import MediaEntry`
- **Keep** the presentation_type collapsing logic. It is redundant when `best_only=True` is used at the API layer (the API already returns one offer per quality), but the dedup in [job.py](src/streaming_nl/job.py) on `(jw_entry_id, provider_short_name, monetization_type)` will also collapse anything that slips through. Keeping the normalize-layer collapse is defensive and harmless.

#### [src/streaming_nl/job.py](src/streaming_nl/job.py)

- No import fixes needed (it imports from local modules, not the broken paths)
- Verify it still runs after the dependency fixes above

#### [tests/test_normalize.py](tests/test_normalize.py)

- If it imports from `simplejustwatchapi.schema`, change to `simplejustwatchapi` (or `simplejustwatchapi.tuples`)
- Hand-built `MediaEntry` fixtures must use the **real** field set from `simplejustwatchapi.tuples.MediaEntry` — read the NamedTuple definition and construct accordingly. The Developer should open the file `.venv/lib/python3.12/site-packages/simplejustwatchapi/tuples.py` to see the exact field list.
- Same applies for `Offer`, `OfferPackage`, `Scoring` fixtures.

#### [tests/test_providers.py](tests/test_providers.py)

- Same import fixes as above
- Mocking strategy: patch `streaming_nl.providers.jw_providers` (the module-level function alias) instead of the non-existent `GetProviders` class

### New file: [tests/test_imports.py](tests/test_imports.py)

Add this file with a dirt-simple check that catches "imported a name that doesn't exist" bugs at test time:

```python
"""Smoke test: every module imports cleanly and uses real library symbols."""

def test_all_modules_import() -> None:
    import streaming_nl.config
    import streaming_nl.providers
    import streaming_nl.extract
    import streaming_nl.normalize
    import streaming_nl.writer
    import streaming_nl.job
    import streaming_nl.__main__  # noqa: F401


def test_real_library_symbols_exist() -> None:
    """Pin the public API surface we depend on. If the upstream library changes
    these names, we want a loud failure here, not a runtime crash in production."""
    from simplejustwatchapi import popular, providers, MediaEntry, Offer, OfferPackage
    assert callable(popular)
    assert callable(providers)
    # NamedTuples are types — instantiating them with no args fails, but they
    # must at least be importable and have a _fields attribute.
    assert hasattr(MediaEntry, "_fields")
    assert hasattr(Offer, "_fields")
    assert hasattr(OfferPackage, "_fields")
```

This test runs in <100ms, requires no network, and would have caught the original bug instantly.

### Final verification (Developer must run all of these before declaring done)

```bash
uv sync
uv run pytest                                    # all tests pass
uv run mypy --strict src/streaming_nl            # types clean
uv run ruff check src tests                      # lint clean
uv run python -c "import streaming_nl.job"       # imports work
uv run python -m streaming_nl                    # full extract runs end-to-end
ls -lh data/                                     # CSV files produced
wc -l data/streaming_nl_*.csv                    # ≥1000 rows in main file
```

**Do not declare the task done until `uv run python -m streaming_nl` actually completes successfully and produces a CSV with rows in it.** Code that imports cleanly is necessary but not sufficient.

---

## Developer log
(Developer appends here)

### 2026-05-08 — code changes complete, awaiting runtime verification

Surgical fix applied per spec. Changes:

- [src/streaming_nl/extract.py](src/streaming_nl/extract.py)
  - Replaced `from simplejustwatchapi.query import GetPopularTitles` and `from simplejustwatchapi.schema import MediaEntry` with `from simplejustwatchapi import JustWatchHttpError, MediaEntry, popular`.
  - `_fetch_page` now calls module-level `popular(...)` directly. Dropped the `query` parameter. Renamed `content_type` → `object_type` inside `_fetch_page` and pass `object_types=[object_type]` to the API. `best_only=True` passed explicitly.
  - Retry policy now also retries on `JustWatchHttpError` (network/HTTP transients) but not `JustWatchApiError`.
  - `extract_partition` keeps its `content_type` parameter name (public contract preserved); it forwards the value as `object_type=content_type` into `_fetch_page`.
- [src/streaming_nl/providers.py](src/streaming_nl/providers.py)
  - Replaced `from simplejustwatchapi.query import GetProviders` with `from simplejustwatchapi import providers as jw_providers`. Replaced the two-line instantiation+call with a single `jw_providers(country=country)` call.
- [src/streaming_nl/normalize.py](src/streaming_nl/normalize.py)
  - Updated import to `from simplejustwatchapi import MediaEntry`. Presentation-type collapsing left in as defensive backstop, per spec.
- [tests/_fixtures.py](tests/_fixtures.py) — new helper module with `make_package`, `make_offer`, `make_scoring`, `make_entry` builders that fill in **all** real NamedTuple fields from `simplejustwatchapi.tuples`.
- [tests/test_normalize.py](tests/test_normalize.py), [tests/test_providers.py](tests/test_providers.py) — rewritten to use the fixture builders and to patch `streaming_nl.providers.jw_providers` instead of the non-existent `GetProviders` class. `simplejustwatchapi.schema` import removed.
- [tests/test_imports.py](tests/test_imports.py) — new file. Imports every `streaming_nl` module and asserts the real upstream symbols (`popular`, `providers`, `MediaEntry`, `Offer`, `OfferPackage`) exist. Catches the previous class-of-bug in <100ms with no network.
- [README-streaming-nl.md](README-streaming-nl.md) — added one-line note in "Known limitations" that presentation-type collapsing is delegated to the API via `best_only=True`.
- [docs/features/nl-streaming-catalog.md](docs/features/nl-streaming-catalog.md) — already accurate (refers to module-level `popular`/`providers` indirectly via the library name only); no update required.

### ⚠ Verification not yet executed

This developer agent does not have a terminal tool available in the current execution environment. The code changes pass static analysis (no diagnostics from the language server) but the spec-required runtime checks have **not** been run from inside the agent:

```bash
uv sync
uv run pytest
uv run mypy --strict src/streaming_nl
uv run ruff check src tests
uv run python -m streaming_nl
wc -l data/streaming_nl_*.csv
```

Status remains **IN_DEV** until these are run and pass. The user (or a Reviewer agent with terminal access) needs to execute the checklist before flipping to `READY_FOR_REVIEW`.

---

## Reviewer verdict
(Reviewer appends here)

### Reviewer must verify (lessons from previous task)

The previous review missed import errors because the Reviewer only inspected code structure and trusted that "it looks correct". For this task, the Reviewer **must**:

1. Run `uv run python -m streaming_nl` themselves and confirm exit code 0
2. Verify `data/streaming_nl_<date>.csv` exists and has rows
3. Run the full `pytest`/`mypy`/`ruff` triple
4. Only then sign off
