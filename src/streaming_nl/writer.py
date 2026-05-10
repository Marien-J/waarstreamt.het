"""CSV writer utilities."""

import csv
from collections.abc import Sequence
from pathlib import Path

import structlog

logger = structlog.get_logger()


# Column order per spec
COLUMNS = [
    "extracted_at",
    "country",
    "jw_entry_id",
    "jw_object_id",
    "object_type",
    "title",
    "release_year",
    "runtime_minutes",
    "imdb_id",
    "tmdb_id",
    "genres",
    "age_certification",
    "imdb_score",
    "tmdb_score",
    "tomatometer",
    "streaming_charts_rank",
    "jw_url",
    "poster_url",
    "provider_short_name",
    "provider_name",
    "provider_technical_name",
    "monetization_type",
    "presentation_type",
    "price_value",
    "price_currency",
    "offer_url",
    "audio_languages",
    "subtitle_languages",
]


def write_csv(rows: Sequence[dict[str, str]], path: Path) -> None:
    """Write rows to CSV with proper quoting and column order.
    
    Args:
        rows: List of row dicts
        path: Output file path
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=COLUMNS,
            quoting=csv.QUOTE_ALL,
        )
        writer.writeheader()
        writer.writerows(rows)
    
    logger.info("csv_written", path=str(path), row_count=len(rows))


def write_provider_csv(
    provider_map: dict[str, str], path: Path, country: str
) -> None:
    """Write provider metadata CSV.
    
    Args:
        provider_map: Dict of display_name -> short_name
        path: Output file path
        country: Country code
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    
    rows = [
        {
            "country": country,
            "display_name": display_name,
            "short_name": short_name,
        }
        for display_name, short_name in provider_map.items()
    ]
    
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["country", "display_name", "short_name"],
            quoting=csv.QUOTE_ALL,
        )
        writer.writeheader()
        writer.writerows(rows)
    
    logger.info("provider_csv_written", path=str(path), provider_count=len(rows))
