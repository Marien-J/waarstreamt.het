export const PROVIDER_TIERS = {
  mainstream: ['nfx', 'prv', 'atp', 'kpn', 'ply', 'vdl', 'amz', 'dis'],
  niche: ['hmx', 'hmf', 'pth', 'wki', 'mej', 'itu', 'zav'],
}

export interface ProviderMetadata {
  short_name: string
  display_name: string
  logo_url: string
  brand_color: string
  tier: 'mainstream' | 'niche' | 'channel'
}

let providersCache: Record<string, ProviderMetadata> | null = null

export async function loadProviders(): Promise<Record<string, ProviderMetadata>> {
  if (providersCache) return providersCache

  const response = await fetch(`${import.meta.env.BASE_URL}data/providers.json`)
  providersCache = await response.json()
  return providersCache!
}

export function getProviderTier(shortName: string): 'mainstream' | 'niche' | 'channel' {
  if (PROVIDER_TIERS.mainstream.includes(shortName)) return 'mainstream'
  if (PROVIDER_TIERS.niche.includes(shortName)) return 'niche'
  return 'channel'
}

export function groupProvidersByTier(
  providers: string[],
  _metadata: Record<string, ProviderMetadata>
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

  for (const provider of providers) {
    const tier = getProviderTier(provider)
    if (tier === 'channel') {
      result.channels.push(provider)
    } else {
      result[tier].push(provider)
    }
  }

  return result
}
