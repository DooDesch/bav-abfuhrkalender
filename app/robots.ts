import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/utils/seo';

/**
 * Generate robots.txt for search engine crawlers
 * Allows all pages except API routes and playground
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/playground/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
