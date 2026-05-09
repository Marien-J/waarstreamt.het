# 20260509-dynamic-provider-discovery

**Status:** READY_FOR_DEV
**Created:** 2026-05-09

## Goal

Replace the static, hand-curated `provider_names` list in each country config with fully dynamic provider discovery: every time the extractor runs it queries JustWatch for that country's providers and takes **all flatrate (subscription) providers** automatically. No manual list maintenance ever again.

This was motivated by discovering HBO Max was missing from DE, and Disney+/Apple TV+ were silently failing to match due to "+" vs "plus" name mismatches — both caused by the same root problem: a static list that diverges from reality.

## Acceptance criteria

- [ ] `CountryConfig` TypedDict no longer has a `provider_names` field.
- [ ] All per-country `provider_names` lists are removed from `COUNTRY_CONFIGS` in `config.py`.
- [ ] The legacy `PROVIDER_NAMES` constant in `config.py` is removed.
- [ ] `providers.py` `resolve_provider_codes()` no longer reads `provider_names` from config; instead it calls `jw_providers(country=country)` and returns **all** packages whose `clear_name` / `package_type` or similar field indicates flatrate (subscription) availability. If the API doesn't expose a flatrate filter on the provider object, return all providers (simpler is fine — see Implementation hints).
- [ ] `resolve_provider_codes()` still raises `SystemExit(1)` if JustWatch returns zero packages (network failure guard).
- [ ] `_providers.csv` output reflects the live JW provider set (no change to writer).
- [ ] All existing tests pass with mocks updated to match new logic.
  - `test_country_configs_required_fields`: remove `provider_names` assertion.
  - `test_country_configs_resolve_providers_mocked`: rewrite — mock returns N packages, assert result equals all N mapped.
  - `test_resolve_provider_codes_success`: simplify — assert result contains all mocked packages.
  - `test_resolve_provider_codes_partial_match`: delete (no longer applicable).
  - `test_resolve_provider_codes_zero_match_exits`: keep as-is.
- [ ] `uv run pytest -q` passes with no failures.

## Constraints / non-goals

- Do NOT change the CSV schema, writer, normalizer, or extractor logic.
- Do NOT change the CLI interface or `COUNTRY_CONFIGS` keys (country codes stay).
- Do NOT add new countries — that is a separate task.
- Extracting 200+ providers including rental/purchase stores would make runs impractically slow. If the JustWatch package object exposes a package type or monetization hint, filter to subscription-only. If it doesn't, just take all and add a TODO comment — don't over-engineer.

## Affected docs (developer must update or prune)

- `docs/features/` — scan for any doc that mentions `provider_names` configuration and update or remove the stale guidance.

## Implementation hints

### What to remove
- `CountryConfig.provider_names: list[str]`
- All `"provider_names": [...]` blocks in each country dict
- `PROVIDER_NAMES = COUNTRY_CONFIGS["NL"]["provider_names"]` legacy alias

### New `resolve_provider_codes` (providers.py)
```python
def resolve_provider_codes(country: str = COUNTRY) -> dict[str, str]:
    available = jw_providers(country=country)
    if not available:
        logger.error("no_providers_returned", country=country)
        raise SystemExit(1)
    result = {p.name: p.short_name for p in available}
    logger.info("provider_resolution_complete", country=country, count=len(result))
    return result
```
If the package object has a field like `package_type == "subscription"` or similar, wrap the comprehension in a filter. Check by inspecting `available[0].__dict__` or `vars(available[0])` in the notebook.

### Imports to clean up (providers.py)
Remove `COUNTRY_CONFIGS` and `PROVIDER_NAMES` imports from `streaming_nl.config`; only `COUNTRY` is still needed.

---
## Developer log

**Files changed:**
- `src/streaming_nl/config.py` — removed `provider_names: list[str]` from `CountryConfig` TypedDict; removed all `provider_names` lists from NL/DE/BE/US/GB/JP country dicts; removed `PROVIDER_NAMES` alias.
- `src/streaming_nl/providers.py` — replaced curated-list matching loop with direct `{p.name: p.short_name for p in available}` comprehension; cleaned up imports (dropped `COUNTRY_CONFIGS`, `PROVIDER_NAMES`); added TODO comment about flatrate filtering (OfferPackage has `monetization_types` but jw_providers returns it unpopulated at provider-query time).
- `tests/test_config.py` — removed `provider_names` assertion from `test_country_configs_required_fields`; rewrote `test_country_configs_resolve_providers_mocked` to assert all mocked packages returned (not name-matched subset).
- `tests/test_providers.py` — updated `test_resolve_provider_codes_success` to assert full dict equality; deleted `test_resolve_provider_codes_partial_match`; updated `test_resolve_provider_codes_zero_match_exits` to pass empty list instead of unmatched package.
- `docs/features/streaming-catalog.md` — removed `provider_names` config bullet; updated Known limitations to replace fuzzy-matching note with dynamic-discovery note.

**Tests added:** none (updated existing); 17 passed, 0 failed.

**Decisions:** `OfferPackage.monetization_types` exists in the library's data model but is not populated by `jw_providers()` (provider-level endpoint), so no flatrate filter was applied — a TODO comment marks this for future improvement.

---
## Reviewer verdict
(Reviewer appends here)

APPROVED. 17 tests pass. All acceptance criteria satisfied: `provider_names` removed from TypedDict + all 6 country configs, `PROVIDER_NAMES` alias removed, `resolve_provider_codes` replaced with 3-line dict comprehension, tests updated correctly, docs pruned. Branch: agent/20260509-dynamic-provider-discovery. PR: (see below).
