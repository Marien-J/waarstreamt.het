# Documentation index

Canonical entry point. The Planner reads this first when sparring.

## Features

- [Streaming Catalog Extractor](features/streaming-catalog.md) — JustWatch-based multi-country streaming data extraction (NL, DE, BE, US, GB)
- [Streaming Web App](features/streaming-web-app.md) — Modern React/Vite SPA with country switcher, language switcher, and geo-detection
- [Dashboard](features/dashboard.md) — **DEPRECATED** Legacy Python Dash interface (replaced by web app)

## Architecture decisions

- [001: Web App Architecture](architecture/decisions/001-web-app-architecture.md) — React/Vite SPA choice for catalog browsing
- [002: Multi-Country Catalog & i18n Strategy](architecture/decisions/002-multi-country-i18n.md) — Country-scoped extraction, ipapi.co geo-detection, custom i18n hook
- [003: Search Backend](architecture/decisions/003-search-backend.md) — Orama → MiniSearch: no stemming, prefix+fuzzy, diacritic normalization
- [004: Provider Canonicalization](architecture/decisions/004-provider-canonicalization.md) — Brand layer + per-country derived provider data; brand IDs replace raw short_names; display_name derived from CSV provider_name (2026-05-09)
- [005: Monetization Coalesce & Purchases Toggle](architecture/decisions/005-monetization-coalesce.md) — Drop non-canonical offers at preprocess; global "View purchases" toggle defaulted OFF.
