import { usePreferencesStore, type CountryCode } from '@/store/preferences'

const COUNTRIES: { code: CountryCode; flag: string; label: string }[] = [
  { code: 'NL', flag: '🇳🇱', label: 'Nederland' },
  { code: 'DE', flag: '🇩🇪', label: 'Deutschland' },
  { code: 'BE', flag: '🇧🇪', label: 'België' },
  { code: 'US', flag: '🇺🇸', label: 'United States' },
  { code: 'GB', flag: '🇬🇧', label: 'United Kingdom' },
]

interface CountrySwitcherProps {
  onCountryChange?: (country: CountryCode) => void
}

export function CountrySwitcher({ onCountryChange }: CountrySwitcherProps) {
  const { country, setCountry } = usePreferencesStore()

  const current = COUNTRIES.find((c) => c.code === country)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value as CountryCode
    setCountry(newCountry)
    onCountryChange?.(newCountry)
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-lg" aria-hidden="true">{current?.flag}</span>
      <select
        value={country}
        onChange={handleChange}
        className="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm cursor-pointer hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)]"
        aria-label="Select country"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}
