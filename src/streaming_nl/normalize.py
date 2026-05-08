"""Normalize MediaEntry objects into flat CSV rows."""

from datetime import datetime, timezone

import structlog
from simplejustwatchapi import MediaEntry  # type: ignore[import-untyped]

logger = structlog.get_logger()


# Presentation type quality precedence
PRESENTATION_TYPES = {"4K": 4, "HD": 3, "SD": 2, "": 1}


def _get_presentation_priority(presentation_type: str | None) -> int:
    """Get numeric priority for presentation type."""
    if presentation_type is None:
        return PRESENTATION_TYPES[""]
    return PRESENTATION_TYPES.get(presentation_type, 1)


def media_entry_to_rows(entry: MediaEntry, country: str) -> list[dict[str, str]]:
    """Fan out one row per offer in entry.offers.
    
    Apply presentation_type collapsing: for each unique
    (entry_id, provider_short_name, monetization_type), keep only the
    highest-fidelity presentation_type (4K > HD > SD > empty).
    
    If entry has no offers, return empty list and log at DEBUG level.
    
    Args:
        entry: MediaEntry from JustWatch API
        country: Two-letter country code
        
    Returns:
        List of row dicts (one per collapsed offer)
    """
    if not entry.offers:
        logger.debug("entry_has_no_offers", entry_id=entry.entry_id, title=entry.title)
        return []
    
    # Extract timestamp once
    extracted_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    # Group offers by (provider_short_name, monetization_type)
    # and keep only the best presentation_type
    best_offers: dict[tuple[str, str], dict[str, str]] = {}
    
    for offer in entry.offers:
        key = (offer.package.short_name, offer.monetization_type)
        
        # Build row dict
        row: dict[str, str] = {
            "extracted_at": extracted_at,
            "country": country,
            "jw_entry_id": entry.entry_id or "",
            "jw_object_id": str(entry.object_id) if entry.object_id is not None else "",
            "object_type": entry.object_type or "",
            "title": entry.title or "",
            "release_year": str(entry.release_year) if entry.release_year is not None else "",
            "runtime_minutes": (
                str(entry.runtime_minutes) if entry.runtime_minutes is not None else ""
            ),
            "imdb_id": entry.imdb_id or "",
            "tmdb_id": entry.tmdb_id or "",
            "genres": ";".join(entry.genres) if entry.genres else "",
            "age_certification": entry.age_certification or "",
            "imdb_score": (
                str(entry.scoring.imdb_score)
                if entry.scoring and entry.scoring.imdb_score is not None
                else ""
            ),
            "tmdb_score": (
                str(entry.scoring.tmdb_score)
                if entry.scoring and entry.scoring.tmdb_score is not None
                else ""
            ),
            "tomatometer": (
                str(entry.scoring.tomatometer)
                if entry.scoring and entry.scoring.tomatometer is not None
                else ""
            ),
            "jw_url": entry.url or "",
            "poster_url": entry.poster or "",
            "provider_short_name": offer.package.short_name or "",
            "provider_name": offer.package.name or "",
            "provider_technical_name": offer.package.technical_name or "",
            "monetization_type": offer.monetization_type or "",
            "presentation_type": offer.presentation_type or "",
            "price_value": str(offer.price_value) if offer.price_value is not None else "",
            "price_currency": offer.price_currency or "",
            "offer_url": offer.url or "",
            "audio_languages": ";".join(offer.audio_languages) if offer.audio_languages else "",
            "subtitle_languages": (
                ";".join(offer.subtitle_languages) if offer.subtitle_languages else ""
            ),
        }
        
        # Keep only the best presentation_type for this key
        if key not in best_offers:
            best_offers[key] = row
        else:
            current_priority = _get_presentation_priority(
                best_offers[key]["presentation_type"]
            )
            new_priority = _get_presentation_priority(row["presentation_type"])
            if new_priority > current_priority:
                best_offers[key] = row
    
    return list(best_offers.values())
