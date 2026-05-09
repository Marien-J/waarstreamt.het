import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Known short_name → brand_id mappings for legacy My Providers migration
const LEGACY_SHORT_NAME_TO_BRAND: Record<string, string> = {
  amp: 'amazon', prv: 'amazon', amz: 'amazon', pva: 'amazon', aim: 'amazon',
  nfx: 'netflix', nfa: 'netflix', nfk: 'netflix',
  mxx: 'max', aho: 'max',
  dnp: 'disney', dis: 'disney',
  app: 'paramount', pmp: 'paramount',
  atp: 'apple', itu: 'apple',
  ply: 'google',
  hlu: 'hulu',
  unx: 'unx',
  vil: 'videoland', vdl: 'videoland',
  vrt: 'vrt',
  jyn: 'jyn',
  tvn: 'tvn',
  wls: 'wls',
  bbc: 'bbc',
  itv: 'itv',
  ntv: 'ntv',
  sst: 'sst',
  pct: 'peacock',
  kpn: 'kpn',
}

interface AppState {
  // Dark mode
  darkMode: boolean
  toggleDarkMode: () => void
  
  // My providers
  myProviders: string[]
  setMyProviders: (providers: string[]) => void
  
  // Filters
  selectedProviders: string[]
  setSelectedProviders: (providers: string[]) => void
  
  selectedGenres: string[]
  setSelectedGenres: (genres: string[]) => void
  
  monetizationTypes: string[]
  setMonetizationTypes: (types: string[]) => void
  
  contentType: 'all' | 'MOVIE' | 'SHOW'
  setContentType: (type: 'all' | 'MOVIE' | 'SHOW') => void
  
  yearRange: [number, number]
  setYearRange: (range: [number, number]) => void
  
  ratingMin: number
  setRatingMin: (rating: number) => void
  
  includeUnrated: boolean
  setIncludeUnrated: (include: boolean) => void
  
  runtimeMin: number
  setRuntimeMin: (minutes: number) => void
  
  runtimeMax: number
  setRuntimeMax: (minutes: number) => void
  
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  // Reset
  resetFilters: () => void
}

const currentYear = new Date().getFullYear()

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Dark mode (default false = light mode)
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      
      // My providers
      myProviders: [],
      setMyProviders: (providers) => set({ myProviders: providers }),
      
      // Filters
      selectedProviders: [],
      setSelectedProviders: (providers) => set({ selectedProviders: providers }),
      
      selectedGenres: [],
      setSelectedGenres: (genres) => set({ selectedGenres: genres }),
      
      monetizationTypes: ['FLATRATE'],
      setMonetizationTypes: (types) => set({ monetizationTypes: types }),
      
      contentType: 'all',
      setContentType: (type) => set({ contentType: type }),
      
      yearRange: [1950, currentYear],
      setYearRange: (range) => set({ yearRange: range }),
      
      ratingMin: 0,
      setRatingMin: (rating) => set({ ratingMin: rating }),
      
      includeUnrated: true,
      setIncludeUnrated: (include) => set({ includeUnrated: include }),
      
      runtimeMin: 0,
      setRuntimeMin: (minutes) => set({ runtimeMin: minutes }),
      
      runtimeMax: 300,
      setRuntimeMax: (minutes) => set({ runtimeMax: minutes }),
      
      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Reset
      resetFilters: () => set({
        selectedProviders: [],
        selectedGenres: [],
        monetizationTypes: ['FLATRATE'],
        contentType: 'all',
        yearRange: [1950, currentYear],
        ratingMin: 0,
        includeUnrated: true,
        runtimeMin: 0,
        runtimeMax: 300,
        searchQuery: '',
      }),
    }),
    {
      name: 'waarstreamt-storage',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          const s = persistedState as { myProviders?: string[] }
          if (Array.isArray(s.myProviders)) {
            const knownBrandIds = new Set(Object.values(LEGACY_SHORT_NAME_TO_BRAND))
            const migrated = s.myProviders
              .map((p: string) => LEGACY_SHORT_NAME_TO_BRAND[p] ?? p)
              .filter((p: string) => knownBrandIds.has(p))
            s.myProviders = [...new Set(migrated)]
          }
        }
        return persistedState as ReturnType<typeof useAppStore.getState>
      },
      partialize: (state) => ({
        darkMode: state.darkMode,
        myProviders: state.myProviders,
      }),
    }
  )
)
