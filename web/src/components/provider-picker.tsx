import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { loadProviders, groupProvidersByTier, type ProviderMetadata } from '@/lib/providers'

interface ProviderPickerProps {
  onClose: () => void
}

export function ProviderPicker({ onClose }: ProviderPickerProps) {
  const { myProviders, setMyProviders } = useAppStore()
  const [selected, setSelected] = useState<string[]>(myProviders)
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

  const toggle = (providerCode: string) => {
    setSelected(prev =>
      prev.includes(providerCode)
        ? prev.filter(p => p !== providerCode)
        : [...prev, providerCode]
    )
  }

  const selectAll = (tier: 'mainstream' | 'niche' | 'channels') => {
    setSelected(prev => [...new Set([...prev, ...providerTiers[tier]])])
  }

  const clearAll = (tier: 'mainstream' | 'niche' | 'channels') => {
    setSelected(prev => prev.filter(p => !providerTiers[tier].includes(p)))
  }

  const handleSave = () => {
    setMyProviders(selected)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-2xl font-bold mb-2">My Streaming Providers</h2>
          <p className="text-sm text-[var(--muted)]">
            Select the streaming services you're subscribed to. We'll filter results to only show titles available on your services.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mainstream */}
          {providerTiers.mainstream.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Mainstream Services</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAll('mainstream')}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-[var(--muted)]">|</span>
                  <button
                    onClick={() => clearAll('mainstream')}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {providerTiers.mainstream.map((code) => {
                  const provider = providers[code]
                  if (!provider) return null
                  const isSelected = selected.includes(code)
                  return (
                    <button
                      key={code}
                      onClick={() => toggle(code)}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] bg-opacity-10'
                          : 'border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {provider.logo_url && (
                        <img
                          src={provider.logo_url}
                          alt={provider.display_name}
                          className="w-8 h-8 rounded"
                        />
                      )}
                      <span className="text-sm font-medium">{provider.display_name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Niche */}
          {providerTiers.niche.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Niche Services</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAll('niche')}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-[var(--muted)]">|</span>
                  <button
                    onClick={() => clearAll('niche')}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {providerTiers.niche.map((code) => {
                  const provider = providers[code]
                  if (!provider) return null
                  const isSelected = selected.includes(code)
                  return (
                    <button
                      key={code}
                      onClick={() => toggle(code)}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] bg-opacity-10'
                          : 'border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {provider.logo_url && (
                        <img
                          src={provider.logo_url}
                          alt={provider.display_name}
                          className="w-8 h-8 rounded"
                        />
                      )}
                      <span className="text-sm font-medium">{provider.display_name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--border)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[var(--border)] rounded hover:bg-[var(--card)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded hover:opacity-90 transition-opacity"
          >
            Save ({selected.length} selected)
          </button>
        </div>
      </div>
    </div>
  )
}
