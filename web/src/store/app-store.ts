import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
      // Dark mode (default true)
      darkMode: true,
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
      partialize: (state) => ({
        darkMode: state.darkMode,
        myProviders: state.myProviders,
      }),
    }
  )
)
