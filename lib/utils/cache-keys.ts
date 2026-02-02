/**
 * Central cache key generation utilities
 * Used across the application to ensure consistent cache key formats
 */

/**
 * Build a cache key for waste collection data by location and street
 * Normalizes inputs to lowercase and trims whitespace
 */
export function buildWasteCollectionCacheKey(
  location: string,
  street: string
): string {
  const normalizedLocation = location.trim().toLowerCase();
  const normalizedStreet = street.trim().toLowerCase();
  return `waste-collection:${normalizedLocation}:${normalizedStreet}`;
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
