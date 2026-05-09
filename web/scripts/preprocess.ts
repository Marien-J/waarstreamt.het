import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

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
}

interface Offer {
  provider_short_name: string
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

interface CountryMeta {
  title_count: number
  offer_count: number
  language: string
}

interface Manifest {
  extracted_at: string
  build_hash: string
  countries: Record<string, CountryMeta>
}

// Load provider metadata
const providersJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'providers.json'), 'utf-8')
)

const dataDir = path.join(__dirname, '../../data')

// Find latest CSV per country
// Pattern: streaming_<cc>_<lang>_<date>.csv  (new) OR streaming_nl_<date>.csv (legacy)
const allCsvFiles = fs.readdirSync(dataDir).filter(f =>
  f.endsWith('.csv') && !f.includes('_providers')
)

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
  let extractedAt = ''

  for (const row of validRows) {
    if (!extractedAt) extractedAt = row.extracted_at

    const jwEntryId = row.jw_entry_id

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
      })
    }

    const title = titleMap.get(jwEntryId)!
    const presentationType = row.presentation_type.startsWith('_')
      ? row.presentation_type.slice(1)
      : row.presentation_type

    const offer: Offer = {
      provider_short_name: row.provider_short_name,
      monetization_type: row.monetization_type,
      presentation_type: presentationType,
      price_value: row.price_value ? parseFloat(row.price_value) : null,
      price_currency: row.price_currency,
      offer_url: row.offer_url,
      audio_languages: row.audio_languages ? row.audio_languages.split(';').filter(Boolean) : [],
      subtitle_languages: row.subtitle_languages ? row.subtitle_languages.split(';').filter(Boolean) : [],
    }

    title.offers.push(offer)
  }

  const titles: Title[] = Array.from(titleMap.values())

  for (const title of titles) {
    title.offer_count = title.offers.length
    title.available_on_flatrate = [
      ...new Set(
        title.offers
          .filter(o => o.monetization_type === 'FLATRATE')
          .map(o => o.provider_short_name)
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

  return { titles, offerCount: validRows.length, extractedAt }
}

// Create output directory
const outputDir = path.join(__dirname, '../public/data')
fs.mkdirSync(outputDir, { recursive: true })

const manifestCountries: Record<string, CountryMeta> = {}
let firstExtractedAt = ''

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

  // Write titles_<cc>.json
  const titlesPath = path.join(outputDir, `titles_${cc}.json`)
  fs.writeFileSync(titlesPath, JSON.stringify(titles, null, 0))
  const sizeMb = (fs.statSync(titlesPath).size / 1024 / 1024).toFixed(2)
  console.log(`   ✅ Wrote titles_${cc}.json (${sizeMb} MB, ${titles.length} titles)`)

  manifestCountries[cc] = {
    title_count: titles.length,
    offer_count: offerCount,
    language,
  }
}

// Write providers.json
fs.writeFileSync(
  path.join(outputDir, 'providers.json'),
  JSON.stringify(providersJson, null, 2)
)
console.log(`   ✅ Wrote providers.json`)

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

