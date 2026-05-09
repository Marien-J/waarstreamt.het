import MiniSearch from 'minisearch'
import type { Title } from './data'

export interface SearchableTitle {
  jw_entry_id: string
  title: string
}

/** Lowercase + diacritic-strip + whitespace-collapse */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

let searchIndex: MiniSearch<SearchableTitle> | null = null
let titlesCache: Title[] = []
let titleCacheMap: Map<string, Title> = new Map()

export async function initializeSearch(titles: Title[]): Promise<void> {
  console.log('🔍 Initializing search index...')
  titlesCache = titles
  titleCacheMap = new Map(titles.map(t => [t.jw_entry_id, t]))

  searchIndex = new MiniSearch<SearchableTitle>({
    fields: ['title'],
    storeFields: ['jw_entry_id'],
    processTerm: (term: string) => {
      const n = normalize(term)
      return n.length > 0 ? n : null
    },
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
      boost: { title: 2 },
    },
  })

  searchIndex.addAll(
    titles.map(t => ({ id: t.jw_entry_id, jw_entry_id: t.jw_entry_id, title: t.title }))
  )

  console.log(`   ✅ Indexed ${titles.length} titles`)
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
export function applyFilters(titles: Title[], filters?: SearchFilters): Title[] {
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

    // Providers - ANY selected brand covers this title
    if (filters.providers && filters.providers.length > 0) {
      const titleBrands = new Set(title.offers.map(o => o.brand_id))
      const hasProvider = filters.providers.some(p => titleBrands.has(p))
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
 * - Empty query: return all titles (filtered)
 * - Query < 2 chars: return empty result
 * - Otherwise: MiniSearch prefix+fuzzy, score bonus for prefix-match on first token,
 *   sort by score desc then popularity desc
 */
export async function searchTitles(
  query: string,
  filters?: SearchFilters
): Promise<string[]> {
  if (!searchIndex) {
    throw new Error('Search index not initialized')
  }

  const trimmed = query.trim()
  let candidates: Title[]

  if (trimmed.length === 0) {
    candidates = titlesCache
  } else if (trimmed.length < 2) {
    return []
  } else {
    const hits = searchIndex.search(trimmed)

    const normQuery = normalize(trimmed)
    const firstQueryToken = normQuery.split(' ')[0]

    const scored = hits.map(hit => {
      const id = hit.id as string
      const title = titleCacheMap.get(id)
      let score = hit.score
      if (title && firstQueryToken) {
        const firstTitleToken = normalize(title.title).split(' ')[0]
        if (firstTitleToken.startsWith(firstQueryToken)) {
          score *= 1.5
        }
      }
      return { id, score }
    })

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const ta = titleCacheMap.get(a.id)
      const tb = titleCacheMap.get(b.id)
      const pa = ta?.imdb_score ?? ta?.tmdb_score ?? 0
      const pb = tb?.imdb_score ?? tb?.tmdb_score ?? 0
      return pb - pa
    })

    candidates = scored
      .map(r => titleCacheMap.get(r.id))
      .filter((t): t is Title => t !== undefined)
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
