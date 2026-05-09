"""Tests for provider resolution."""

from unittest.mock import patch

from tests._fixtures import make_package


def test_resolve_provider_codes_success() -> None:
    """Test that all returned packages are included in the result."""
    from streaming_nl.providers import resolve_provider_codes

    mock_packages = [
        make_package(short_name="nfx", name="Netflix", technical_name="netflix"),
        make_package(short_name="vdl", name="Videoland", technical_name="videoland"),
        make_package(short_name="dnp", name="Disney Plus", technical_name="disneyplus"),
        make_package(
            short_name="amp", name="Amazon Prime Video", technical_name="amazonprimevideo"
        ),
    ]

    with patch("streaming_nl.providers.jw_providers", return_value=mock_packages):
        result = resolve_provider_codes("NL")

    assert result == {
        "Netflix": "nfx",
        "Videoland": "vdl",
        "Disney Plus": "dnp",
        "Amazon Prime Video": "amp",
    }


def test_resolve_provider_codes_zero_match_exits() -> None:
    """Test that zero providers returned from JW causes SystemExit."""
    from streaming_nl.providers import resolve_provider_codes

    with patch("streaming_nl.providers.jw_providers", return_value=[]):
        try:
            resolve_provider_codes("NL")
            raise AssertionError("Should have raised SystemExit")
        except SystemExit as exc:
            assert exc.code == 1
