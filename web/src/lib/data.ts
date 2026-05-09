import { decodeCatalogEntry, decodeOffer, shardIndex } from './wire'
import type { WireCatalogFile, WireOffersShard } from './wire'

export interface Offer {
  brand_id: string
  provider_short_name: string
  provider_name: string
  monetization_type: string
  presentation_type: string
  price_value: number | null
  price_currency: string
  offer_url: string
  audio_languages: string[]
  subtitle_languages: string[]
}

export interface Title {
  jw_entry_id: string
  object_type: 'MOVIE' | 'SHOW'
  title: string
  release_year: number
  runtime_minutes: number | null
  imdb_id: string | null
  tmdb_id: string | null
  genres: string[]
  age_certification: string | null
  imdb_score: number | null
  tmdb_score: number | null
  tomatometer: number | null
  jw_url: string
  poster_url: string
  offers: Offer[]
  offer_count: number
  available_on_flatrate: string[]
  lowest_rent: number | null
  lowest_buy: number | null
  // Catalog-tier derived fields for filtering without loading full offers:
  brands: string[]   // all brand ids (any monetization)
  monet: string[]    // unique monetization types present
  quals: string[]    // unique presentation types (for quality filter)
}

export interface CountryMeta {
  title_count: number
  offer_count: number
  language: string
  catalog_size_bytes: number
  offers_shard_count: number
}

export interface Manifest {
  extracted_at: string
  build_hash: string
  countries: Record<string, CountryMeta>
}

// Caches
const catalogCache: Map<string, Title[]> = new Map()
const offersShardCache: Map<string, WireOffersShard> = new Map()
let manifestCache: Manifest | null = null

/**
 * Load the slim catalog for a country and decode wire format.
 * Returns Title[] with empty offers. Use loadOffersForTitle() for detail pages.
 */
export async function loadTitles(countryCode: string = 'nl'): Promise<Title[]> {
  const cc = countryCode.toLowerCase()
  if (catalogCache.has(cc)) return catalogCache.get(cc)!

  const response = await fetch(`${import.meta.env.BASE_URL}data/catalog_${cc}.json`)
  if (!response.ok) {
    throw new Error(`Failed to load catalog for ${cc}: ${response.status} ${response.statusText}`)
  }
  const wire: WireCatalogFile = await response.json()
  const titles = wire.entries.map(decodeCatalogEntry)
  catalogCache.set(cc, titles)
  return titles
}

/**
 * Lazy-load the offers shard for a given title id + country.
 * Shard is cached in memory; subsequent calls for ids in the same shard are instant.
 */
export async function loadOffersForTitle(
  jwEntryId: string,
  countryCode: string
): Promise<Offer[]> {
  const cc = countryCode.toLowerCase()
  // Read shard count from manifest (tiny, cached after first load)
  const manifest = await loadManifest()
  const k = manifest.countries[cc]?.offers_shard_count ?? 1
  const shard = shardIndex(jwEntryId, k)
  const cacheKey = k === 1 ? cc : `${cc}/${shard}`

  if (!offersShardCache.has(cacheKey)) {
    const suffix = k === 1 ? '' : `_${shard}`
    const url = `${import.meta.env.BASE_URL}data/offers_${cc}${suffix}.json`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load offers for ${cc}${suffix}: ${response.status}`)
    }
    const wire: WireOffersShard = await response.json()
    offersShardCache.set(cacheKey, wire)
  }

  const wireShard = offersShardCache.get(cacheKey)!
  const wireOffers = wireShard.offers[jwEntryId] ?? []
  return wireOffers.map(wo => decodeOffer(wo, wireShard.currency))
}

export async function loadManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache

  const response = await fetch(`${import.meta.env.BASE_URL}data/manifest.json`)
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`)
  }
  manifestCache = await response.json()
  return manifestCache!
}

export function getTitleById(titles: Title[], id: string): Title | undefined {
  return titles.find(t => t.jw_entry_id === id)
}

/**
 * Search all currently-cached catalogs for a title by jw_entry_id.
 * Returns the first match, or null. Useful as metadata fallback on detail page.
 */
export function findTitleAcrossCachedCatalogs(jwEntryId: string): Title | null {
  for (const titles of catalogCache.values()) {
    const found = titles.find(t => t.jw_entry_id === jwEntryId)
    if (found) return found
  }
  return null
}
