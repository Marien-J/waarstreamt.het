"""Provider resolution and lookup functionality."""

import structlog
from simplejustwatchapi import providers as jw_providers  # type: ignore[import-untyped]

from streaming_nl.config import COUNTRY

logger = structlog.get_logger()


def resolve_provider_codes(country: str = COUNTRY) -> dict[str, str]:
    """Return all JustWatch providers for the country as name -> short_name codes.

    Args:
        country: Two-letter country code

    Returns:
        Dict mapping provider display name -> short_name for all available providers

    Raises:
        SystemExit: If zero providers returned (network failure guard)
    """
    # TODO: filter to flatrate/subscription-only once simplejustwatchapi exposes
    # monetization type on provider objects returned by jw_providers().
    available = jw_providers(country=country)

    if not available:
        logger.error("no_providers_returned", country=country)
        raise SystemExit(1)

    result = {p.name: p.short_name for p in available}
    logger.info("provider_resolution_complete", country=country, count=len(result))
    return result
