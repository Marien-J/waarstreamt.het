"""Configuration constants for the streaming-nl extractor."""

from pathlib import Path

# JustWatch API settings
COUNTRY = "NL"
LANGUAGE = "nl"
PAGE_SIZE = 90  # Safe limit before complexity errors
MAX_OFFSET = 1890  # Stay under 1999 cap

# Provider display names to resolve
PROVIDER_NAMES = [
    "Netflix",
    "Videoland",
    "Disney+",
    "Amazon Prime Video",
    "HBO Max",
    "SkyShowtime",
    "Apple TV+",
]

# Content types to extract
CONTENT_TYPES = ["MOVIE", "SHOW"]

# Output settings
OUTPUT_DIR = Path("data")
