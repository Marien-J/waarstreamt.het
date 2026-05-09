import { type ReactElement, type CSSProperties } from 'react'
import type { CountryCode } from '@/store/preferences'

// height/width on each SVG makes it scale with font-size while preserving viewBox aspect ratio
const S: CSSProperties = { height: '1em', width: 'auto', display: 'block' }

const FLAGS: Record<CountryCode, ReactElement> = {
  // Netherlands — 3 horizontal stripes: red / white / blue (3:2 ratio)
  NL: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" style={S}>
      <rect width="9" height="6" fill="#21468B" />
      <rect width="9" height="4" fill="#fff" />
      <rect width="9" height="2" fill="#AE1C28" />
    </svg>
  ),
  // Germany — 3 horizontal stripes: black / red / gold (5:3 ratio)
  DE: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" style={S}>
      <rect width="5" height="3" fill="#FFCE00" />
      <rect width="5" height="2" fill="#DD0000" />
      <rect width="5" height="1" fill="#000" />
    </svg>
  ),
  // Belgium — 3 vertical stripes: black / yellow / red (3:2 ratio)
  BE: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" style={S}>
      <rect width="3" height="2" fill="#EF3340" />
      <rect width="2" height="2" fill="#FAD02C" />
      <rect width="1" height="2" fill="#000" />
    </svg>
  ),
  // United States — 13 stripes (7 red on white) + blue canton (19:10 ratio)
  US: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 10" style={S}>
      <rect width="19" height="10" fill="#fff" />
      <rect y="0"     width="19" height="0.769" fill="#B22234" />
      <rect y="1.538" width="19" height="0.769" fill="#B22234" />
      <rect y="3.077" width="19" height="0.769" fill="#B22234" />
      <rect y="4.615" width="19" height="0.769" fill="#B22234" />
      <rect y="6.154" width="19" height="0.769" fill="#B22234" />
      <rect y="7.692" width="19" height="0.769" fill="#B22234" />
      <rect y="9.231" width="19" height="0.769" fill="#B22234" />
      {/* Blue canton covering top 7 stripes × 2/5 flag width */}
      <rect width="7.6" height="5.385" fill="#3C3B6E" />
    </svg>
  ),
  // Great Britain — Union Jack (2:1 ratio), simplified counterchange
  GB: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" style={S}>
      <rect width="60" height="30" fill="#012169" />
      {/* St Andrew's cross (white saltire) */}
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="10" fill="none" />
      {/* St Patrick's cross (red, centred on white — simplified) */}
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="6" fill="none" />
      {/* St George's cross — white fimbriation */}
      <rect x="25" width="10" height="30" fill="#fff" />
      <rect y="10" width="60" height="10" fill="#fff" />
      {/* St George's cross — red bar */}
      <rect x="27" width="6" height="30" fill="#C8102E" />
      <rect y="12" width="60" height="6" fill="#C8102E" />
    </svg>
  ),
  // Japan — white field, red disc centred (3:2 ratio)
  JP: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" style={S}>
      <rect width="3" height="2" fill="#fff" />
      <circle cx="1.5" cy="1" r="0.3" fill="#BC002D" />
    </svg>
  ),
}

interface FlagProps {
  code: CountryCode
  className?: string
}

/**
 * Renders an inline SVG flag for the given ISO country code.
 * aria-hidden is set on the wrapper — the adjacent ISO code labels the element
 * for screen readers so the image is purely decorative.
 */
export function Flag({ code, className }: FlagProps) {
  return (
    <span
      aria-hidden="true"
      className={['inline-flex items-center align-middle', className].filter(Boolean).join(' ')}
    >
      {FLAGS[code]}
    </span>
  )
}
