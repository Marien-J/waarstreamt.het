import type { Title } from './data'

// ── Worker integration ────────────────────────────────────────────────────────
//
// The MiniSearch index is built in catalog-worker.ts (off main thread).
// The main thread stores the decoded Title[] and uses it for JS-side filtering.
// Text search queries are sent to the worker; results come back as id arrays.

type WorkerSearchResult = { queryId: number; ids: string[] }

let _worker: Worker | null = null
let _searchReady = false
let _nextQueryId = 0
const _pending = new Map<number, (ids: string[]) => void>()

/** Title cache on the main thread (no offers — catalog tier only) */
let titlesCache: Title[] = []
let titleCacheMap: Map<string, Title> = new Map()

/**
 * Called from the route component when the worker posts a 'ready' message.
 * Stores titles for filter-only queries (no text search) and marks ready.
 */
export function setSearchTitles(titles: Title[]): void {
  titlesCache = titles
  titleCacheMap = new Map(titles.map(t => [t.jw_entry_id, t]))
  _searchReady = true
}

/**
 * Attach the catalog worker. Called once from the route component after creating it.
 * Sets up the message handler that resolves pending search promises.
 */
export function attachWorker(worker: Worker): void {
  _worker = worker
  _searchReady = false
  titlesCache = []
  titleCacheMap = new Map()
  _nextQueryId = 0
  _pending.clear()
}

/** Reset when country switches (worker will reload). */
export function detachWorker(): void {
  _searchReady = false
  titlesCache = []
  titleCacheMap = new Map()
  _pending.clear()
}

/** Returns the current titles held in the search module cache. */
export function getCurrentTitles(): Title[] {
  return titlesCache
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface SearchFilters {
  providers?: string[]
  genres?: string[]
  monetization?: string[]
  showPurchases?: boolean
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
 * Works on catalog-tier Title objects (no offers — uses brands/monet/quals fields).
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

    // Runtime
    if (filters.runtimeMin !== undefined && filters.runtimeMin > 0) {
      if (!title.runtime_minutes || title.runtime_minutes < filters.runtimeMin) return false
    }
    if (filters.runtimeMax !== undefined && filters.runtimeMax < 300) {
      if (title.runtime_minutes && title.runtime_minutes > filters.runtimeMax) return false
    }

    // Genres - ANY selected genre matches
    if (filters.genres && filters.genres.length > 0) {
      if (!filters.genres.some(g => title.genres.includes(g))) return false
    }

    // Providers - use title.brands (all brand ids, any monetization)
    if (filters.providers && filters.providers.length > 0) {
      const hasBrand = filters.providers.some(p => title.brands.includes(p))
      if (!hasBrand) return false
    }

    // Monetization - use title.monet (unique monetization types present)
    if (filters.monetization && filters.monetization.length > 0) {
      const showPurchases = filters.showPurchases !== false
      if (!showPurchases) {
        const activeMonetization = filters.monetization.filter(m => m !== 'BUY')
        if (activeMonetization.length > 0) {
          const hasActiveMonet = activeMonetization.some(m => title.monet.includes(m))
          if (!hasActiveMonet) return false
        }
        // Exclude BUY-only titles when showPurchases is off
        const hasNonBuy = title.monet.some(m => m !== 'BUY')
        if (!hasNonBuy) return false
      } else {
        const hasMonetization = filters.monetization.some(m => title.monet.includes(m))
        if (!hasMonetization) return false
      }
    } else if (filters.showPurchases === false) {
      const hasNonBuy = title.monet.some(m => m !== 'BUY')
      if (!hasNonBuy) return false
    }

    // Quality - use title.quals (unique presentation types)
    if (filters.quality && filters.quality.length > 0) {
      if (!filters.quality.some(q => title.quals.includes(q))) return false
    }

    return true
  })
}

// ── Search ────────────────────────────────────────────────────────────────────

/**
 * Search and filter titles.
 * - Empty query: filter all cached titles with applyFilters, return id[]
 * - Short query (<2 chars): return []
 * - Otherwise: post to worker for MiniSearch, then apply JS filters on results
 */
export async function searchTitles(
  query: string,
  filters?: SearchFilters
): Promise<string[]> {
  const trimmed = query.trim()

  if (trimmed.length === 0) {
    return applyFilters(titlesCache, filters).map(t => t.jw_entry_id)
  }
  if (trimmed.length < 2) {
    return []
  }

  // Text search via worker
  if (!_worker) {
    return []
  }

  const queryId = _nextQueryId++
  const ids = await new Promise<string[]>((resolve) => {
    _pending.set(queryId, resolve)
    _worker!.postMessage({ type: 'search', queryId, query: trimmed })
  })

  const matchingTitles = ids
    .map(id => titleCacheMap.get(id))
    .filter((t): t is Title => t !== undefined)

  return applyFilters(matchingTitles, filters).map(t => t.jw_entry_id)
}

/**
 * Called from the worker message handler in the route component
 * when a search-result message arrives.
 */
export function resolveSearchResult(result: WorkerSearchResult): void {
  const resolve = _pending.get(result.queryId)
  if (resolve) {
    resolve(result.ids)
    _pending.delete(result.queryId)
  }
}

export async function searchAndFilterTitles(
  query: string,
  filters: SearchFilters
): Promise<string[]> {
  return searchTitles(query, filters)
}

// Keep for backward compat — callers that called initializeSearch can now use attachWorker
export async function initializeSearch(_titles: Title[]): Promise<void> {
  // No-op: index build is now done in the worker via attachWorker + 'load' message.
  // The route component calls attachWorker() and setSearchTitles() instead.
}
