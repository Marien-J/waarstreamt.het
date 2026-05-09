/**
 * Smoke-test for title search quality.
 * Verifies known-good queries against real catalog JSON files.
 * Usage: tsx scripts/test-search.ts
 * Exit 0 = all pass, exit 1 = failures.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import MiniSearch from 'minisearch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Types ────────────────────────────────────────────────────────────────────

interface Title {
  jw_entry_id: string
  title: string
  imdb_score: number | null
  tmdb_score: number | null
}

interface SearchDoc {
  id: string
  jw_entry_id: string
  title: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildIndex(titles: Title[]): MiniSearch<SearchDoc> {
  const idx = new MiniSearch<SearchDoc>({
    fields: ['title'],
    storeFields: ['jw_entry_id'],
    processTerm: (term: string) => {
      const n = normalize(term)
      return n.length > 0 ? n : null
    },
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
      boost: { title: 2 },
    },
  })
  idx.addAll(titles.map(t => ({ id: t.jw_entry_id, jw_entry_id: t.jw_entry_id, title: t.title })))
  return idx
}

function searchFor(idx: MiniSearch<SearchDoc>, titleMap: Map<string, Title>, query: string): string[] {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []
  if (trimmed.length < 2) return []

  const hits = idx.search(trimmed)

  const normQuery = normalize(trimmed)
  const firstQueryToken = normQuery.split(' ')[0]

  const scored = hits.map(hit => {
    const id = hit.id as string
    const t = titleMap.get(id)
    let score = hit.score
    if (t && firstQueryToken) {
      const firstTitleToken = normalize(t.title).split(' ')[0]
      if (firstTitleToken.startsWith(firstQueryToken)) {
        score *= 1.5
      }
    }
    return { id, score, t }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const pa = a.t?.imdb_score ?? a.t?.tmdb_score ?? 0
    const pb = b.t?.imdb_score ?? b.t?.tmdb_score ?? 0
    return pb - pa
  })

  return scored.map(r => r.t?.title ?? '').filter(Boolean)
}

// ── Test runner ──────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ ${message}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${message}`)
    failed++
  }
}

function runCatalogTests(label: string, jsonPath: string, tests: Array<() => void>): void {
  console.log(`\n=== ${label} ===`)
  const titles: Title[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const titleMap = new Map(titles.map(t => [t.jw_entry_id, t]))
  const idx = buildIndex(titles)
  console.log(`Loaded ${titles.length} titles`)

  // Expose for closures
  ;(globalThis as any).__idx = idx
  ;(globalThis as any).__titleMap = titleMap
  ;(globalThis as any).__titles = titles

  for (const t of tests) t()
}

// ── NL Tests ─────────────────────────────────────────────────────────────────

const nlPath = path.join(__dirname, '../public/data/titles_nl.json')

runCatalogTests('NL Catalog', nlPath, [
  () => {
    const idx = (globalThis as any).__idx as MiniSearch<SearchDoc>
    const titleMap = (globalThis as any).__titleMap as Map<string, Title>
    const results = searchFor(idx, titleMap, 'suits')
    console.log(`  "suits" top 5: ${results.slice(0, 5).join(' | ')}`)
    assert(results.slice(0, 5).includes('Suits'), '"suits" → "Suits" in top 5')
  },
  () => {
    const idx = (globalThis as any).__idx as MiniSearch<SearchDoc>
    const titleMap = (globalThis as any).__titleMap as Map<string, Title>
    const results = searchFor(idx, titleMap, 'harry potter')
    console.log(`  "harry potter" top 5: ${results.slice(0, 5).join(' | ')}`)
    assert(
      results.slice(0, 5).some(t => t.toLowerCase().includes('harry potter')),
      '"harry potter" → Harry Potter title in top 5'
    )
  },
  () => {
    const idx = (globalThis as any).__idx as MiniSearch<SearchDoc>
    const titleMap = (globalThis as any).__titleMap as Map<string, Title>
    const results = searchFor(idx, titleMap, 'mentalist')
    console.log(`  "mentalist" top 5: ${results.slice(0, 5).join(' | ')}`)
    assert(results.slice(0, 5).includes('The Mentalist'), '"mentalist" → "The Mentalist" in top 5')
  },
  () => {
    const idx = (globalThis as any).__idx as MiniSearch<SearchDoc>
    const titleMap = (globalThis as any).__titleMap as Map<string, Title>
    const results = searchFor(idx, titleMap, 'harry poter')
    console.log(`  "harry poter" (typo) top 10: ${results.slice(0, 10).join(' | ')}`)
    assert(
      results.slice(0, 10).some(t => t.toLowerCase().includes('harry potter')),
      '"harry poter" (typo) → Harry Potter in top 10'
    )
  },
  () => {
    const idx = (globalThis as any).__idx as MiniSearch<SearchDoc>
    const titleMap = (globalThis as any).__titleMap as Map<string, Title>
    const results = searchFor(idx, titleMap, 's')
    assert(results.length === 0, '"s" (1 char) → 0 results (length floor)')
  },
  () => {
    const titles = (globalThis as any).__titles as Title[]
    // Empty query handled by the searchTitles function in production; here just test length floor
    const idx = (globalThis as any).__idx as MiniSearch<SearchDoc>
    const titleMap = (globalThis as any).__titleMap as Map<string, Title>
    const results = searchFor(idx, titleMap, '')
    // Empty query returns [] per helper (0 chars < 2); production code returns all — assert floor
    assert(results.length === 0, 'empty query → 0 results from helper (floor)')
    // Verify catalog size is as expected
    assert(titles.length > 0, `NL catalog has ${titles.length} titles`)
  },
])

// ── DE Tests ─────────────────────────────────────────────────────────────────

const dePath = path.join(__dirname, '../public/data/titles_de.json')

runCatalogTests('DE Catalog', dePath, [
  () => {
    const idx = (globalThis as any).__idx as MiniSearch<SearchDoc>
    const titleMap = (globalThis as any).__titleMap as Map<string, Title>
    const results = searchFor(idx, titleMap, 'dark')
    console.log(`  "dark" top 5: ${results.slice(0, 5).join(' | ')}`)
    assert(results.slice(0, 5).includes('Dark'), '"dark" → "Dark" in top 5 DE results')
  },
  () => {
    const idx = (globalThis as any).__idx as MiniSearch<SearchDoc>
    const titleMap = (globalThis as any).__titleMap as Map<string, Title>
    const results = searchFor(idx, titleMap, 'vikings')
    console.log(`  "vikings" top 5: ${results.slice(0, 5).join(' | ')}`)
    assert(results.slice(0, 5).includes('Vikings'), '"vikings" → "Vikings" in top 5 DE results')
  },
])

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`)
if (failed > 0) {
  process.exit(1)
}
