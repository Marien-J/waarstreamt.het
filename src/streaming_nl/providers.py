"""Provider resolution and lookup functionality."""

import structlog
from simplejustwatchapi import providers as jw_providers  # type: ignore[import-untyped]

from streaming_nl.config import COUNTRY

logger = structlog.get_logger()


INCLUDED_MONETIZATION_TYPES = {"FLATRATE", "FREE", "ADS", "RENT"}


def resolve_provider_codes(country: str = COUNTRY) -> dict[str, str]:
    """Return JustWatch providers for the country filtered to streaming/rental offers.

    Includes providers with any of: FLATRATE, FREE, ADS, RENT.
    Excludes purchase-only (BUY) and cinema (CINEMA) providers.

    Args:
        country: Two-letter country code

    Returns:
        Dict mapping provider display name -> short_name

    Raises:
        SystemExit: If zero providers returned (network failure guard)
    """
    available = jw_providers(country=country)

    if not available:
        logger.error("no_providers_returned", country=country)
        raise SystemExit(1)

    filtered = [
        p for p in available
        if INCLUDED_MONETIZATION_TYPES & set(p.monetization_types)
    ]

    result = {p.name: p.short_name for p in filtered}
    logger.info(
        "provider_resolution_complete",
        country=country,
        total=len(available),
        filtered=len(result),
    )
    return result
