import { create, insert, search as oramaSearch, Orama } from '@orama/orama'
import type { Title } from './data'

export interface SearchableTitle {
  jw_entry_id: string
  title: string
}

let searchIndex: Orama<any> | null = null
let titlesCache: Title[] = []

export async function initializeSearch(titles: Title[]): Promise<Orama<any>> {
  console.log('🔍 Initializing search index...')
  titlesCache = titles

  searchIndex = await create({
    schema: {
      jw_entry_id: 'string',
      title: 'string',
    },
  })

  for (const title of titles) {
    await insert(searchIndex, {
      jw_entry_id: title.jw_entry_id,
      title: title.title,
    })
  }

  console.log(`   ✅ Indexed ${titles.length} titles`)
  return searchIndex
}

export interface SearchFilters {
  providers?: string[]
  genres?: string[]
  monetization?: string[]
  type?: 'MOVIE' | 'SHOW' | 'all'
  yearMin?: number
  yearMax?: number
  ratingMin?: number
  includeUnrated?: boolean
  quality?: string[]
  runtimeMin?: number
  runtimeMax?: number
}

/**
 * Apply filters to a list of titles in JS.
 * Returns titles matching ALL active filters.
 */
function applyFilters(titles: Title[], filters?: SearchFilters): Title[] {
  if (!filters) return titles

  return titles.filter(title => {
    // Type
    if (filters.type && filters.type !== 'all' && title.object_type !== filters.type) {
      return false
    }

    // Year range
    if (filters.yearMin !== undefined && title.release_year < filters.yearMin) return false
    if (filters.yearMax !== undefined && title.release_year > filters.yearMax) return false

    // Rating
    if (filters.ratingMin !== undefined && filters.ratingMin > 0) {
      const score = title.imdb_score
      if (score === null || score === undefined) {
        if (!filters.includeUnrated) return false
      } else if (score < filters.ratingMin) {
        return false
      }
    }

    // Runtime (only if non-default)
    if (filters.runtimeMin !== undefined && filters.runtimeMin > 0) {
      if (!title.runtime_minutes || title.runtime_minutes < filters.runtimeMin) return false
    }
    if (filters.runtimeMax !== undefined && filters.runtimeMax < 300) {
      if (title.runtime_minutes && title.runtime_minutes > filters.runtimeMax) return false
    }

    // Genres - ANY selected genre matches
    if (filters.genres && filters.genres.length > 0) {
      const hasGenre = filters.genres.some(g => title.genres.includes(g))
      if (!hasGenre) return false
    }

    // Providers - ANY selected provider has the title
    if (filters.providers && filters.providers.length > 0) {
      const titleProviders = new Set(title.offers.map(o => o.provider_short_name))
      const hasProvider = filters.providers.some(p => titleProviders.has(p))
      if (!hasProvider) return false
    }

    // Monetization - ANY offer of selected types
    if (filters.monetization && filters.monetization.length > 0) {
      const monetizations = new Set(title.offers.map(o => o.monetization_type))
      const hasMonetization = filters.monetization.some(m => monetizations.has(m))
      if (!hasMonetization) return false
    }

    // Quality - ANY offer of selected quality
    if (filters.quality && filters.quality.length > 0) {
      const qualities = new Set(title.offers.map(o => o.presentation_type))
      const hasQuality = filters.quality.some(q => qualities.has(q))
      if (!hasQuality) return false
    }

    return true
  })
}

/**
 * Search and filter titles.
 * - If query: use Orama for fuzzy text search, then filter in JS
 * - If no query: filter all titles in JS
 */
export async function searchTitles(
  query: string,
  filters?: SearchFilters
): Promise<string[]> {
  if (!searchIndex) {
    throw new Error('Search index not initialized')
  }

  let candidates: Title[]

  if (query && query.trim().length > 0) {
    const results = await oramaSearch(searchIndex, {
      term: query.trim(),
      properties: ['title'],
      tolerance: 2,
      limit: 5000,
    })
    const matchedIds = new Set(results.hits.map((hit: any) => hit.document.jw_entry_id))
    candidates = titlesCache.filter(t => matchedIds.has(t.jw_entry_id))
  } else {
    candidates = titlesCache
  }

  const filtered = applyFilters(candidates, filters)
  return filtered.map(t => t.jw_entry_id)
}

export async function searchAndFilterTitles(
  query: string,
  filters: SearchFilters
): Promise<string[]> {
  return searchTitles(query, filters)
}
