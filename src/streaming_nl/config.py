"""Configuration constants for the streaming extractor."""

from pathlib import Path
from typing import TypedDict


class CountryConfig(TypedDict):
    country: str
    language: str
    provider_names: list[str]


# Per-country configuration
COUNTRY_CONFIGS: dict[str, CountryConfig] = {
    "NL": {
        "country": "NL",
        "language": "nl",
        "provider_names": [
            "Netflix",
            "Videoland",
            "Disney+",
            "Amazon Prime Video",
            "HBO Max",
            "SkyShowtime",
            "Apple TV+",
        ],
    },
    "DE": {
        "country": "DE",
        "language": "de",
        "provider_names": [
            "Netflix",
            "Amazon Prime Video",
            "Disney+",
            "Apple TV+",
            "RTL+",
            "WOW",
            "Paramount+",
            "Joyn",
        ],
    },
    "BE": {
        "country": "BE",
        "language": "nl",
        "provider_names": [
            "Netflix",
            "Streamz",
            "Amazon Prime Video",
            "Disney+",
            "Apple TV+",
            "VRT MAX",
            "GoPlay",
        ],
    },
    "US": {
        "country": "US",
        "language": "en",
        "provider_names": [
            "Netflix",
            "Hulu",
            "Amazon Prime Video",
            "Disney+",
            "Apple TV+",
            "Max",
            "Paramount+",
            "Peacock",
        ],
    },
    "GB": {
        "country": "GB",
        "language": "en",
        "provider_names": [
            "Netflix",
            "Amazon Prime Video",
            "Disney+",
            "Apple TV+",
            "BBC iPlayer",
            "NOW",
            "ITVX",
            "Paramount+",
        ],
    },
    "JP": {
        "country": "JP",
        "language": "en",
        "provider_names": [
            "Netflix",
            "Amazon Prime Video",
            "Disney+",
            "Apple TV+",
            "Hulu",
            "U-NEXT",
            "Paramount+",
        ],
    },
}

# JustWatch API settings
PAGE_SIZE = 90  # Safe limit before complexity errors
MAX_OFFSET = 1890  # Stay under 1999 cap

# Legacy defaults (kept for backward-compat; prefer COUNTRY_CONFIGS)
COUNTRY = "NL"
LANGUAGE = "nl"
PROVIDER_NAMES = COUNTRY_CONFIGS["NL"]["provider_names"]

# Content types to extract
CONTENT_TYPES = ["MOVIE", "SHOW"]

# Output settings
OUTPUT_DIR = Path("data")
