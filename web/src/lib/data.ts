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

export interface Manifest {
  extracted_at: string
  title_count: number
  offer_count: number
  build_hash: string
}

let titlesCache: Title[] | null = null
let manifestCache: Manifest | null = null

export async function loadTitles(): Promise<Title[]> {
  if (titlesCache) return titlesCache

  try {
    const response = await fetch('/data/titles.json')
    if (!response.ok) {
      throw new Error(`Failed to load titles: ${response.status} ${response.statusText}`)
    }
    titlesCache = await response.json()
    return titlesCache!
  } catch (error) {
    console.error('Error loading titles:', error)
    throw error
  }
}

export async function loadManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache

  try {
    const response = await fetch('/data/manifest.json')
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
