import { usePreferencesStore } from '@/store/preferences'
import type { LanguageCode } from '@/lib/i18n'

const LANGUAGES: { code: LanguageCode; flag: string }[] = [
  { code: 'nl', flag: '🇳🇱' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'fr', flag: '🇫🇷' },
]

export function LanguageSwitcher() {
  const { language, setLanguage } = usePreferencesStore()

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Select language">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          title={l.code.toUpperCase()}
          aria-pressed={language === l.code}
          className={[
            'text-base px-1.5 py-0.5 rounded transition-colors',
            language === l.code
              ? 'bg-[var(--accent)] ring-1 ring-[var(--accent)]'
              : 'opacity-50 hover:opacity-80',
          ].join(' ')}
        >
          {l.flag}
        </button>
      ))}
    </div>
  )
}
