"""Title detail modal component."""

import dash_bootstrap_components as dbc
import pandas as pd
from dash import html


def render_detail_modal(details: dict | None) -> dbc.Modal:
    """Render title detail modal.
    
    Args:
        details: Title details dict from get_title_details()
    """
    if not details:
        return dbc.Modal(
            [
                dbc.ModalHeader(dbc.ModalTitle("Title Details")),
                dbc.ModalBody("No details available."),
            ],
            id="detail-modal",
            size="lg",
            is_open=False,
        )
    
    # Format genres
    genres = details.get("genres", "")
    genre_list = genres.split(";") if genres else []
    
    # Format runtime
    runtime = details.get("runtime_minutes")
    runtime_str = f"{int(runtime)} min" if pd.notna(runtime) else "N/A"
    
    # Format scores
    imdb = details.get("imdb_score")
    tmdb = details.get("tmdb_score")
    imdb_str = f"{imdb:.1f}" if pd.notna(imdb) else "N/A"
    tmdb_str = f"{tmdb:.1f}" if pd.notna(tmdb) else "N/A"
    
    # Build offer cards
    offers = details.get("offers", [])
    best_deal = details.get("best_deal")
    
    offer_cards = []
    for offer in offers:
        is_best = offer == best_deal
        
        # Format price
        price_val = offer.get("price_value")
        price_cur = offer.get("price_currency", "EUR")
        if pd.notna(price_val):
            price_str = f"€{price_val:.2f}" if price_cur == "EUR" else f"{price_val:.2f} {price_cur}"
        else:
            price_str = "Included"
        
        # Quality badge
        quality = offer.get("presentation_type", "")
        quality_badge = (
            html.Span(quality, className="badge bg-secondary ms-2")
            if quality else None
        )
        
        offer_card = dbc.Card(
            [
                dbc.CardBody(
                    [
                        html.Div(
                            [
                                html.H6(
                                    [
                                        offer["provider_name"],
                                        quality_badge,
                                    ],
                                    className="mb-2",
                                ),
                                html.P(
                                    [
                                        html.Strong(offer["monetization_type"]),
                                        " — ",
                                        price_str,
                                    ],
                                    className="mb-2",
                                ),
                                dbc.Button(
                                    "Watch Now",
                                    href=offer.get("offer_url", "#"),
                                    target="_blank",
                                    color="primary" if is_best else "outline-primary",
                                    size="sm",
                                    external_link=True,
                                ),
                            ]
                        ),
                        html.Div(
                            html.Span("Best Deal", className="badge bg-success"),
                            className="mt-2",
                        ) if is_best else None,
                    ]
                )
            ],
            className="mb-2 offer-card",
        )
        offer_cards.append(offer_card)
    
    # Poster
    poster_url = details.get("poster_url", "")
    poster = (
        html.Img(
            src=poster_url,
            className="img-fluid rounded mb-3",
            style={"maxHeight": "400px"},
        )
        if poster_url else None
    )
    
    return dbc.Modal(
        [
            dbc.ModalHeader(
                dbc.ModalTitle(
                    f"{details['title']} ({int(details['release_year']) if pd.notna(details['release_year']) else 'N/A'})"
                ),
                close_button=True,
            ),
            dbc.ModalBody(
                [
                    dbc.Row(
                        [
                            dbc.Col(
                                [poster] if poster else [],
                                width=4,
                            ),
                            dbc.Col(
                                [
                                    html.P(
                                        [
                                            html.Strong("Type: "),
                                            details["object_type"],
                                        ]
                                    ),
                                    html.P(
                                        [
                                            html.Strong("Runtime: "),
                                            runtime_str,
                                        ]
                                    ),
                                    html.P(
                                        [
                                            html.Strong("Genres: "),
                                            ", ".join(genre_list) if genre_list else "N/A",
                                        ]
                                    ),
                                    html.P(
                                        [
                                            html.Strong("Age Rating: "),
                                            details.get("age_certification") or "N/A",
                                        ]
                                    ),
                                    html.P(
                                        [
                                            html.Strong("IMDb: "),
                                            imdb_str,
                                            " | ",
                                            html.Strong("TMDB: "),
                                            tmdb_str,
                                        ]
                                    ),
                                    html.P(
                                        [
                                            html.Strong("IMDb ID: "),
                                            html.A(
                                                details.get("imdb_id", "N/A"),
                                                href=f"https://www.imdb.com/title/{details.get('imdb_id', '')}",
                                                target="_blank",
                                            ) if details.get("imdb_id") else "N/A",
                                        ]
                                    ),
                                ],
                                width=8,
                            ),
                        ]
                    ),
                    html.Hr(),
                    html.H6("Available on:", className="mb-3"),
                    html.Div(offer_cards) if offer_cards else html.P("No offers available.", className="text-muted"),
                ]
            ),
        ],
        id="detail-modal",
        size="lg",
        is_open=True,
    )
