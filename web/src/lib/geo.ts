import type { CountryCode } from '@/store/preferences'

const SUPPORTED_COUNTRIES: CountryCode[] = ['NL', 'DE', 'BE', 'US', 'GB']
const CACHE_KEY = 'waarstreamt.country.detected'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry {
  country: CountryCode
  ts: number
}

function readCache(): CountryCode | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return entry.country
  } catch {
    return null
  }
}

function writeCache(country: CountryCode): void {
  try {
    const entry: CacheEntry = { country, ts: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage may be unavailable — ignore
  }
}

function coerceToSupported(code: string): CountryCode | null {
  const upper = code.toUpperCase() as CountryCode
  return SUPPORTED_COUNTRIES.includes(upper) ? upper : null
}

/** Derive country from navigator.language (e.g. "nl-NL" → "NL"). */
function fromNavigatorLanguage(): CountryCode | null {
  const lang = navigator.language ?? ''
  const parts = lang.split('-')
  if (parts.length >= 2) {
    return coerceToSupported(parts[parts.length - 1])
  }
  // Single-part language codes: map common ones
  const langMap: Record<string, CountryCode> = {
    nl: 'NL',
    de: 'DE',
    fr: 'BE', // best guess for French → Belgium
    en: 'GB',
  }
  return langMap[parts[0].toLowerCase()] ?? null
}

/**
 * Detect the user's country using:
 * 1. 7-day localStorage cache
 * 2. ipapi.co geolocation API
 * 3. navigator.language country segment
 * 4. Hardcoded fallback 'NL'
 */
export async function detectCountry(): Promise<CountryCode> {
  const cached = readCache()
  if (cached) return cached

  // Try ipapi.co
  try {
    const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
    if (response.ok) {
      const data = await response.json()
      const country = coerceToSupported(data.country_code ?? '')
      if (country) {
        writeCache(country)
        return country
      }
    }
  } catch {
    // Network error or unsupported country — fall through
  }

  // Try navigator.language
  const fromNav = fromNavigatorLanguage()
  if (fromNav) {
    writeCache(fromNav)
    return fromNav
  }

  // Hardcoded fallback
  writeCache('NL')
  return 'NL'
}
