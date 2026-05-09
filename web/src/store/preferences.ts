import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LanguageCode } from '@/lib/i18n'

export type CountryCode = 'NL' | 'DE' | 'BE' | 'US' | 'GB'

const DEFAULT_LANGUAGE: Record<CountryCode, LanguageCode> = {
  NL: 'nl',
  BE: 'nl',
  DE: 'de',
  US: 'en',
  GB: 'en',
}

interface PreferencesState {
  country: CountryCode
  language: LanguageCode
  /** Whether the user has ever explicitly chosen a country (skips geo-detection). */
  countryExplicit: boolean
  setCountry: (country: CountryCode) => void
  setLanguage: (language: LanguageCode) => void
  /** Called on app init when geo-detection completes and no explicit country is stored. */
  applyDetectedCountry: (country: CountryCode) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      country: 'NL',
      language: 'nl',
      countryExplicit: false,

      setCountry: (country) => {
        const language = get().language
        // If the current language was the default for the old country, follow the new default
        const oldDefault = DEFAULT_LANGUAGE[get().country]
        const newDefault = DEFAULT_LANGUAGE[country]
        const newLanguage = language === oldDefault ? newDefault : language
        set({ country, language: newLanguage, countryExplicit: true })
      },

      setLanguage: (language) => set({ language }),

      applyDetectedCountry: (country) => {
        if (!get().countryExplicit) {
          set({ country, language: DEFAULT_LANGUAGE[country] })
        }
      },
    }),
    {
      name: 'waarstreamt.preferences',
      partialize: (state) => ({
        // Only persist country when the user explicitly chose it.
        // If countryExplicit is false, geo-detection runs fresh on next load.
        ...(state.countryExplicit ? { country: state.country } : {}),
        language: state.language,
        countryExplicit: state.countryExplicit,
      }),
    }
  )
)

export { DEFAULT_LANGUAGE }
