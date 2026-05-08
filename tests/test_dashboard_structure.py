"""Basic smoke tests for dashboard package structure."""

import sys
from pathlib import Path


def test_dashboard_package_exists():
    """Test that dashboard package is importable."""
    # Add src to path for testing
    src_path = Path(__file__).parent.parent / "src"
    if str(src_path) not in sys.path:
        sys.path.insert(0, str(src_path))
    
    # Should be able to import the package
    import dashboard
    assert hasattr(dashboard, "__version__")


def test_dashboard_structure():
    """Test that expected files exist."""
    dashboard_dir = Path(__file__).parent.parent / "src" / "dashboard"
    
    assert dashboard_dir.exists()
    assert (dashboard_dir / "__init__.py").exists()
    assert (dashboard_dir / "__main__.py").exists()
    assert (dashboard_dir / "app.py").exists()
    assert (dashboard_dir / "data.py").exists()
    assert (dashboard_dir / "callbacks.py").exists()
    
    components_dir = dashboard_dir / "components"
    assert components_dir.exists()
    assert (components_dir / "__init__.py").exists()
    assert (components_dir / "search.py").exists()
    assert (components_dir / "filters.py").exists()
    assert (components_dir / "results.py").exists()
    assert (components_dir / "detail.py").exists()
    
    assets_dir = dashboard_dir / "assets"
    assert assets_dir.exists()
    assert (assets_dir / "style.css").exists()


def test_readme_exists():
    """Test that dashboard README exists."""
    readme = Path(__file__).parent.parent / "README-dashboard.md"
    assert readme.exists()
    
    content = readme.read_text()
    assert "Dashboard" in content
    assert "uv run python -m dashboard" in content


def test_docs_exist():
    """Test that dashboard docs exist."""
    docs_file = Path(__file__).parent.parent / "docs" / "features" / "dashboard.md"
    assert docs_file.exists()
    
    content = docs_file.read_text()
    assert "Dashboard" in content
    assert "Architecture" in content


def test_docs_index_updated():
    """Test that docs INDEX references dashboard."""
    index = Path(__file__).parent.parent / "docs" / "INDEX.md"
    assert index.exists()
    
    content = index.read_text()
    assert "Dashboard" in content
    assert "features/dashboard.md" in content
