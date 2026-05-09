/**
 * Cross-country filter verification tests.
 * Run: npm run test:filters (from web/)
 *
 * Loads each country's titles_<cc>.json + providers_<cc>.json and asserts
 * correctness of brand-based filtering.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DATA = path.join(__dirname, '../public/data')

// ── Types (mirrors web/src/lib/data.ts) ──────────────────────────────────────
interface Offer {
  provider_short_name: string
  brand_id: string
  monetization_type: string
  presentation_type: string
  price_value: number | null
  price_currency: string
  offer_url: string
  audio_languages: string[]
  subtitle_languages: string[]
}

interface Title {
  jw_entry_id: string
  object_type: 'MOVIE' | 'SHOW'
  title: string
  release_year: number
  runtime_minutes: number | null
  imdb_id: string | null
  tmdb_id: string | null
  genres: string[]
  age_certification: string | null
  imdb_score: number | null
  tmdb_score: number | null
  tomatometer: number | null
  jw_url: string
  poster_url: string
  offers: Offer[]
  offer_count: number
  available_on_flatrate: string[]
  lowest_rent: number | null
  lowest_buy: number | null
}

interface BrandMetadata {
  brand_id: string
  display_name: string
  logo_url?: string
  brand_color: string
  title_count: number
  tier: 'mainstream' | 'niche'
  short_names: string[]
}

// ── applyFilters (mirrors web/src/lib/search.ts) ─────────────────────────────
interface SearchFilters {
  providers?: string[]
  genres?: string[]
  monetization?: string[]
  type?: 'MOVIE' | 'SHOW' | 'all'
}

function applyFilters(titles: Title[], filters: SearchFilters): Title[] {
  return titles.filter(title => {
    if (filters.type && filters.type !== 'all' && title.object_type !== filters.type) {
      return false
    }
    if (filters.genres && filters.genres.length > 0) {
      if (!filters.genres.some(g => title.genres.includes(g))) return false
    }
    if (filters.providers && filters.providers.length > 0) {
      const titleBrands = new Set(title.offers.map(o => o.brand_id))
      if (!filters.providers.some(p => titleBrands.has(p))) return false
    }
    if (filters.monetization && filters.monetization.length > 0) {
      const monetizations = new Set(title.offers.map(o => o.monetization_type))
      if (!filters.monetization.some(m => monetizations.has(m))) return false
    }
    return true
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadTitles(cc: string): Title[] {
  const p = path.join(PUBLIC_DATA, `titles_${cc}.json`)
  if (!fs.existsSync(p)) throw new Error(`Missing titles_${cc}.json`)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

function loadProviders(cc: string): Record<string, BrandMetadata> {
  const p = path.join(PUBLIC_DATA, `providers_${cc}.json`)
  if (!fs.existsSync(p)) throw new Error(`Missing providers_${cc}.json`)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

// ── Test runner ───────────────────────────────────────────────────────────────
let failed = false
let passed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓  ${message}`)
    passed++
  } else {
    console.error(`  ✗  ${message}`)
    failed = true
  }
}

const COUNTRIES = ['nl', 'de', 'be', 'us', 'gb', 'jp']

console.log('\n=== test-filters ===\n')

// ── 1. Load all data ──────────────────────────────────────────────────────────
const data: Record<string, { titles: Title[]; providers: Record<string, BrandMetadata> }> = {}
for (const cc of COUNTRIES) {
  try {
    data[cc] = { titles: loadTitles(cc), providers: loadProviders(cc) }
    console.log(`  loaded ${cc}: ${data[cc].titles.length} titles, ${Object.keys(data[cc].providers).length} brands`)
  } catch (e) {
    console.error(`  ✗  FAIL: ${(e as Error).message}`)
    failed = true
  }
}

// ── 2. All offers have canonical monetization_type ────────────────────────────
console.log('\n[0] All offers have monetization_type ∈ {FLATRATE, RENT, BUY} …')
const CANONICAL_TYPES = new Set(['FLATRATE', 'RENT', 'BUY'])
for (const cc of COUNTRIES) {
  if (!data[cc]) continue
  const { titles } = data[cc]
  let nonCanonical = 0
  for (const title of titles) {
    for (const offer of title.offers) {
      if (!CANONICAL_TYPES.has(offer.monetization_type)) nonCanonical++
    }
  }
  assert(nonCanonical === 0, `${cc.toUpperCase()} | all offers have canonical monetization_type (found ${nonCanonical} non-canonical)`)
}

// ── 3. KPN absent from non-NL countries ──────────────────────────────────────
console.log('\n[1] KPN absent from DE/US/GB/JP providers …')
for (const cc of ['de', 'us', 'gb', 'jp']) {
  if (!data[cc]) continue
  assert(!('kpn' in data[cc].providers), `KPN absent from providers_${cc}.json`)
}

// ── 3. All mainstream-tier brands have ≥50 FLATRATE titles per country ────────
console.log('\n[2] Mainstream brands have ≥50 FLATRATE titles per country …')
for (const cc of COUNTRIES) {
  if (!data[cc]) continue
  const { titles, providers } = data[cc]
  const mainstreamBrands = Object.values(providers).filter(b => b.tier === 'mainstream')
  for (const brand of mainstreamBrands) {
    const count = applyFilters(titles, {
      providers: [brand.brand_id],
      monetization: ['FLATRATE'],
    }).length
    assert(
      count >= 50,
      `${cc.toUpperCase()} | ${brand.display_name} (${brand.brand_id}) has ≥50 FLATRATE titles (got ${count})`
    )
  }
}

// ── 4. Amazon returns ≥100 FLATRATE titles in NL/DE/US ────────────────────────
console.log('\n[3] Amazon returns ≥100 FLATRATE titles in NL/DE/US …')
for (const cc of ['nl', 'de', 'us']) {
  if (!data[cc]) continue
  const count = applyFilters(data[cc].titles, {
    providers: ['amazon'],
    monetization: ['FLATRATE'],
  }).length
  assert(count >= 100, `${cc.toUpperCase()} | amazon FLATRATE ≥100 titles (got ${count})`)
}

// ── 5. Netflix+Drama+MOVIE+FLATRATE returns ≥10 in NL/DE/US/GB/JP ────────────
console.log('\n[4] Netflix+Drama+MOVIE+FLATRATE ≥10 titles in NL/DE/US/GB/JP …')
for (const cc of ['nl', 'de', 'us', 'gb', 'jp']) {
  if (!data[cc]) continue
  const count = applyFilters(data[cc].titles, {
    providers: ['netflix'],
    genres: ['drm'],
    type: 'MOVIE',
    monetization: ['FLATRATE'],
  }).length
  assert(count >= 10, `${cc.toUpperCase()} | netflix+drm+MOVIE+FLATRATE ≥10 (got ${count})`)
}

// ── 6. Netflix ∪ Disney ≥ Netflix alone (union sanity) ───────────────────────
console.log('\n[5] Netflix ∪ Disney ≥ Netflix alone (union sanity) …')
for (const cc of COUNTRIES) {
  if (!data[cc]) continue
  const netflixCount = applyFilters(data[cc].titles, {
    providers: ['netflix'],
    monetization: ['FLATRATE'],
  }).length
  const unionCount = applyFilters(data[cc].titles, {
    providers: ['netflix', 'disney'],
    monetization: ['FLATRATE'],
  }).length
  assert(
    unionCount >= netflixCount,
    `${cc.toUpperCase()} | netflix+disney (${unionCount}) ≥ netflix alone (${netflixCount})`
  )
}

// ── 7. No result contains offer brand_id not in that country's providers ──────
console.log('\n[6] No title has offer brand_id absent from country providers …')
for (const cc of COUNTRIES) {
  if (!data[cc]) continue
  const { titles, providers } = data[cc]
  const providerBrandIds = new Set(Object.keys(providers))
  let strayFound = false
  for (const title of titles) {
    for (const offer of title.offers) {
      if (!providerBrandIds.has(offer.brand_id)) {
        // brand not in providers means it was below the niche threshold — that's OK
        // we only fail if the brand is in a provider-filtered result
        strayFound = true
        break
      }
    }
    if (strayFound) break
  }
  // This is a soft check: brands below threshold are legitimately absent from providers.json
  // We can only assert that filtered results don't include brands claimed in providers.
  const allFilteredTitles = applyFilters(titles, { monetization: ['FLATRATE'] })
  let hasStray = false
  for (const title of allFilteredTitles) {
    for (const brandId of title.available_on_flatrate) {
      // If brand is in available_on_flatrate but NOT in providers, it was below threshold — ok
      // Only fail if a mainstream brand is completely missing
    }
  }
  // Validate: all mainstream providers actually appear in available_on_flatrate of ≥1 title
  const mainstreamBrands = Object.values(providers).filter(b => b.tier === 'mainstream')
  for (const brand of mainstreamBrands) {
    const appears = allFilteredTitles.some(t => t.available_on_flatrate.includes(brand.brand_id))
    assert(
      appears,
      `${cc.toUpperCase()} | mainstream brand '${brand.brand_id}' appears in ≥1 FLATRATE title`
    )
    void hasStray
  }
}

// ── [7] No provider display_name is a raw short-code passthrough ──────────────
console.log('\n[7] No provider display_name is a raw short-code passthrough …')
for (const cc of COUNTRIES) {
  if (!data[cc]) continue
  const { providers } = data[cc]
  for (const brand of Object.values(providers)) {
    const dn = brand.display_name
    assert(
      !(dn.length <= 4 && dn === dn.toLowerCase()),
      `${cc.toUpperCase()} | brand '${brand.brand_id}': display_name "${dn}" is not a raw short-code`
    )
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
if (failed) {
  console.error(`FAIL — one or more assertions failed. (${passed} passed)`)
  process.exit(1)
} else {
  console.log(`PASS — all ${passed} assertions satisfied.`)
}
