"""CLI entry point for streaming extractor."""

import argparse
import sys

import structlog

from streaming_nl.config import COUNTRY_CONFIGS
from streaming_nl.job import run_all, run_job


def setup_logging() -> None:
    """Configure structlog for console output."""
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer() if sys.stdout.isatty() else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(min_level=20),  # INFO
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=False,
    )


def main() -> None:
    """Run the full extract job."""
    setup_logging()

    parser = argparse.ArgumentParser(
        prog="python -m streaming_nl",
        description="Extract streaming catalog data from JustWatch.",
    )
    parser.add_argument(
        "--country",
        metavar="CC",
        action="append",
        dest="countries",
        choices=list(COUNTRY_CONFIGS.keys()),
        help="Country code to extract (repeatable). Supported: %(choices)s",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        dest="all_countries",
        help="Extract all supported countries sequentially.",
    )

    args = parser.parse_args()

    if not args.all_countries and not args.countries:
        parser.print_help()
        sys.exit(0)

    try:
        if args.all_countries:
            results = run_all()
            any_failed = any(isinstance(v, Exception) for v in results.values())
            sys.exit(1 if any_failed else 0)
        else:
            for cc in args.countries:
                run_job(country=cc)
            sys.exit(0)
    except SystemExit:
        raise
    except Exception as exc:
        logger = structlog.get_logger()
        logger.error("job_failed", error=str(exc), exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
