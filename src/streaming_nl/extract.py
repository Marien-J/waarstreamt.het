"""Extract streaming catalog data from JustWatch."""

import time
from collections.abc import Iterator

import structlog
from simplejustwatchapi import JustWatchHttpError, MediaEntry, popular  # type: ignore[import-untyped]
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from streaming_nl.config import COUNTRY, LANGUAGE, MAX_OFFSET, PAGE_SIZE

logger = structlog.get_logger()


# Retry on network errors only (not API errors like malformed queries)
@retry(
    retry=retry_if_exception_type((ConnectionError, TimeoutError, JustWatchHttpError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
)
def _fetch_page(
    country: str,
    language: str,
    providers: list[str],
    object_type: str,
    count: int,
    offset: int,
) -> list[MediaEntry]:
    """Fetch a single page with retry logic."""
    return popular(  # type: ignore[no-any-return]
        country=country,
        language=language,
        count=count,
        best_only=True,
        offset=offset,
        providers=providers,
        object_types=[object_type],
    )


def extract_partition(
    provider_short_name: str,
    content_type: str,
    country: str = COUNTRY,
    language: str = LANGUAGE,
    page_size: int = PAGE_SIZE,
    max_offset: int = MAX_OFFSET,
) -> Iterator[MediaEntry]:
    """Yield MediaEntry rows for one (provider, content_type) partition.
    
    Pages through popular() with count=page_size, offset stepping by page_size.
    Stops on empty page. Logs WARNING if last successful page was at max_offset
    (likely truncated by 1999 cap).
    
    Args:
        provider_short_name: JustWatch provider short_name code
        content_type: "MOVIE" or "SHOW"
        country: Two-letter country code
        language: Two-letter language code
        page_size: Number of entries per page
        max_offset: Maximum offset before stopping (due to API limit)
        
    Yields:
        MediaEntry objects from the catalog
    """
    logger.info(
        "partition_start",
        provider=provider_short_name,
        content_type=content_type,
        country=country,
    )
    
    offset = 0
    total_entries = 0
    last_page_count = 0
    
    while offset <= max_offset:
        try:
            entries = _fetch_page(
                country=country,
                language=language,
                providers=[provider_short_name],
                object_type=content_type,
                count=page_size,
                offset=offset,
            )
            
            if not entries:
                logger.debug(
                    "empty_page",
                    provider=provider_short_name,
                    content_type=content_type,
                    offset=offset,
                )
                break
            
            last_page_count = len(entries)
            total_entries += last_page_count
            
            logger.debug(
                "page_fetched",
                provider=provider_short_name,
                content_type=content_type,
                offset=offset,
                count=last_page_count,
            )
            
            yield from entries
            
            offset += page_size
            
            # Polite rate limiting
            time.sleep(0.2)
            
        except Exception as exc:
            logger.error(
                "page_fetch_failed",
                provider=provider_short_name,
                content_type=content_type,
                offset=offset,
                error=str(exc),
            )
            raise
    
    # Warn if we hit the cap with a full page (likely truncated)
    if offset > max_offset and last_page_count == page_size:
        logger.warning(
            "partition_truncated_at_cap",
            provider=provider_short_name,
            content_type=content_type,
            max_offset=max_offset,
            last_page_count=last_page_count,
        )
    
    logger.info(
        "partition_complete",
        provider=provider_short_name,
        content_type=content_type,
        total_entries=total_entries,
    )
