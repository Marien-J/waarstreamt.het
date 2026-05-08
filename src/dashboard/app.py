"""Dash app initialization and layout."""

from pathlib import Path

import dash_bootstrap_components as dbc
from dash import Dash, dcc, html

from dashboard.components.filters import render_filters
from dashboard.components.search import render_search
from dashboard.data import get_filter_options, load_data


def create_app(csv_path: Path) -> Dash:
    """Create and configure the Dash app.
    
    Args:
        csv_path: Path to the streaming catalog CSV
    
    Returns:
        Configured Dash app instance
    """
    # Load data at startup
    load_data(csv_path)
    
    # Get filter options
    filter_options = get_filter_options()
    
    # Initialize app with Bootstrap theme
    app = Dash(
        __name__,
        external_stylesheets=[dbc.themes.BOOTSTRAP, dbc.icons.BOOTSTRAP],
        suppress_callback_exceptions=True,
    )
    
    # App layout
    app.layout = html.Div(
        [
            # Dark mode toggle (top right)
            html.Div(
                [
                    dbc.Switch(
                        id="dark-mode-switch",
                        label="Dark Mode",
                        value=False,
                        className="dark-mode-toggle",
                    ),
                ],
                className="position-absolute top-0 end-0 p-3",
                style={"zIndex": 1050},
            ),
            
            html.Div(
                [
                    # Header
                    dbc.Row(
                        dbc.Col(
                            [
                                html.H1("🎬 Dutch Streaming Search", className="mb-1"),
                                html.P(
                                    "Search and explore the Dutch streaming catalog",
                                    className="text-muted",
                                ),
                            ],
                            width=12,
                        ),
                        className="mb-4",
                    ),
                    
                    # Main content
                    dbc.Row(
                        [
                            # Sidebar
                            dbc.Col(
                                render_filters(filter_options),
                                width=3,
                                className="sidebar",
                            ),
                            
                            # Main panel
                            dbc.Col(
                                [
                                    # Search bar
                                    render_search(),
                                    
                                    # Results container
                                    html.Div(id="results-container"),
                                ],
                                width=9,
                            ),
                        ]
                    ),
                    
                    # Data store for client-side caching
                    dcc.Store(id="search-results-store"),
                    
                    # Detail modal placeholder
                    html.Div(id="detail-modal"),
                ],
                id="body-container",
                className="container-fluid p-4",
            ),
        ],
        className="app-wrapper",
    )
    
    return app
