"""Configuration constants for the streaming extractor."""

from pathlib import Path
from typing import TypedDict


class CountryConfig(TypedDict):
    country: str
    language: str


# Per-country configuration
COUNTRY_CONFIGS: dict[str, CountryConfig] = {
    "NL": {
        "country": "NL",
        "language": "nl",
    },
    "DE": {
        "country": "DE",
        "language": "de",
    },
    "BE": {
        "country": "BE",
        "language": "nl",
    },
    "US": {
        "country": "US",
        "language": "en",
    },
    "GB": {
        "country": "GB",
        "language": "en",
    },
}

# JustWatch API settings
PAGE_SIZE = 90  # Safe limit before complexity errors
MAX_OFFSET = 1890  # Stay under 1999 cap

# Legacy defaults (kept for backward-compat; prefer COUNTRY_CONFIGS)
COUNTRY = "NL"
LANGUAGE = "nl"

# Content types to extract
CONTENT_TYPES = ["MOVIE", "SHOW"]

# Output settings
OUTPUT_DIR = Path("data")

