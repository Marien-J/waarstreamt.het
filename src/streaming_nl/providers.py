"""Provider resolution and lookup functionality."""

import structlog
from simplejustwatchapi import providers as jw_providers  # type: ignore[import-untyped]

from streaming_nl.config import COUNTRY, COUNTRY_CONFIGS, PROVIDER_NAMES

logger = structlog.get_logger()


def resolve_provider_codes(country: str = COUNTRY) -> dict[str, str]:
    """Resolve provider display names to JustWatch short_name codes.

    Args:
        country: Two-letter country code

    Returns:
        Dict mapping display_name -> short_name for successfully matched providers

    Raises:
        SystemExit: If zero providers matched (fatal)
    """
    # Use country-specific provider list if available, else fall back to global
    config = COUNTRY_CONFIGS.get(country.upper())
    provider_names = config["provider_names"] if config else PROVIDER_NAMES

    logger.info("resolving_providers", country=country, target_count=len(provider_names))

    # Fetch available providers for this country
    available_providers = jw_providers(country=country)

    matched: dict[str, str] = {}

    for display_name in provider_names:
        display_lower = display_name.lower()

        for package in available_providers:
            # Try matching against name or technical_name
            if (
                display_lower in package.name.lower()
                or display_lower in package.technical_name.lower()
            ):
                matched[display_name] = package.short_name
                logger.info(
                    "provider_matched",
                    display_name=display_name,
                    short_name=package.short_name,
                    technical_name=package.technical_name,
                )
                break
        else:
            logger.warning("provider_not_matched", display_name=display_name)

    if not matched:
        logger.error("no_providers_matched", country=country)
        raise SystemExit(1)

    logger.info("provider_resolution_complete", matched_count=len(matched))
    return matched
