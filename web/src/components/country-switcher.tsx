import { usePreferencesStore, type CountryCode } from '@/store/preferences'

const COUNTRIES: { code: CountryCode; flag: string }[] = [
  { code: 'NL', flag: '🇳🇱' },
  { code: 'DE', flag: '🇩🇪' },
  { code: 'BE', flag: '🇧🇪' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'GB', flag: '🇬🇧' },
]

interface CountrySwitcherProps {
  onCountryChange?: (country: CountryCode) => void
}

export function CountrySwitcher({ onCountryChange }: CountrySwitcherProps) {
  const { country, setCountry } = usePreferencesStore()

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Select country">
      {COUNTRIES.map((c) => (
        <button
          key={c.code}
          onClick={() => { setCountry(c.code); onCountryChange?.(c.code) }}
          title={c.code}
          aria-pressed={country === c.code}
          className={[
            'text-base px-1.5 py-0.5 rounded transition-colors',
            country === c.code
              ? 'bg-[var(--accent)] ring-1 ring-[var(--accent)]'
              : 'opacity-50 hover:opacity-80',
          ].join(' ')}
        >
          {c.flag}
        </button>
      ))}
    </div>
  )
}
