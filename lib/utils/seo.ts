// SEO Utility Functions

import locationCoords from '@/lib/data/location-coords.json';
import asoMappings from '@/lib/data/aso-location-mappings.json';

// ============================================================================
// Provider Information
// ============================================================================

/**
 * Provider metadata for SEO
 */
export interface ProviderInfo {
  id: string;
  name: string;
  fullName: string;
  region: string;
}

/**
 * All supported waste collection providers
 */
export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'bav',
    name: 'BAV',
    fullName: 'Bergischer Abfallwirtschaftsverband',
    region: 'Bergisches Land',
  },
  {
    id: 'aso',
    name: 'ASO',
    fullName: 'Abfall-Service Osterholz',
    region: 'Osterholz',
  },
];

/**
 * Get all provider names (short form)
 */
export function getProviderNames(): string[] {
  return PROVIDERS.map((p) => p.name);
}

/**
 * Get all provider full names
 */
export function getProviderFullNames(): string[] {
  return PROVIDERS.map((p) => p.fullName);
}

/**
 * Get all provider regions
 */
export function getProviderRegions(): string[] {
  return PROVIDERS.map((p) => p.region);
}

// ============================================================================
// Date/Year Utilities
// ============================================================================

/**
 * Get the current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get a year range string for SEO (current year and next)
 * e.g., "2026/2027"
 */
export function getYearRange(): string {
  const year = getCurrentYear();
  return `${year}/${year + 1}`;
}

// ============================================================================
// URL Utilities
// ============================================================================

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

// ============================================================================
// Location Utilities
// ============================================================================

/**
 * All location names from the BAV region
 */
export const BAV_LOCATIONS = Object.keys(locationCoords);

/**
 * All location names from the ASO region
 */
export const ASO_LOCATIONS = Object.keys(asoMappings);

/**
 * All supported locations (all providers combined)
 */
export const ALL_LOCATIONS = [...new Set([...BAV_LOCATIONS, ...ASO_LOCATIONS])];

/**
 * Get all valid location slugs
 */
export function getLocationSlugs(): string[] {
  return ALL_LOCATIONS.map((loc) => loc.toLowerCase());
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
  return ALL_LOCATIONS.find((loc) => loc.toLowerCase() === slug.toLowerCase()) || null;
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

// ============================================================================
// SEO Keywords
// ============================================================================

/**
 * Get SEO keywords with current year
 */
export function getSeoKeywords(): string[] {
  const year = getCurrentYear();
  const baseKeywords = [
    // Year-specific keywords (very important for search)
    `Abfuhrkalender ${year}`,
    `Müllabfuhr ${year}`,
    `Abfallkalender ${year}`,
    `Müllkalender ${year}`,
    // Provider names
    ...getProviderNames(),
    ...getProviderFullNames(),
    // General keywords
    'Abfuhrkalender',
    'Müllabfuhr',
    'Abfallkalender',
    'Müllkalender',
    'Abfuhrtermine',
    'Mülltermine',
    // Waste types
    'Restmüll',
    'Gelber Sack',
    'Altpapier',
    'Papier',
    'Biomüll',
    'Biotonne',
    'Glascontainer',
    'Wertstoff',
    // Actions
    'Entsorgung',
    'Recycling',
    'Abfallentsorgung',
    'Müllabholung',
    // Regions
    ...getProviderRegions(),
    // Top locations (limited to avoid keyword stuffing)
    ...ALL_LOCATIONS.slice(0, 20),
  ];
  return [...new Set(baseKeywords)];
}

/**
 * Static SEO keywords (for backwards compatibility)
 * @deprecated Use getSeoKeywords() for dynamic year support
 */
export const SEO_KEYWORDS = getSeoKeywords();

// ============================================================================
// Metadata Generators
// ============================================================================

/**
 * Generate dynamic page title with year
 */
export function generateTitle(base: string, includeYear = true): string {
  if (includeYear) {
    return `${base} ${getCurrentYear()}`;
  }
  return base;
}

/**
 * Generate metadata description for location page
 */
export function generateLocationDescription(locationName: string): string {
  const year = getCurrentYear();
  return `Müllabfuhr-Termine ${year} für ${locationName}. Alle Abfuhrtermine für Restmüll, Gelber Sack, Papier, Bio und Glas. Kostenlos als ICS-Kalender exportieren.`;
}

/**
 * Generate metadata description for street page
 */
export function generateStreetDescription(streetName: string, locationName: string): string {
  const year = getCurrentYear();
  return `Abfuhrkalender ${year} für ${streetName} in ${locationName}. Nächste Abholung für Restmüll, Gelber Sack, Papier, Bio und Glas. Kostenlos als ICS-Kalender exportieren.`;
}

/**
 * Generate keywords for location page
 */
export function generateLocationKeywords(locationName: string): string[] {
  const year = getCurrentYear();
  return [
    `Müllabfuhr ${locationName} ${year}`,
    `Abfuhrkalender ${locationName} ${year}`,
    `Abfalltermine ${locationName}`,
    `Müllkalender ${locationName}`,
    locationName,
    ...getProviderNames(),
    'Restmüll',
    'Gelber Sack',
    'Papier',
    'Biomüll',
  ];
}

/**
 * Generate keywords for street page
 */
export function generateStreetKeywords(streetName: string, locationName: string): string[] {
  const year = getCurrentYear();
  return [
    `Müllabfuhr ${streetName} ${locationName} ${year}`,
    `Abfuhrkalender ${streetName} ${year}`,
    `Abfalltermine ${locationName}`,
    streetName,
    locationName,
    ...getProviderNames(),
    'Restmüll',
    'Gelber Sack',
    'Papier',
    'Biomüll',
  ];
}
