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
assert(/loadTitles\(country/.test(indexSrc), 'calls loadTitles(country…)')
assert(/\}, \[country\]/.test(indexSrc), 'useEffect depends on country')

// ── app.tsx must be gone ──────────────────────────────────────────────────────
import { existsSync } from 'fs'
console.log('\nChecking app.tsx is deleted …')
assert(!existsSync(join(ROOT, 'src', 'app.tsx')), 'app.tsx does not exist')

// ── Final result ──────────────────────────────────────────────────────────────
console.log()
if (failed) {
  console.error('FAIL — one or more assertions failed.')
  process.exit(1)
} else {
  console.log('PASS — all wiring assertions satisfied.')
}
