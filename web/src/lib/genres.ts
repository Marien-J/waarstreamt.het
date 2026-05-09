import { usePreferencesStore } from '@/store/preferences'
import en from '@/i18n/en.json'
import nl from '@/i18n/nl.json'
import de from '@/i18n/de.json'
import fr from '@/i18n/fr.json'
import type { LanguageCode } from '@/lib/i18n'

const dictionaries: Record<LanguageCode, Record<string, string>> = { nl, de, en, fr }

export const GENRE_CODES = [
  'drm', 'cmy', 'trl', 'act', 'crm', 'rma', 'fml', 'fnt',
  'scf', 'eur', 'doc', 'hrr', 'ani', 'hst', 'rly', 'war', 'msc', 'spt', 'wsn',
]

// Legacy English map (used in preprocess.ts at build time)
export const GENRE_MAP: Record<string, string> = Object.fromEntries(
  GENRE_CODES.map((code) => [code, en[`genre_${code}` as keyof typeof en] ?? code])
)

export function getGenreLabel(code: string): string {
  const language = usePreferencesStore.getState().language
  const dict = dictionaries[language] ?? dictionaries.en
  return dict[`genre_${code}` as keyof typeof dict] ?? GENRE_MAP[code] ?? code
}

export function getGenreCodes(): string[] {
  return GENRE_CODES
}

