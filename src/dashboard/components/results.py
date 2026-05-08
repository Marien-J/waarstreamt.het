"""Results table component."""

import dash_bootstrap_components as dbc
import pandas as pd
from dash import dash_table, html


def render_results(df: pd.DataFrame, page: int = 0, page_size: int = 25) -> html.Div:
    """Render paginated search results table.
    
    Args:
        df: Results DataFrame
        page: Current page (0-indexed)
        page_size: Results per page
    """
    if df.empty:
        return html.Div(
            [
                html.Div(
                    [
                        html.I(className="bi bi-search mb-3", style={"fontSize": "3rem"}),
                        html.H5("No results found", className="text-muted"),
                        html.P(
                            "Try adjusting your search or filters",
                            className="text-muted small",
                        ),
                    ],
                    className="text-center py-5 empty-state",
                )
            ],
            className="results-container",
        )
    
    # Get unique titles for display
    unique_titles = df.groupby("jw_entry_id").agg({
        "title": "first",
        "release_year": "first",
        "object_type": "first",
        "genres": "first",
        "imdb_score": "first",
        "tmdb_score": "first",
    }).reset_index()
    
    # Calculate average rating
    unique_titles["avg_rating"] = unique_titles[["imdb_score", "tmdb_score"]].mean(axis=1).round(1)
    
    # Format for display
    display_df = unique_titles[[
        "jw_entry_id", "title", "release_year", "object_type", "genres", "avg_rating"
    ]].copy()
    
    display_df["release_year"] = display_df["release_year"].fillna(0).astype(int)
    display_df["release_year"] = display_df["release_year"].replace(0, "")
    display_df["avg_rating"] = display_df["avg_rating"].fillna("")
    display_df["genres"] = display_df["genres"].str.replace(";", ", ")
    
    # Rename columns for display
    display_df = display_df.rename(columns={
        "jw_entry_id": "ID",
        "title": "Title",
        "release_year": "Year",
        "object_type": "Type",
        "genres": "Genres",
        "avg_rating": "Rating",
    })
    
    total_results = len(display_df)
    
    return html.Div(
        [
            html.Div(
                f"Found {total_results} title{'s' if total_results != 1 else ''}",
                className="mb-3 text-muted small",
            ),
            dash_table.DataTable(
                id="results-table",
                columns=[
                    {"name": col, "id": col}
                    for col in display_df.columns
                    if col != "ID"
                ],
                data=display_df.to_dict("records"),
                page_current=page,
                page_size=page_size,
                page_action="native",
                sort_action="native",
                style_cell={
                    "textAlign": "left",
                    "padding": "12px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                },
                style_header={
                    "fontWeight": "600",
                    "borderBottom": "2px solid #dee2e6",
                },
                style_data={
                    "borderBottom": "1px solid #f0f0f0",
                },
                style_data_conditional=[
                    {
                        "if": {"row_index": "odd"},
                        "backgroundColor": "rgba(0, 0, 0, 0.02)",
                    }
                ],
                style_table={
                    "overflowX": "auto",
                },
                row_selectable="single",
                selected_rows=[],
            ),
        ],
        className="results-container",
    )
