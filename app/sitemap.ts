import type { MetadataRoute } from 'next';
import { getBaseUrl, createStreetSlug } from '@/lib/utils/seo';
import { getAllLocations, getStreets } from '@/lib/services/provider-registry';
import { cacheService } from '@/lib/services/cache.service';
import { SITEMAP_CACHE_KEY } from '@/lib/utils/cache-keys';

/** Sitemap cache TTL: 1 week in seconds */
const SITEMAP_CACHE_TTL = 7 * 24 * 60 * 60;

/**
 * Generate sitemap with all locations and streets from all providers
 * This enables Google to discover and index all pages
 * Results are cached for 1 week to improve response time for crawlers
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Check cache first
  const cachedEntries = cacheService.get<MetadataRoute.Sitemap>(SITEMAP_CACHE_KEY);
  if (cachedEntries) {
    return cachedEntries;
  }

  const baseUrl = getBaseUrl();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  try {
    // Get locations from all providers
    const locations = await getAllLocations();

    // Add all locations and their streets
    for (const location of locations) {
      const locationSlug = location.name.toLowerCase();

      // Add location page
      entries.push({
        url: `${baseUrl}/${locationSlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });

      // Fetch streets for this location (provider-agnostic)
      try {
        const streets = await getStreets(location.name);

        for (const street of streets) {
          const streetSlug = createStreetSlug(street.name);
          entries.push({
            url: `${baseUrl}/${locationSlug}/${streetSlug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      } catch (error) {
        // Log error but continue with other locations
        console.error(`Failed to fetch streets for ${location.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to fetch locations for sitemap:', error);
  }

  // Cache the generated sitemap entries
  cacheService.set(SITEMAP_CACHE_KEY, entries, SITEMAP_CACHE_TTL);

  return entries;
}
