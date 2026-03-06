/**
 * Emergency fallback cache for locations and streets.
 * Ensures we always have data for autocomplete even when the provider API fails.
 * - Locations: seeded from static provider lists (BAV + ASO); updated when provider returns successfully.
 * - Streets: per-location cache updated on successful fetch; returned when provider fails.
 */

import { PROVIDERS } from '@/lib/utils/seo';
import asoMappings from '@/lib/data/aso-location-mappings.json';

// Avoid importing provider-registry (would create circular dependency)
export type FallbackLocation = { id: number; name: string; provider: string };
export type FallbackStreet = { id: number | string; name: string };

// Static seed: BAV from PROVIDERS, ASO from mapping keys (same as provider-registry getASOLocationNames)
function getStaticLocationNames(): { name: string; providerId: string }[] {
  const out: { name: string; providerId: string }[] = [];
  const bav = PROVIDERS.find((p) => p.id === 'bav');
  if (bav) {
    for (const name of bav.locations) {
      out.push({ name, providerId: 'bav' });
    }
  }
  const asoKeys = Object.keys(asoMappings as Record<string, unknown>);
  for (const name of asoKeys) {
    out.push({ name, providerId: 'aso' });
  }
  return out;
}

function buildStaticLocations(): FallbackLocation[] {
  const names = getStaticLocationNames();
  return names.map((item, index) => ({
    id: index + 1,
    name: item.name,
    provider: item.providerId,
  }));
}

// In-memory "last good" data (survives until process restarts)
let lastGoodLocations: FallbackLocation[] | null = null;
const streetsByLocation = new Map<string, FallbackStreet[]>();

const staticLocations = buildStaticLocations();

/**
 * Get locations for fallback: last successful fetch or static seed.
 * Caller should use this when the provider request fails or returns empty.
 */
export function getLocationsFallback(): FallbackLocation[] {
  return lastGoodLocations ?? staticLocations;
}

/**
 * Update fallback with fresh locations from provider.
 * Merge by name so we keep IDs stable and add any new locations.
 */
export function setLocationsFallback(locations: FallbackLocation[]): void {
  if (locations.length === 0) return;
  const byName = new Map(lastGoodLocations?.map((l) => [l.name.toLowerCase(), l]) ?? []);
  for (const loc of locations) {
    const key = loc.name.trim().toLowerCase();
    byName.set(key, { id: loc.id, name: loc.name, provider: loc.provider });
  }
  lastGoodLocations = Array.from(byName.values());
}

/**
 * Get cached streets for a location, if any.
 */
export function getStreetsFallback(locationName: string): FallbackStreet[] | undefined {
  const key = locationName.trim().toLowerCase();
  return streetsByLocation.get(key);
}

/**
 * Store streets for a location after a successful provider fetch.
 */
export function setStreetsFallback(
  locationName: string,
  streets: FallbackStreet[]
): void {
  const key = locationName.trim().toLowerCase();
  if (streets.length > 0) {
    streetsByLocation.set(key, streets);
  }
}
