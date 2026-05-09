export interface Offer {
  provider_short_name: string
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
}

export interface CountryMeta {
  title_count: number
  offer_count: number
  language: string
}

export interface Manifest {
  extracted_at: string
  build_hash: string
  countries: Record<string, CountryMeta>
  // legacy single-country fields (may not be present)
  title_count?: number
  offer_count?: number
}

const titlesCache: Map<string, Title[]> = new Map()
let manifestCache: Manifest | null = null

export async function loadTitles(countryCode: string = 'nl'): Promise<Title[]> {
  const cc = countryCode.toLowerCase()
  if (titlesCache.has(cc)) return titlesCache.get(cc)!

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/titles_${cc}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load titles for ${cc}: ${response.status} ${response.statusText}`)
    }
    const titles: Title[] = await response.json()
    titlesCache.set(cc, titles)
    return titles
  } catch (error) {
    console.error('Error loading titles:', error)
    throw error
  }
}

export async function loadManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/manifest.json`)
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`)
    }
    manifestCache = await response.json()
    return manifestCache!
  } catch (error) {
    console.error('Error loading manifest:', error)
    throw error
  }
}

export function getTitleById(titles: Title[], id: string): Title | undefined {
  return titles.find(t => t.jw_entry_id === id)
}

/**
 * Search all currently-cached catalogs for a title by jw_entry_id.
 * Returns the first match found, or null if no cached catalog contains it.
 * Useful as a metadata fallback when a title is absent from the current country's catalog.
 */
export function findTitleAcrossCachedCatalogs(jwEntryId: string): Title | null {
  for (const titles of titlesCache.values()) {
    const found = titles.find(t => t.jw_entry_id === jwEntryId)
    if (found) return found
  }
  return null
}

