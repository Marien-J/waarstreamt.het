import { usePreferencesStore, type CountryCode } from '@/store/preferences'
import { useTranslation } from '@/lib/i18n'
import { Flag } from '@/components/flag'

const COUNTRIES: CountryCode[] = ['NL', 'DE', 'BE', 'US', 'GB']

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
            key={c}
            onClick={() => { setCountry(c); onCountryChange?.(c) }}
            title={c}
            aria-pressed={country === c}
            className={[
              'text-sm font-medium px-1.5 py-0.5 rounded transition-colors',
              country === c
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            <Flag code={c} className="mr-0.5" /> {c}
          </button>
        ))}
      </div>
    </div>
  )
}
