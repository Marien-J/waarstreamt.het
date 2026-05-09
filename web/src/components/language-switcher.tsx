import { usePreferencesStore } from '@/store/preferences'
import type { LanguageCode } from '@/lib/i18n'

const LANGUAGES: { code: LanguageCode; flag: string; label: string }[] = [
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
]

export function LanguageSwitcher() {
  const { language, setLanguage } = usePreferencesStore()

  const current = LANGUAGES.find((l) => l.code === language)

  return (
    <div className="flex items-center gap-1">
      <span className="text-lg" aria-hidden="true">{current?.flag}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        className="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-sm cursor-pointer hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)]"
        aria-label="Select language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
