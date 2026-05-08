"""Smoke test: every module imports cleanly and uses real library symbols."""


def test_all_modules_import() -> None:
    import streaming_nl.config  # noqa: F401
    import streaming_nl.providers  # noqa: F401
    import streaming_nl.extract  # noqa: F401
    import streaming_nl.normalize  # noqa: F401
    import streaming_nl.writer  # noqa: F401
    import streaming_nl.job  # noqa: F401
    import streaming_nl.__main__  # noqa: F401


def test_real_library_symbols_exist() -> None:
    """Pin the public API surface we depend on. If the upstream library changes
    these names, we want a loud failure here, not a runtime crash in production."""
    from simplejustwatchapi import MediaEntry, Offer, OfferPackage, popular, providers

    assert callable(popular)
    assert callable(providers)
    # NamedTuples are types — instantiating them with no args fails, but they
    # must at least be importable and have a _fields attribute.
    assert hasattr(MediaEntry, "_fields")
    assert hasattr(Offer, "_fields")
    assert hasattr(OfferPackage, "_fields")
