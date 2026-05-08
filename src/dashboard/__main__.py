"""CLI entry point for the dashboard."""

import argparse
import sys
from pathlib import Path

from dashboard.app import create_app


def find_latest_csv() -> Path:
    """Find the most recent streaming catalog CSV."""
    data_dir = Path("data")
    
    if not data_dir.exists():
        print("Error: data/ directory not found.", file=sys.stderr)
        print("Run 'uv run python -m streaming_nl' first to generate data.", file=sys.stderr)
        sys.exit(1)
    
    csv_files = list(data_dir.glob("streaming_nl_*.csv"))
    # Exclude provider CSVs
    csv_files = [f for f in csv_files if "_providers" not in f.name]
    
    if not csv_files:
        print("Error: No streaming catalog CSV found in data/.", file=sys.stderr)
        print("Run 'uv run python -m streaming_nl' first to generate data.", file=sys.stderr)
        sys.exit(1)
    
    # Sort by filename (date is in name) and take most recent
    latest = sorted(csv_files)[-1]
    return latest


def main() -> None:
    """Run the dashboard server."""
    parser = argparse.ArgumentParser(
        description="Dutch streaming catalog search dashboard"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8050,
        help="Port to run the dashboard on (default: 8050)",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        help="Path to CSV file (default: auto-detect latest in data/)",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Run in debug mode with hot reload",
    )
    
    args = parser.parse_args()
    
    # Determine CSV path
    csv_path = args.csv if args.csv else find_latest_csv()
    
    if not csv_path.exists():
        print(f"Error: CSV file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)
    
    print(f"Loading data from: {csv_path}")
    
    # Create app
    app = create_app(csv_path)
    
    # Import callbacks (must happen after app creation)
    import dashboard.callbacks  # noqa: F401
    
    print(f"\n🚀 Dashboard starting on http://localhost:{args.port}")
    print("Press Ctrl+C to stop\n")
    
    # Run server
    app.run(
        host="0.0.0.0",
        port=args.port,
        debug=args.debug,
    )


if __name__ == "__main__":
    main()
