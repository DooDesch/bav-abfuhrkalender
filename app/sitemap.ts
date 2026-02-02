import type { MetadataRoute } from 'next';
import { getBaseUrl, createStreetSlug } from '@/lib/utils/seo';
import { getBAVApiService } from '@/lib/services/bav-api.service';

/**
 * Generate sitemap with all locations and streets
 * This enables Google to discover and index all pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const apiService = getBAVApiService();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  try {
    const locations = await apiService.getLocations();

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

      // Fetch streets for this location
      try {
        const streets = await apiService.getStreets(location.id);

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

  return entries;
}
