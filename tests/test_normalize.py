"""Tests for normalize module."""

from tests._fixtures import make_entry, make_offer, make_package, make_scoring


def test_movie_with_flatrate_offer() -> None:
    """Test normalizing a movie with a single flatrate offer."""
    from streaming_nl.normalize import media_entry_to_rows

    nfx = make_package(short_name="nfx", name="Netflix", technical_name="netflix")
    entry = make_entry(
        entry_id="tm123456",
        object_id=123456,
        object_type="MOVIE",
        title="Test Movie",
        release_year=2023,
        runtime_minutes=120,
        imdb_id="tt1234567",
        tmdb_id="123456",
        genres=["Action", "Drama"],
        age_certification="16",
        url="https://justwatch.com/nl/movie/test",
        poster="https://images.justwatch.com/poster.jpg",
        scoring=make_scoring(imdb_score=7.5, tmdb_score=8.0, tomatometer=85),
        offers=[
            make_offer(
                package=nfx,
                monetization_type="FLATRATE",
                presentation_type="HD",
                url="https://netflix.com/watch/123",
                audio_languages=["en", "nl"],
                subtitle_languages=["nl", "en"],
            )
        ],
    )

    rows = media_entry_to_rows(entry, "NL")

    assert len(rows) == 1
    row = rows[0]

    assert row["country"] == "NL"
    assert row["jw_entry_id"] == "tm123456"
    assert row["object_type"] == "MOVIE"
    assert row["title"] == "Test Movie"
    assert row["release_year"] == "2023"
    assert row["runtime_minutes"] == "120"
    assert row["imdb_id"] == "tt1234567"
    assert row["tmdb_id"] == "123456"
    assert row["genres"] == "Action;Drama"
    assert row["age_certification"] == "16"
    assert row["imdb_score"] == "7.5"
    assert row["tmdb_score"] == "8.0"
    assert row["tomatometer"] == "85"
    assert row["provider_short_name"] == "nfx"
    assert row["provider_name"] == "Netflix"
    assert row["monetization_type"] == "FLATRATE"
    assert row["presentation_type"] == "HD"
    assert row["audio_languages"] == "en;nl"
    assert row["subtitle_languages"] == "nl;en"


def test_show_with_rent_and_buy_offers() -> None:
    """Test normalizing a show with both rent and buy offers."""
    from streaming_nl.normalize import media_entry_to_rows

    itu = make_package(short_name="itu", name="Apple TV", technical_name="itunes")
    entry = make_entry(
        entry_id="ts654321",
        object_id=654321,
        object_type="SHOW",
        title="Test Show",
        release_year=2022,
        runtime_minutes=45,
        imdb_id="tt7654321",
        tmdb_id="654321",
        genres=["Comedy"],
        age_certification="12",
        url="https://justwatch.com/nl/show/test",
        poster="https://images.justwatch.com/poster2.jpg",
        scoring=make_scoring(imdb_score=8.2),
        offers=[
            make_offer(
                package=itu,
                monetization_type="RENT",
                presentation_type="HD",
                price_value=3.99,
                price_currency="EUR",
                url="https://tv.apple.com/rent/123",
                audio_languages=["en"],
                subtitle_languages=["nl"],
            ),
            make_offer(
                package=itu,
                monetization_type="BUY",
                presentation_type="HD",
                price_value=12.99,
                price_currency="EUR",
                url="https://tv.apple.com/buy/123",
                audio_languages=["en"],
                subtitle_languages=["nl"],
            ),
        ],
    )

    rows = media_entry_to_rows(entry, "NL")

    assert len(rows) == 2

    rent_row = [r for r in rows if r["monetization_type"] == "RENT"][0]
    buy_row = [r for r in rows if r["monetization_type"] == "BUY"][0]

    assert rent_row["price_value"] == "3.99"
    assert buy_row["price_value"] == "12.99"
    assert rent_row["price_currency"] == "EUR"
    assert buy_row["price_currency"] == "EUR"


def test_entry_with_none_scoring_fields() -> None:
    """Test normalizing an entry with missing scoring data."""
    from streaming_nl.normalize import media_entry_to_rows

    vdl = make_package(short_name="vdl", name="Videoland", technical_name="videoland")
    entry = make_entry(
        entry_id="tm999999",
        object_id=999999,
        object_type="MOVIE",
        title="Obscure Movie",
        release_year=None,
        runtime_minutes=None,
        imdb_id="",
        tmdb_id="",
        genres=[],
        age_certification="",
        url="https://justwatch.com/nl/movie/obscure",
        poster="",
        scoring=None,
        offers=[
            make_offer(
                package=vdl,
                monetization_type="FLATRATE",
                presentation_type="SD",
            )
        ],
    )

    rows = media_entry_to_rows(entry, "NL")

    assert len(rows) == 1
    row = rows[0]

    assert row["release_year"] == ""
    assert row["runtime_minutes"] == ""
    assert row["imdb_score"] == ""
    assert row["tmdb_score"] == ""
    assert row["tomatometer"] == ""
    assert row["genres"] == ""
    assert row["audio_languages"] == ""
    assert row["subtitle_languages"] == ""


def test_entry_with_no_offers() -> None:
    """Test that entries with no offers return empty list."""
    from streaming_nl.normalize import media_entry_to_rows

    entry = make_entry(
        entry_id="tm000000",
        object_id=0,
        object_type="MOVIE",
        title="No Offers Movie",
        release_year=2020,
        runtime_minutes=90,
        imdb_id="tt0000000",
        tmdb_id="0",
        genres=["Documentary"],
        age_certification="",
        url="https://justwatch.com/nl/movie/no-offers",
        poster="",
        scoring=None,
        offers=[],
    )

    rows = media_entry_to_rows(entry, "NL")

    assert len(rows) == 0


def test_presentation_type_collapsing() -> None:
    """Test that highest quality presentation type is kept per offer group."""
    from streaming_nl.normalize import media_entry_to_rows

    nfx = make_package(short_name="nfx", name="Netflix", technical_name="netflix")
    entry = make_entry(
        entry_id="tm111111",
        object_id=111111,
        object_type="MOVIE",
        title="Multi-Quality Movie",
        release_year=2024,
        runtime_minutes=100,
        imdb_id="tt1111111",
        tmdb_id="111111",
        genres=["Sci-Fi"],
        age_certification="12",
        url="https://justwatch.com/nl/movie/multi",
        poster="",
        scoring=None,
        offers=[
            make_offer(
                package=nfx,
                monetization_type="FLATRATE",
                presentation_type="SD",
                url="https://netflix.com/watch/sd",
                audio_languages=["en"],
                subtitle_languages=["nl"],
            ),
            make_offer(
                package=nfx,
                monetization_type="FLATRATE",
                presentation_type="HD",
                url="https://netflix.com/watch/hd",
                audio_languages=["en"],
                subtitle_languages=["nl"],
            ),
            make_offer(
                package=nfx,
                monetization_type="FLATRATE",
                presentation_type="4K",
                url="https://netflix.com/watch/4k",
                audio_languages=["en"],
                subtitle_languages=["nl"],
            ),
        ],
    )

    rows = media_entry_to_rows(entry, "NL")

    assert len(rows) == 1
    row = rows[0]

    assert row["presentation_type"] == "4K"
    assert "4k" in row["offer_url"]
