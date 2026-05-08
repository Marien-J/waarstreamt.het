import { useState, useEffect } from 'react'
import type { Title } from '@/lib/data'
import { GENRE_MAP, getGenreLabel } from '@/lib/genres'
import { loadProviders, groupProvidersByTier, type ProviderMetadata } from '@/lib/providers'

interface FilterSidebarProps {
  searchParams: {
    q: string
    providers: string[]
    genres: string[]
    monetization: string[]
    type: 'all' | 'MOVIE' | 'SHOW'
    yearMin: number
    yearMax: number
    ratingMin: number
    includeUnrated: boolean
    quality: string[]
    runtimeMin: number
    runtimeMax: number
  }
  onUpdateParam: (key: string, value: any) => void
  onClearFilters: () => void
  titles: Title[]
}

const MONETIZATION_TYPES = [
  { value: 'FLATRATE', label: 'Subscription' },
  { value: 'RENT', label: 'Rent' },
  { value: 'BUY', label: 'Buy' },
  { value: 'FREE', label: 'Free' },
  { value: 'ADS', label: 'With Ads' },
  { value: 'CINEMA', label: 'In Theaters' },
]

const QUALITY_OPTIONS = [
  { value: 'HD', label: 'HD' },
  { value: '4K', label: '4K' },
  { value: 'SD', label: 'SD' },
]

export function FilterSidebar({ searchParams, onUpdateParam, onClearFilters, titles }: FilterSidebarProps) {
  const [providers, setProviders] = useState<Record<string, ProviderMetadata>>({})
  const [providerTiers, setProviderTiers] = useState<{
    mainstream: string[]
    niche: string[]
    channels: string[]
  }>({ mainstream: [], niche: [], channels: [] })

  useEffect(() => {
    loadProviders().then(data => {
      setProviders(data)
      const allProviderCodes = Object.keys(data)
      setProviderTiers(groupProvidersByTier(allProviderCodes, data))
    })
  }, [])

  const currentYear = new Date().getFullYear()

  const toggleProvider = (providerCode: string) => {
    const newProviders = searchParams.providers.includes(providerCode)
      ? searchParams.providers.filter(p => p !== providerCode)
      : [...searchParams.providers, providerCode]
    onUpdateParam('providers', newProviders)
  }

  const toggleGenre = (genreCode: string) => {
    const newGenres = searchParams.genres.includes(genreCode)
      ? searchParams.genres.filter(g => g !== genreCode)
      : [...searchParams.genres, genreCode]
    onUpdateParam('genres', newGenres)
  }

  const toggleMonetization = (type: string) => {
    const newTypes = searchParams.monetization.includes(type)
      ? searchParams.monetization.filter(t => t !== type)
      : [...searchParams.monetization, type]
    onUpdateParam('monetization', newTypes.length > 0 ? newTypes : ['FLATRATE'])
  }

  const toggleQuality = (quality: string) => {
    const newQuality = searchParams.quality.includes(quality)
      ? searchParams.quality.filter(q => q !== quality)
      : [...searchParams.quality, quality]
    onUpdateParam('quality', newQuality)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Type tabs */}
      <div>
        <h3 className="font-semibold mb-3">Type</h3>
        <div className="flex gap-2">
          {['all', 'MOVIE', 'SHOW'].map((type) => (
            <button
              key={type}
              onClick={() => onUpdateParam('type', type)}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                searchParams.type === type
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] hover:border-[var(--accent)]'
              }`}
            >
              {type === 'all' ? 'All' : type === 'MOVIE' ? 'Movies' : 'Shows'}
            </button>
          ))}
        </div>
      </div>

      {/* Providers */}
      <div>
        <h3 className="font-semibold mb-3">Providers</h3>
        <div className="space-y-4">
          {/* Mainstream */}
          {providerTiers.mainstream.length > 0 && (
            <div>
              <div className="text-xs text-[var(--muted)] uppercase mb-2">Mainstream</div>
              <div className="space-y-1">
                {providerTiers.mainstream.map((code) => {
                  const provider = providers[code]
                  if (!provider) return null
                  return (
                    <label key={code} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--card)] p-1 rounded">
                      <input
                        type="checkbox"
                        checked={searchParams.providers.includes(code)}
                        onChange={() => toggleProvider(code)}
                        className="w-4 h-4"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {provider.logo_url && (
                          <img src={provider.logo_url} alt="" className="w-5 h-5 rounded" />
                        )}
                        <span className="text-sm">{provider.display_name}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Niche */}
          {providerTiers.niche.length > 0 && (
            <div>
              <div className="text-xs text-[var(--muted)] uppercase mb-2">Niche</div>
              <div className="space-y-1">
                {providerTiers.niche.map((code) => {
                  const provider = providers[code]
                  if (!provider) return null
                  return (
                    <label key={code} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--card)] p-1 rounded">
                      <input
                        type="checkbox"
                        checked={searchParams.providers.includes(code)}
                        onChange={() => toggleProvider(code)}
                        className="w-4 h-4"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {provider.logo_url && (
                          <img src={provider.logo_url} alt="" className="w-5 h-5 rounded" />
                        )}
                        <span className="text-sm">{provider.display_name}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monetization */}
      <div>
        <h3 className="font-semibold mb-3">Monetization</h3>
        <div className="space-y-1">
          {MONETIZATION_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--card)] p-1 rounded">
              <input
                type="checkbox"
                checked={searchParams.monetization.includes(value)}
                onChange={() => toggleMonetization(value)}
                className="w-4 h-4"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div>
        <h3 className="font-semibold mb-3">Genres</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {Object.entries(GENRE_MAP).map(([code, label]) => (
            <label key={code} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--card)] p-1 rounded">
              <input
                type="checkbox"
                checked={searchParams.genres.includes(code)}
                onChange={() => toggleGenre(code)}
                className="w-4 h-4"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Year range */}
      <div>
        <h3 className="font-semibold mb-3">Year Range</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{searchParams.yearMin}</span>
            <span>{searchParams.yearMax}</span>
          </div>
          <input
            type="range"
            min="1950"
            max={currentYear}
            value={searchParams.yearMin}
            onChange={(e) => onUpdateParam('yearMin', Number(e.target.value))}
            className="w-full"
          />
          <input
            type="range"
            min="1950"
            max={currentYear}
            value={searchParams.yearMax}
            onChange={(e) => onUpdateParam('yearMax', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold mb-3">IMDb Rating</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Min: {searchParams.ratingMin.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={searchParams.ratingMin}
            onChange={(e) => onUpdateParam('ratingMin', Number(e.target.value))}
            className="w-full"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={searchParams.includeUnrated}
              onChange={(e) => onUpdateParam('includeUnrated', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Include unrated titles</span>
          </label>
        </div>
      </div>

      {/* Quality */}
      <div>
        <h3 className="font-semibold mb-3">Quality</h3>
        <div className="space-y-1">
          {QUALITY_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--card)] p-1 rounded">
              <input
                type="checkbox"
                checked={searchParams.quality.includes(value)}
                onChange={() => toggleQuality(value)}
                className="w-4 h-4"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Runtime (movies only) */}
      {(searchParams.type === 'all' || searchParams.type === 'MOVIE') && (
        <div>
          <h3 className="font-semibold mb-3">Runtime (minutes)</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{searchParams.runtimeMin}</span>
              <span>{searchParams.runtimeMax}</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={searchParams.runtimeMin}
              onChange={(e) => onUpdateParam('runtimeMin', Number(e.target.value))}
              className="w-full"
            />
            <input
              type="range"
              min="0"
              max="300"
              value={searchParams.runtimeMax}
              onChange={(e) => onUpdateParam('runtimeMax', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Clear all */}
      <div className="pt-4 border-t border-[var(--border)]">
        <button
          onClick={onClearFilters}
          className="w-full px-4 py-2 border border-[var(--border)] rounded hover:bg-[var(--accent)] hover:text-white transition-colors text-sm"
        >
          Clear all filters
        </button>
      </div>
    </div>
  )
}
