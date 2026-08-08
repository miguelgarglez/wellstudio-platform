import type { MetadataRoute } from 'next'

import { resolvePublicUrl } from '@/lib/site-metadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/app',
        '/auth',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: resolvePublicUrl('/sitemap.xml'),
  }
}
