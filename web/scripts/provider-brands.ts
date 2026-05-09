/**
 * Provider brand canonicalization.
 *
 * BRAND_BY_SHORT_NAME maps every JustWatch short_name that appears in the
 * 6 country catalogs (NL/DE/BE/US/GB/JP) to a canonical brand ID.
 *
 * Rules:
 *  - Short_names from the providers CSVs are REQUIRED to be mapped.
 *  - Known multi-code brands are consolidated (amazon = prv + amp + amz + pva +
 *    aim).
 *  - Unknown short_names are NOT listed here; preprocess defaults them to their
 *    own short_name as brand_id (passthrough).
 *
 * Updated 2026-05-09 (task 20260509-complete-brand-coverage):
 *  - Full enumeration of all short_names from the 6 main offer-level CSVs
 *    (not just the small providers lookup CSVs).
 *  - All passthrough brands with ≥50 FLATRATE titles per country are now
 *    properly mapped to canonical brand entries with display_names.
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
  ppa: 'paramount', // Paramount Plus Apple TV Channel
  ppp: 'paramount', // Paramount Plus Premium
  pba: 'paramount', // Paramount Plus Basic with Ads
  ppe: 'paramount', // Paramount Plus Essential
  prk: 'paramount', // Paramount+ Roku Premium Channel

  // ── Apple TV+ ────────────────────────────────────────────────────────────
  atp: 'apple', // Apple TV+
  itu: 'apple', // iTunes / Apple TV Store (TVOD)

  // ── Google Play ──────────────────────────────────────────────────────────
  ply: 'google', // Google Play Movies

  // ── Peacock ──────────────────────────────────────────────────────────────
  pct: 'peacock', // Peacock Premium
  pcp: 'peacock', // Peacock Premium Plus

  // ── Hulu (JP, US) ────────────────────────────────────────────────────────
  hlu: 'hulu',

  // ── U-NEXT (JP) ──────────────────────────────────────────────────────────
  unx: 'unx',
  mxu: 'unx', // HBO Max on U-Next (accessed via U-NEXT subscription)

  // ── Videoland (NL) ───────────────────────────────────────────────────────
  vil: 'videoland',
  vdl: 'videoland', // legacy code from old providers.json

  // ── VRT MAX (BE) ─────────────────────────────────────────────────────────
  vrt: 'vrt',

  // ── Joyn (DE) ────────────────────────────────────────────────────────────
  jyn: 'jyn',
  jpl: 'jyn', // Joyn Plus (subscription tier of Joyn)

  // ── RTL+ (DE) ────────────────────────────────────────────────────────────
  tvn: 'tvn',
  rlm: 'tvn', // RTL+ Max Amazon Channel
  rpa: 'tvn', // RTL Passion Amazon Channel
  arc: 'tvn', // RTL Crime Amazon Channel

  // ── WOW (DE, JP) ─────────────────────────────────────────────────────────
  wls: 'wls',
  sko: 'wls', // WOW (formerly Sky Ticket, technical_name: skyticket)
  wfa: 'wls', // Wow Fiction Amazon Channel
  cwp: 'wls', // Cinefil Wow Plus Amazon Channel (JP)

  // ── BBC iPlayer (GB) ─────────────────────────────────────────────────────
  bbc: 'bbc',

  // ── ITVX (GB) ────────────────────────────────────────────────────────────
  itv: 'itv',
  itp: 'itv', // ITVX Premium

  // ── NOW (GB) ─────────────────────────────────────────────────────────────
  ntv: 'ntv',
  ntc: 'ntv', // Now TV Cinema

  // ── Sky Go (DE, GB) ──────────────────────────────────────────────────────
  skg: 'skygo',

  // ── SkyShowtime (NL) ─────────────────────────────────────────────────────
  sst: 'sst',

  // ── MagentaTV (DE) ───────────────────────────────────────────────────────
  mag: 'magenta',

  // ── ARD Plus (DE) ────────────────────────────────────────────────────────
  ard: 'ardplus',
  ara: 'ardplus', // ARD Plus Apple TV channel
  arl: 'ardplus', // ARD Plus Amazon channel

  // ── Crunchyroll ──────────────────────────────────────────────────────────
  cru: 'crunchyroll',
  cra: 'crunchyroll', // Crunchyroll Amazon Channel

  // ── BritBox (GB, US) ─────────────────────────────────────────────────────
  bbo: 'britbox',
  abb: 'britbox', // BritBox Amazon Channel
  bba: 'britbox', // Britbox Apple TV Channel

  // ── Shudder ──────────────────────────────────────────────────────────────
  shd: 'shudder',
  asd: 'shudder', // Shudder Amazon Channel
  sua: 'shudder', // Shudder Apple TV Channel

  // ── AMC+ ─────────────────────────────────────────────────────────────────
  acp: 'amcplus',
  azp: 'amcplus', // AMC+ Amazon Channel
  aat: 'amcplus', // AMC Plus Apple TV Channel

  // ── MGM+ ─────────────────────────────────────────────────────────────────
  epx: 'mgmplus',
  aep: 'mgmplus', // MGM+ Amazon Channel
  erk: 'mgmplus', // MGM Plus Roku Premium Channel

  // ── Discovery+ ───────────────────────────────────────────────────────────
  dpu: 'discovery',
  adp: 'discovery', // Discovery+ Amazon Channel
  dpe: 'discovery', // Discovery+ (EU)

  // ── Starz ────────────────────────────────────────────────────────────────
  szt: 'starz', // Starz Apple TV Channel
  sru: 'starz', // Starz Roku Premium Channel

  // ── Criterion Channel (US) ───────────────────────────────────────────────
  crc: 'criterion',

  // ── fuboTV (US) ──────────────────────────────────────────────────────────
  fuv: 'fubotv',

  // ── Philo (US) ───────────────────────────────────────────────────────────
  phl: 'philo',

  // ── YouTube TV (US) ──────────────────────────────────────────────────────
  ytt: 'youtubetv',

  // ── Kocowa (BE, DE, NL) ──────────────────────────────────────────────────
  koc: 'kocowa',

  // ── Rakuten Viki (DE, US) ────────────────────────────────────────────────
  vik: 'viki',

  // ── GEO Television (DE) ──────────────────────────────────────────────────
  agt: 'geo',
  atw: 'geo', // GEO Television + Wild Amazon Channel

  // ── Spectrum On Demand (US) ──────────────────────────────────────────────
  sod: 'spectrum',

  // ── Cineverse (US) ───────────────────────────────────────────────────────
  cev: 'cineverse',

  // ── Lionsgate+ (DE, US) ──────────────────────────────────────────────────
  alg: 'lionsgate',

  // ── Investigation Discovery (US) ─────────────────────────────────────────
  inv: 'invdiscovery',

  // ── Sundance Now (US) ────────────────────────────────────────────────────
  sdn: 'sundancenow',

  // ── A&E (US) ─────────────────────────────────────────────────────────────
  aae: 'aetv',
  aec: 'aetv', // A&E Crime Central Apple TV Channel

  // ── HISTORY Vault (US) ───────────────────────────────────────────────────
  ahv: 'histvault',
  hva: 'histvault', // HISTORY Vault Apple TV Channel

  // ── Magnolia Network (US) ────────────────────────────────────────────────
  amn: 'magnolia',

  // ── HGTV (US) ────────────────────────────────────────────────────────────
  hgt: 'hgtv',

  // ── Food Network (US) ────────────────────────────────────────────────────
  fnw: 'foodnetwork',

  // ── Fandor (US) ──────────────────────────────────────────────────────────
  afa: 'fandor',

  // ── Screambox (US) ───────────────────────────────────────────────────────
  asb: 'screambox',

  // ── Midnight Pulp (US) ───────────────────────────────────────────────────
  mtp: 'midnightpulp',

  // ── MovieSphere+ (US) ────────────────────────────────────────────────────
  mse: 'moviesphere',

  // ── Shout! Factory (US) ──────────────────────────────────────────────────
  asf: 'shoutfactory',

  // ── FlixFling (US) ───────────────────────────────────────────────────────
  fxf: 'flixfling',

  // ── Canal+ (NL, BE) ──────────────────────────────────────────────────────
  cpd: 'canalplus',

  // ── NLZIET (NL) ──────────────────────────────────────────────────────────
  nlz: 'nlziet',

  // ── CineMember (NL) ──────────────────────────────────────────────────────
  cim: 'cinemember',

  // ── NPO Plus (NL) ────────────────────────────────────────────────────────
  npp: 'npoplus',

  // ── Viaplay (NL) ─────────────────────────────────────────────────────────
  vip: 'viaplay',

  // ── Sooner (NL, DE) ──────────────────────────────────────────────────────
  snr: 'sooner',

  // ── Ziggo TV (NL) ────────────────────────────────────────────────────────
  zig: 'ziggo',

  // ── Film1 (NL) ───────────────────────────────────────────────────────────
  fm1: 'film1',

  // ── Telenet (BE) ─────────────────────────────────────────────────────────
  tel: 'telenet',

  // ── FOD (JP) ─────────────────────────────────────────────────────────────
  fuj: 'fod',
  fda: 'fod', // FOD Channel Amazon Channel

  // ── dAnime (JP) ──────────────────────────────────────────────────────────
  dan: 'danime',

  // ── Anime Times (JP) ─────────────────────────────────────────────────────
  aam: 'animetimes',

  // ── TELESA (JP) ──────────────────────────────────────────────────────────
  tls: 'telesa',

  // ── Toei (JP) ────────────────────────────────────────────────────────────
  toa: 'toei',
  ton: 'toei', // Toei On Demand Amazon Channel

  // ── Asia Premium (JP) ────────────────────────────────────────────────────
  pma: 'asiapremium',

  // ── Plus Shochiku (JP) ───────────────────────────────────────────────────
  psa: 'shochiku',

  // ── KADOKAWA (JP) ────────────────────────────────────────────────────────
  kdk: 'kadokawa',

  // ── Channel K (JP) ───────────────────────────────────────────────────────
  chk: 'channelk',

  // ── Seven Entertainment (DE) ─────────────────────────────────────────────
  sea: 'sevenentertainment',

  // ── Aniverse (DE) ────────────────────────────────────────────────────────
  ava: 'aniverse',

  // ── Film Total (DE) ──────────────────────────────────────────────────────
  aft: 'filmtotal',

  // ── Bloody Movies (DE, US) ───────────────────────────────────────────────
  abm: 'bloodymovies',

  // ── Moviedome Plus (DE) ──────────────────────────────────────────────────
  mdp: 'moviedome',

  // ── GRJNGO (DE) ──────────────────────────────────────────────────────────
  gja: 'grjngo',

  // ── Kixi (DE) ────────────────────────────────────────────────────────────
  kxa: 'kixi',

  // ── Disaster X (DE) ──────────────────────────────────────────────────────
  dxa: 'disasterx',

  // ── Netzkino (DE) ────────────────────────────────────────────────────────
  nks: 'netzkino',

  // ── Franatic (DE) ────────────────────────────────────────────────────────
  fta: 'franatic',

  // ── FlimmerkisteTV (DE) ──────────────────────────────────────────────────
  fkr: 'flimmerkiste',

  // ── Superfresh (DE) ──────────────────────────────────────────────────────
  sfc: 'superfresh',

  // ── Galactic Stream (DE) ─────────────────────────────────────────────────
  gsa: 'galacticstream',

  // ── Adrenalin (DE) ───────────────────────────────────────────────────────
  adr: 'adrenalin',

  // ── Love and Passion (DE) ────────────────────────────────────────────────
  lap: 'loveandpassion',

  // ── ZDF Select (DE) ──────────────────────────────────────────────────────
  zsa: 'zdfselect',

  // ── Kabel Eins Classics (DE) ─────────────────────────────────────────────
  kba: 'kabeleins',

  // ── KPN iTV (NL) ─────────────────────────────────────────────────────────
  kpn: 'kpn',

  // ── MagentaTV (additional code) ──────────────────────────────────────────
  etv: 'magenta', // MagentaTV (technical_name: entertaintv) — consolidates with mag

  // ── Rakuten TV (TVOD/ADS) ─────────────────────────────────────────────────
  wki: 'rakuten', // Rakuten TV (technical_name: wuaki)

  // ── UCI Kino (CINEMA) ─────────────────────────────────────────────────────
  uck: 'ucikino',

  // ── MUBI ──────────────────────────────────────────────────────────────────
  mbi: 'mubi',
  amu: 'mubi', // MUBI Amazon Channel

  // ── Cinemax ───────────────────────────────────────────────────────────────
  acn: 'cinemax', // Cinemax Amazon Channel
  cma: 'cinemax', // Cinemax Apple TV Channel

  // ── Acorn TV ──────────────────────────────────────────────────────────────
  act: 'acorntv',
  aac: 'acorntv', // AcornTV Amazon Channel
  acr: 'acorntv', // Acorn TV Apple TV Channel

  // ── MGM Plus (additional Amazon channel code) ────────────────────────────
  mgp: 'mgmplus', // MGM Plus Amazon Channel

  // ── Starz (additional codes) ─────────────────────────────────────────────
  stz: 'starz', // Starz (direct)
  saz: 'starz', // Starz Amazon Channel

  // ── BET+ ─────────────────────────────────────────────────────────────────
  bpc: 'betplus', // Bet+ Amazon Channel
  bpa: 'betplus', // BET+ Apple TV Channel

  // ── Dove Channel ─────────────────────────────────────────────────────────
  dva: 'dove', // Dove Amazon Channel

  // ── TLC ───────────────────────────────────────────────────────────────────
  tlc: 'tlcnetwork',

  // ── Pure Flix ─────────────────────────────────────────────────────────────
  pux: 'pureflix',

  // ── UP Faith & Family ─────────────────────────────────────────────────────
  ufc: 'upfaithfamily', // UP Faith & Family Amazon Channel
  ufa: 'upfaithfamily', // UP Faith & Family Apple TV Channel

  // ── Qello Concerts ────────────────────────────────────────────────────────
  qcs: 'qello', // Qello Concerts by Stingray Amazon Channel

  // ── Magnolia Network (additional Amazon channel code) ────────────────────
  msa: 'magnolia', // Magnolia Selects Amazon Channel

  // ── History Channel ───────────────────────────────────────────────────────
  his: 'history',

  // ── Magellan TV ───────────────────────────────────────────────────────────
  mgl: 'magellantv',

  // ── Cultpix ───────────────────────────────────────────────────────────────
  ctx: 'cultpix',
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
  // ── Major global brands ───────────────────────────────────────────────────
  amazon: {
    display_name: 'Amazon Prime Video',
    brand_color: '#00A8E1',
    logo_url: 'https://images.justwatch.com/icon/52449861/s100',
  },
  netflix: {
    display_name: 'Netflix',
    brand_color: '#E50914',
    logo_url: 'https://images.justwatch.com/icon/207360008/s100',
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
  peacock: {
    display_name: 'Peacock',
    brand_color: '#000000',
    logo_url: 'https://images.justwatch.com/icon/194173870/s100',
  },

  // ── Country-specific primary brands ──────────────────────────────────────
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
    logo_url: 'https://images.justwatch.com/icon/190848813/s100',
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
  kpn: {
    display_name: 'KPN',
    brand_color: '#00A03E',
  },

  // ── New brands added 2026-05-09 ───────────────────────────────────────────

  // Global / multi-country
  crunchyroll: {
    display_name: 'Crunchyroll',
    brand_color: '#F47521',
    logo_url: 'https://images.justwatch.com/icon/324213205/s100',
  },
  britbox: {
    display_name: 'BritBox',
    brand_color: '#002EA6',
  },
  shudder: {
    display_name: 'Shudder',
    brand_color: '#006400',
  },
  amcplus: {
    display_name: 'AMC+',
    brand_color: '#000000',
  },
  mgmplus: {
    display_name: 'MGM+',
    brand_color: '#003087',
  },
  discovery: {
    display_name: 'Discovery+',
    brand_color: '#2175D9',
  },
  skygo: {
    display_name: 'Sky Go',
    brand_color: '#00b0f0',
  },
  starz: {
    display_name: 'Starz',
    brand_color: '#000000',
    logo_url: 'https://images.justwatch.com/icon/30154735/s100',
  },
  criterion: {
    display_name: 'Criterion Channel',
    brand_color: '#000000',
    logo_url: 'https://images.justwatch.com/icon/308609719/s100',
  },
  fubotv: {
    display_name: 'fuboTV',
    brand_color: '#E9062C',
    logo_url: 'https://images.justwatch.com/icon/316727347/s100',
  },
  philo: {
    display_name: 'Philo',
    brand_color: '#25BEC8',
  },
  youtubetv: {
    display_name: 'YouTube TV',
    brand_color: '#FF0000',
  },
  kocowa: {
    display_name: 'Kocowa',
    brand_color: '#E31837',
  },
  viki: {
    display_name: 'Rakuten Viki',
    brand_color: '#1DACE3',
  },
  lionsgate: {
    display_name: 'Lionsgate+',
    brand_color: '#000000',
  },
  cineverse: {
    display_name: 'Cineverse',
    brand_color: '#000000',
  },
  spectrum: {
    display_name: 'Spectrum On Demand',
    brand_color: '#003594',
  },
  invdiscovery: {
    display_name: 'Investigation Discovery',
    brand_color: '#2175D9',
  },
  sundancenow: {
    display_name: 'Sundance Now',
    brand_color: '#000000',
  },
  aetv: {
    display_name: 'A&E',
    brand_color: '#000000',
  },
  histvault: {
    display_name: 'HISTORY Vault',
    brand_color: '#D4AF37',
  },
  magnolia: {
    display_name: 'Magnolia Network',
    brand_color: '#000000',
  },
  hgtv: {
    display_name: 'HGTV',
    brand_color: '#009B4E',
  },
  foodnetwork: {
    display_name: 'Food Network',
    brand_color: '#E57200',
  },
  fandor: {
    display_name: 'Fandor',
    brand_color: '#FF5F00',
  },
  screambox: {
    display_name: 'Screambox',
    brand_color: '#FF0000',
  },
  midnightpulp: {
    display_name: 'Midnight Pulp',
    brand_color: '#000000',
  },
  moviesphere: {
    display_name: 'MovieSphere+',
    brand_color: '#000000',
  },
  shoutfactory: {
    display_name: 'Shout! Factory TV',
    brand_color: '#E31837',
  },
  flixfling: {
    display_name: 'FlixFling',
    brand_color: '#000000',
  },

  // DE-specific
  magenta: {
    display_name: 'MagentaTV',
    brand_color: '#E20074',
  },
  ardplus: {
    display_name: 'ARD Plus',
    brand_color: '#003DA5',
  },
  geo: {
    display_name: 'GEO Television',
    brand_color: '#FFD700',
  },
  sevenentertainment: {
    display_name: 'Seven Entertainment',
    brand_color: '#FF0000',
  },
  aniverse: {
    display_name: 'Aniverse',
    brand_color: '#6A0DAD',
  },
  filmtotal: {
    display_name: 'Film Total',
    brand_color: '#000000',
  },
  bloodymovies: {
    display_name: 'Bloody Movies',
    brand_color: '#8B0000',
  },
  moviedome: {
    display_name: 'Moviedome Plus',
    brand_color: '#000000',
  },
  grjngo: {
    display_name: 'GRJNGO',
    brand_color: '#D4380D',
  },
  kixi: {
    display_name: 'Kixi',
    brand_color: '#000000',
  },
  disasterx: {
    display_name: 'Disaster X',
    brand_color: '#FF4500',
  },
  netzkino: {
    display_name: 'Netzkino',
    brand_color: '#1A1A2E',
  },
  franatic: {
    display_name: 'Franatic',
    brand_color: '#000000',
  },
  flimmerkiste: {
    display_name: 'FlimmerkisteTV',
    brand_color: '#FF6600',
  },
  superfresh: {
    display_name: 'Superfresh',
    brand_color: '#00AA55',
  },
  galacticstream: {
    display_name: 'Galactic Stream',
    brand_color: '#1A0A3B',
  },
  adrenalin: {
    display_name: 'Adrenalin',
    brand_color: '#FF0000',
  },
  loveandpassion: {
    display_name: 'Love and Passion',
    brand_color: '#FF69B4',
  },
  zdfselect: {
    display_name: 'ZDF Select',
    brand_color: '#003DA5',
  },
  kabeleins: {
    display_name: 'Kabel Eins Classics',
    brand_color: '#E31837',
  },

  // NL-specific
  canalplus: {
    display_name: 'Canal+',
    brand_color: '#000000',
  },
  nlziet: {
    display_name: 'NLZIET',
    brand_color: '#FF7A00',
  },
  cinemember: {
    display_name: 'CineMember',
    brand_color: '#000000',
  },
  npoplus: {
    display_name: 'NPO Plus',
    brand_color: '#E4002B',
  },
  viaplay: {
    display_name: 'Viaplay',
    brand_color: '#1B0A3F',
  },
  sooner: {
    display_name: 'Sooner',
    brand_color: '#000000',
  },
  ziggo: {
    display_name: 'Ziggo TV',
    brand_color: '#FF7A00',
  },
  film1: {
    display_name: 'Film1',
    brand_color: '#000000',
  },

  // BE-specific
  telenet: {
    display_name: 'Telenet',
    brand_color: '#E4002B',
  },

  // JP-specific
  fod: {
    display_name: 'FOD',
    brand_color: '#E31837',
  },
  danime: {
    display_name: 'dAnime Store',
    brand_color: '#0099CC',
  },
  animetimes: {
    display_name: 'Anime Times',
    brand_color: '#0066CC',
  },
  telesa: {
    display_name: 'TELASA',
    brand_color: '#0099CC',
  },
  toei: {
    display_name: 'Toei Animation',
    brand_color: '#FF0000',
  },
  asiapremium: {
    display_name: 'Asia Premium',
    brand_color: '#000000',
  },
  shochiku: {
    display_name: 'Plus Shochiku',
    brand_color: '#000000',
  },
  kadokawa: {
    display_name: 'KADOKAWA',
    brand_color: '#E31837',
  },
  channelk: {
    display_name: 'Channel K',
    brand_color: '#000000',
  },

  // ── Added 2026-05-09 (task 20260509-complete-brand-coverage) ─────────────

  // Global / multi-country
  mubi: {
    display_name: 'MUBI',
    brand_color: '#0B0B0B',
  },
  cinemax: {
    display_name: 'Cinemax',
    brand_color: '#000000',
  },
  acorntv: {
    display_name: 'Acorn TV',
    brand_color: '#004B23',
  },
  betplus: {
    display_name: 'BET+',
    brand_color: '#000000',
  },
  dove: {
    display_name: 'Dove Channel',
    brand_color: '#1E90FF',
  },
  tlcnetwork: {
    display_name: 'TLC',
    brand_color: '#00BBBB',
  },
  pureflix: {
    display_name: 'Pure Flix',
    brand_color: '#0047AB',
  },
  upfaithfamily: {
    display_name: 'UP Faith & Family',
    brand_color: '#1DA1F2',
  },
  qello: {
    display_name: 'Qello Concerts',
    brand_color: '#000000',
  },
  history: {
    display_name: 'History',
    brand_color: '#4B3E30',
  },
  magellantv: {
    display_name: 'Magellan TV',
    brand_color: '#1A3E72',
  },
  cultpix: {
    display_name: 'Cultpix',
    brand_color: '#E5001C',
  },

  // TVOD / country-specific
  rakuten: {
    display_name: 'Rakuten TV',
    brand_color: '#BF0000',
  },
  ucikino: {
    display_name: 'UCI Kino',
    brand_color: '#E5001C',
  },
}
