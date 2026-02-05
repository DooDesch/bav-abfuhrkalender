// BAV API Configuration Constants

export const BAV_API_BASE_URL =
  process.env['BAV_API_BASE_URL'] ||
  'https://bav-abfallapp.regioit.de/abfall-app-bav/rest';

// ============================================================================
// AbfallIO (ASO Osterholz) Configuration
// ============================================================================

/** Base URL for the AbfallIO API */
export const ABFALL_IO_BASE_URL =
  process.env['ABFALL_IO_BASE_URL'] || 'https://api.abfall.io';

/** API Key for ASO (Abfall-Service Osterholz) */
export const ABFALL_IO_ASO_KEY =
  process.env['ABFALL_IO_ASO_KEY'] || '040b38fe83f026f161f30f282b2748c0';

/** Modus key for AbfallIO API (constant across all providers) */
export const ABFALL_IO_MODUS_KEY = 'd6c5855a62cf32a4dadbc2831f0f295f';

/** TTL for AbfallIO session tokens (4 hours in seconds) */
export const ABFALL_IO_SESSION_TTL = 4 * 60 * 60;

export const CACHE_TTL = parseInt(
  process.env['CACHE_TTL'] || '3600',
  10
); // 1 hour in seconds

/** Cache TTL for locations data (7 days - locations rarely change) */
export const LOCATIONS_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/** Cache TTL for streets data (24 hours - streets rarely change) */
export const STREETS_CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

/** Cooldown for cache refresh requests (10 minutes in seconds) */
export const CACHE_REFRESH_COOLDOWN = 10 * 60; // 10 minutes in seconds

export const NEXT_REVALIDATE = 3600; // 1 hour in seconds

/** localStorage key for last selected address (location + street) */
export const LAST_ADDRESS_STORAGE_KEY = 'bav-last-address';

/** localStorage key for fraction filter selection in waste calendar */
export const FRACTION_FILTER_STORAGE_KEY = 'bav-waste-collection-filter';

/** localStorage key for cookie consent preferences */
export const COOKIE_CONSENT_STORAGE_KEY = 'bav-cookie-consent';
