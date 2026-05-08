"""Search bar component."""

import dash_bootstrap_components as dbc
from dash import dcc, html


def render_search() -> dbc.Col:
    """Render the search input bar with autocomplete."""
    return dbc.Col(
        [
            html.Label("Search titles", className="form-label"),
            html.Div(
                [
                    dcc.Input(
                        id="search-input",
                        type="text",
                        placeholder="Start typing to search titles...",
                        className="form-control",
                        debounce=True,
                        list="title-suggestions",
                        style={"width": "100%"},
                        autoComplete="off",
                    ),
                    html.Datalist(
                        id="title-suggestions",
                        children=[],
                    ),
                ],
                className="position-relative",
            ),
        ],
        width=12,
        className="mb-3",
    )
