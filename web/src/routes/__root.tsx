import { Outlet, createRootRoute, useNavigate } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProviderPicker } from '@/components/provider-picker'
import { CountrySwitcher } from '@/components/country-switcher'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useAppStore } from '@/store/app-store'
import { usePreferencesStore } from '@/store/preferences'
import { detectCountry } from '@/lib/geo'
import { useState, useEffect } from 'react'
import { loadProviders, type BrandMetadata } from '@/lib/providers'
import { useTranslation } from '@/lib/i18n'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { darkMode, myProviders, showPurchases, toggleShowPurchases } = useAppStore()
  const { applyDetectedCountry, country } = usePreferencesStore()
  const [providers, setProviders] = useState<Record<string, BrandMetadata>>({})
  const [showProviderPicker, setShowProviderPicker] = useState(false)
  const t = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    loadProviders(country.toLowerCase()).then(setProviders)
  }, [country])

  // Run geo-detection once on mount (no-op if user has explicit preference)
  useEffect(() => {
    detectCountry().then(applyDetectedCountry)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="card border-b border-[var(--border)] flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <button onClick={() => navigate({ to: '/', search: { q: '', providers: [], genres: [], monetization: [], type: 'all', yearMin: 1950, yearMax: new Date().getFullYear(), ratingMin: 0, includeUnrated: true, quality: [], runtimeMin: 0, runtimeMax: 300 } })} className="text-2xl font-bold hover:opacity-80 transition-opacity cursor-pointer">Waar streamt het?</button>
            <div className="flex items-center gap-2 flex-wrap">
              <CountrySwitcher />
              <LanguageSwitcher />
              <button
                onClick={toggleShowPurchases}
                title={t('view_purchases')}
                aria-pressed={showPurchases}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  showPurchases
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline">{t('view_purchases')}</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
          
          {/* My Providers chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[var(--muted)]">My Providers:</span>
            {myProviders.length === 0 ? (
              <button
                onClick={() => setShowProviderPicker(true)}
                className="text-sm px-3 py-1 border border-[var(--border)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                + Select providers
              </button>
            ) : (
              <>
                {myProviders.slice(0, 5).map((providerCode) => {
                  const provider = providers[providerCode]
                  if (!provider) return null
                  return (
                    <div
                      key={providerCode}
                      className="flex items-center gap-1 px-2 py-1 bg-[var(--accent)] text-white border border-[var(--accent)] rounded-full text-sm"
                    >
                      {provider.logo_url && (
                        <img
                          src={provider.logo_url}
                          alt={provider.display_name}
                          className="w-4 h-4 rounded"
                        />
                      )}
                      <span>{provider.display_name}</span>
                    </div>
                  )
                })}
                {myProviders.length > 5 && (
                  <span className="text-sm text-[var(--muted)]">
                    +{myProviders.length - 5} more
                  </span>
                )}
                <button
                  onClick={() => setShowProviderPicker(true)}
                  className="text-sm px-3 py-1 border border-[var(--border)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Provider picker modal */}
      {showProviderPicker && (
        <ProviderPicker onClose={() => setShowProviderPicker(false)} />
      )}
    </div>
  )
}
