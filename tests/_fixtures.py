"""Helpers to build correctly-shaped NamedTuple fixtures for tests."""

from __future__ import annotations

from simplejustwatchapi import MediaEntry, Offer, OfferPackage, Scoring


def make_package(
    *,
    short_name: str,
    name: str,
    technical_name: str,
) -> OfferPackage:
    return OfferPackage(
        id=f"pkg:{short_name}",
        package_id=0,
        name=name,
        technical_name=technical_name,
        short_name=short_name,
        monetization_types=[],
        icon="",
    )


def make_offer(
    *,
    package: OfferPackage,
    monetization_type: str,
    presentation_type: str,
    price_value: float | None = None,
    price_currency: str | None = None,
    url: str = "",
    audio_languages: list[str] | None = None,
    subtitle_languages: list[str] | None = None,
) -> Offer:
    return Offer(
        id="offer:0",
        monetization_type=monetization_type,
        presentation_type=presentation_type,
        price_string=None,
        price_value=price_value,
        price_currency=price_currency or "",
        last_change_retail_price_value=None,
        type="",
        package=package,
        url=url,
        element_count=None,
        available_to=None,
        deeplink_roku=None,
        subtitle_languages=subtitle_languages or [],
        video_technology=[],
        audio_technology=[],
        audio_languages=audio_languages or [],
    )


def make_scoring(
    *,
    imdb_score: float | None = None,
    tmdb_score: float | None = None,
    tomatometer: int | None = None,
) -> Scoring:
    return Scoring(
        imdb_score=imdb_score,
        imdb_votes=None,
        tmdb_popularity=None,
        tmdb_score=tmdb_score,
        tomatometer=tomatometer,
        certified_fresh=None,
        jw_rating=None,
    )


def make_entry(
    *,
    entry_id: str,
    object_id: int,
    object_type: str,
    title: str,
    release_year: int | None,
    runtime_minutes: int | None,
    imdb_id: str | None,
    tmdb_id: str | None,
    genres: list[str],
    age_certification: str | None,
    url: str | None,
    poster: str | None,
    scoring: Scoring | None,
    offers: list[Offer],
) -> MediaEntry:
    # NamedTuple type hints aren't enforced at runtime, so passing None for
    # nominally-required fields is fine — the production code under test
    # already guards against None for these.
    return MediaEntry(
        entry_id=entry_id,
        object_id=object_id,
        object_type=object_type,
        title=title,
        url=url,
        release_year=release_year,  # type: ignore[arg-type]
        release_date="",
        runtime_minutes=runtime_minutes,  # type: ignore[arg-type]
        short_description="",
        genres=genres,
        imdb_id=imdb_id,
        tmdb_id=tmdb_id,
        poster=poster,
        backdrops=[],
        age_certification=age_certification,
        scoring=scoring,
        interactions=None,
        streaming_charts=None,
        offers=offers,
        total_season_count=None,
        total_episode_count=None,
        season_number=None,
        episode_number=None,
    )
