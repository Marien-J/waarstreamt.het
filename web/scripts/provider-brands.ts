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
  brand_color: string
  logo_url?: string
}

/**
 * BRANDS defines the canonical metadata for each brand ID.
 * Preprocess uses this to populate providers_<cc>.json.
 * Unknown brand IDs get display_name derived from CSV provider_name at preprocess time.
 */
export const BRANDS: Record<string, BrandInfo> = {
  // ── Major global brands ───────────────────────────────────────────────────
  amazon: {
    brand_color: '#00A8E1',
    logo_url: 'https://images.justwatch.com/icon/52449861/s100',
  },
  netflix: {
    brand_color: '#E50914',
    logo_url: 'https://images.justwatch.com/icon/207360008/s100',
  },
  max: {
    brand_color: '#002BE7',
    logo_url: 'https://images.justwatch.com/icon/305908916/s100',
  },
  disney: {
    brand_color: '#113CCF',
    logo_url: 'https://images.justwatch.com/icon/147638351/s100',
  },
  paramount: {
    brand_color: '#0064FF',
    logo_url: 'https://images.justwatch.com/icon/230791108/s100',
  },
  apple: {
    brand_color: '#000000',
    logo_url: 'https://images.justwatch.com/icon/190848813/s100',
  },
  google: {
    brand_color: '#4285F4',
    logo_url: 'https://images.justwatch.com/icon/169478387/s100',
  },
  hulu: {
    brand_color: '#1CE783',
    logo_url: 'https://images.justwatch.com/icon/116305230/s100',
  },
  peacock: {
    brand_color: '#000000',
    logo_url: 'https://images.justwatch.com/icon/194173870/s100',
  },

  // ── Country-specific primary brands ──────────────────────────────────────
  unx: {
    brand_color: '#000000',
  },
  videoland: {
    brand_color: '#FF6600',
    logo_url: 'https://images.justwatch.com/icon/111860795/s100',
  },
  vrt: {
    brand_color: '#FF0000',
  },
  jyn: {
    brand_color: '#E52626',
  },
  tvn: {
    brand_color: '#FF6D00',
  },
  wls: {
    brand_color: '#003087',
  },
  bbc: {
    brand_color: '#FF0000',
    logo_url: 'https://images.justwatch.com/icon/190848813/s100',
  },
  itv: {
    brand_color: '#000000',
  },
  ntv: {
    brand_color: '#00C9A7',
  },
  sst: {
    brand_color: '#0033CC',
  },
  kpn: {
    brand_color: '#00A03E',
  },

  // ── New brands added 2026-05-09 ───────────────────────────────────────────

  // Global / multi-country
  crunchyroll: {
    brand_color: '#F47521',
    logo_url: 'https://images.justwatch.com/icon/324213205/s100',
  },
  britbox: {
    brand_color: '#002EA6',
  },
  shudder: {
    brand_color: '#006400',
  },
  amcplus: {
    brand_color: '#000000',
  },
  mgmplus: {
    brand_color: '#003087',
  },
  discovery: {
    brand_color: '#2175D9',
  },
  skygo: {
    brand_color: '#00b0f0',
  },
  starz: {
    brand_color: '#000000',
    logo_url: 'https://images.justwatch.com/icon/30154735/s100',
  },
  criterion: {
    brand_color: '#000000',
    logo_url: 'https://images.justwatch.com/icon/308609719/s100',
  },
  fubotv: {
    brand_color: '#E9062C',
    logo_url: 'https://images.justwatch.com/icon/316727347/s100',
  },
  philo: {
    brand_color: '#25BEC8',
  },
  youtubetv: {
    brand_color: '#FF0000',
  },
  kocowa: {
    brand_color: '#E31837',
  },
  viki: {
    brand_color: '#1DACE3',
  },
  lionsgate: {
    brand_color: '#000000',
  },
  cineverse: {
    brand_color: '#000000',
  },
  spectrum: {
    brand_color: '#003594',
  },
  invdiscovery: {
    brand_color: '#2175D9',
  },
  sundancenow: {
    brand_color: '#000000',
  },
  aetv: {
    brand_color: '#000000',
  },
  histvault: {
    brand_color: '#D4AF37',
  },
  magnolia: {
    brand_color: '#000000',
  },
  hgtv: {
    brand_color: '#009B4E',
  },
  foodnetwork: {
    brand_color: '#E57200',
  },
  fandor: {
    brand_color: '#FF5F00',
  },
  screambox: {
    brand_color: '#FF0000',
  },
  midnightpulp: {
    brand_color: '#000000',
  },
  moviesphere: {
    brand_color: '#000000',
  },
  shoutfactory: {
    brand_color: '#E31837',
  },
  flixfling: {
    brand_color: '#000000',
  },

  // DE-specific
  magenta: {
    brand_color: '#E20074',
  },
  ardplus: {
    brand_color: '#003DA5',
  },
  geo: {
    brand_color: '#FFD700',
  },
  sevenentertainment: {
    brand_color: '#FF0000',
  },
  aniverse: {
    brand_color: '#6A0DAD',
  },
  filmtotal: {
    brand_color: '#000000',
  },
  bloodymovies: {
    brand_color: '#8B0000',
  },
  moviedome: {
    brand_color: '#000000',
  },
  grjngo: {
    brand_color: '#D4380D',
  },
  kixi: {
    brand_color: '#000000',
  },
  disasterx: {
    brand_color: '#FF4500',
  },
  netzkino: {
    brand_color: '#1A1A2E',
  },
  franatic: {
    brand_color: '#000000',
  },
  flimmerkiste: {
    brand_color: '#FF6600',
  },
  superfresh: {
    brand_color: '#00AA55',
  },
  galacticstream: {
    brand_color: '#1A0A3B',
  },
  adrenalin: {
    brand_color: '#FF0000',
  },
  loveandpassion: {
    brand_color: '#FF69B4',
  },
  zdfselect: {
    brand_color: '#003DA5',
  },
  kabeleins: {
    brand_color: '#E31837',
  },

  // NL-specific
  canalplus: {
    brand_color: '#000000',
  },
  nlziet: {
    brand_color: '#FF7A00',
  },
  cinemember: {
    brand_color: '#000000',
  },
  npoplus: {
    brand_color: '#E4002B',
  },
  viaplay: {
    brand_color: '#1B0A3F',
  },
  sooner: {
    brand_color: '#000000',
  },
  ziggo: {
    brand_color: '#FF7A00',
  },
  film1: {
    brand_color: '#000000',
  },

  // BE-specific
  telenet: {
    brand_color: '#E4002B',
  },

  // JP-specific
  fod: {
    brand_color: '#E31837',
  },
  danime: {
    brand_color: '#0099CC',
  },
  animetimes: {
    brand_color: '#0066CC',
  },
  telesa: {
    brand_color: '#0099CC',
  },
  toei: {
    brand_color: '#FF0000',
  },
  asiapremium: {
    brand_color: '#000000',
  },
  shochiku: {
    brand_color: '#000000',
  },
  kadokawa: {
    brand_color: '#E31837',
  },
  channelk: {
    brand_color: '#000000',
  },

  // ── Added 2026-05-09 (task 20260509-complete-brand-coverage) ─────────────

  // Global / multi-country
  mubi: {
    brand_color: '#0B0B0B',
  },
  cinemax: {
    brand_color: '#000000',
  },
  acorntv: {
    brand_color: '#004B23',
  },
  betplus: {
    brand_color: '#000000',
  },
  dove: {
    brand_color: '#1E90FF',
  },
  tlcnetwork: {
    brand_color: '#00BBBB',
  },
  pureflix: {
    brand_color: '#0047AB',
  },
  upfaithfamily: {
    brand_color: '#1DA1F2',
  },
  qello: {
    brand_color: '#000000',
  },
  history: {
    brand_color: '#4B3E30',
  },
  magellantv: {
    brand_color: '#1A3E72',
  },
  cultpix: {
    brand_color: '#E5001C',
  },

  // TVOD / country-specific
  rakuten: {
    brand_color: '#BF0000',
  },
  ucikino: {
    brand_color: '#E5001C',
  },
}
