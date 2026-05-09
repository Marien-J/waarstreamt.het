/**
 * Catalog Web Worker
 *
 * Runs off the main thread. Responsibilities:
 *   1. Fetch catalog_<cc>.json
 *   2. JSON.parse + decode wire format to Title[]
 *   3. Build MiniSearch index
 *   4. Send {type:'ready', titles} to main thread
 *   5. Handle {type:'search'} messages and reply with ordered id arrays
 *
 * No SharedArrayBuffer required (GitHub Pages doesn't set COOP/COEP).
 */

import MiniSearch from 'minisearch'
import type { Title } from '../lib/data'
import { decodeCatalogEntry } from '../lib/wire'
import type { WireCatalogFile } from '../lib/wire'

// ── Message types ─────────────────────────────────────────────────────────────

type InMsg =
  | { type: 'load'; country: string; baseUrl: string }
  | { type: 'search'; queryId: number; query: string }

type OutMsg =
  | { type: 'ready'; titles: Title[] }
  | { type: 'search-result'; queryId: number; ids: string[] }
  | { type: 'error'; message: string }

// ── Worker state ──────────────────────────────────────────────────────────────

let idx: MiniSearch | null = null
let titlesCache: Title[] = []
let titleCacheMap: Map<string, Title> = new Map()
let pendingSearches: Array<{ queryId: number; query: string }> = []

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildIndex(titles: Title[]): MiniSearch {
  const index = new MiniSearch({
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
  index.addAll(
    titles.map(t => ({ id: t.jw_entry_id, jw_entry_id: t.jw_entry_id, title: t.title }))
  )
  return index
}

function doSearch(query: string): string[] {
  if (!idx) return []
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const hits = idx.search(trimmed)
  const normQuery = normalize(trimmed)
  const firstQueryToken = normQuery.split(' ')[0]

  const scored = hits.map((hit: any) => {
    const id = hit.id as string
    const title = titleCacheMap.get(id)
    let score = hit.score
    if (title && firstQueryToken) {
      const firstTitleToken = normalize(title.title).split(' ')[0]
      if (firstTitleToken.startsWith(firstQueryToken)) {
        score *= 1.5
      }
    }
    return { id, score }
  })

  scored.sort((a: any, b: any) => {
    if (b.score !== a.score) return b.score - a.score
    const ta = titleCacheMap.get(a.id)
    const tb = titleCacheMap.get(b.id)
    const pa = (ta?.imdb_score ?? ta?.tmdb_score) ?? 0
    const pb = (tb?.imdb_score ?? tb?.tmdb_score) ?? 0
    return pb - pa
  })

  return scored.map((r: any) => r.id)
}

// ── Load handler ──────────────────────────────────────────────────────────────

async function handleLoad(country: string, baseUrl: string): Promise<void> {
  // Reset state for this country
  idx = null
  titlesCache = []
  titleCacheMap = new Map()

  const url = `${baseUrl}data/catalog_${country}.json`
  const response = await fetch(url)
  if (!response.ok) {
    const msg: OutMsg = { type: 'error', message: `Failed to fetch ${url}: ${response.status}` }
    self.postMessage(msg)
    return
  }

  const wire: WireCatalogFile = await response.json()
  const titles = wire.entries.map(decodeCatalogEntry)

  titlesCache = titles
  titleCacheMap = new Map(titles.map(t => [t.jw_entry_id, t]))
  idx = buildIndex(titles)

  // Flush any queries that arrived before the index was ready
  for (const { queryId, query } of pendingSearches) {
    const ids = doSearch(query)
    const msg: OutMsg = { type: 'search-result', queryId, ids }
    self.postMessage(msg)
  }
  pendingSearches = []

  // Signal ready to main thread
  const readyMsg: OutMsg = { type: 'ready', titles }
  self.postMessage(readyMsg)
}

// ── Message handler ───────────────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<InMsg>) => {
  const msg = event.data
  if (msg.type === 'load') {
    handleLoad(msg.country, msg.baseUrl).catch((err) => {
      const errMsg: OutMsg = { type: 'error', message: String(err) }
      self.postMessage(errMsg)
    })
  } else if (msg.type === 'search') {
    if (idx) {
      const ids = doSearch(msg.query)
      const result: OutMsg = { type: 'search-result', queryId: msg.queryId, ids }
      self.postMessage(result)
    } else {
      // Queue until index is ready
      pendingSearches.push({ queryId: msg.queryId, query: msg.query })
    }
  }
}
