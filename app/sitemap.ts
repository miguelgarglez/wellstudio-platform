import type { MetadataRoute } from 'next'

import { resolvePublicUrl } from '@/lib/site-metadata'

const publicRoutes = ['/', '/classes', '/plans', '/privacy-policy', '/terms'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: resolvePublicUrl(route) ?? route,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/classes' || route === '/plans' ? 0.8 : 0.3,
  }))
}
