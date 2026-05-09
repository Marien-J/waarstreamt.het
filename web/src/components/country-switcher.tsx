import { usePreferencesStore, type CountryCode } from '@/store/preferences'
import { useTranslation } from '@/lib/i18n'

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
  const t = useTranslation()

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--muted)] hidden sm:inline">{t('header.country')}</span>
      <div className="flex items-center gap-0.5" role="group" aria-label="Select country">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => { setCountry(c.code); onCountryChange?.(c.code) }}
            title={c.code}
            aria-pressed={country === c.code}
            className={[
              'text-sm font-medium px-1.5 py-0.5 rounded transition-colors',
              country === c.code
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            {c.flag} {c.code}
          </button>
        ))}
      </div>
    </div>
  )
}
