// BAV API Configuration Constants

export const BAV_API_BASE_URL =
  process.env.BAV_API_BASE_URL ||
  'https://bav-abfallapp.regioit.de/abfall-app-bav/rest';

export const CACHE_TTL = parseInt(
  process.env.CACHE_TTL || '3600',
  10
); // 1 hour in seconds

export const NEXT_REVALIDATE = 3600; // 1 hour in seconds

/** localStorage key for last selected address (location + street) */
export const LAST_ADDRESS_STORAGE_KEY = 'bav-last-address';
