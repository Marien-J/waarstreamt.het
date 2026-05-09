import { usePreferencesStore } from '@/store/preferences'
import type { LanguageCode } from '@/lib/i18n'
import { useTranslation } from '@/lib/i18n'

const LANGUAGES: { code: LanguageCode }[] = [
  { code: 'nl' },
  { code: 'de' },
  { code: 'en' },
  { code: 'fr' },
]

export function LanguageSwitcher() {
  const { language, setLanguage } = usePreferencesStore()
  const t = useTranslation()

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--muted)]">{t('header.language')}</span>
      <div className="flex items-center gap-0.5" role="group" aria-label="Select language">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            title={l.code.toUpperCase()}
            aria-pressed={language === l.code}
            className={[
              'text-sm font-medium px-1.5 py-0.5 rounded transition-colors',
              language === l.code
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            {l.code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
