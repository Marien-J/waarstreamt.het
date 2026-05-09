"""Tests for multi-country configuration."""

from unittest.mock import patch

from tests._fixtures import make_package


EXPECTED_COUNTRIES = ["NL", "DE", "BE", "US", "GB"]


def test_country_configs_has_all_countries() -> None:
    """All 5 expected country codes must be present."""
    from streaming_nl.config import COUNTRY_CONFIGS

    for cc in EXPECTED_COUNTRIES:
        assert cc in COUNTRY_CONFIGS, f"Missing country config: {cc}"


def test_country_configs_required_fields() -> None:
    """Each entry must have country and language."""
    from streaming_nl.config import COUNTRY_CONFIGS

    for cc, cfg in COUNTRY_CONFIGS.items():
        assert cfg["country"] == cc, f"{cc}: country field mismatch"
        assert cfg["language"], f"{cc}: language must be non-empty"


def test_country_configs_resolve_providers_mocked() -> None:
    """resolve_provider_codes returns all mocked packages for every country config."""
    from streaming_nl.config import COUNTRY_CONFIGS
    from streaming_nl.providers import resolve_provider_codes

    mock_packages = [
        make_package(short_name="nfx", name="Netflix", technical_name="netflix"),
        make_package(short_name="vdl", name="Videoland", technical_name="videoland"),
        make_package(short_name="dnp", name="Disney Plus", technical_name="disneyplus"),
    ]
    expected = {"Netflix": "nfx", "Videoland": "vdl", "Disney Plus": "dnp"}

    with patch("streaming_nl.providers.jw_providers", return_value=mock_packages):
        for cc in COUNTRY_CONFIGS:
            result = resolve_provider_codes(country=cc)
            assert result == expected, (
                f"{cc}: expected all mocked providers, got {list(result.keys())}"
            )
