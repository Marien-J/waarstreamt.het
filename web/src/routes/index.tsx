import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { loadTitles, type Title } from '@/lib/data'
import { initializeSearch, searchAndFilterTitles } from '@/lib/search'
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
    monetization: search.monetization ? String(search.monetization).split(',').filter(Boolean) : [],  // Empty = show all
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
  const [error, setError] = useState<string | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { myProviders } = useAppStore()
  const { country } = usePreferencesStore()

  useEffect(() => {
    async function init() {
      setLoading(true)
      setFilteredTitles([])
      try {
        console.log('Loading titles...')
        const loadedTitles = await loadTitles(country.toLowerCase())
        console.log(`Loaded ${loadedTitles.length} titles`)
        setTitles(loadedTitles)
        console.log('Initializing search index...')
        await initializeSearch(loadedTitles)
        console.log('Search initialized')
        setLoading(false)
      } catch (err) {
        console.error('Failed to initialize:', err)
        setError(err instanceof Error ? err.message : 'Failed to load catalog')
        setLoading(false)
      }
    }
    init()
  }, [country])

  const applyFilters = useCallback(async () => {
    if (!titles.length) return

    // Combine myProviders with URL providers filter
    const activeProviders = searchParams.providers.length > 0
      ? searchParams.providers
      : myProviders.length > 0
      ? myProviders
      : []

    const filters = {
      providers: activeProviders,
      genres: searchParams.genres,
      monetization: searchParams.monetization,
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
      // Default view: recent + highly rated flatrate titles
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
      const results = resultIds
        .map(id => titles.find(t => t.jw_entry_id === id))
        .filter((t): t is Title => t !== undefined)
      setFilteredTitles(results)
    }
  }, [titles, searchParams, myProviders])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const updateSearchParam = (key: string, value: any) => {
    const newSearch = { ...searchParams }
    
    if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      delete newSearch[key]
    } else if (Array.isArray(value)) {
      newSearch[key] = value.join(',')
    } else {
      newSearch[key] = value
    }

    navigate({ search: newSearch })
  }

  const handleSearch = (query: string) => {
    updateSearchParam('q', query)
  }

  const clearFilters = () => {
    navigate({ search: { q: searchParams.q } })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--muted)]">Loading catalog...</p>
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
            className="lg:hidden px-4 py-2 border border-[var(--border)] rounded hover:bg-[var(--accent)] hover:text-white transition-colors"
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
            <button
              onClick={clearFilters}
              className="text-[var(--accent)] hover:underline"
            >
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
          <div className="card w-full max-h-[80vh] overflow-y-auto rounded-t-2xl">
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>
            <FilterSidebar
              searchParams={searchParams}
              onUpdateParam={updateSearchParam}
              onClearFilters={clearFilters}
              titles={titles}
            />
          </div>
        </div>
      )}
    </div>
  )
}
