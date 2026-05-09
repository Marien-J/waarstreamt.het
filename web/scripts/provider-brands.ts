/**
 * Provider brand canonicalization.
 *
 * BRAND_BY_SHORT_NAME maps every JustWatch short_name that appears in the
 * 6 country catalogs (NL/DE/BE/US/GB/JP) to a canonical brand ID.
 *
 * Rules:
 *  - Short_names from the providers CSVs are REQUIRED to be mapped.
 *  - Known multi-code brands are consolidated (amazon = prv + amp + amz + pva + aim).
 *  - Unknown short_names are NOT listed here; preprocess defaults them to their
 *    own short_name as brand_id (passthrough).
 */
export const BRAND_BY_SHORT_NAME: Record<string, string> = {
  // ── Amazon (multiple codes across countries) ──────────────────────────────
  amp: 'amazon', // Amazon Prime Video (DE, GB, JP, US)
  prv: 'amazon', // Amazon Prime Video (NL, BE)
  amz: 'amazon', // Amazon Video TVOD
  pva: 'amazon', // Prime Video (with ads)
  aim: 'amazon', // Amazon Prime Video Free with Ads

  // ── Netflix ───────────────────────────────────────────────────────────────
  nfx: 'netflix', // Netflix
  nfa: 'netflix', // Netflix with Ads
  nfk: 'netflix', // Netflix Kids

  // ── Max (HBO Max / Max rebrand 2023) ─────────────────────────────────────
  mxx: 'max', // HBO Max / Max
  aho: 'max', // HBO Max Amazon Channel

  // ── Disney+ ──────────────────────────────────────────────────────────────
  dnp: 'disney', // Disney+
  dis: 'disney', // Disney+ (alternate code)

  // ── Paramount+ ───────────────────────────────────────────────────────────
  app: 'paramount', // Paramount+ (DE, GB, US)
  pmp: 'paramount', // Paramount+ (variant)

  // ── Apple TV+ ────────────────────────────────────────────────────────────
  atp: 'apple', // Apple TV+
  itu: 'apple', // iTunes / Apple TV Store (TVOD)

  // ── Google Play ──────────────────────────────────────────────────────────
  ply: 'google', // Google Play Movies

  // ── Hulu (JP, US) ────────────────────────────────────────────────────────
  hlu: 'hulu',

  // ── U-NEXT (JP) ──────────────────────────────────────────────────────────
  unx: 'unx',

  // ── Videoland (NL) ───────────────────────────────────────────────────────
  vil: 'videoland',
  vdl: 'videoland', // legacy code from old providers.json

  // ── VRT MAX (BE) ─────────────────────────────────────────────────────────
  vrt: 'vrt',

  // ── Joyn (DE) ────────────────────────────────────────────────────────────
  jyn: 'jyn',

  // ── RTL+ (DE) ────────────────────────────────────────────────────────────
  tvn: 'tvn',

  // ── WOW (DE) ─────────────────────────────────────────────────────────────
  wls: 'wls',

  // ── BBC iPlayer (GB) ─────────────────────────────────────────────────────
  bbc: 'bbc',

  // ── ITVX (GB) ────────────────────────────────────────────────────────────
  itv: 'itv',

  // ── NOW (GB) ─────────────────────────────────────────────────────────────
  ntv: 'ntv',

  // ── SkyShowtime (NL) ─────────────────────────────────────────────────────
  sst: 'sst',

  // ── Peacock (US) ─────────────────────────────────────────────────────────
  pct: 'peacock',

  // ── KPN iTV (NL) — not in providers CSV but major NL provider ────────────
  kpn: 'kpn',
}

export interface BrandInfo {
  display_name: string
  brand_color: string
  logo_url?: string
}

/**
 * BRANDS defines the canonical metadata for each brand ID.
 * Preprocess uses this to populate providers_<cc>.json.
 * Unknown brand IDs (passthroughs) will fallback to brand_id as display_name.
 */
export const BRANDS: Record<string, BrandInfo> = {
  amazon: {
    display_name: 'Amazon Prime Video',
    brand_color: '#00A8E1',
    logo_url: 'https://images.justwatch.com/icon/52449861/s100',
  },
  netflix: {
    display_name: 'Netflix',
    brand_color: '#E50914',
    logo_url: 'https://images.justwatch.com/icon/430997/s100',
  },
  max: {
    display_name: 'Max',
    brand_color: '#002BE7',
    logo_url: 'https://images.justwatch.com/icon/305908916/s100',
  },
  disney: {
    display_name: 'Disney+',
    brand_color: '#113CCF',
    logo_url: 'https://images.justwatch.com/icon/147638351/s100',
  },
  paramount: {
    display_name: 'Paramount+',
    brand_color: '#0064FF',
    logo_url: 'https://images.justwatch.com/icon/230791108/s100',
  },
  apple: {
    display_name: 'Apple TV+',
    brand_color: '#000000',
    logo_url: 'https://images.justwatch.com/icon/190848813/s100',
  },
  google: {
    display_name: 'Google Play',
    brand_color: '#4285F4',
    logo_url: 'https://images.justwatch.com/icon/169478387/s100',
  },
  hulu: {
    display_name: 'Hulu',
    brand_color: '#1CE783',
    logo_url: 'https://images.justwatch.com/icon/116305230/s100',
  },
  unx: {
    display_name: 'U-NEXT',
    brand_color: '#000000',
  },
  videoland: {
    display_name: 'Videoland',
    brand_color: '#FF6600',
    logo_url: 'https://images.justwatch.com/icon/111860795/s100',
  },
  vrt: {
    display_name: 'VRT MAX',
    brand_color: '#FF0000',
  },
  jyn: {
    display_name: 'Joyn',
    brand_color: '#E52626',
  },
  tvn: {
    display_name: 'RTL+',
    brand_color: '#FF6D00',
  },
  wls: {
    display_name: 'WOW',
    brand_color: '#003087',
  },
  bbc: {
    display_name: 'BBC iPlayer',
    brand_color: '#FF0000',
  },
  itv: {
    display_name: 'ITVX',
    brand_color: '#000000',
  },
  ntv: {
    display_name: 'NOW',
    brand_color: '#00C9A7',
  },
  sst: {
    display_name: 'SkyShowtime',
    brand_color: '#0033CC',
  },
  peacock: {
    display_name: 'Peacock',
    brand_color: '#000000',
  },
  kpn: {
    display_name: 'KPN',
    brand_color: '#00A03E',
  },
}
