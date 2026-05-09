/**
 * i18n key completeness check.
 * Asserts that all language dictionaries contain exactly the same set of keys.
 * Run with: npx tsx scripts/check-i18n-keys.ts
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const LANGUAGES = ['en', 'nl', 'de', 'fr'] as const
const i18nDir = join(__dirname, '../src/i18n')

const dicts: Record<string, Record<string, string>> = {}

for (const lang of LANGUAGES) {
  const raw = readFileSync(join(i18nDir, `${lang}.json`), 'utf-8')
  dicts[lang] = JSON.parse(raw)
}

const referenceKeys = Object.keys(dicts.en).sort()
let allGood = true

for (const lang of LANGUAGES) {
  const keys = Object.keys(dicts[lang]).sort()

  const missing = referenceKeys.filter(k => !keys.includes(k))
  const extra = keys.filter(k => !referenceKeys.includes(k))

  if (missing.length > 0) {
    console.error(`[${lang}] Missing keys: ${missing.join(', ')}`)
    allGood = false
  }
  if (extra.length > 0) {
    console.error(`[${lang}] Extra keys (not in en): ${extra.join(', ')}`)
    allGood = false
  }
}

if (allGood) {
  console.log(`✅ All ${LANGUAGES.length} dictionaries have the same ${referenceKeys.length} keys.`)
  process.exit(0)
} else {
  process.exit(1)
}
