export const GENRE_MAP: Record<string, string> = {
  drm: 'Drama',
  cmy: 'Comedy',
  trl: 'Thriller',
  act: 'Action & Adventure',
  crm: 'Crime',
  rma: 'Romance',
  fml: 'Kids & Family',
  fnt: 'Fantasy',
  scf: 'Science-Fiction',
  eur: 'Made in Europe',
  doc: 'Documentary',
  hrr: 'Horror',
  ani: 'Animation',
  hst: 'History',
  rly: 'Reality TV',
  war: 'War & Military',
  msc: 'Music & Musical',
  spt: 'Sport',
  wsn: 'Western',
}

export function getGenreLabel(code: string): string {
  return GENRE_MAP[code] || code
}

export function getGenreCodes(): string[] {
  return Object.keys(GENRE_MAP)
}
