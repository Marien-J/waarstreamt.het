import type { Title } from '@/lib/data'
import { getGenreLabel } from '@/lib/genres'
import { loadProviders, type ProviderMetadata } from '@/lib/providers'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'

interface TitleDetailProps {
  title: Title
  onClose: () => void
}

export function TitleDetail({ title, onClose }: TitleDetailProps) {
  const t = useTranslation()
  const [providers, setProviders] = useState<Record<string, ProviderMetadata>>({})

  useEffect(() => {
    loadProviders().then(setProviders)
  }, [])

  // Group offers by brand_id
  const offersByProvider = new Map<string, typeof title.offers>()
  for (const offer of title.offers) {
    const key = offer.brand_id ?? offer.provider_short_name
    const existing = offersByProvider.get(key) || []
    offersByProvider.set(key, [...existing, offer])
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-4xl max-h-[90vh] overflow-auto w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={title.poster_url.replace('/s718/', '/s592/')}
              alt={title.title}
              className="w-full md:w-64 rounded-lg"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{title.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                <span>{title.release_year}</span>
                <span>•</span>
                <span>{title.object_type === 'MOVIE' ? t('detail_movie') : t('detail_show')}</span>
                {title.runtime_minutes && (
                  <>
                    <span>•</span>
                    <span>{t('detail_min', { n: title.runtime_minutes })}</span>
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
            <div className="flex flex-wrap gap-4">
              {title.imdb_score && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">IMDb:</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">{title.imdb_score.toFixed(1)}</span>
                  </div>
                </div>
              )}
              {title.tmdb_score && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">TMDB:</span>
                  <span className="font-semibold">{title.tmdb_score.toFixed(1)}/10</span>
                </div>
              )}
              {title.tomatometer && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">RT:</span>
                  <span className="font-semibold">{title.tomatometer.toFixed(0)}%</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {title.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {title.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full bg-[var(--accent)] text-white text-sm"
                  >
                    {getGenreLabel(genre)}
                  </span>
                ))}
              </div>
            )}

            {/* Offers */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">{t('where_to_watch')}</h2>
              <div className="space-y-2">
                {Array.from(offersByProvider.entries()).map(([providerKey, offers]) => {
                  const provider = providers[providerKey]
                  const displayName = provider?.display_name || offers[0]?.provider_name || providerKey

                  return (
                    <div key={providerKey} className="card p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center text-white font-semibold">
                          {displayName[0]}
                        </div>
                        <span className="font-medium">{displayName}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {offers.map((offer, idx) => (
                          <a
                            key={idx}
                            href={offer.offer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-sm"
                          >
                            {offer.monetization_type}
                            {offer.price_value && ` €${offer.price_value.toFixed(2)}`}
                            {offer.presentation_type && ` (${offer.presentation_type})`}
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
                className="btn"
              >
                {t('view_on_justwatch')}
              </a>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
