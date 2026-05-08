import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { loadTitles, type Title } from '@/lib/data'
import { getGenreLabel } from '@/lib/genres'
import { loadProviders, type ProviderMetadata } from '@/lib/providers'

export const Route = createFileRoute('/title/$id')({
  component: TitleDetailView,
})

function TitleDetailView() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState<Title | null>(null)
  const [providers, setProviders] = useState<Record<string, ProviderMetadata>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const titles = await loadTitles()
      const foundTitle = titles.find(t => t.jw_entry_id === id)
      setTitle(foundTitle || null)
      
      const providersData = await loadProviders()
      setProviders(providersData)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate({ to: '/' })
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!title) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Title not found</h2>
          <p className="text-[var(--muted)] mb-4">The title you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:opacity-90"
          >
            Back to browse
          </button>
        </div>
      </div>
    )
  }

  // Group offers by provider
  const offersByProvider = new Map<string, typeof title.offers>()
  for (const offer of title.offers) {
    const existing = offersByProvider.get(offer.provider_short_name) || []
    offersByProvider.set(offer.provider_short_name, [...existing, offer])
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back button */}
        <button
          onClick={() => navigate({ to: '/' })}
          className="mb-4 text-[var(--accent)] hover:underline flex items-center gap-2"
        >
          ← Back to browse
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={title.poster_url.replace('/s718/', '/s592/')}
              alt={title.title}
              className="w-full md:w-80 rounded-lg shadow-lg"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-3">{title.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-[var(--muted)]">
                <span>{title.release_year}</span>
                <span>•</span>
                <span>{title.object_type === 'MOVIE' ? 'Movie' : 'TV Show'}</span>
                {title.runtime_minutes && (
                  <>
                    <span>•</span>
                    <span>{title.runtime_minutes} min</span>
                  </>
                )}
                {title.age_certification && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 border border-[var(--border)] rounded">
                      {title.age_certification}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Ratings */}
            <div className="flex flex-wrap gap-6">
              {title.imdb_score && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--muted)]">IMDb:</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold text-lg">{title.imdb_score.toFixed(1)}</span>
                  </div>
                </div>
              )}
              {title.tmdb_score && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--muted)]">TMDB:</span>
                  <span className="font-semibold text-lg">{title.tmdb_score.toFixed(1)}/10</span>
                </div>
              )}
              {title.tomatometer && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--muted)]">RT:</span>
                  <span className="font-semibold text-lg">{title.tomatometer.toFixed(0)}%</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {title.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {title.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-[var(--accent)] text-white rounded-full text-sm"
                  >
                    {getGenreLabel(genre)}
                  </span>
                ))}
              </div>
            )}

            {/* Watch options */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Where to Watch</h2>
              <div className="space-y-4">
                {Array.from(offersByProvider.entries()).map(([providerCode, offers]) => {
                  const provider = providers[providerCode]
                  return (
                    <div key={providerCode} className="card p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {provider?.logo_url && (
                          <img
                            src={provider.logo_url}
                            alt={provider.display_name}
                            className="w-10 h-10 rounded"
                          />
                        )}
                        <h3 className="font-semibold text-lg">
                          {provider?.display_name || providerCode}
                        </h3>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {offers.map((offer, idx) => (
                          <a
                            key={idx}
                            href={offer.offer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 border border-[var(--border)] rounded hover:border-[var(--accent)] transition-colors"
                          >
                            <div>
                              <div className="font-medium capitalize">
                                {offer.monetization_type.toLowerCase()}
                              </div>
                              <div className="text-sm text-[var(--muted)]">
                                {offer.presentation_type}
                                {offer.price_value && (
                                  <> • €{offer.price_value.toFixed(2)}</>
                                )}
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* JustWatch link */}
            <div>
              <a
                href={title.jw_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[var(--accent)] hover:underline"
              >
                View on JustWatch
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
