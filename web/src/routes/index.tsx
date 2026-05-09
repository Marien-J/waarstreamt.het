import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useRef } from 'react'
import { type Title } from '@/lib/data'
import {
  attachWorker,
  detachWorker,
  setSearchTitles,
  searchAndFilterTitles,
  resolveSearchResult,
  applyFilters,
} from '@/lib/search'
import { useAppStore } from '@/store/app-store'
import { usePreferencesStore } from '@/store/preferences'
import { SearchBar } from '@/components/search-bar'
import { ResultGrid } from '@/components/result-grid'
import { FilterSidebar } from '@/components/filter-sidebar'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || '',
    providers: search.providers ? String(search.providers).split(',').filter(Boolean) : [],
    genres: search.genres ? String(search.genres).split(',').filter(Boolean) : [],
    monetization: search.monetization ? String(search.monetization).split(',').filter(Boolean) : [],
    type: (search.type as 'all' | 'MOVIE' | 'SHOW') || 'all',
    yearMin: Number(search.yearMin) || 1950,
    yearMax: Number(search.yearMax) || new Date().getFullYear(),
    ratingMin: Number(search.ratingMin) || 0,
    includeUnrated: search.includeUnrated !== 'false',
    quality: search.quality ? String(search.quality).split(',').filter(Boolean) : [],
    runtimeMin: Number(search.runtimeMin) || 0,
    runtimeMax: Number(search.runtimeMax) || 300,
  }),
  component: BrowseView,
})

function BrowseView() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const [titles, setTitles] = useState<Title[]>([])
  const [filteredTitles, setFilteredTitles] = useState<Title[]>([])
  const [loading, setLoading] = useState(true)
  const [searchReady, setSearchReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { myProviders, showPurchases } = useAppStore()
  const { country } = usePreferencesStore()

  // Pending query typed before the index is ready
  const pendingQueryRef = useRef<string | null>(null)
  const workerRef = useRef<Worker | null>(null)

  // Create/recreate the worker on country change
  useEffect(() => {
    setLoading(true)
    setSearchReady(false)
    setTitles([])
    setFilteredTitles([])
    detachWorker()

    const worker = new Worker(
      new URL('../workers/catalog-worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current = worker
    attachWorker(worker)

    worker.onmessage = (event) => {
      const msg = event.data
      if (msg.type === 'ready') {
        const loadedTitles: Title[] = msg.titles
        setSearchTitles(loadedTitles)
        setTitles(loadedTitles)
        setSearchReady(true)
        setLoading(false)
        // Flush pending query
        if (pendingQueryRef.current !== null) {
          navigate({ search: { ...searchParams, q: pendingQueryRef.current } })
          pendingQueryRef.current = null
        }
      } else if (msg.type === 'search-result') {
        resolveSearchResult(msg)
      } else if (msg.type === 'error') {
        console.error('Worker error:', msg.message)
        setError(msg.message)
        setLoading(false)
      }
    }

    const baseUrl = import.meta.env.BASE_URL as string
    worker.postMessage({ type: 'load', country: country.toLowerCase(), baseUrl })

    return () => {
      worker.terminate()
      workerRef.current = null
      detachWorker()
    }
  }, [country]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyCurrentFilters = useCallback(async () => {
    if (!titles.length) return

    const activeProviders = searchParams.providers.length > 0
      ? searchParams.providers
      : myProviders.length > 0
      ? myProviders
      : []

    const filters = {
      providers: activeProviders,
      genres: searchParams.genres,
      monetization: searchParams.monetization,
      showPurchases,
      type: searchParams.type,
      yearMin: searchParams.yearMin,
      yearMax: searchParams.yearMax,
      ratingMin: searchParams.ratingMin,
      includeUnrated: searchParams.includeUnrated,
      quality: searchParams.quality,
      runtimeMin: searchParams.runtimeMin,
      runtimeMax: searchParams.runtimeMax,
    }

    const resultIds = await searchAndFilterTitles(searchParams.q, filters)

    if (resultIds.length === 0 && !searchParams.q && activeProviders.length === 0) {
      // Default view: highly rated FLATRATE titles
      const defaultTitles = titles
        .filter(t => t.available_on_flatrate.length > 0)
        .sort((a, b) => {
          const scoreA = a.imdb_score || a.tmdb_score || 0
          const scoreB = b.imdb_score || b.tmdb_score || 0
          return scoreB - scoreA
        })
        .slice(0, 100)
      setFilteredTitles(defaultTitles)
    } else {
      const titleMap = new Map(titles.map(t => [t.jw_entry_id, t]))
      const results = resultIds
        .map(id => titleMap.get(id))
        .filter((t): t is Title => t !== undefined)
      setFilteredTitles(results)
    }
  }, [titles, searchParams, myProviders, showPurchases])

  useEffect(() => {
    applyCurrentFilters()
  }, [applyCurrentFilters])

  // Before index is ready, stash the search query for flush on 'ready'
  const handleSearch = (query: string) => {
    if (!searchReady && query.trim()) {
      pendingQueryRef.current = query
    }
    const newSearch = { ...searchParams }
    if (!query) {
      delete (newSearch as any).q
    } else {
      (newSearch as any).q = query
    }
    navigate({ search: newSearch })
  }

  const updateSearchParam = (key: string, value: any) => {
    const newSearch = { ...searchParams }
    if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      delete (newSearch as any)[key]
    } else if (Array.isArray(value)) {
      (newSearch as any)[key] = value.join(',')
    } else {
      (newSearch as any)[key] = value
    }
    navigate({ search: newSearch })
  }

  const clearFilters = () => {
    navigate({ search: { q: searchParams.q } })
  }

  if (loading) {
    return (
      <div className="h-full flex">
        {/* Desktop sidebar skeleton */}
        <aside className="hidden lg:block w-72 border-r border-[var(--border)] flex-shrink-0" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="card border-b border-[var(--border)] p-4 flex gap-2 flex-shrink-0">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} initialValue={searchParams.q} />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--muted)]">Loading catalog...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Catalog</h2>
          <p className="text-[var(--muted)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 border-r border-[var(--border)] overflow-y-auto flex-shrink-0">
        <FilterSidebar
          searchParams={searchParams}
          onUpdateParam={updateSearchParam}
          onClearFilters={clearFilters}
          titles={titles}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar + mobile filter toggle */}
        <div className="card border-b border-[var(--border)] p-4 flex gap-2 flex-shrink-0">
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} initialValue={searchParams.q} />
          </div>
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden min-h-[44px] px-4 py-2 border border-[var(--border)] rounded hover:bg-[var(--accent)] hover:text-white transition-colors"
          >
            Filters
          </button>
        </div>

        {/* Results count */}
        <div className="px-4 py-2 text-sm text-[var(--muted)] flex items-center justify-between border-b border-[var(--border)] flex-shrink-0">
          <span>
            Showing {filteredTitles.length} of {titles.length} titles
          </span>
          {(searchParams.q || searchParams.providers.length > 0 || searchParams.genres.length > 0) && (
            <button onClick={clearFilters} className="text-[var(--accent)] hover:underline">
              Clear all filters
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-hidden">
          <ResultGrid titles={filteredTitles} />
        </div>
      </div>

      {/* Mobile filters bottom sheet */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-75 z-40 flex items-end">
          <div className="card w-full max-h-[80vh] rounded-t-2xl flex flex-col">
            <div className="flex-shrink-0 border-b border-[var(--border)] p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <FilterSidebar
                searchParams={searchParams}
                onUpdateParam={updateSearchParam}
                onClearFilters={clearFilters}
                titles={titles}
              />
            </div>
            <div className="flex-shrink-0 border-t border-[var(--border)] p-4 flex gap-3">
              <button
                onClick={() => { clearFilters(); setShowMobileFilters(false) }}
                className="flex-1 min-h-[44px] border border-[var(--border)] rounded hover:bg-[var(--accent)] hover:text-white transition-colors text-sm"
              >
                Clear all filters
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 min-h-[44px] bg-[var(--accent)] text-white rounded hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
