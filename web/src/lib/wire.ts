/**
 * Compact wire format for the two-tier data layout.
 *
 * catalog_<cc>.json  — slim, eager. Contains everything for grid/search/filter.
 * offers_<cc>[_n].json — lazy. Full offer detail, sharded if needed.
 *
 * Compact key mapping lives here. The decode functions rehydrate to the
 * existing Title / Offer shapes used by the UI — UI components never see
 * the wire format.
 */

import type { Title, Offer } from './data'

// ── Catalog wire ──────────────────────────────────────────────────────────────

/** One title row as it appears on disk in catalog_<cc>.json */
export interface WireCatalogEntry {
  i: string          // jw_entry_id
  t: string          // title
  tp: 'MOVIE' | 'SHOW'
  y: number          // release_year
  r: number | null   // runtime_minutes
  p: string          // poster_url
  jw: string         // jw_url
  g: string[]        // genres
  im: number | null  // imdb_score
  td: number | null  // tmdb_score
  tm: number | null  // tomatometer
  a: string | null   // age_certification
  f: string[]        // available_on_flatrate (brand ids with FLATRATE offers)
  rl: number | null  // lowest_rent
  bl: number | null  // lowest_buy
  mn: string[]       // monet — unique monetization_type values across all offers
  b: string[]        // brands — all brand ids (any monetization)
  q: string[]        // quals — unique presentation_type values (for quality filter)
  cr?: number | null // chart_rank (optional — absent in older catalogs)
}

/** Top-level shape of catalog_<cc>.json */
export interface WireCatalogFile {
  entries: WireCatalogEntry[]
}

// ── Offers wire ───────────────────────────────────────────────────────────────

/** One offer row as it appears on disk in offers_<cc>[_n].json */
export interface WireOffer {
  bi: string          // brand_id
  sn: string          // provider_short_name
  pn: string          // provider_name
  mt: string          // monetization_type
  pt: string          // presentation_type
  pv: number | null   // price_value
  ou: string          // offer_url
  al: string[]        // audio_languages
  sl: string[]        // subtitle_languages
}

/** Top-level shape of offers_<cc>[_n].json */
export interface WireOffersShard {
  currency: string                      // e.g. "EUR" — applies to all price_values
  offers: Record<string, WireOffer[]>   // keyed by jw_entry_id
}

// ── Decode functions ──────────────────────────────────────────────────────────

/** Rehydrate a compact catalog entry to the full Title shape (offers=[]) */
export function decodeCatalogEntry(w: WireCatalogEntry): Title {
  return {
    jw_entry_id: w.i,
    object_type: w.tp,
    title: w.t,
    release_year: w.y,
    runtime_minutes: w.r,
    imdb_id: null,   // not stored in catalog — not used by UI
    tmdb_id: null,
    genres: w.g,
    age_certification: w.a,
    imdb_score: w.im,
    tmdb_score: w.td,
    tomatometer: w.tm,
    jw_url: w.jw,
    poster_url: w.p,
    offers: [],       // empty until lazy-loaded via loadOffersForTitle
    offer_count: 0,   // will be set from the offers shard
    available_on_flatrate: w.f,
    lowest_rent: w.rl,
    lowest_buy: w.bl,
    chart_rank: w.cr ?? null,
    // Catalog-only derived fields for filtering without full offers:
    brands: w.b,
    monet: w.mn,
    quals: w.q,
  }
}

/** Rehydrate a compact offer to the full Offer shape */
export function decodeOffer(w: WireOffer, currency: string): Offer {
  return {
    brand_id: w.bi,
    provider_short_name: w.sn,
    provider_name: w.pn,
    monetization_type: w.mt,
    presentation_type: w.pt,
    price_value: w.pv,
    price_currency: currency,
    offer_url: w.ou,
    audio_languages: w.al,
    subtitle_languages: w.sl,
  }
}

// ── Shard routing ─────────────────────────────────────────────────────────────

/**
 * Given a jw_entry_id (e.g. "tm50154" or "ts438507") and a shard count K,
 * return the shard index: parseInt(id.replace(/^[a-z]+/, '')) % K
 */
export function shardIndex(id: string, k: number): number {
  const num = parseInt(id.replace(/^[a-z]+/, ''), 10)
  return isNaN(num) ? 0 : Math.abs(num) % k
}
