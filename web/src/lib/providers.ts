export interface BrandMetadata {
  brand_id: string
  display_name: string
  logo_url?: string
  brand_color: string
  title_count: number
  tier: 'mainstream' | 'niche' | 'channel'
  short_names: string[]
}

// Per-country cache: cc → brand record
const providersCache = new Map<string, Record<string, BrandMetadata>>()

export async function loadProviders(
  countryCode: string = 'nl'
): Promise<Record<string, BrandMetadata>> {
  const cc = countryCode.toLowerCase()
  if (providersCache.has(cc)) return providersCache.get(cc)!

  const response = await fetch(
    `${import.meta.env.BASE_URL}data/providers_${cc}.json`
  )
  const data: Record<string, BrandMetadata> = await response.json()
  providersCache.set(cc, data)
  return data
}

export function groupProvidersByTier(
  providers: string[],
  metadata: Record<string, BrandMetadata>
): {
  mainstream: string[]
  niche: string[]
  channels: string[]
} {
  const result = {
    mainstream: [] as string[],
    niche: [] as string[],
    channels: [] as string[],
  }

  for (const brandId of providers) {
    const tier = metadata[brandId]?.tier ?? 'channel'
    if (tier === 'mainstream') {
      result.mainstream.push(brandId)
    } else if (tier === 'niche') {
      result.niche.push(brandId)
    } else {
      result.channels.push(brandId)
    }
  }

  return result
}

// Backward-compat alias (consumers that imported the old ProviderMetadata type)
export type ProviderMetadata = BrandMetadata

