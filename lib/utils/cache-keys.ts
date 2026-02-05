/**
 * Central cache key generation utilities
 * Used across the application to ensure consistent cache key formats
 */

/**
 * Build a cache key for waste collection data by location and street
 * Normalizes inputs to lowercase and trims whitespace
 * Optionally includes houseNumberId for addresses that require it
 */
export function buildWasteCollectionCacheKey(
  location: string,
  street: string,
  houseNumberId?: string
): string {
  const normalizedLocation = location.trim().toLowerCase();
  const normalizedStreet = street.trim().toLowerCase();
  const baseKey = `waste-collection:${normalizedLocation}:${normalizedStreet}`;
  return houseNumberId ? `${baseKey}:hnr:${houseNumberId}` : baseKey;
}

/**
 * Normalize an address string for storage/comparison
 */
export function normalizeAddressKey(
  location: string,
  street: string
): string {
  const loc = location.trim().toLowerCase();
  const str = street.trim().toLowerCase();
  return loc && str ? `${loc}|${str}` : '';
}

/**
 * Build a cache key for tracking cache refresh cooldowns
 * Used to prevent spam of the cache refresh endpoint
 */
export function buildCacheRefreshCooldownKey(
  location: string,
  street: string
): string {
  const normalizedLocation = location.trim().toLowerCase();
  const normalizedStreet = street.trim().toLowerCase();
  return `refresh-cooldown:${normalizedLocation}:${normalizedStreet}`;
}

/**
 * Cache key for the sitemap entries
 * Used to cache the complete sitemap to avoid regenerating it on every request
 */
export const SITEMAP_CACHE_KEY = 'sitemap:entries';
