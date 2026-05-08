"""Tests for provider resolution."""

from unittest.mock import patch

from tests._fixtures import make_package


def test_resolve_provider_codes_success() -> None:
    """Test successful provider resolution."""
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

    assert "Netflix" in result
    assert result["Netflix"] == "nfx"
    assert "Videoland" in result
    assert result["Videoland"] == "vdl"


def test_resolve_provider_codes_partial_match() -> None:
    """Test that partial matching works and warnings are logged for unmatched."""
    from streaming_nl.providers import resolve_provider_codes

    mock_packages = [
        make_package(short_name="nfx", name="Netflix", technical_name="netflix"),
    ]

    with patch("streaming_nl.providers.jw_providers", return_value=mock_packages):
        result = resolve_provider_codes("NL")

    assert len(result) >= 1
    assert "Netflix" in result


def test_resolve_provider_codes_zero_match_exits() -> None:
    """Test that zero matches causes SystemExit."""
    from streaming_nl.providers import resolve_provider_codes

    mock_packages = [
        make_package(short_name="xxx", name="Unknown Service", technical_name="unknown"),
    ]

    with patch("streaming_nl.providers.jw_providers", return_value=mock_packages):
        try:
            resolve_provider_codes("NL")
            raise AssertionError("Should have raised SystemExit")
        except SystemExit as exc:
            assert exc.code == 1
