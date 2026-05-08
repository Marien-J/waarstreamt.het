"""Data loading, caching, and search logic."""

from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd
from fuzzywuzzy import fuzz


# Global DataFrame loaded at startup
_df: pd.DataFrame | None = None


def load_data(csv_path: Path) -> pd.DataFrame:
    """Load CSV into memory and cache globally."""
    global _df
    
    df = pd.read_csv(csv_path, low_memory=False)
    
    # Clean data types
    df["release_year"] = pd.to_numeric(df["release_year"], errors="coerce")
    df["runtime_minutes"] = pd.to_numeric(df["runtime_minutes"], errors="coerce")
    df["imdb_score"] = pd.to_numeric(df["imdb_score"], errors="coerce")
    df["tmdb_score"] = pd.to_numeric(df["tmdb_score"], errors="coerce")
    df["price_value"] = pd.to_numeric(df["price_value"], errors="coerce")
    
    # Fill NaN strings with empty
    string_cols = [
        "title", "imdb_id", "tmdb_id", "genres", "age_certification",
        "provider_name", "monetization_type", "presentation_type",
        "offer_url", "poster_url"
    ]
    for col in string_cols:
        if col in df.columns:
            df[col] = df[col].fillna("")
    
    _df = df
    return df


def get_data() -> pd.DataFrame:
    """Get the loaded DataFrame."""
    if _df is None:
        raise RuntimeError("Data not loaded. Call load_data() first.")
    return _df


@lru_cache(maxsize=1)
def get_unique_titles() -> list[dict[str, Any]]:
    """Get list of unique titles with aggregated metadata."""
    df = get_data()
    
    # Group by title identifier to get unique titles
    unique = df.groupby("jw_entry_id").agg({
        "title": "first",
        "release_year": "first",
        "object_type": "first",
        "genres": "first",
        "imdb_score": "first",
        "tmdb_score": "first",
        "runtime_minutes": "first",
        "poster_url": "first",
        "imdb_id": "first",
        "tmdb_id": "first",
        "age_certification": "first",
    }).reset_index()
    
    # Calculate average rating
    unique["avg_rating"] = unique[["imdb_score", "tmdb_score"]].mean(axis=1)
    
    return unique.to_dict("records")


@lru_cache(maxsize=128)
def get_filter_options() -> dict[str, Any]:
    """Get all filter options (cached)."""
    df = get_data()
    
    # Provider list
    providers = sorted(df["provider_name"].dropna().unique())
    
    # Genres (flatten and count)
    all_genres = []
    for genres_str in df["genres"].dropna():
        if genres_str:
            all_genres.extend(genres_str.split(";"))
    
    genre_counts = pd.Series(all_genres).value_counts()
    top_genres = genre_counts.head(15).index.tolist()
    
    # Year range
    years = df["release_year"].dropna()
    year_min = int(years.min()) if len(years) > 0 else 1900
    year_max = int(years.max()) if len(years) > 0 else 2026
    
    # Content types
    content_types = sorted(df["object_type"].dropna().unique())
    
    # Monetization types
    monetization_types = sorted(df["monetization_type"].dropna().unique())
    
    # Quality levels
    qualities = sorted([q for q in df["presentation_type"].dropna().unique() if q])
    
    return {
        "providers": providers,
        "genres": top_genres,
        "year_min": year_min,
        "year_max": year_max,
        "content_types": content_types,
        "monetization_types": monetization_types,
        "qualities": qualities,
    }


def search_titles(
    query: str,
    providers: list[str] | None = None,
    content_type: str | None = None,
    monetization_types: list[str] | None = None,
    genres: list[str] | None = None,
    year_range: tuple[int, int] | None = None,
    qualities: list[str] | None = None,
    min_score: int = 70,
) -> pd.DataFrame:
    """Search titles with fuzzy matching and filters.
    
    Args:
        query: Search string (min 2 chars)
        providers: Filter by provider names
        content_type: Filter by MOVIE or SHOW
        monetization_types: Filter by monetization types
        genres: Filter by genres
        year_range: (min_year, max_year) tuple
        qualities: Filter by presentation types
        min_score: Minimum fuzzy match score (0-100)
    
    Returns:
        DataFrame of matching titles with offers
    """
    df = get_data()
    
    # Start with full dataset
    results = df.copy()
    
    # Apply filters first
    if providers:
        results = results[results["provider_name"].isin(providers)]
    
    if content_type:
        results = results[results["object_type"] == content_type]
    
    if monetization_types:
        results = results[results["monetization_type"].isin(monetization_types)]
    
    if qualities:
        results = results[results["presentation_type"].isin(qualities)]
    
    if year_range:
        min_year, max_year = year_range
        results = results[
            (results["release_year"] >= min_year) &
            (results["release_year"] <= max_year)
        ]
    
    if genres:
        # Match any genre in the list
        genre_mask = results["genres"].apply(
            lambda x: any(g in str(x).split(";") for g in genres) if x else False
        )
        results = results[genre_mask]
    
    # Search across title and IDs if query provided
    if query and len(query) >= 2:
        query_lower = query.lower()
        
        # Check if query looks like an ID
        is_imdb = query.startswith("tt")
        is_tmdb = query.isdigit()
        
        if is_imdb:
            # Direct IMDb ID match
            results = results[results["imdb_id"].str.lower() == query_lower]
        elif is_tmdb:
            # Direct TMDB ID match
            results = results[results["tmdb_id"] == query]
        else:
            # Fuzzy title search
            def score_title(title: str) -> int:
                if not title:
                    return 0
                # Exact match gets boost
                if query_lower == title.lower():
                    return 100
                # Partial ratio for fuzzy matching
                return fuzz.partial_ratio(query_lower, title.lower())
            
            results["_search_score"] = results["title"].apply(score_title)
            results = results[results["_search_score"] >= min_score]
            results = results.sort_values("_search_score", ascending=False)
            results = results.drop("_search_score", axis=1)
    else:
        # No query - show unique titles only (one row per title)
        # Group by jw_entry_id to show unique titles
        results = results.groupby("jw_entry_id").first().reset_index()
        # Sort by title
        results = results.sort_values("title")
        # Limit to 500 unique titles for performance
        results = results.head(500)
    
    return results


def get_title_details(jw_entry_id: str) -> dict[str, Any]:
    """Get all offers and metadata for a specific title."""
    df = get_data()
    
    title_df = df[df["jw_entry_id"] == jw_entry_id]
    
    if title_df.empty:
        return {}
    
    # Get title metadata (from first row)
    first = title_df.iloc[0]
    
    # Group offers by provider
    offers = []
    for _, row in title_df.iterrows():
        offers.append({
            "provider_name": row["provider_name"],
            "monetization_type": row["monetization_type"],
            "presentation_type": row["presentation_type"],
            "price_value": row["price_value"],
            "price_currency": row["price_currency"],
            "offer_url": row["offer_url"],
        })
    
    # Find best deal
    best_deal = None
    
    # Prefer flatrate, then cheapest rent, then cheapest buy
    flatrate = [o for o in offers if o["monetization_type"] == "FLATRATE"]
    rents = [o for o in offers if o["monetization_type"] == "RENT" and pd.notna(o["price_value"])]
    buys = [o for o in offers if o["monetization_type"] == "BUY" and pd.notna(o["price_value"])]
    
    if flatrate:
        best_deal = flatrate[0]
    elif rents:
        best_deal = min(rents, key=lambda x: x["price_value"])
    elif buys:
        best_deal = min(buys, key=lambda x: x["price_value"])
    
    return {
        "jw_entry_id": jw_entry_id,
        "title": first["title"],
        "release_year": first["release_year"],
        "object_type": first["object_type"],
        "runtime_minutes": first["runtime_minutes"],
        "genres": first["genres"],
        "age_certification": first["age_certification"],
        "imdb_id": first["imdb_id"],
        "tmdb_id": first["tmdb_id"],
        "imdb_score": first["imdb_score"],
        "tmdb_score": first["tmdb_score"],
        "poster_url": first["poster_url"],
        "offers": offers,
        "best_deal": best_deal,
    }
