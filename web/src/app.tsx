import { useState, useEffect, useCallback } from 'react'
import { loadTitles, type Title } from '@/lib/data'
import { initializeSearch, searchTitles } from '@/lib/search'
import { useAppStore } from '@/store/app-store'
import { usePreferencesStore, type CountryCode } from '@/store/preferences'
import { detectCountry } from '@/lib/geo'
import { useTranslation } from '@/lib/i18n'
import { SearchBar } from '@/components/search-bar'
import { ResultGrid } from '@/components/result-grid'
import { TitleDetail } from '@/components/title-detail'
import { ThemeToggle } from '@/components/theme-toggle'
import { CountrySwitcher } from '@/components/country-switcher'
import { LanguageSwitcher } from '@/components/language-switcher'

export function App() {
  const [titles, setTitles] = useState<Title[]>([])
  const [filteredTitles, setFilteredTitles] = useState<Title[]>([])
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null)
  const [loading, setLoading] = useState(true)
  const { darkMode, searchQuery } = useAppStore()
  const { country, applyDetectedCountry } = usePreferencesStore()
  const t = useTranslation()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Run geo-detection once on mount (no-op if user has explicit preference)
  useEffect(() => {
    detectCountry().then(applyDetectedCountry)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCatalog = useCallback(async (countryCode: CountryCode) => {
    setLoading(true)
    try {
      const loadedTitles = await loadTitles(countryCode.toLowerCase())
      setTitles(loadedTitles)
      setFilteredTitles(loadedTitles.slice(0, 100))
      await initializeSearch(loadedTitles)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalog(country)
  }, [country, loadCatalog])

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      const defaultTitles = titles
        .filter(t => t.available_on_flatrate.length > 0)
        .sort((a, b) => {
          const scoreA = a.imdb_score || a.tmdb_score || 0
          const scoreB = b.imdb_score || b.tmdb_score || 0
          return scoreB - scoreA
        })
        .slice(0, 100)
      setFilteredTitles(defaultTitles)
      return
    }

    const resultIds = await searchTitles(query)
    const results = resultIds
      .map(id => titles.find(t => t.jw_entry_id === id))
      .filter((t): t is Title => t !== undefined)
    setFilteredTitles(results)
  }, [titles])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--muted)]">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="card border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{t('app_title')}</h1>
          <div className="flex-1 max-w-2xl">
            <SearchBar onSearch={handleSearch} />
          </div>
          <div className="flex items-center gap-2">
            <CountrySwitcher onCountryChange={(cc) => loadCatalog(cc)} />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden">
        <ResultGrid
          titles={filteredTitles}
          onTitleClick={setSelectedTitle}
        />
      </main>

      {/* Detail modal */}
      {selectedTitle && (
        <TitleDetail
          title={selectedTitle}
          onClose={() => setSelectedTitle(null)}
        />
      )}

      {/* Results count */}
      <div className="card border-t border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] text-center">
        {t('showing_results', { count: filteredTitles.length, total: titles.length })}
        {searchQuery && ` ${t('for_query', { query: searchQuery })}`}
      </div>
    </div>
  )
}

