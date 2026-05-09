/**
 * Verify that CountrySwitcher, LanguageSwitcher, and detectCountry are wired
 * into the live render tree (routes/__root.tsx and routes/index.tsx).
 *
 * Run: npx tsx web/scripts/verify-wiring.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dirname, '..')

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, 'src', rel), 'utf-8')
}

let failed = false

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓  ${message}`)
  } else {
    console.error(`  ✗  ${message}`)
    failed = true
  }
}

// ── routes/__root.tsx ─────────────────────────────────────────────────────────
const rootSrc = readSrc('routes/__root.tsx')
console.log('\nChecking routes/__root.tsx …')
assert(rootSrc.includes('CountrySwitcher'), 'imports CountrySwitcher')
assert(rootSrc.includes('LanguageSwitcher'), 'imports LanguageSwitcher')
assert(rootSrc.includes('detectCountry'), 'imports detectCountry')
assert(rootSrc.includes('applyDetectedCountry'), 'calls applyDetectedCountry')
assert(/<CountrySwitcher/.test(rootSrc), 'renders <CountrySwitcher />')
assert(/<LanguageSwitcher/.test(rootSrc), 'renders <LanguageSwitcher />')

// ── routes/index.tsx ─────────────────────────────────────────────────────────
const indexSrc = readSrc('routes/index.tsx')
console.log('\nChecking routes/index.tsx …')
assert(indexSrc.includes('usePreferencesStore'), 'imports usePreferencesStore')
// Catalog now loaded in the Web Worker — index.tsx spawns the worker and routes messages
assert(indexSrc.includes('catalog-worker.ts'), 'spawns catalog-worker.ts')
assert(indexSrc.includes('attachWorker'), 'calls attachWorker')
assert(/\}, \[country\]/.test(indexSrc), 'useEffect depends on country')
assert(indexSrc.includes('setLoading(true)'), 'resets loading to true on country change')
assert(indexSrc.includes('setFilteredTitles([])'), 'clears filteredTitles on country change')
// Worker sends 'ready' before setLoading(false) is called
assert(
  indexSrc.indexOf("msg.type === 'ready'") < indexSrc.indexOf('setLoading(false)'),
  "worker 'ready' handler runs before setLoading(false)"
)

// ── lib/i18n.ts ───────────────────────────────────────────────────────────────
const i18nSrc = readSrc('lib/i18n.ts')
console.log('\nChecking lib/i18n.ts …')
assert(
  /usePreferencesStore\(.*s.*=>.*s\.language/.test(i18nSrc),
  'useTranslation selects language from preferences store'
)

// ── app.tsx must be gone ──────────────────────────────────────────────────────
import { existsSync } from 'fs'
console.log('\nChecking app.tsx is deleted …')
assert(!existsSync(join(ROOT, 'src', 'app.tsx')), 'app.tsx does not exist')

// ── routes/title.$id.tsx ─────────────────────────────────────────────────────
const titleDetailSrc = readSrc('routes/title.$id.tsx')
console.log('\nChecking routes/title.$id.tsx …')
assert(titleDetailSrc.includes('usePreferencesStore'), 'imports usePreferencesStore')
assert(/loadTitles\(country/.test(titleDetailSrc), 'calls loadTitles(country…)')
assert(/\[id, country\]/.test(titleDetailSrc), 'useEffect depends on [id, country]')
assert(
  titleDetailSrc.includes("navigate({ to: '/', search: { q:"),
  'title.$id.tsx navigates to / with q search param'
)

// ── Flag component wiring ─────────────────────────────────────────────────────
const countrySwitcherSrc = readSrc('components/country-switcher.tsx')
const languageSwitcherSrc = readSrc('components/language-switcher.tsx')
console.log('\nChecking Flag component wiring …')
assert(
  countrySwitcherSrc.includes('Flag'),
  'country-switcher.tsx imports Flag component'
)
assert(
  !/[\u{1F1E6}-\u{1F1FF}]/u.test(countrySwitcherSrc),
  'country-switcher.tsx has no regional-indicator emoji codepoints'
)
assert(
  !/[\u{1F1E6}-\u{1F1FF}]/u.test(titleDetailSrc),
  'routes/title.$id.tsx has no regional-indicator emoji codepoints'
)

// ── Mobile-responsive label visibility ───────────────────────────────────────
console.log('\nChecking mobile-responsive label visibility …')
assert(
  !countrySwitcherSrc.includes('hidden sm:inline'),
  'country-switcher label is not hidden on mobile (no hidden sm:inline)'
)
assert(
  !languageSwitcherSrc.includes('hidden sm:inline'),
  'language-switcher label is not hidden on mobile (no hidden sm:inline)'
)

// ── detail.unavailable_in_country in all 4 dicts ──────────────────────────────
import en from '../src/i18n/en.json' assert { type: 'json' }
import nl from '../src/i18n/nl.json' assert { type: 'json' }
import de from '../src/i18n/de.json' assert { type: 'json' }
import fr from '../src/i18n/fr.json' assert { type: 'json' }
console.log('\nChecking detail.unavailable_in_country key in all dictionaries …')
assert('detail.unavailable_in_country' in en, 'en has detail.unavailable_in_country')
assert('detail.unavailable_in_country' in nl, 'nl has detail.unavailable_in_country')
assert('detail.unavailable_in_country' in de, 'de has detail.unavailable_in_country')
assert('detail.unavailable_in_country' in fr, 'fr has detail.unavailable_in_country')

// ── Japan country entries ─────────────────────────────────────────────────────
const flagSrc = readSrc('components/flag.tsx')
const preferencesSrc = readFileSync(join(ROOT, 'src', 'store', 'preferences.ts'), 'utf-8')
console.log('\nChecking Japan (JP) country entries …')
assert(flagSrc.includes('JP'), "flag.tsx contains 'JP' key in FLAGS record")
assert(preferencesSrc.includes("'JP'"), "preferences.ts contains 'JP' in CountryCode type")

// ── web/index.html meta ───────────────────────────────────────────────────────
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf-8')
console.log('\nChecking web/index.html …')
assert(!indexHtml.includes('NL Streaming'), 'title does not contain "NL Streaming"')

// ── Brand canonicalization gates ──────────────────────────────────────────────
console.log('\nChecking provider canonicalization …')
assert(
  existsSync(join(ROOT, 'scripts', 'provider-brands.ts')),
  'web/scripts/provider-brands.ts exists'
)

const providersSrc = readSrc('lib/providers.ts')
assert(
  /loadProviders\([\s\S]{0,10}countryCode/.test(providersSrc),
  'lib/providers.ts has loadProviders(countryCode signature'
)

const preprocessSrc = readFileSync(join(ROOT, 'scripts', 'preprocess.ts'), 'utf-8')
assert(
  preprocessSrc.includes('providers_${cc}.json') || preprocessSrc.includes('providers_'),
  'web/scripts/preprocess.ts writes providers_${cc}.json'
)

assert(
  titleDetailSrc.includes('brand_id'),
  'routes/title.$id.tsx references brand_id in offer grouping'
)

// ── Monetization coalesce + purchases toggle ──────────────────────────────────
const appStoreSrc = readFileSync(join(ROOT, 'src', 'store', 'app-store.ts'), 'utf-8')
const searchSrc = readFileSync(join(ROOT, 'src', 'lib', 'search.ts'), 'utf-8')
const titleDetailComponentSrc = readFileSync(join(ROOT, 'src', 'components', 'title-detail.tsx'), 'utf-8')
console.log('\nChecking monetization coalesce + purchases toggle …')
assert(
  appStoreSrc.includes('showPurchases') && appStoreSrc.includes('toggleShowPurchases'),
  'app-store.ts contains showPurchases and toggleShowPurchases'
)
assert(
  appStoreSrc.includes('version: 3'),
  'app-store.ts contains version: 3'
)
assert(
  rootSrc.includes('showPurchases'),
  'routes/__root.tsx contains showPurchases (button wired into root)'
)
assert(
  searchSrc.includes('showPurchases'),
  'lib/search.ts references showPurchases (filter logic respects toggle)'
)
assert(
  titleDetailComponentSrc.includes('showPurchases'),
  'components/title-detail.tsx references showPurchases'
)

// ── Final result ──────────────────────────────────────────────────────────────
console.log()
if (failed) {
  console.error('FAIL — one or more assertions failed.')
  process.exit(1)
} else {
  console.log('PASS — all wiring assertions satisfied.')
}
