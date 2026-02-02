// SEO Utility Functions

import locationCoords from '@/lib/data/location-coords.json';

/**
 * Get the base URL for the application
 * Uses Vercel's production URL environment variable if available
 */
export function getBaseUrl(): string {
  if (process.env['VERCEL_PROJECT_PRODUCTION_URL']) {
    return `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}`;
  }
  if (process.env['VERCEL_URL']) {
    return `https://${process.env['VERCEL_URL']}`;
  }
  return process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000';
}

/**
 * Get all valid location slugs from location-coords.json
 */
export function getLocationSlugs(): string[] {
  return Object.keys(locationCoords).map((loc) => loc.toLowerCase());
}

/**
 * Check if a location slug is valid
 */
export function isValidLocationSlug(slug: string): boolean {
  const validSlugs = getLocationSlugs();
  return validSlugs.includes(slug.toLowerCase());
}

/**
 * Get the original location name from a slug
 * burscheid -> Burscheid, hückeswagen -> Hückeswagen
 */
export function getLocationNameFromSlug(slug: string): string | null {
  const locations = Object.keys(locationCoords);
  return locations.find((loc) => loc.toLowerCase() === slug.toLowerCase()) || null;
}

/**
 * Capitalize a location slug properly
 * Handles German umlauts and special cases
 */
export function capitalizeLocation(slug: string): string {
  const originalName = getLocationNameFromSlug(slug);
  if (originalName) {
    return originalName;
  }
  // Fallback: simple capitalization
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Create a URL-safe street slug
 */
export function createStreetSlug(streetName: string): string {
  return encodeURIComponent(streetName.toLowerCase());
}

/**
 * Decode a street slug back to display name
 */
export function decodeStreetSlug(slug: string): string {
  const decoded = decodeURIComponent(slug);
  // Capitalize first letter of each word
  return decoded
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * All location names from the BAV region for keywords
 */
export const BAV_LOCATIONS = Object.keys(locationCoords);

/**
 * Common SEO keywords for the application
 */
export const SEO_KEYWORDS = [
  'Abfuhrkalender',
  'BAV',
  'Müllabfuhr',
  'Bergischer Abfallwirtschaftsverband',
  'Abfallkalender',
  'Müllkalender',
  'Restmüll',
  'Gelber Sack',
  'Altpapier',
  'Papier',
  'Biomüll',
  'Biotonne',
  'Glascontainer',
  'Wertstoff',
  'Entsorgung',
  'Recycling',
  'Abfallentsorgung',
  'Bergisches Land',
  ...BAV_LOCATIONS,
];
