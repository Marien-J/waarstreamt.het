"""Dash callback functions."""

from typing import Any

import pandas as pd
from dash import Input, Output, State, callback, no_update, html
from dash.exceptions import PreventUpdate

from dashboard.components.detail import render_detail_modal
from dashboard.components.results import render_results
from dashboard.data import get_title_details, search_titles, get_data
from fuzzywuzzy import fuzz


@callback(
    Output("title-suggestions", "children"),
    Input("search-input", "value"),
)
def update_autocomplete(search_value: str | None) -> list:
    """Update autocomplete suggestions based on user input."""
    if not search_value or len(search_value) < 2:
        return []
    
    df = get_data()
    
    # Get unique titles
    unique_titles = df.groupby("jw_entry_id").agg({
        "title": "first",
        "release_year": "first",
    }).reset_index()
    
    # Fuzzy match titles
    def score_title(row):
        title = str(row["title"])
        year = int(row["release_year"]) if pd.notna(row["release_year"]) else ""
        score = fuzz.partial_ratio(search_value.lower(), title.lower())
        return score, title, year
    
    unique_titles["match"] = unique_titles.apply(score_title, axis=1)
    unique_titles["score"] = unique_titles["match"].apply(lambda x: x[0])
    
    # Filter and sort by score
    matches = unique_titles[unique_titles["score"] >= 60].sort_values("score", ascending=False).head(20)
    
    # Format options as HTML option elements
    options = []
    for _, row in matches.iterrows():
        score, title, year = row["match"]
        label = f"{title} ({year})" if year else title
        options.append(html.Option(value=title, label=label))
    
    return options


@callback(
    [
        Output("results-container", "children"),
        Output("search-results-store", "data"),
    ],
    [
        Input("search-input", "value"),
        Input("filter-providers", "value"),
        Input("filter-content-type", "value"),
        Input("filter-monetization", "value"),
        Input("filter-genres", "value"),
        Input("filter-year-range", "value"),
        Input("filter-quality", "value"),
    ],
)
def update_results(
    query: str | None,
    providers: list[str] | None,
    content_type: str | None,
    monetization: list[str] | None,
    genres: list[str] | None,
    year_range: list[int] | None,
    quality: list[str] | None,
) -> tuple[Any, dict]:
    """Update search results based on query and filters."""
    # Convert year range
    year_tuple = tuple(year_range) if year_range else None
    
    # Search (if no query, show all with filters applied)
    results = search_titles(
        query=query or "",
        providers=providers,
        content_type=content_type,
        monetization_types=monetization,
        genres=genres,
        year_range=year_tuple,
        qualities=quality,
    )
    
    return render_results(results), {"data": results.to_dict("records")}


@callback(
    Output("detail-modal", "is_open"),
    Output("detail-modal", "children"),
    [Input("results-table", "selected_rows")],
    [State("search-results-store", "data")],
)
def show_detail(selected_rows: list[int] | None, stored_data: dict | None) -> tuple[bool, Any]:
    """Show detail modal when a row is selected."""
    if not selected_rows or not stored_data or not stored_data.get("data"):
        return False, no_update
    
    df = pd.DataFrame(stored_data["data"])
    
    # Get unique titles
    unique_titles = df.groupby("jw_entry_id").first().reset_index()
    
    if not unique_titles.empty and selected_rows[0] < len(unique_titles):
        entry_id = unique_titles.iloc[selected_rows[0]]["jw_entry_id"]
        details = get_title_details(entry_id)
        modal = render_detail_modal(details)
        return True, modal.children
    
    return False, no_update


@callback(
    [
        Output("filter-providers", "value"),
        Output("filter-content-type", "value"),
        Output("filter-monetization", "value"),
        Output("filter-genres", "value"),
        Output("filter-quality", "value"),
    ],
    Input("clear-filters-btn", "n_clicks"),
    prevent_initial_call=True,
)
def clear_filters(n_clicks: int) -> tuple[None, None, None, None, None]:
    """Clear all filters."""
    return None, None, None, None, None


@callback(
    Output("body-container", "className"),
    Input("dark-mode-switch", "value"),
)
def toggle_dark_mode(dark_mode: bool) -> str:
    """Toggle dark mode class on body."""
    return "dark-mode" if dark_mode else ""
