/**
 * Cross-country filter verification tests.
 * Run: npm run test:filters (from web/)
 *
 * Loads each country's catalog_<cc>.json + providers_<cc>.json and asserts
 * correctness of brand-based filtering using the new two-tier wire format.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DATA = path.join(__dirname, '../public/data')

// ── Wire format types (mirrors web/src/lib/wire.ts) ───────────────────────────
interface WireCatalogEntry {
  i: string; t: string; tp: 'MOVIE' | 'SHOW'; y: number; r: number | null
  p: string; jw: string; g: string[]; im: number | null; td: number | null
  tm: number | null; a: string | null
  f: string[]  // available_on_flatrate (brand ids)
  rl: number | null; bl: number | null
  mn: string[] // unique monetization types
  b: string[]  // all brand ids (any monetization)
  q: string[]  // unique presentation types
}

// ── Catalog-tier Title shape (mirrors web/src/lib/data.ts) ───────────────────
interface Title {
  jw_entry_id: string
  object_type: 'MOVIE' | 'SHOW'
  title: string
  release_year: number
  runtime_minutes: number | null
  genres: string[]
  age_certification: string | null
  imdb_score: number | null
  tmdb_score: number | null
  tomatometer: number | null
  available_on_flatrate: string[]
  lowest_rent: number | null
  lowest_buy: number | null
  brands: string[]   // all brand ids (any monetization)
  monet: string[]    // unique monetization_type values
  quals: string[]    // unique presentation_type values
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

// ── applyFilters (mirrors catalog-tier logic in web/src/lib/search.ts) ────────
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
    // Use title.brands (all brand ids, any monetization) — catalog-tier
    if (filters.providers && filters.providers.length > 0) {
      if (!filters.providers.some(p => title.brands.includes(p))) return false
    }
    // Use title.monet (unique monetization types) — catalog-tier
    if (filters.monetization && filters.monetization.length > 0) {
      if (!filters.monetization.some(m => title.monet.includes(m))) return false
    }
    return true
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function decodeCatalogEntry(w: WireCatalogEntry): Title {
  return {
    jw_entry_id: w.i, object_type: w.tp, title: w.t,
    release_year: w.y, runtime_minutes: w.r,
    genres: w.g, age_certification: w.a,
    imdb_score: w.im, tmdb_score: w.td, tomatometer: w.tm,
    available_on_flatrate: w.f, lowest_rent: w.rl, lowest_buy: w.bl,
    brands: w.b, monet: w.mn, quals: w.q,
  }
}

function loadCatalog(cc: string): Title[] {
  const p = path.join(PUBLIC_DATA, `catalog_${cc}.json`)
  if (!fs.existsSync(p)) throw new Error(`Missing catalog_${cc}.json`)
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
  const entries: WireCatalogEntry[] = raw.entries
  return entries.map(decodeCatalogEntry)
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
    data[cc] = { titles: loadCatalog(cc), providers: loadProviders(cc) }
    console.log(`  loaded ${cc}: ${data[cc].titles.length} titles, ${Object.keys(data[cc].providers).length} brands`)
  } catch (e) {
    console.error(`  ✗  FAIL: ${(e as Error).message}`)
    failed = true
  }
}

// ── 2. All catalog monet fields contain only canonical monetization types ────────
console.log('\n[0] All titles have monet ⊆ {FLATRATE, RENT, BUY, FREE, ADS} …')
const CANONICAL_TYPES = new Set(['FLATRATE', 'RENT', 'BUY', 'FREE', 'ADS'])
for (const cc of COUNTRIES) {
  if (!data[cc]) continue
  const { titles } = data[cc]
  let nonCanonical = 0
  for (const title of titles) {
    for (const mt of title.monet) {
      if (!CANONICAL_TYPES.has(mt)) nonCanonical++
    }
  }
  assert(nonCanonical === 0, `${cc.toUpperCase()} | all monet entries are canonical (found ${nonCanonical} non-canonical)`)
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

// ── 7. All mainstream brands appear in title.brands of ≥1 FLATRATE title ──────
console.log('\n[6] All mainstream brands appear in brands field of ≥1 FLATRATE title …')
for (const cc of COUNTRIES) {
  if (!data[cc]) continue
  const { titles, providers } = data[cc]
  const allFlatrateByBrands = titles.filter(t => t.monet.includes('FLATRATE'))
  const mainstreamBrands = Object.values(providers).filter(b => b.tier === 'mainstream')
  for (const brand of mainstreamBrands) {
    const appears = allFlatrateByBrands.some(t => t.brands.includes(brand.brand_id))
    assert(
      appears,
      `${cc.toUpperCase()} | mainstream brand '${brand.brand_id}' appears in brands of ≥1 FLATRATE title`
    )
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
