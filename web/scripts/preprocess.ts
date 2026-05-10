import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import { BRAND_BY_SHORT_NAME, BRANDS } from './provider-brands.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supported country codes
const SUPPORTED_COUNTRIES = ['nl', 'de', 'be', 'us', 'gb']

// Types
interface CSVRow {
  extracted_at: string
  country: string
  jw_entry_id: string
  jw_object_id: string
  object_type: 'MOVIE' | 'SHOW'
  title: string
  release_year: string
  runtime_minutes: string
  imdb_id: string
  tmdb_id: string
  genres: string
  age_certification: string
  imdb_score: string
  tmdb_score: string
  tomatometer: string
  jw_url: string
  poster_url: string
  provider_short_name: string
  provider_name: string
  provider_technical_name: string
  monetization_type: string
  presentation_type: string
  price_value: string
  price_currency: string
  offer_url: string
  audio_languages: string
  subtitle_languages: string
  streaming_charts_rank: string
}

interface Offer {
  provider_short_name: string
  provider_name: string
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
  chart_rank: number | null
}

interface CountryMeta {
  title_count: number
  offer_count: number
  language: string
  catalog_size_bytes: number
  offers_shard_count: number
}

const dataDir = path.join(__dirname, '../../data')

// Find latest CSV per country
// Pattern: streaming_<cc>_<lang>_<date>.csv  (new) OR streaming_nl_<date>.csv (legacy)
const allCsvFiles = fs.readdirSync(dataDir).filter(f =>
  f.endsWith('.csv') && !f.includes('_providers')
)

if (allCsvFiles.length === 0) {
  throw new Error(
    'No CSV files found in data/. Run `uv run python -m streaming_nl --all` locally first, then re-run `npm run preprocess`.'
  )
}

function findLatestCsvForCountry(cc: string): string | null {
  // New naming: streaming_<cc>_<lang>_YYYY-MM-DD.csv
  const pattern = new RegExp(`^streaming_${cc}_[a-z]+_\\d{4}-\\d{2}-\\d{2}\\.csv$`)
  const matches = allCsvFiles.filter(f => pattern.test(f))
  if (matches.length > 0) return matches.sort().reverse()[0]

  // Legacy NL naming: streaming_nl_YYYY-MM-DD.csv (for nl only)
  if (cc === 'nl') {
    const legacy = allCsvFiles.filter(f => /^streaming_nl_\d{4}-\d{2}-\d{2}\.csv$/.test(f))
    if (legacy.length > 0) return legacy.sort().reverse()[0]
  }
  return null
}

function processCsv(csvPath: string): { titles: Title[]; offerCount: number; extractedAt: string } {
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const parseResult = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  const rows = parseResult.data
  const validRows = rows.filter(row => row.release_year !== '0')

  const titleMap = new Map<string, Title>()
  const chartRankMap = new Map<string, number>()
  let extractedAt = ''

  for (const row of validRows) {
    if (!extractedAt) extractedAt = row.extracted_at

    const jwEntryId = row.jw_entry_id

    const rawRank = row.streaming_charts_rank
    if (rawRank) {
      const r = parseInt(rawRank, 10)
      if (!isNaN(r)) {
        const prev = chartRankMap.get(jwEntryId)
        if (prev === undefined || r < prev) chartRankMap.set(jwEntryId, r)
      }
    }

    if (!titleMap.has(jwEntryId)) {
      titleMap.set(jwEntryId, {
        jw_entry_id: jwEntryId,
        object_type: row.object_type,
        title: row.title,
        release_year: parseInt(row.release_year),
        runtime_minutes: row.runtime_minutes ? parseInt(row.runtime_minutes) : null,
        imdb_id: row.imdb_id || null,
        tmdb_id: row.tmdb_id || null,
        genres: row.genres ? row.genres.split(';').filter(Boolean) : [],
        age_certification: row.age_certification || null,
        imdb_score: row.imdb_score ? parseFloat(row.imdb_score) : null,
        tmdb_score: row.tmdb_score ? parseFloat(row.tmdb_score) : null,
        tomatometer: row.tomatometer ? parseFloat(row.tomatometer) : null,
        jw_url: row.jw_url,
        poster_url: row.poster_url,
        offers: [],
        offer_count: 0,
        available_on_flatrate: [],
        lowest_rent: null,
        lowest_buy: null,
        chart_rank: null,
      })
    }

    const title = titleMap.get(jwEntryId)!
    const presentationType = row.presentation_type.startsWith('_')
      ? row.presentation_type.slice(1)
      : row.presentation_type

    // Canonical monetization types only: drop FREE, ADS, CINEMA, FAST, etc.
    // Expand compound types (e.g. FLATRATE_AND_BUY) into individual offers.
    const CANONICAL = new Set(['FLATRATE', 'RENT', 'BUY'])
    const rawType = row.monetization_type

    // Detect compound types (e.g. FLATRATE_AND_BUY)
    const parts = rawType.includes('_AND_')
      ? rawType.split('_AND_')
      : [rawType]
    const canonicalParts = parts.filter(p => CANONICAL.has(p))

    if (canonicalParts.length === 0) continue  // drop non-canonical offer

    for (const monetizationType of canonicalParts) {
      const offer: Offer = {
        provider_short_name: row.provider_short_name,
        provider_name: row.provider_name,
        brand_id: BRAND_BY_SHORT_NAME[row.provider_short_name] ?? row.provider_short_name,
        monetization_type: monetizationType,
        presentation_type: presentationType,
        price_value: row.price_value ? parseFloat(row.price_value) : null,
        price_currency: row.price_currency,
        offer_url: row.offer_url,
        audio_languages: row.audio_languages ? row.audio_languages.split(';').filter(Boolean) : [],
        subtitle_languages: row.subtitle_languages ? row.subtitle_languages.split(';').filter(Boolean) : [],
      }

      title.offers.push(offer)
    }
  }

  const titles: Title[] = Array.from(titleMap.values())

  for (const title of titles) {
    title.offer_count = title.offers.length
    // available_on_flatrate: brand IDs (deduped), not raw short_names
    title.available_on_flatrate = [
      ...new Set(
        title.offers
          .filter(o => o.monetization_type === 'FLATRATE')
          .map(o => o.brand_id)
      )
    ]
    const rentPrices = title.offers
      .filter(o => o.monetization_type === 'RENT' && o.price_value !== null)
      .map(o => o.price_value!)
    title.lowest_rent = rentPrices.length > 0 ? Math.min(...rentPrices) : null
    const buyPrices = title.offers
      .filter(o => o.monetization_type === 'BUY' && o.price_value !== null)
      .map(o => o.price_value!)
    title.lowest_buy = buyPrices.length > 0 ? Math.min(...buyPrices) : null
  }

  // Drop titles with zero offers (catalog hygiene)
  const titlesWithOffers = titles.filter(t => t.offers.length > 0)

  for (const title of titlesWithOffers) {
    title.chart_rank = chartRankMap.get(title.jw_entry_id) ?? null
  }

  return { titles: titlesWithOffers, offerCount: validRows.length, extractedAt }
}

// Derive per-country providers_<cc>.json from actual title offer data
// Top 8 brands by unique FLATRATE title count = mainstream; ≥ threshold = niche; rest dropped
const NICHE_THRESHOLD = 50
const MAINSTREAM_LIMIT = 8

interface ProviderBrandEntry {
  brand_id: string
  display_name: string
  logo_url?: string
  brand_color: string
  title_count: number
  tier: 'mainstream' | 'niche'
  short_names: string[]
}

function deriveProviders(titles: Title[]): Record<string, ProviderBrandEntry> {
  // Count unique titles per brand_id (FLATRATE only) — for tier assignment
  const brandTitles = new Map<string, Set<string>>()
  // Track which short_names map to each brand (FLATRATE) — for short_names field
  const brandShortNames = new Map<string, Set<string>>()
  // FLATRATE offer-count per (brand_id, short_name) — for display_name selection
  const brandFlatrateOffers = new Map<string, Map<string, { provider_name: string; count: number }>>()
  // All-offer-count per (brand_id, short_name) — for display_name fallback
  const brandAllOffers = new Map<string, Map<string, { provider_name: string; count: number }>>()

  function trackOffer(
    map: Map<string, Map<string, { provider_name: string; count: number }>>,
    bid: string, sn: string, pn: string
  ) {
    if (!map.has(bid)) map.set(bid, new Map())
    const inner = map.get(bid)!
    if (!inner.has(sn)) inner.set(sn, { provider_name: pn, count: 0 })
    inner.get(sn)!.count++
  }

  for (const title of titles) {
    for (const offer of title.offers) {
      const bid = offer.brand_id
      const sn = offer.provider_short_name
      const pn = offer.provider_name || bid
      // Track all offers (fallback for display_name)
      trackOffer(brandAllOffers, bid, sn, pn)
      if (offer.monetization_type === 'FLATRATE') {
        if (!brandTitles.has(bid)) brandTitles.set(bid, new Set())
        brandTitles.get(bid)!.add(title.jw_entry_id)
        if (!brandShortNames.has(bid)) brandShortNames.set(bid, new Set())
        brandShortNames.get(bid)!.add(sn)
        trackOffer(brandFlatrateOffers, bid, sn, pn)
      }
    }
  }

  // Pick display_name: most-frequent short_name's provider_name; tie-break alphabetic
  function pickDisplayName(
    inner: Map<string, { provider_name: string; count: number }> | undefined
  ): string | undefined {
    if (!inner || inner.size === 0) return undefined
    const entries = [...inner.values()]
    entries.sort((a, b) => b.count !== a.count ? b.count - a.count : a.provider_name.localeCompare(b.provider_name))
    return entries[0].provider_name || undefined
  }

  // Sort by title count desc
  const sorted = [...brandTitles.entries()]
    .map(([brandId, titleSet]) => ({ brandId, count: titleSet.size }))
    .sort((a, b) => b.count - a.count)

  const result: Record<string, ProviderBrandEntry> = {}
  let rank = 0
  for (const { brandId, count } of sorted) {
    rank++
    let tier: 'mainstream' | 'niche'
    if (rank <= MAINSTREAM_LIMIT && count >= NICHE_THRESHOLD) {
      tier = 'mainstream'
    } else if (count >= NICHE_THRESHOLD) {
      tier = 'niche'
    } else {
      continue // drop
    }
    const meta = BRANDS[brandId]
    const displayName =
      meta?.display_name ??
      pickDisplayName(brandFlatrateOffers.get(brandId)) ??
      pickDisplayName(brandAllOffers.get(brandId)) ??
      brandId
    result[brandId] = {
      brand_id: brandId,
      display_name: displayName,
      logo_url: meta?.logo_url,
      brand_color: meta?.brand_color ?? '#888888',
      title_count: count,
      tier,
      short_names: [...(brandShortNames.get(brandId) ?? [])].sort(),
    }
  }
  return result
}

// Create output directory
const outputDir = path.join(__dirname, '../public/data')
fs.mkdirSync(outputDir, { recursive: true })

const manifestCountries: Record<string, CountryMeta> = {}
let firstExtractedAt = ''

interface Manifest {
  extracted_at: string
  build_hash: string
  countries: Record<string, CountryMeta>
}

// ── Wire format types (compact keys for disk storage) ────────────────────────

interface WireCatalogEntry {
  i: string;    // jw_entry_id
  t: string;    // title
  tp: 'MOVIE' | 'SHOW'
  y: number;    // release_year
  r: number | null  // runtime_minutes
  p: string;    // poster_url
  jw: string;   // jw_url
  g: string[];  // genres
  im: number | null  // imdb_score
  td: number | null  // tmdb_score
  tm: number | null  // tomatometer
  a: string | null   // age_certification
  f: string[];  // available_on_flatrate (brand ids)
  rl: number | null  // lowest_rent
  bl: number | null  // lowest_buy
  mn: string[]  // monet (unique monetization types)
  b: string[]   // brands (all brand ids, any monet)
  q: string[]   // quals (unique presentation types)
  cr: number | null  // streaming chart rank
}

interface WireOffer {
  bi: string;   // brand_id
  sn: string;   // provider_short_name
  pn: string;   // provider_name
  mt: string;   // monetization_type
  pt: string;   // presentation_type
  pv: number | null  // price_value (currency stored once per file)
  ou: string;   // offer_url
  al: string[]  // audio_languages
  sl: string[]  // subtitle_languages
}

function toCatalogEntry(title: Title): WireCatalogEntry {
  const brands = [...new Set(title.offers.map(o => o.brand_id))]
  const monet = [...new Set(title.offers.map(o => o.monetization_type))]
  const quals = [...new Set(title.offers.map(o => o.presentation_type).filter(Boolean))]
  return {
    i: title.jw_entry_id, t: title.title, tp: title.object_type,
    y: title.release_year, r: title.runtime_minutes,
    p: title.poster_url, jw: title.jw_url, g: title.genres,
    im: title.imdb_score, td: title.tmdb_score, tm: title.tomatometer,
    a: title.age_certification, f: title.available_on_flatrate,
    rl: title.lowest_rent, bl: title.lowest_buy, mn: monet, b: brands, q: quals,
    cr: title.chart_rank,
  }
}

function toWireOffer(o: Offer): WireOffer {
  return {
    bi: o.brand_id, sn: o.provider_short_name, pn: o.provider_name,
    mt: o.monetization_type, pt: o.presentation_type, pv: o.price_value,
    ou: o.offer_url, al: o.audio_languages, sl: o.subtitle_languages,
  }
}

function detectCurrency(titles: Title[]): string {
  for (const t of titles) {
    for (const o of t.offers) {
      if (o.price_currency) return o.price_currency
    }
  }
  return ''
}

function shardIndexFor(id: string, k: number): number {
  const num = parseInt(id.replace(/^[a-z]+/, ''), 10)
  return isNaN(num) ? 0 : Math.abs(num) % k
}

function writeCountryFiles(
  cc: string,
  titles: Title[],
  outDir: string
): { catalogSizeBytes: number; offersShardCount: number } {
  const MAX_SHARD_BYTES = 50 * 1024 * 1024

  // Catalog
  const catalogFile = { entries: titles.map(toCatalogEntry) }
  const catalogPath = path.join(outDir, `catalog_${cc}.json`)
  fs.writeFileSync(catalogPath, JSON.stringify(catalogFile, null, 0))
  const catalogSize = fs.statSync(catalogPath).size
  console.log(`   ✅ Wrote catalog_${cc}.json (${(catalogSize / 1024 / 1024).toFixed(2)} MB, ${titles.length} titles)`)

  // Build flat offers record
  const currency = detectCurrency(titles)
  const offersRecord: Record<string, WireOffer[]> = {}
  for (const t of titles) {
    if (t.offers.length > 0) {
      offersRecord[t.jw_entry_id] = t.offers.map(toWireOffer)
    }
  }

  // Find smallest power-of-2 K so each shard <= 50MB
  let k = 1
  while (k <= 64) {
    if (k === 1) {
      const size = Buffer.byteLength(JSON.stringify({ currency, offers: offersRecord }), 'utf-8')
      if (size <= MAX_SHARD_BYTES) break
    } else {
      const shards: Record<string, WireOffer[]>[] = Array.from({ length: k }, () => ({}))
      for (const [id, wo] of Object.entries(offersRecord)) {
        shards[shardIndexFor(id, k)][id] = wo
      }
      const allFit = shards.every(s =>
        Buffer.byteLength(JSON.stringify({ currency, offers: s }), 'utf-8') <= MAX_SHARD_BYTES
      )
      if (allFit) break
    }
    k *= 2
  }

  if (k === 1) {
    const offersPath = path.join(outDir, `offers_${cc}.json`)
    fs.writeFileSync(offersPath, JSON.stringify({ currency, offers: offersRecord }, null, 0))
    const mb = (fs.statSync(offersPath).size / 1024 / 1024).toFixed(2)
    console.log(`   ✅ Wrote offers_${cc}.json (${mb} MB)`)
  } else {
    const shards: Record<string, WireOffer[]>[] = Array.from({ length: k }, () => ({}))
    for (const [id, wo] of Object.entries(offersRecord)) {
      shards[shardIndexFor(id, k)][id] = wo
    }
    for (let i = 0; i < k; i++) {
      const offersPath = path.join(outDir, `offers_${cc}_${i}.json`)
      fs.writeFileSync(offersPath, JSON.stringify({ currency, offers: shards[i] }, null, 0))
      const mb = (fs.statSync(offersPath).size / 1024 / 1024).toFixed(2)
      console.log(`   ✅ Wrote offers_${cc}_${i}.json (${mb} MB, ${Object.keys(shards[i]).length} titles)`)
    }
  }

  return { catalogSizeBytes: catalogSize, offersShardCount: k }
}

for (const cc of SUPPORTED_COUNTRIES) {
  const csvFile = findLatestCsvForCountry(cc)
  if (!csvFile) {
    console.log(`⚠️  No CSV found for ${cc.toUpperCase()} — skipping`)
    continue
  }
  const csvPath = path.join(dataDir, csvFile)
  console.log(`📊 Processing ${csvFile} (${cc.toUpperCase()})...`)

  const { titles, offerCount, extractedAt } = processCsv(csvPath)
  if (!firstExtractedAt) firstExtractedAt = extractedAt

  // Determine language from filename: streaming_<cc>_<lang>_<date>.csv
  const langMatch = csvFile.match(/^streaming_[a-z]+_([a-z]+)_\d{4}/)
  const language = langMatch ? langMatch[1] : cc

  // Write catalog_<cc>.json + offers_<cc>[_n].json (two-tier format)
  const { catalogSizeBytes, offersShardCount } = writeCountryFiles(cc, titles, outputDir)

  // Write providers_<cc>.json
  const providers = deriveProviders(titles)
  const providersPath = path.join(outputDir, `providers_${cc}.json`)
  fs.writeFileSync(providersPath, JSON.stringify(providers, null, 2))
  console.log(`   ✅ Wrote providers_${cc}.json (${Object.keys(providers).length} brands)`)

  manifestCountries[cc] = {
    title_count: titles.length,
    offer_count: offerCount,
    language,
    catalog_size_bytes: catalogSizeBytes,
    offers_shard_count: offersShardCount,
  }
}

// Remove legacy un-prefixed files if they exist
for (const legacyFile of ['titles.json', 'providers.json']) {
  const legacyPath = path.join(outputDir, legacyFile)
  if (fs.existsSync(legacyPath)) {
    fs.unlinkSync(legacyPath)
    console.log(`   🗑️  Removed legacy ${legacyFile}`)
  }
}

// Remove legacy per-country titles_<cc>.json files (replaced by catalog_<cc>.json + offers)
for (const f of fs.readdirSync(outputDir)) {
  if (/^titles_[a-z]+\.json$/.test(f)) {
    fs.unlinkSync(path.join(outputDir, f))
    console.log(`   🗑️  Removed legacy ${f}`)
  }
}

// Size guard: fail build if any JSON file exceeds 95MB (hard GitHub limit is 100MB)
const oversizedFiles = fs.readdirSync(outputDir)
  .filter(f => f.endsWith('.json'))
  .filter(f => fs.statSync(path.join(outputDir, f)).size > 95 * 1024 * 1024)
if (oversizedFiles.length > 0) {
  console.error(`\n❌ ERROR: Files exceed 95MB GitHub limit: ${oversizedFiles.join(', ')}`)
  process.exit(1)
}

// Write manifest.json
const manifest: Manifest = {
  extracted_at: firstExtractedAt,
  build_hash: new Date().toISOString(),
  countries: manifestCountries,
}
fs.writeFileSync(
  path.join(outputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
)
console.log(`   ✅ Wrote manifest.json`)

console.log(`\n✨ Preprocessing complete! Countries: ${Object.keys(manifestCountries).join(', ')}`)

