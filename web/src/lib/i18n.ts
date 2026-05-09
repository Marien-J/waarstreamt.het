import { usePreferencesStore } from '@/store/preferences'
import en from '@/i18n/en.json'
import nl from '@/i18n/nl.json'
import de from '@/i18n/de.json'
import fr from '@/i18n/fr.json'

export type LanguageCode = 'nl' | 'de' | 'en' | 'fr'

const dictionaries: Record<LanguageCode, Record<string, string>> = { nl, de, en, fr }

/**
 * Returns a translation function for the current active language.
 * Substitutes {key} placeholders with the provided params.
 * Falls back to EN for any missing key.
 */
export function useTranslation(): (key: string, params?: Record<string, string | number>) => string {
  const language = usePreferencesStore((s) => s.language)
  return (key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[language] ?? dictionaries.en
    const fallback = dictionaries.en
    let str = dict[key] ?? fallback[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }
}

/** Get all dictionary keys — used for i18n completeness assertions. */
export function getAllDictionaryKeys(): Record<LanguageCode, string[]> {
  return Object.fromEntries(
    Object.entries(dictionaries).map(([lang, dict]) => [lang, Object.keys(dict)])
  ) as Record<LanguageCode, string[]>
}
