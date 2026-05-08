import { Outlet, createRootRoute } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProviderPicker } from '@/components/provider-picker'
import { useAppStore } from '@/store/app-store'
import { useState, useEffect } from 'react'
import { loadProviders, type ProviderMetadata } from '@/lib/providers'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { darkMode, myProviders } = useAppStore()
  const [providers, setProviders] = useState<Record<string, ProviderMetadata>>({})
  const [showProviderPicker, setShowProviderPicker] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    loadProviders().then(setProviders)
  }, [])

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="card border-b border-[var(--border)] flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h1 className="text-2xl font-bold">Waar streamt het?</h1>
            <ThemeToggle />
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
