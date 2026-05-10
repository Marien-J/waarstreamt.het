import { useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

interface SearchBarProps {
  onSearch: (query: string) => void
  initialValue?: string
}

export function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Sync with initial value changes (from URL)
  useEffect(() => {
    setLocalQuery(initialValue)
  }, [initialValue])

  // Focus on '/' key
  useHotkeys('/', (e) => {
    e.preventDefault()
    inputRef.current?.focus()
  })

  // Clear on Esc
  useHotkeys('escape', () => {
    if (localQuery) {
      setLocalQuery('')
      onSearch('')
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
        placeholder="Search titles... (press / to focus)"
        className="input w-full pl-10 pr-10 py-3 text-lg"
        autoComplete="off"
      />
      {localQuery && (
        <button
          onClick={() => {
            setLocalQuery('')
            onSearch('')
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
          aria-label="Clear search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
