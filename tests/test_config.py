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
    """Each entry must have country, language, and provider_names."""
    from streaming_nl.config import COUNTRY_CONFIGS

    for cc, cfg in COUNTRY_CONFIGS.items():
        assert cfg["country"] == cc, f"{cc}: country field mismatch"
        assert cfg["language"], f"{cc}: language must be non-empty"
        assert len(cfg["provider_names"]) >= 3, f"{cc}: need at least 3 provider names"


def test_country_configs_resolve_providers_mocked() -> None:
    """Each country config must resolve at least 3 providers against a mocked JW catalog."""
    from streaming_nl.config import COUNTRY_CONFIGS
    from streaming_nl.providers import resolve_provider_codes

    # Comprehensive mock catalog covering all 5 countries' target providers
    mock_packages = [
        make_package(short_name="nfx", name="Netflix", technical_name="netflix"),
        make_package(short_name="vdl", name="Videoland", technical_name="videoland"),
        make_package(short_name="dnp", name="Disney Plus", technical_name="disneyplus"),
        make_package(short_name="amp", name="Amazon Prime Video", technical_name="amazonprimevideo"),
        make_package(short_name="hbm", name="HBO Max", technical_name="hbomax"),
        make_package(short_name="sky", name="SkyShowtime", technical_name="skyshowtime"),
        make_package(short_name="atp", name="Apple TV+", technical_name="appletv"),
        # DE-specific
        make_package(short_name="rtl", name="RTL+", technical_name="rtlplus"),
        make_package(short_name="wow", name="WOW", technical_name="wow"),
        make_package(short_name="prm", name="Paramount+", technical_name="paramount"),
        make_package(short_name="jyn", name="Joyn", technical_name="joyn"),
        # BE-specific
        make_package(short_name="stmz", name="Streamz", technical_name="streamz"),
        make_package(short_name="vrt", name="VRT MAX", technical_name="vrtmax"),
        make_package(short_name="gpl", name="GoPlay", technical_name="goplay"),
        # US-specific
        make_package(short_name="hlu", name="Hulu", technical_name="hulu"),
        make_package(short_name="max", name="Max", technical_name="max"),
        make_package(short_name="pck", name="Peacock", technical_name="peacock"),
        # GB-specific
        make_package(short_name="bbc", name="BBC iPlayer", technical_name="bbciplayer"),
        make_package(short_name="now", name="NOW", technical_name="now"),
        make_package(short_name="itv", name="ITVX", technical_name="itvx"),
    ]

    with patch("streaming_nl.providers.jw_providers", return_value=mock_packages):
        for cc in COUNTRY_CONFIGS:
            result = resolve_provider_codes(country=cc)
            assert len(result) >= 3, (
                f"{cc}: expected at least 3 resolved providers, got {len(result)}: {list(result.keys())}"
            )
