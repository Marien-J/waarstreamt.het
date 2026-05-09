import { useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from '@tanstack/react-router'
import { searchTitles } from '@/lib/search'
import { loadTitles } from '@/lib/data'
import { useTranslation } from '@/lib/i18n'
import { usePreferencesStore } from '@/store/preferences'

interface SearchBarProps {
  onSearch: (query: string) => void
  initialValue?: string
}

interface Suggestion {
  jw_entry_id: string
  title: string
  year: number
  type: string
}

export function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const navigate = useNavigate()
  const t = useTranslation()
  const country = usePreferencesStore((s) => s.country)
  const [localQuery, setLocalQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Sync with initial value changes (from URL)
  useEffect(() => {
    setLocalQuery(initialValue)
  }, [initialValue])

  // Fetch suggestions when user types
  useEffect(() => {
    if (localQuery.length >= 2) {
      const fetchSuggestions = async () => {
        try {
          const titleIds = await searchTitles(localQuery, {})
          const allTitles = await loadTitles(country.toLowerCase())
          const matchedTitles = titleIds
            .slice(0, 8)
            .map(id => allTitles.find(t => t.jw_entry_id === id))
            .filter((t): t is NonNullable<typeof t> => t !== undefined)
            .map(t => ({
              jw_entry_id: t.jw_entry_id,
              title: t.title,
              year: t.release_year,
              type: t.object_type,
            }))
          setSuggestions(matchedTitles)
          setShowSuggestions(matchedTitles.length > 0)
        } catch (err) {
          console.error('Failed to fetch suggestions:', err)
        }
      }
      fetchSuggestions()
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [localQuery])

  // Focus on '/' key
  useHotkeys('/', (e) => {
    e.preventDefault()
    inputRef.current?.focus()
  })

  // Clear on Esc
  useHotkeys('escape', () => {
    if (showSuggestions) {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    } else if (localQuery) {
      setLocalQuery('')
      onSearch('')
    }
  }, { enableOnFormTags: true })

  // Arrow navigation
  useHotkeys('down', (e) => {
    if (showSuggestions) {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    }
  }, { enableOnFormTags: true })

  useHotkeys('up', (e) => {
    if (showSuggestions) {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    }
  }, { enableOnFormTags: true })

  useHotkeys('enter', (e) => {
    if (showSuggestions && selectedIndex >= 0) {
      e.preventDefault()
      const selected = suggestions[selectedIndex]
      setShowSuggestions(false)
      navigate({ to: '/title/$id', params: { id: selected.jw_entry_id } })
    }
  }, { enableOnFormTags: true })

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      onSearch(localQuery)
    }, 100)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localQuery, onSearch])

  return (
    <div className="relative w-full max-w-2xl">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onFocus={() => localQuery.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={t('search_placeholder')}
        className="input w-full pl-10 pr-10 py-3 text-lg"
        autoComplete="off"
      />
      {localQuery && (
        <button
          onClick={() => {
            setLocalQuery('')
            onSearch('')
            setShowSuggestions(false)
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
          aria-label="Clear search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 card border border-[var(--border)] max-h-96 overflow-y-auto shadow-lg z-50"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.jw_entry_id}
              onClick={() => {
                setShowSuggestions(false)
                navigate({ to: '/title/$id', params: { id: suggestion.jw_entry_id } })
              }}
              className={`w-full text-left px-4 py-3 hover:bg-[var(--accent)] hover:text-white transition-colors border-b border-[var(--border)] last:border-0 ${
                index === selectedIndex ? 'bg-[var(--accent)] text-white' : ''
              }`}
            >
              <div className="font-medium">{suggestion.title}</div>
              <div className="text-sm opacity-70">
                {suggestion.year} • {suggestion.type === 'MOVIE' ? 'Movie' : 'Show'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
