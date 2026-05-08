"""CLI entry point for streaming-nl."""

import sys

import structlog

from streaming_nl.job import run_job


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
    
    try:
        run_job()
        sys.exit(0)
    except SystemExit:
        # Already logged
        raise
    except Exception as exc:
        logger = structlog.get_logger()
        logger.error("job_failed", error=str(exc), exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
