"""Main job orchestrator."""

import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import structlog

from streaming_nl.config import CONTENT_TYPES, COUNTRY, OUTPUT_DIR
from streaming_nl.extract import extract_partition
from streaming_nl.normalize import media_entry_to_rows
from streaming_nl.providers import resolve_provider_codes
from streaming_nl.writer import write_csv, write_provider_csv

logger = structlog.get_logger()


def run_job(country: str = COUNTRY) -> Path:
    """Resolve providers → extract all partitions → normalize → write CSV.
    
    Returns:
        Path to the written main CSV file
    """
    start_time = time.time()
    
    logger.info("job_started", country=country)
    
    # 1. Resolve provider codes
    provider_map = resolve_provider_codes(country=country)
    
    # 2. Write provider lookup CSV
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    provider_csv_path = OUTPUT_DIR / f"streaming_nl_{date_str}_providers.csv"
    write_provider_csv(provider_map, provider_csv_path, country)
    
    # 3. Extract all partitions
    all_rows: list[dict[str, str]] = []
    provider_stats: Counter[str] = Counter()
    monetization_stats: Counter[str] = Counter()
    
    for display_name, short_name in provider_map.items():
        for content_type in CONTENT_TYPES:
            logger.info(
                "extracting_partition",
                provider=display_name,
                short_name=short_name,
                content_type=content_type,
            )
            
            try:
                entries = list(extract_partition(short_name, content_type, country=country))
                
                for entry in entries:
                    rows = media_entry_to_rows(entry, country)
                    all_rows.extend(rows)
                    
                    # Track stats
                    for row in rows:
                        provider_stats[row["provider_short_name"]] += 1
                        monetization_stats[row["monetization_type"]] += 1
                
                logger.info(
                    "partition_extracted",
                    provider=display_name,
                    content_type=content_type,
                    entries=len(entries),
                )
                
            except Exception as exc:
                logger.error(
                    "partition_failed",
                    provider=display_name,
                    content_type=content_type,
                    error=str(exc),
                    exc_info=True,
                )
                # Continue with other partitions
    
    # 4. Deduplicate rows (should be no-op after presentation_type collapsing)
    unique_rows: dict[tuple[str, str, str], dict[str, str]] = {}
    for row in all_rows:
        key = (row["jw_entry_id"], row["provider_short_name"], row["monetization_type"])
        if key not in unique_rows:
            unique_rows[key] = row
    
    final_rows = list(unique_rows.values())
    
    if len(final_rows) < len(all_rows):
        logger.warning(
            "duplicates_removed",
            original_count=len(all_rows),
            deduplicated_count=len(final_rows),
        )
    
    # 5. Write main CSV
    main_csv_path = OUTPUT_DIR / f"streaming_nl_{date_str}.csv"
    write_csv(final_rows, main_csv_path)
    
    # 6. Log summary
    elapsed = time.time() - start_time
    
    logger.info(
        "job_complete",
        total_rows=len(final_rows),
        runtime_seconds=round(elapsed, 2),
        provider_breakdown=dict(provider_stats),
        monetization_breakdown=dict(monetization_stats),
        output_path=str(main_csv_path),
    )
    
    # Final summary line
    print(
        f"\n✓ Extract complete: {len(final_rows)} rows in {elapsed:.1f}s"
        f"\n  Providers: {dict(provider_stats)}"
        f"\n  Output: {main_csv_path}"
    )
    
    return main_csv_path
