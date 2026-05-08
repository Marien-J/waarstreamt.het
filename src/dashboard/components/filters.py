"""Sidebar filter controls."""

import dash_bootstrap_components as dbc
from dash import dcc, html


def render_filters(options: dict) -> html.Div:
    """Render sidebar filter panel.
    
    Args:
        options: Dict with filter options from get_filter_options()
    """
    return html.Div(
        [
            html.H5("Filters", className="mb-3"),
            
            # Provider multi-select
            html.Label("Providers", className="form-label"),
            dcc.Dropdown(
                id="filter-providers",
                options=[{"label": p, "value": p} for p in options["providers"]],
                multi=True,
                placeholder="All providers",
                className="mb-3",
            ),
            
            # Content type
            html.Label("Content Type", className="form-label"),
            dcc.Dropdown(
                id="filter-content-type",
                options=[{"label": ct, "value": ct} for ct in options["content_types"]],
                placeholder="All types",
                className="mb-3",
            ),
            
            # Monetization type
            html.Label("Monetization", className="form-label"),
            dcc.Dropdown(
                id="filter-monetization",
                options=[{"label": mt, "value": mt} for mt in options["monetization_types"]],
                multi=True,
                placeholder="All types",
                className="mb-3",
            ),
            
            # Genre multi-select
            html.Label("Genres (top 15)", className="form-label"),
            dcc.Dropdown(
                id="filter-genres",
                options=[{"label": g, "value": g} for g in options["genres"]],
                multi=True,
                placeholder="All genres",
                className="mb-3",
            ),
            
            # Year range slider
            html.Label(
                f"Release Year ({options['year_min']}–{options['year_max']})",
                className="form-label"
            ),
            dcc.RangeSlider(
                id="filter-year-range",
                min=options["year_min"],
                max=options["year_max"],
                value=[options["year_min"], options["year_max"]],
                marks={
                    options["year_min"]: str(options["year_min"]),
                    options["year_max"]: str(options["year_max"]),
                },
                tooltip={"placement": "bottom", "always_visible": False},
                className="mb-3",
            ),
            
            # Quality
            html.Label("Quality", className="form-label"),
            dcc.Dropdown(
                id="filter-quality",
                options=[{"label": q, "value": q} for q in options["qualities"]],
                multi=True,
                placeholder="All qualities",
                className="mb-3",
            ),
            
            # Clear filters button
            dbc.Button(
                "Clear Filters",
                id="clear-filters-btn",
                color="secondary",
                size="sm",
                className="w-100",
            ),
        ],
        className="filter-sidebar",
    )
